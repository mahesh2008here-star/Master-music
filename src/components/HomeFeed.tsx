import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Play,
  Shuffle,
  ChevronRight,
  Radio,
  RotateCw,
  Users,
  CheckCircle2,
  Compass,
  Disc3,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Track, Artist, Album, ListeningStats } from '../types/music';
import { newpipeService } from '../services/newpipeService';
import {
  ytMusicService,
  YTMusicHomeRecommendations,
  YTMusicTopPick
} from '../services/ytMusicService';
import {
  BoldDownloadIcon,
  BoldHeartIcon,
  BoldSearchIcon,
  BoldSparkleIcon
} from './CustomIcons';

interface CommunityPlaylist {
  id: string;
  title: string;
  curator: string;
  playsLabel: string;
  collageCovers: string[];
  tracks: Track[];
}

interface HomeFeedProps {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  stats: ListeningStats;
  downloadedIds: Set<string>;
  excludedSongIds?: string[];
  visibleSectionsCount?: number;
  podcastsEnabled?: boolean;
  recommendationTick?: number;
  showInlineNav?: boolean;
  onNavigateTab?: (tab: 'feed' | 'stats' | 'playlists') => void;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onOpenSearch: (initialQuery?: string) => void;
  onOpenLikedSongs: () => void;
  onOpenDiscover?: () => void;
  onOpenDiscoverNew?: () => void;
  onOpenSettings: () => void;
  onOpenDownloads: () => void;
  onOpenJam: () => void;
  onToggleDownload: (track: Track) => void;
  onOpenArtist: (artist: { id?: string; name: string }) => void;
  onOpenAlbum: (album: { id?: string; title?: string; artist?: string }) => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({
  tracks,
  artists,
  albums,
  stats,
  downloadedIds,
  excludedSongIds = [],
  visibleSectionsCount = 44,
  podcastsEnabled = true,
  recommendationTick = 0,
  showInlineNav = false,
  onNavigateTab,
  onPlayTrack,
  onOpenSearch,
  onOpenLikedSongs,
  onOpenDiscover,
  onOpenDiscoverNew,
  onOpenSettings,
  onOpenDownloads,
  onOpenJam,
  onToggleDownload,
  onOpenArtist,
  onOpenAlbum
}) => {
  const [activeChip, setActiveChip] = useState('All');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startingGenre, setStartingGenre] = useState<string | null>(null);
  const [newpipeTrending, setNewpipeTrending] = useState<Track[]>([]);
  const [ytRecs, setYtRecs] = useState<YTMusicHomeRecommendations | null>(null);
  const [communityPlaylists, setCommunityPlaylists] = useState<CommunityPlaylist[]>([]);

  const topPicksScrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activePickIdx, setActivePickIdx] = useState(0);
  const [cardTransforms, setCardTransforms] = useState<Record<number, { scale: number; opacity: number }>>({});
  const autoScrollPausedRef = useRef<boolean>(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollAnimFrameRef = useRef<number | null>(null);

  const chips = podcastsEnabled
    ? ['All', 'Podcasts', 'Romance', 'Relax', 'Feel good', 'Energize', 'Workout', 'Focus', 'Sleep', 'Commute']
    : ['All', 'Romance', 'Relax', 'Feel good', 'Energize', 'Workout', 'Focus', 'Sleep', 'Commute'];

  const excludedSet = React.useMemo(() => new Set(excludedSongIds), [excludedSongIds]);

  const loadFeedRecommendations = async (mood = activeChip) => {
    const recentTracks = stats.recentPlays.map((p) => p.track);
    const likedArtists = tracks.filter((t) => t.isLiked).map((t) => t.artist);
    const downloadedTitles = tracks
      .filter((t) => downloadedIds.has(t.id))
      .map((t) => t.title);

    const [trendingRes, recsRes, communityRes] = await Promise.allSettled([
      newpipeService.getTrending('IN'),
      ytMusicService.getHomeRecommendations({
        recentTracks,
        likedArtists,
        downloadedTitles,
        mood,
        rotationSeed: recommendationTick
      }),
      fetch('/api/ytmusic/community-playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentTracks: recentTracks.slice(0, 12).map((t) => ({
            title: t.title,
            artist: t.artist,
            album: t.album
          })),
          likedArtists,
          followedArtists: ytMusicService.getFollowedArtists(),
          mood
        })
      }).then((r) =>
        r.ok ? (r.json() as Promise<{ playlists?: CommunityPlaylist[] }>) : { playlists: [] }
      )
    ]);

    if (trendingRes.status === 'fulfilled') {
      setNewpipeTrending(trendingRes.value.items);
    }
    if (recsRes.status === 'fulfilled' && recsRes.value) {
      setYtRecs(recsRes.value);
    }
    if (communityRes.status === 'fulfilled' && Array.isArray(communityRes.value.playlists)) {
      setCommunityPlaylists(communityRes.value.playlists);
    }
  };

  useEffect(() => {
    void loadFeedRecommendations(activeChip);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChip, recommendationTick]);

  const triggerRefresh = async () => {
    setIsRefreshing(true);
    await loadFeedRecommendations(activeChip);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleStartInstantRadio = async (vibe: string) => {
    setStartingGenre(vibe);
    try {
      const res = await newpipeService.search(`${vibe} hits radio songs`);
      const valid = res.items.filter((t) => !excludedSet.has(t.id));
      if (valid.length > 0) {
        onPlayTrack(valid[0], valid);
      } else {
        onPlayTrack(tracks[0], tracks);
      }
    } finally {
      setStartingGenre(null);
    }
  };

  const dedupeTracks = (items: Track[]): Track[] => {
    const seen = new Set<string>();
    const out: Track[] = [];
    for (const item of items) {
      if (!seen.has(item.id) && !excludedSet.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  };

  const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of items) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        out.push(item);
      }
    }
    return out;
  };

  const discoverPool = dedupeTracks(
    ytRecs && ytRecs.discoveryMix.length >= 2
      ? ytRecs.discoveryMix
      : ytRecs && ytRecs.quickPicks.length >= 2
      ? ytRecs.quickPicks
      : newpipeTrending.length >= 2
      ? newpipeTrending
      : tracks
  );

  const biggestHitsList = dedupeTracks(
    ytRecs?.biggestHits && ytRecs.biggestHits.length > 0
      ? ytRecs.biggestHits
      : newpipeTrending.length > 0
      ? newpipeTrending
      : tracks
  );

  const seedArtistName = ytRecs?.seedArtist || 'Sai Abhyankkar';
  const secondaryArtistName = ytRecs?.secondaryArtist || 'Arijit Singh';
  const tertiaryArtistName = ytRecs?.tertiaryArtist || 'Anirudh Ravichander';

  const becauseList = dedupeTracks(
    ytRecs && ytRecs.becauseYouListen.length > 0 ? ytRecs.becauseYouListen : tracks.slice(0, 6)
  );

  const secondarySimilarList = dedupeTracks(
    ytRecs?.secondaryMix && ytRecs.secondaryMix.length > 0
      ? ytRecs.secondaryMix
      : tracks.slice(2).concat(tracks.slice(0, 2))
  );

  const tertiarySimilarList = dedupeTracks(
    ytRecs?.tertiaryMix && ytRecs.tertiaryMix.length > 0
      ? ytRecs.tertiaryMix
      : tracks.slice().reverse()
  );

  const freshFindsList = dedupeTracks(
    ytRecs && ytRecs.freshFinds.length > 0 ? ytRecs.freshFinds : discoverPool.slice().reverse()
  );

  const quickPicksList = dedupeTracks(
    ytRecs && ytRecs.quickPicks.length > 0 ? ytRecs.quickPicks.slice(0, 8) : tracks.slice(0, 8)
  );

  const artistsList = dedupeById(
    ytRecs && ytRecs.artistsForYou.length > 0 ? ytRecs.artistsForYou : artists
  );

  const albumsList = dedupeById(
    ytRecs && ytRecs.albumsForYou.length > 0 ? ytRecs.albumsForYou : albums
  );

  const newReleasesList = dedupeById(ytRecs?.newReleases || []);

  const findArtistAvatar = (name: string, fallbackUrl?: string) => {
    const clean = name.toLowerCase();
    const matched = artistsList.find((a) => a.name.toLowerCase().includes(clean));
    if (matched?.avatarUrl) return matched.avatarUrl;
    return fallbackUrl || tracks[0]?.artworkUrl || '/assets/covers/sai_abhyankkar.png';
  };

  const topPicksCards: YTMusicTopPick[] = React.useMemo(() => {
    if (ytRecs?.topPicks && ytRecs.topPicks.length >= 10) {
      return ytRecs.topPicks;
    }
    const baseCards = ytRecs?.topPicks || [];
    const fallbackSeeds: YTMusicTopPick[] = [
      {
        id: 'pick-fb-1',
        kicker: 'Heavy Rotation',
        title: tracks[0]?.title || `${seedArtistName} Essentials`,
        subtitle: tracks[0]?.artist || seedArtistName,
        accentHex: '#165B33',
        artworkUrl: tracks[0]?.artworkUrl || '/assets/covers/sai_abhyankkar.png',
        tracks: tracks.slice(0, 6)
      },
      {
        id: 'pick-fb-2',
        kicker: 'Discovery Mix',
        title: tracks[1]?.title || 'Infinite Discovery',
        subtitle: tracks[1]?.artist || 'Sai Abhyankkar, Anirudh',
        accentHex: '#1D4ED8',
        artworkUrl: tracks[1]?.artworkUrl || '/assets/covers/bairan.png',
        tracks: tracks.slice(1)
      },
      {
        id: 'pick-fb-3',
        kicker: 'My Supermix',
        title: tracks[2]?.title || 'Daily Supermix',
        subtitle: tracks[2]?.artist || `${seedArtistName}, ${secondaryArtistName}`,
        accentHex: '#7C3AED',
        artworkUrl: tracks[2]?.artworkUrl || '/assets/covers/sheesha.png',
        tracks
      },
      {
        id: 'pick-fb-4',
        kicker: 'Artist Radio',
        title: tracks[3]?.title || `${secondaryArtistName} Radio`,
        subtitle: tracks[3]?.artist || 'Sadhu Tiwari, Vivek',
        accentHex: '#DB2777',
        artworkUrl: tracks[3]?.artworkUrl || '/assets/covers/parvati.png',
        tracks: [...tracks.slice(3), ...tracks.slice(0, 3)]
      },
      {
        id: 'pick-fb-5',
        kicker: 'Workout Surge',
        title: tracks[4]?.title || `${tertiaryArtistName} Banger Mix`,
        subtitle: tracks[4]?.artist || 'KR$NA, High Energy',
        accentHex: '#D97706',
        artworkUrl: tracks[4]?.artworkUrl || '/assets/covers/boom_shaka.png',
        tracks: [...tracks.slice(4), ...tracks.slice(0, 4)]
      },
      {
        id: 'pick-fb-6',
        kicker: 'Release Radar',
        title: tracks[5]?.title || 'Fresh Drops 2026',
        subtitle: tracks[5]?.artist || 'Picked from trending albums',
        accentHex: '#059669',
        artworkUrl: tracks[5]?.artworkUrl || '/assets/covers/god_mode.png',
        tracks: tracks.slice().reverse()
      },
      {
        id: 'pick-fb-7',
        kicker: 'Unwind Mix',
        title: 'Late Night Chill',
        subtitle: 'ARJN, KDS, FIFTY4, Shreya Ghoshal',
        accentHex: '#0284C7',
        artworkUrl: '/assets/covers/arjn.png',
        tracks
      },
      {
        id: 'pick-fb-8',
        kicker: 'Archive Mix',
        title: 'Deep Cuts & Gems',
        subtitle: 'Pritam, Benny Dayal, Vishal',
        accentHex: '#4F46E5',
        artworkUrl: '/assets/covers/badtameez_dil.png',
        tracks: tracks.slice().reverse()
      },
      {
        id: 'pick-fb-9',
        kicker: 'Focus Flow',
        title: 'Veera Veera OST',
        subtitle: 'Sai Abhyankkar, Dhanush',
        accentHex: '#0F766E',
        artworkUrl: '/assets/covers/veera_veera.png',
        tracks
      },
      {
        id: 'pick-fb-10',
        kicker: 'Album Mixtape',
        title: 'Classic Hip-Hop Flow',
        subtitle: 'Coolio, L.V., Classics',
        accentHex: '#B45309',
        artworkUrl: '/assets/covers/gangstas_paradise.png',
        tracks
      }
    ];

    const seen = new Set(baseCards.map((c) => c.id));
    const padded = [...baseCards];
    for (const fb of fallbackSeeds) {
      if (padded.length >= 12) break;
      if (!seen.has(fb.id)) {
        seen.add(fb.id);
        padded.push(fb);
      }
    }
    return padded;
  }, [ytRecs?.topPicks, tracks, seedArtistName, secondaryArtistName, tertiaryArtistName]);

  const measureCarouselTransforms = useCallback(() => {
    const container = topPicksScrollRef.current;
    if (!container) return;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIdx = 0;
    let minDistance = Infinity;
    const nextTransforms: Record<number, { scale: number; opacity: number }> = {};

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(containerCenter - cardCenter);
      if (dist < minDistance) {
        minDistance = dist;
        closestIdx = idx;
      }
      const norm = Math.min(1, dist / Math.max(180, card.offsetWidth * 0.95));
      const scale = 1 - norm * 0.11;
      const opacity = 1 - norm * 0.3;
      nextTransforms[idx] = { scale, opacity };
    });

    setCardTransforms(nextTransforms);
    setActivePickIdx((prev) => (prev !== closestIdx ? closestIdx : prev));
  }, []);

  const scrollToPickIndex = useCallback(
    (idx: number, smooth = true) => {
      const container = topPicksScrollRef.current;
      const targetCard = cardRefs.current[idx];
      if (!container || !targetCard) return;
      const targetLeft = Math.max(
        0,
        targetCard.offsetLeft - (container.clientWidth - targetCard.offsetWidth) / 2
      );

      if (scrollAnimFrameRef.current !== null) {
        cancelAnimationFrame(scrollAnimFrameRef.current);
        scrollAnimFrameRef.current = null;
      }

      if (!smooth) {
        container.scrollLeft = targetLeft;
        measureCarouselTransforms();
        return;
      }

      const startLeft = container.scrollLeft;
      const delta = targetLeft - startLeft;
      const durationMs = 560;
      const startTime = performance.now();

      const easeInOutCubic = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        container.scrollLeft = startLeft + delta * easeInOutCubic(progress);
        measureCarouselTransforms();
        if (progress < 1) {
          scrollAnimFrameRef.current = requestAnimationFrame(step);
        } else {
          scrollAnimFrameRef.current = null;
        }
      };

      scrollAnimFrameRef.current = requestAnimationFrame(step);
    },
    [measureCarouselTransforms]
  );

  const handleTopPicksScroll = useCallback(() => {
    measureCarouselTransforms();
  }, [measureCarouselTransforms]);

  useEffect(() => {
    measureCarouselTransforms();
  }, [topPicksCards.length, measureCarouselTransforms]);

  // Smooth periodic right-advance carousel showcase
  useEffect(() => {
    if (topPicksCards.length <= 1) return;
    const interval = setInterval(() => {
      if (autoScrollPausedRef.current) return;
      const nextIdx = (activePickIdx + 1) % topPicksCards.length;
      scrollToPickIndex(nextIdx, true);
    }, 3200);

    return () => clearInterval(interval);
  }, [activePickIdx, topPicksCards.length, scrollToPickIndex]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (scrollAnimFrameRef.current !== null) cancelAnimationFrame(scrollAnimFrameRef.current);
    };
  }, []);

  const pauseAutoScroll = () => {
    autoScrollPausedRef.current = true;
    if (scrollAnimFrameRef.current !== null) {
      cancelAnimationFrame(scrollAnimFrameRef.current);
      scrollAnimFrameRef.current = null;
    }
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  };

  const scheduleResumeAutoScroll = () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, 3400);
  };

  const moodAndGenresGrid = [
    { label: 'Chill', bg: 'bg-[#F5E8E7] dark:bg-rose-950/35' },
    { label: 'Feel good', bg: 'bg-[#F5EBE4] dark:bg-orange-950/35' },
    { label: 'Commute', bg: 'bg-[#F2EDE6] dark:bg-amber-950/35' },
    { label: 'Focus', bg: 'bg-[#ECEFF5] dark:bg-slate-800/60' },
    { label: 'Diwali', bg: 'bg-[#F6E6E2] dark:bg-red-950/35' },
    { label: 'Gaming', bg: 'bg-[#EFE8F6] dark:bg-violet-950/35' },
    { label: 'Energize', bg: 'bg-[#E9F3EC] dark:bg-emerald-950/35' },
    { label: 'Party', bg: 'bg-[#F6E8F0] dark:bg-pink-950/35' }
  ];

  const genres = ['Pop', 'Rock', 'Hip Hop', 'Indie', 'Bollywood', 'Tamil', 'Lo-Fi', 'Classical'];
  const showSection = (order: number) => visibleSectionsCount >= order;

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-44 select-none transition-colors">
      {/* Frosted M3 Rounded-Bottom Sticky Header */}
      <header className="sticky top-0 z-30 rounded-b-[28px] bg-white/88 dark:bg-[#141716]/88 backdrop-blur-2xl border-b border-black/[0.05] dark:border-white/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-editorial text-[28px] leading-none font-extrabold tracking-tight text-gray-900 dark:text-white">
              Home
            </h1>

            {showInlineNav && onNavigateTab && (
              <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                {(['feed', 'stats', 'playlists'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => onNavigateTab(tab)}
                    style={
                      tab === 'feed'
                        ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                      tab === 'feed' ? '' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {tab === 'playlists' ? 'Library' : tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onOpenDownloads}
              aria-label="Offline downloads"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <BoldDownloadIcon className="w-[19px] h-[19px]" />
              {downloadedIds.size > 0 && (
                <span
                  style={{ backgroundColor: 'var(--mw-primary)' }}
                  className="absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white dark:ring-[#141716]"
                />
              )}
            </button>

            <button
              onClick={() => onOpenSearch()}
              aria-label="Search catalog"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <BoldSearchIcon className="w-[19px] h-[19px]" />
            </button>

            <button
              onClick={onOpenJam}
              aria-label="Friends Jam"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Users className="w-[19px] h-[19px] stroke-[2.2]" />
            </button>

            <button
              onClick={onOpenSettings}
              aria-label="Account and Settings"
              style={{
                backgroundColor: 'var(--mw-tint)',
                color: 'var(--mw-tint-text)'
              }}
              className="w-10 h-10 ml-0.5 rounded-full border-2 border-[var(--mw-primary)]/40 flex items-center justify-center transition-transform active:scale-95"
            >
              <User className="w-[18px] h-[18px] stroke-[2.4]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-3 space-y-6">
        {/* Mood Filter Pills Row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 flex-1">
            {chips.map((chip) => {
              const isSelected = activeChip === chip;
              return (
                <button
                  key={chip}
                  onClick={() => setActiveChip(chip)}
                  style={
                    isSelected
                      ? { backgroundColor: 'var(--mw-tint-strong)', color: 'var(--mw-tint-text)' }
                      : undefined
                  }
                  className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap shrink-0 transition-all min-h-[36px] border ${
                    isSelected
                      ? 'border-transparent shadow-xs font-bold'
                      : 'bg-white/80 dark:bg-white/[0.07] border-black/[0.06] dark:border-white/[0.1] text-gray-800 dark:text-gray-200 hover:bg-black/[0.04]'
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => void triggerRefresh()}
            aria-label="Refresh feed"
            className="w-9 h-9 rounded-full bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* 1. TOP PICKS HERO CENTERED PEEK CAROUSEL */}
        {showSection(1) && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <BoldSparkleIcon style={{ color: 'var(--mw-primary)' }} className="w-4 h-4 flex-shrink-0" />
                <span className="font-editorial text-[12px] font-extrabold tracking-widest uppercase text-gray-700 dark:text-gray-200 truncate">
                  Top Picks
                </span>
              </div>
              {ytRecs?.seedArtist && (
                <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 truncate">
                  {ytRecs.seedArtist}
                </span>
              )}
            </div>

            <div
              ref={topPicksScrollRef}
              onScroll={handleTopPicksScroll}
              onMouseEnter={pauseAutoScroll}
              onMouseLeave={scheduleResumeAutoScroll}
              onTouchStart={pauseAutoScroll}
              onTouchEnd={scheduleResumeAutoScroll}
              onPointerDown={pauseAutoScroll}
              className="-mx-4 md:-mx-6 px-[calc(50%-144px)] sm:px-[calc(50%-160px)] flex items-center gap-3 overflow-x-auto scrollbar-none py-1.5"
            >
              {topPicksCards.map((pick, idx) => {
                const isCentered = idx === activePickIdx;
                const xform = cardTransforms[idx] || {
                  scale: isCentered ? 1 : 0.9,
                  opacity: isCentered ? 1 : 0.76
                };
                return (
                  <div
                    key={`${pick.id}-${idx}`}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    onClick={() => {
                      if (!isCentered) {
                        pauseAutoScroll();
                        scrollToPickIndex(idx, true);
                        scheduleResumeAutoScroll();
                        return;
                      }
                      const list = pick.tracks && pick.tracks.length > 0 ? pick.tracks : tracks;
                      onPlayTrack(list[0] || tracks[0], list);
                    }}
                    style={{
                      transform: `scale(${xform.scale.toFixed(3)})`,
                      opacity: xform.opacity.toFixed(3)
                    }}
                    className={`w-[288px] sm:w-[320px] aspect-[1/1.04] flex-shrink-0 cursor-pointer will-change-transform ${
                      isCentered ? 'z-10' : 'z-0'
                    }`}
                  >
                    <div className="relative w-full h-full rounded-[28px] overflow-hidden bg-neutral-900 shadow-[0_14px_34px_rgba(0,0,0,0.22)]">
                      <img
                        src={pick.artworkUrl}
                        alt={pick.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <h3 className="font-display text-[19px] font-extrabold leading-tight truncate drop-shadow-sm">
                          {pick.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 2. INDIA'S BIGGEST HITS (Small Thumbnail + Uppercase Kicker + Bold Title + Arrow + 3-Visible Square Row) */}
        {showSection(2) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={biggestHitsList[0]?.artworkUrl || tracks[0]?.artworkUrl}
                  alt="Biggest Hits"
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover shadow-xs flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold tracking-wider uppercase text-gray-500 dark:text-gray-400 truncate">
                    MUSIC THAT&apos;S HOT AND HAPPENING!
                  </p>
                  <h2 className="font-display text-[17px] font-extrabold tracking-tight uppercase text-gray-900 dark:text-white truncate leading-tight">
                    INDIA&apos;S BIGGEST HITS
                  </h2>
                </div>
              </div>

              <button
                onClick={() => onOpenSearch('Biggest Hits 2026')}
                aria-label="Explore biggest hits"
                className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {biggestHitsList.slice(0, 10).map((t, idx) => (
                <div
                  key={`bh-${t.id}-${idx}`}
                  onClick={() => onPlayTrack(t, biggestHitsList)}
                  className="w-[122px] sm:w-[146px] flex-shrink-0 cursor-pointer group"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-xs">
                    <img
                      src={t.artworkUrl}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[12.5px] font-bold text-gray-900 dark:text-white mt-2 line-clamp-1">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {t.artist}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3. SIMILAR TO [SEED ARTIST] (Round Avatar + Similar to + Artist Name + Square Card Shelf) */}
        {showSection(3) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => onOpenArtist({ name: seedArtistName })}
                className="flex items-center gap-3 min-w-0 text-left group"
              >
                <img
                  src={findArtistAvatar(seedArtistName, becauseList[0]?.artworkUrl)}
                  alt={seedArtistName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover shadow-xs flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Similar to
                  </p>
                  <h2 className="font-display text-[17px] font-extrabold tracking-tight uppercase text-gray-900 dark:text-white truncate leading-tight group-hover:opacity-80">
                    {seedArtistName}
                  </h2>
                </div>
              </button>

              <button
                onClick={() => onOpenArtist({ name: seedArtistName })}
                aria-label={`Open ${seedArtistName}`}
                className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {becauseList.map((t, idx) => (
                <div
                  key={`sim1-${t.id}-${idx}`}
                  onClick={() => onPlayTrack(t, becauseList)}
                  className="w-[122px] sm:w-[146px] flex-shrink-0 cursor-pointer group"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-xs">
                    <img
                      src={t.artworkUrl}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[12.5px] font-bold text-gray-900 dark:text-white mt-2 truncate">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {t.artist}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. MOOD AND GENRES (Exact 2-Column Compact Rounded Tile Grid from Screen Recording 00:12–00:17) */}
        {showSection(4) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[15px] font-extrabold tracking-wider uppercase text-gray-900 dark:text-white">
                MOOD AND GENRES
              </h2>
              <button
                onClick={() => onOpenSearch('Moods')}
                aria-label="Explore moods and genres"
                className="w-8 h-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300"
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {moodAndGenresGrid.map((tile) => (
                <button
                  key={tile.label}
                  onClick={() => void handleStartInstantRadio(tile.label)}
                  disabled={Boolean(startingGenre)}
                  className={`h-[52px] px-4 rounded-2xl ${tile.bg} border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-left hover:brightness-97 active:scale-[0.98] transition-all`}
                >
                  <span className="text-[13.5px] font-bold text-gray-900 dark:text-white truncate">
                    {tile.label}
                  </span>
                  {startingGenre === tile.label && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--mw-primary)] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 5. SIMILAR TO [SECONDARY ARTIST] (Matching Screen Recording 00:13–00:17) */}
        {showSection(5) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => onOpenArtist({ name: secondaryArtistName })}
                className="flex items-center gap-3 min-w-0 text-left group"
              >
                <img
                  src={findArtistAvatar(secondaryArtistName, secondarySimilarList[0]?.artworkUrl)}
                  alt={secondaryArtistName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover shadow-xs flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Similar to
                  </p>
                  <h2 className="font-display text-[17px] font-extrabold tracking-tight uppercase text-gray-900 dark:text-white truncate leading-tight group-hover:opacity-80">
                    {secondaryArtistName}
                  </h2>
                </div>
              </button>

              <button
                onClick={() => onOpenArtist({ name: secondaryArtistName })}
                aria-label={`Open ${secondaryArtistName}`}
                className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {secondarySimilarList.slice(0, 8).map((t, idx) => (
                <div
                  key={`sim2-${t.id}-${idx}`}
                  onClick={() => onPlayTrack(t, secondarySimilarList)}
                  className="w-[122px] sm:w-[146px] flex-shrink-0 cursor-pointer group"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-xs">
                    <img
                      src={t.artworkUrl}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[12.5px] font-bold text-gray-900 dark:text-white mt-2 truncate">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {t.artist}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. SIMILAR TO [TERTIARY ARTIST] (Matching Screen Recording 00:13–00:17) */}
        {showSection(6) && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => onOpenArtist({ name: tertiaryArtistName })}
                className="flex items-center gap-3 min-w-0 text-left group"
              >
                <img
                  src={findArtistAvatar(tertiaryArtistName, tertiarySimilarList[0]?.artworkUrl)}
                  alt={tertiaryArtistName}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover shadow-xs flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    Similar to
                  </p>
                  <h2 className="font-display text-[17px] font-extrabold tracking-tight uppercase text-gray-900 dark:text-white truncate leading-tight group-hover:opacity-80">
                    {tertiaryArtistName}
                  </h2>
                </div>
              </button>

              <button
                onClick={() => onOpenArtist({ name: tertiaryArtistName })}
                aria-label={`Open ${tertiaryArtistName}`}
                className="w-9 h-9 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center text-gray-700 dark:text-gray-300 flex-shrink-0"
              >
                <ArrowRight className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
              {tertiarySimilarList.slice(0, 8).map((t, idx) => (
                <div
                  key={`sim3-${t.id}-${idx}`}
                  onClick={() => onPlayTrack(t, tertiarySimilarList)}
                  className="w-[122px] sm:w-[146px] flex-shrink-0 cursor-pointer group"
                >
                  <div className="aspect-square rounded-2xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 shadow-xs">
                    <img
                      src={t.artworkUrl}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[12.5px] font-bold text-gray-900 dark:text-white mt-2 truncate">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {t.artist}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. QUICK ACCESS + MY GENRES INSTANT RADIO */}
        {showSection(7) && (
          <section className="space-y-4">
            <div className="rounded-3xl bg-white/75 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 shadow-xs">
              <h2 className="font-display text-[19px] font-extrabold tracking-tight mb-3">
                Quick access
              </h2>

              <div className="flex md:grid md:grid-cols-4 gap-3 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={onOpenLikedSongs}
                  className="w-[142px] md:w-auto flex-shrink-0 rounded-2xl p-2.5 bg-[#BDF2C6] dark:bg-emerald-950/60 text-left hover:brightness-97 active:scale-[0.98] transition-all"
                >
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-[#89BD94] to-[#2F593B] flex items-center justify-center shadow-inner mb-2.5">
                    <BoldHeartIcon active className="w-8 h-8 text-[#163820]" />
                  </div>
                  <span className="font-display text-sm font-extrabold text-gray-900 dark:text-white block truncate">
                    Liked Songs
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block truncate">
                    Your collection
                  </span>
                </button>

                <button
                  onClick={() =>
                    onOpenDiscover
                      ? onOpenDiscover()
                      : onPlayTrack(discoverPool[0] || tracks[0], discoverPool)
                  }
                  className="w-[142px] md:w-auto flex-shrink-0 rounded-2xl p-2.5 bg-[#BCD4F8] dark:bg-blue-950/60 text-left hover:brightness-97 active:scale-[0.98] transition-all"
                >
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-[#8AB1EE] to-[#2E4F80] flex items-center justify-center shadow-inner mb-2.5">
                    <Compass className="w-8 h-8 text-[#10264A] stroke-[2.2]" />
                  </div>
                  <span className="font-display text-sm font-extrabold text-gray-900 dark:text-white block truncate">
                    Discover
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block truncate">
                    Made for you
                  </span>
                </button>

                <button
                  onClick={() =>
                    onOpenDiscoverNew
                      ? onOpenDiscoverNew()
                      : onPlayTrack(freshFindsList[0] || tracks[0], freshFindsList)
                  }
                  className="w-[142px] md:w-auto flex-shrink-0 rounded-2xl p-2.5 bg-[#D4E6D3] dark:bg-teal-950/60 text-left hover:brightness-97 active:scale-[0.98] transition-all"
                >
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-[#9FB8A0] to-[#3B5440] flex items-center justify-center shadow-inner mb-2.5">
                    <BoldSparkleIcon className="w-8 h-8 text-[#1D3022]" />
                  </div>
                  <span className="font-display text-sm font-extrabold text-gray-900 dark:text-white block truncate">
                    Discover New
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block truncate">
                    New releases
                  </span>
                </button>

                <button
                  onClick={onOpenJam}
                  className="w-[142px] md:w-auto flex-shrink-0 rounded-2xl p-2.5 bg-[#EFE6D5] dark:bg-amber-950/50 text-left hover:brightness-97 active:scale-[0.98] transition-all"
                >
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-[#C8B89E] to-[#6E563B] flex items-center justify-center shadow-inner mb-2.5">
                    <Users className="w-8 h-8 text-[#2D2114] stroke-[2.2]" />
                  </div>
                  <span className="font-display text-sm font-extrabold text-gray-900 dark:text-white block truncate">
                    Friends Jam
                  </span>
                  <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 block truncate">
                    Listen together
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-3xl bg-white/75 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 shadow-xs">
              <h2 className="font-display text-[19px] font-extrabold tracking-tight">
                My genres
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 mb-3">
                Start a station by genre
              </p>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {genres.map((genre) => {
                  const isLoadingThis = startingGenre === genre;
                  return (
                    <button
                      key={genre}
                      onClick={() => void handleStartInstantRadio(genre)}
                      disabled={Boolean(startingGenre)}
                      className="px-4 py-2 rounded-full bg-black/[0.04] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.08] dark:hover:bg-white/[0.14] text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2 active:scale-95 transition-all min-h-[38px]"
                    >
                      {isLoadingThis ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--mw-primary)]" />
                      ) : (
                        <Radio className="w-3.5 h-3.5 text-[var(--mw-primary)]" />
                      )}
                      <span>{genre}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 8. TRENDING COMMUNITY PLAYLISTS */}
        {showSection(8) && communityPlaylists.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-display text-[19px] font-extrabold tracking-tight px-1">
              Trending community playlists
            </h2>

            <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto pb-1 scrollbar-none">
              {communityPlaylists.map((pl) => (
                <div
                  key={pl.id}
                  className="w-[300px] md:w-auto flex-shrink-0 rounded-3xl bg-[#8F8982]/20 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] p-4 space-y-3.5"
                >
                  <div
                    onClick={() => pl.tracks[0] && onPlayTrack(pl.tracks[0], pl.tracks)}
                    className="w-36 h-36 mx-auto rounded-2xl overflow-hidden grid grid-cols-2 grid-rows-2 gap-0.5 shadow-md cursor-pointer"
                  >
                    {pl.collageCovers.slice(0, 4).map((cov, cIdx) => (
                      <img
                        key={cIdx}
                        src={cov}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-extrabold text-gray-900 dark:text-white truncate">
                        {pl.title}
                      </h3>
                      <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate mt-0.5">
                        {pl.curator} · {pl.playsLabel}
                      </p>
                    </div>
                    <button
                      onClick={() => pl.tracks[0] && onPlayTrack(pl.tracks[0], pl.tracks)}
                      aria-label={`Play ${pl.title}`}
                      className="w-10 h-10 rounded-full bg-black/15 dark:bg-white/15 flex items-center justify-center text-gray-900 dark:text-white flex-shrink-0 hover:scale-105 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                    {pl.tracks.slice(0, 3).map((tr, ti) => (
                      <div
                        key={`${pl.id}-tr-${tr.id}-${ti}`}
                        onClick={() => onPlayTrack(tr, pl.tracks)}
                        className="flex items-center justify-between py-2 gap-2.5 cursor-pointer hover:opacity-80"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={tr.artworkUrl}
                            alt={tr.title}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {tr.title}
                            </h4>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                              {tr.artist}
                            </p>
                          </div>
                        </div>
                        <Play className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 9. FRESH FINDS & QUICK PICKS */}
        {showSection(9) && (
          <section className="space-y-5">
            <div className="rounded-3xl bg-white/75 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-display text-[19px] font-extrabold tracking-tight">
                    Fresh finds
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    New tracks beyond your usual rotation
                  </p>
                </div>
                <button
                  onClick={() => onPlayTrack(freshFindsList[0] || tracks[0], freshFindsList)}
                  aria-label="Shuffle fresh finds"
                  style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                {freshFindsList.slice(0, 8).map((t, idx) => (
                  <div
                    key={`ff-${t.id}-${idx}`}
                    onClick={() => onPlayTrack(t, freshFindsList)}
                    className="w-[126px] sm:w-[148px] flex-shrink-0 cursor-pointer group"
                  >
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-xs bg-neutral-200 dark:bg-neutral-800">
                      <img
                        src={t.artworkUrl}
                        alt={t.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        style={{ backgroundColor: 'var(--mw-primary)' }}
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold text-white"
                      >
                        NEW
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-2 truncate">
                      {t.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{t.artist}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white/75 dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.08] p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-display text-[19px] font-extrabold tracking-tight">
                    {activeChip === 'All' ? 'Quick picks' : `${activeChip} Mix`}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Ready to stream
                  </p>
                </div>
                <button
                  onClick={() => onPlayTrack(quickPicksList[0] || tracks[0], quickPicksList)}
                  style={{ color: 'var(--mw-primary)' }}
                  className="text-xs font-bold flex items-center gap-1 hover:underline"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play All</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-6 divide-y md:divide-y-0 divide-black/[0.06] dark:divide-white/[0.08]">
                {quickPicksList.map((track, idx) => {
                  const isDownloaded = downloadedIds.has(track.id);
                  return (
                    <div
                      key={`qp-${track.id}-${idx}`}
                      onClick={() => onPlayTrack(track, quickPicksList)}
                      className="flex items-center justify-between py-2.5 md:px-2 md:rounded-xl hover:bg-black/[0.03] dark:hover:bg-white/[0.04] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <img
                          src={track.artworkUrl}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {track.artist} · {track.quality.badgeLabel}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDownload(track);
                        }}
                        aria-label={isDownloaded ? 'Remove offline download' : 'Download track'}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                          isDownloaded
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                        }`}
                      >
                        {isDownloaded ? (
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        ) : (
                          <BoldDownloadIcon className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* 10. ARTISTS FOR YOU & RELEASE RADAR / ALBUMS */}
        {showSection(10) && (
          <section className="space-y-6 pt-1">
            <div>
              <h2 className="font-display text-[19px] font-extrabold tracking-tight mb-3 px-1">
                Artists for You
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {artistsList.map((artist, idx) => (
                  <div
                    key={`art-${artist.id}-${idx}`}
                    onClick={() =>
                      onOpenArtist({
                        id: artist.id.length < 15 ? artist.id : undefined,
                        name: artist.name
                      })
                    }
                    className="flex flex-col items-center flex-shrink-0 cursor-pointer group w-24"
                  >
                    <div className="w-22 h-22 rounded-full overflow-hidden shadow-sm bg-neutral-200 dark:bg-neutral-800">
                      <img
                        src={artist.avatarUrl}
                        alt={artist.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white mt-2 truncate max-w-full text-center">
                      {artist.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-1.5">
                  <Disc3 style={{ color: 'var(--mw-primary)' }} className="w-4.5 h-4.5" />
                  <h2 className="font-display text-[19px] font-extrabold tracking-tight">
                    {newReleasesList.length > 0 ? 'Release Radar & Albums' : 'Albums for You'}
                  </h2>
                </div>
                <button
                  onClick={() => onOpenSearch('New Releases 2026')}
                  style={{ color: 'var(--mw-primary)' }}
                  className="text-xs font-bold flex items-center gap-0.5 hover:underline"
                >
                  <span>See All</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {(newReleasesList.length > 0 ? newReleasesList : albumsList).map((album, idx) => (
                  <div
                    key={`alb-${album.id}-${idx}`}
                    onClick={() =>
                      onOpenAlbum({
                        id: /^\d+$/.test(album.id) ? album.id : undefined,
                        title: album.title,
                        artist: album.artist
                      })
                    }
                    className="w-[126px] sm:w-[148px] flex-shrink-0 cursor-pointer group"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden shadow-xs bg-neutral-200 dark:bg-neutral-800">
                      <img
                        src={album.coverUrl}
                        alt={album.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-2 truncate">
                      {album.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {album.artist} · {album.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
