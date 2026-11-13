import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Shuffle,
  Radio,
  UserPlus,
  UserCheck,
  Loader2,
  Download,
  CheckCircle2,
  ListPlus,
  Disc3,
  AlertCircle,
  MoreVertical,
  BadgeCheck,
  X
} from 'lucide-react';
import { Track } from '../types/music';
import {
  ytMusicService,
  YTMusicArtistDetail,
  YTMusicAlbumSummary,
  YTMusicArtistSummary
} from '../services/ytMusicService';

interface ArtistDetailModalProps {
  artistQuery: { id?: string; name: string };
  downloadedIds: Set<string>;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onToggleDownload: (track: Track) => void;
  onOpenAlbum: (album: YTMusicAlbumSummary) => void;
  onOpenArtist: (artist: { id?: string; name: string }) => void;
  onFollowChanged: () => void;
  onClose: () => void;
}

export const ArtistDetailModal: React.FC<ArtistDetailModalProps> = ({
  artistQuery,
  downloadedIds,
  onPlayTrack,
  onAddToQueue,
  onToggleDownload,
  onOpenAlbum,
  onOpenArtist,
  onFollowChanged,
  onClose
}) => {
  const [detail, setDetail] = useState<YTMusicArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowed, setIsFollowed] = useState(() =>
    ytMusicService.isArtistFollowed(artistQuery.name)
  );
  const [bioExpanded, setBioExpanded] = useState(false);
  const [scrolledHeader, setScrolledHeader] = useState(false);
  const [actionTrack, setActionTrack] = useState<Track | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setBioExpanded(false);
    setScrolledHeader(false);
    setIsFollowed(ytMusicService.isArtistFollowed(artistQuery.name));
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

    ytMusicService
      .getArtistDetail(artistQuery)
      .then((res) => {
        if (!active) return;
        setDetail(res);
        setIsFollowed(ytMusicService.isArtistFollowed(res.name));
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load artist');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [artistQuery.id, artistQuery.name]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrolledHeader(e.currentTarget.scrollTop > 220);
  };

  const formatCount = (n: number) => {
    if (!n) return '';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
    return String(n);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleSubscribe = () => {
    const targetName = detail?.name || artistQuery.name;
    ytMusicService.toggleFollowArtist(targetName);
    setIsFollowed(ytMusicService.isArtistFollowed(targetName));
    onFollowChanged();
  };

  const handlePlayAll = () => {
    if (detail && detail.topSongs.length > 0) {
      onPlayTrack(detail.topSongs[0], detail.topSongs);
    }
  };

  const handleShufflePlay = () => {
    if (detail && detail.topSongs.length > 0) {
      const shuffled = [...detail.topSongs].sort(() => Math.random() - 0.5);
      onPlayTrack(shuffled[0], shuffled);
    }
  };

  const listenerCountRaw = detail ? Math.max(detail.fanCount || 0, detail.followerCount || 0) : 0;
  const listenerBadgeText = listenerCountRaw > 0 ? formatCount(listenerCountRaw) : '';

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-50 overflow-y-auto bg-[var(--mw-page-bg)] text-gray-900 dark:text-white select-none pb-36"
    >
      {/* Compact Sticky Scrolled Top Bar */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
          scrolledHeader
            ? 'bg-[var(--mw-page-bg)]/94 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] shadow-xs pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="max-w-3xl mx-auto px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              aria-label="Back"
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-extrabold truncate">
              {detail?.name || artistQuery.name}
            </h1>
          </div>

          <button
            onClick={handlePlayAll}
            disabled={!detail || detail.topSongs.length === 0}
            aria-label="Play artist top songs"
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-xs active:scale-95 transition-transform disabled:opacity-40 flex-shrink-0"
          >
            <Play className="w-4.5 h-4.5 fill-current translate-x-0.5" />
          </button>
        </div>
      </header>

      {/* Top Floating Controls when at Hero Top */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 max-w-3xl mx-auto px-4 pt-[max(14px,env(safe-area-inset-top))] flex items-center justify-between transition-opacity duration-200 ${
          scrolledHeader ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <button
          onClick={onClose}
          aria-label="Back"
          className="w-10 h-10 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md text-white flex items-center justify-center border border-white/15 active:scale-90 transition-all shadow-md"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleToggleSubscribe}
          style={
            isFollowed
              ? { backgroundColor: 'var(--mw-primary)', color: '#ffffff' }
              : undefined
          }
          className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border active:scale-95 transition-all shadow-md ${
            isFollowed
              ? 'border-transparent'
              : 'bg-black/45 hover:bg-black/65 text-white border-white/20'
          }`}
        >
          {isFollowed ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
          <span>{isFollowed ? 'Following' : 'Follow'}</span>
        </button>
      </div>

      <div className="max-w-3xl mx-auto min-h-[100dvh]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-36 gap-3 text-gray-500">
            <Loader2 style={{ color: 'var(--mw-primary)' }} className="w-8 h-8 animate-spin" />
            <p className="text-xs font-semibold">Loading {artistQuery.name}...</p>
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center py-36 px-6 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-bold">{error || 'Artist unavailable'}</p>
            <button
              onClick={onClose}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="px-5 py-2 rounded-full text-white text-xs font-bold"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div>
            {/* Full-Bleed Edge-to-Edge Hero Artist Portrait */}
            <div className="relative w-full h-[390px] sm:h-[440px] overflow-hidden bg-neutral-900">
              <img
                src={detail.imageUrl}
                alt={detail.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />

              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0,0,0,0.34) 0%, rgba(0,0,0,0.04) 38%, rgba(0,0,0,0.62) 72%, rgba(0,0,0,0.82) 86%, var(--mw-page-bg) 100%)'
                }}
              />

              <div className="absolute bottom-6 left-4.5 right-4.5 z-10">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-[32px] sm:text-[38px] font-black tracking-tight text-white leading-none drop-shadow-md truncate">
                    {detail.name}
                  </h2>
                  <BadgeCheck
                    style={{ color: '#ffffff', fill: 'var(--mw-primary)' }}
                    className="w-7 h-7 flex-shrink-0 drop-shadow-sm"
                  />
                </div>
                <p className="text-[13.5px] font-bold text-white/90 mt-1.5 drop-shadow-sm">
                  {listenerBadgeText ? `${listenerBadgeText} monthly listeners` : detail.dominantLanguage || 'Verified Artist'}
                </p>
              </div>
            </div>

            <div className="px-4.5 pt-2 space-y-6">
              {/* Action Row: Shuffle + Radio Left | Solid Circular Play Button Right */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShufflePlay}
                    disabled={detail.topSongs.length === 0}
                    aria-label="Shuffle artist songs"
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-xs hover:brightness-95 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <Shuffle className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>

                  <button
                    onClick={handleShufflePlay}
                    disabled={detail.topSongs.length === 0}
                    aria-label="Start artist radio"
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-full flex items-center justify-center shadow-xs hover:brightness-95 active:scale-95 transition-all disabled:opacity-40"
                  >
                    <Radio className="w-4.5 h-4.5 stroke-[2.2]" />
                  </button>
                </div>

                <button
                  onClick={handlePlayAll}
                  disabled={detail.topSongs.length === 0}
                  aria-label="Play top songs"
                  style={{ backgroundColor: 'var(--mw-primary)' }}
                  className="w-14 h-14 rounded-full text-white flex items-center justify-center shadow-lg hover:brightness-95 active:scale-95 transition-all disabled:opacity-40"
                >
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </button>
              </div>

              {/* Rounded About Biography Card */}
              {detail.bio && (
                <section className="p-4.5 rounded-3xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.08]">
                  <h3
                    style={{ color: 'var(--mw-primary)' }}
                    className="font-display text-sm font-extrabold mb-1.5"
                  >
                    About
                  </h3>
                  <p
                    className={`text-[13.5px] text-gray-800 dark:text-gray-200 leading-relaxed ${
                      bioExpanded ? '' : 'line-clamp-4'
                    }`}
                  >
                    {detail.bio}
                  </p>
                  {detail.bio.length > 140 && (
                    <button
                      onClick={() => setBioExpanded((prev) => !prev)}
                      style={{ color: 'var(--mw-primary)' }}
                      className="mt-2 text-xs font-extrabold hover:underline"
                    >
                      {bioExpanded ? 'Show less' : '... Read more'}
                    </button>
                  )}
                </section>
              )}

              {/* Songs Section */}
              {detail.topSongs.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[22px] font-extrabold tracking-tight">
                      Songs
                    </h3>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {detail.topSongs.length} tracks
                    </span>
                  </div>

                  <div className="space-y-2">
                    {detail.topSongs.map((track, idx) => {
                      const isDl = downloadedIds.has(track.id);
                      return (
                        <div
                          key={`${track.id}-${idx}`}
                          onClick={() => onPlayTrack(track, detail.topSongs)}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-black/[0.035] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                            <img
                              src={track.artworkUrl}
                              alt={track.title}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                            />
                            <div className="min-w-0">
                              <h4 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">
                                {track.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-1">
                                {isDl && (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                                )}
                                <span className="truncate">
                                  {track.album || track.artist} · {formatDuration(track.duration)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionTrack(track);
                            }}
                            aria-label={`More options for ${track.title}`}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0"
                          >
                            <MoreVertical className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Albums */}
              {detail.topAlbums.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-display text-[20px] font-extrabold tracking-tight">
                    Albums
                  </h3>
                  <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none">
                    {detail.topAlbums.map((alb, idx) => (
                      <div
                        key={`${alb.id}-${idx}`}
                        onClick={() => onOpenAlbum(alb)}
                        className="w-36 flex-shrink-0 cursor-pointer group"
                      >
                        <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800">
                          <img
                            src={alb.coverUrl}
                            alt={alb.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <h4 className="text-xs font-bold mt-2 truncate">{alb.title}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {alb.year} · {alb.trackCount} songs
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Singles & EPs */}
              {detail.singles.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-display text-[20px] font-extrabold tracking-tight">
                    Singles &amp; EPs
                  </h3>
                  <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none">
                    {detail.singles.slice(0, 10).map((alb, idx) => (
                      <div
                        key={`${alb.id}-${idx}`}
                        onClick={() => onOpenAlbum(alb)}
                        className="w-32 flex-shrink-0 cursor-pointer group"
                      >
                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800">
                          <img
                            src={alb.coverUrl}
                            alt={alb.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center">
                            <Disc3 className="w-3.5 h-3.5" />
                          </div>
                        </div>
                        <h4 className="text-xs font-bold mt-1.5 truncate">{alb.title}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {alb.year}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Fans Might Also Like */}
              {detail.similarArtists.length > 0 && (
                <section className="space-y-3">
                  <h3 className="font-display text-[20px] font-extrabold tracking-tight">
                    Fans might also like
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                    {detail.similarArtists.map((sim: YTMusicArtistSummary, idx) => (
                      <div
                        key={`${sim.id}-${idx}`}
                        onClick={() => onOpenArtist({ id: sim.id, name: sim.name })}
                        className="flex flex-col items-center flex-shrink-0 cursor-pointer group"
                      >
                        <div className="w-22 h-22 rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-sm group-hover:scale-105 transition-transform bg-neutral-200 dark:bg-neutral-800">
                          <img
                            src={sim.avatarUrl}
                            alt={sim.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="text-xs font-bold mt-2 max-w-[88px] truncate text-center">
                          {sim.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Song 3-Dots Bottom Action Sheet */}
      {actionTrack && detail && (
        <div
          onClick={() => setActionTrack(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161918] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl divide-y divide-black/[0.06] dark:divide-white/10"
          >
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={actionTrack.artworkUrl}
                  alt={actionTrack.title}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="text-sm font-bold truncate">{actionTrack.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {actionTrack.artist} · {actionTrack.album}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActionTrack(null)}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="divide-y divide-black/[0.05] dark:divide-white/[0.07] text-sm font-semibold">
              <button
                onClick={() => {
                  onPlayTrack(actionTrack, detail.topSongs);
                  setActionTrack(null);
                }}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-black/[0.03] dark:hover:bg-white/5 text-left"
              >
                <span>Play Now</span>
                <Play className="w-4 h-4 text-[var(--mw-primary)] fill-current" />
              </button>

              <button
                onClick={() => {
                  onAddToQueue(actionTrack);
                  setActionTrack(null);
                }}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-black/[0.03] dark:hover:bg-white/5 text-left"
              >
                <span>Add to Up Next Queue</span>
                <ListPlus className="w-4 h-4 text-gray-500" />
              </button>

              <button
                onClick={() => {
                  onToggleDownload(actionTrack);
                  setActionTrack(null);
                }}
                className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-black/[0.03] dark:hover:bg-white/5 text-left"
              >
                <span>
                  {downloadedIds.has(actionTrack.id)
                    ? 'Remove Offline Download'
                    : 'Download Merged Audio + Cover'}
                </span>
                {downloadedIds.has(actionTrack.id) ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Download className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {actionTrack.album && (
                <button
                  onClick={() => {
                    const albTitle = actionTrack.album;
                    setActionTrack(null);
                    onOpenAlbum({
                      id: '',
                      title: albTitle,
                      artist: detail.name,
                      year: new Date().getFullYear(),
                      trackCount: 1,
                      coverUrl: actionTrack.artworkUrl
                    });
                  }}
                  className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-black/[0.03] dark:hover:bg-white/5 text-left"
                >
                  <span>Open Album · {actionTrack.album}</span>
                  <Disc3 className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
