import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Compass,
  Play,
  Shuffle,
  RotateCw,
  ListPlus,
  BookmarkPlus,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Track, Playlist, ListeningStats } from '../types/music';
import { ytMusicService, YTMusicArtistSummary, YTMusicAlbumSummary } from '../services/ytMusicService';
import { newpipeService } from '../services/newpipeService';
import { BoldDownloadIcon, BoldHeartIcon } from './CustomIcons';

interface DiscoverScreenProps {
  tracks: Track[];
  stats: ListeningStats;
  downloadedIds: Set<string>;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onToggleDownload: (track: Track) => void;
  onSaveAsPlaylist: (playlist: Playlist, addedTracks: Track[]) => void;
  onOpenArtist: (artist: { id?: string; name: string }) => void;
  onOpenAlbum: (album: { id?: string; title?: string; artist?: string }) => void;
  onClose: () => void;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  tracks,
  stats,
  downloadedIds,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  onToggleDownload,
  onSaveAsPlaylist,
  onOpenArtist,
  onOpenAlbum,
  onClose
}) => {
  const [selectedVibe, setSelectedVibe] = useState('All');
  const [discoveryTracks, setDiscoveryTracks] = useState<Track[]>([]);
  const [artists, setArtists] = useState<YTMusicArtistSummary[]>([]);
  const [albums, setAlbums] = useState<YTMusicAlbumSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const vibes = ['All', 'Hindi', 'Tamil', 'Indie', 'Electronic', 'Acoustic'];

  const loadDiscovery = useCallback(async (vibe: string) => {
    setLoading(true);
    try {
      if (vibe === 'All') {
        const recs = await ytMusicService.getHomeRecommendations({
          recentTracks: stats.recentPlays.map((p) => p.track),
          likedArtists: tracks.filter((t) => t.isLiked).map((t) => t.artist),
          mood: 'All',
          rotationSeed: Math.floor(Date.now() / 180000)
        });
        if (recs) {
          const merged = [...recs.discoveryMix, ...recs.quickPicks, ...recs.freshFinds];
          const seen = new Set<string>();
          setDiscoveryTracks(
            merged.filter((t) => {
              if (seen.has(t.id)) return false;
              seen.add(t.id);
              return true;
            })
          );
          setArtists(recs.artistsForYou || []);
          setAlbums(recs.albumsForYou || []);
        }
      } else {
        const res = await newpipeService.search(`${vibe} indie hits 2026`);
        setDiscoveryTracks(res.items);
      }
    } finally {
      setLoading(false);
    }
  }, [stats.recentPlays, tracks]);

  useEffect(() => {
    void loadDiscovery(selectedVibe);
  }, [selectedVibe, loadDiscovery]);

  const handleSaveMix = () => {
    if (discoveryTracks.length === 0) return;
    onSaveAsPlaylist(
      {
        id: `pl-discover-${Date.now()}`,
        title: `Discover Mix · ${selectedVibe}`,
        trackIds: discoveryTracks.slice(0, 15).map((t) => t.id),
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        isPinned: false,
        coverUrl: discoveryTracks[0]?.artworkUrl
      },
      discoveryTracks.slice(0, 15)
    );
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: 'blur(12px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-45 bg-[var(--mw-page-bg)] text-gray-900 dark:text-white overflow-y-auto pb-40 select-none"
    >
      {/* Color-Theory Cobalt / Sapphire Hero */}
      <div className="bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8]/85 to-[var(--mw-page-bg)] text-white pt-[max(14px,env(safe-area-inset-top))] pb-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              aria-label="Back to Home"
              className="w-11 h-11 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveMix}
                disabled={discoveryTracks.length === 0}
                className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-bold flex items-center gap-1.5"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{savedToast ? 'Saved' : 'Save Mix'}</span>
              </button>
              <button
                onClick={() => void loadDiscovery(selectedVibe)}
                aria-label="Refresh Discover"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center"
              >
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#60A5FA] via-[#2563EB] to-[#1E3A8A] flex items-center justify-center shadow-2xl flex-shrink-0">
              <Compass className="w-12 h-12 text-white" />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                Discover
              </h1>
              <p className="text-xs text-white/80 mt-2">
                Artists &amp; tracks matched to your listening history
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => discoveryTracks[0] && onPlayTrack(discoveryTracks[0], discoveryTracks)}
              disabled={discoveryTracks.length === 0}
              className="h-11 px-6 rounded-full bg-white text-[#1E3A8A] font-display font-extrabold text-sm flex items-center gap-2 shadow-lg hover:brightness-95 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Mix</span>
            </button>
            <button
              onClick={() => {
                if (discoveryTracks.length === 0) return;
                const s = [...discoveryTracks].sort(() => Math.random() - 0.5);
                onPlayTrack(s[0], s);
              }}
              disabled={discoveryTracks.length === 0}
              className="h-11 px-5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-sm flex items-center gap-2"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 mt-2">
        {/* Genre / Language Filters */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {vibes.map((v) => (
            <button
              key={v}
              onClick={() => setSelectedVibe(v)}
              className={`px-4 h-10 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedVibe === v
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-[var(--mw-surface)] border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Artists Section */}
        {artists.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-extrabold">Recommended Artists</h2>
            <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-1">
              {artists.map((artist, idx) => (
                <button
                  key={`disc-art-${artist.id}-${idx}`}
                  onClick={() =>
                    onOpenArtist({ id: artist.id.length < 15 ? artist.id : undefined, name: artist.name })
                  }
                  className="w-24 flex-shrink-0 text-center group"
                >
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-md bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={artist.avatarUrl}
                      alt={artist.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <span className="block text-xs font-bold truncate mt-2">{artist.name}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Tracks List */}
        <section className="space-y-2.5">
          <h2 className="font-display text-lg font-extrabold">
            {selectedVibe === 'All' ? 'Discovery Tracks' : `${selectedVibe} Selections`}
          </h2>

          {loading ? (
            <div className="py-14 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#2563EB]" />
              <span>Loading selections...</span>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] bg-[var(--mw-surface)] rounded-3xl border border-black/[0.05] dark:border-white/[0.07] px-3">
              {discoveryTracks.map((track, idx) => {
                const isDownloaded = downloadedIds.has(track.id);
                return (
                  <div
                    key={`disc-tr-${track.id}-${idx}`}
                    onClick={() => onPlayTrack(track, discoveryTracks)}
                    className="flex items-center justify-between py-3 px-1.5 gap-3 cursor-pointer hover:opacity-85"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={track.artworkUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold truncate">{track.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {track.artist} · {track.quality.badgeLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleLike(track.id)}
                        aria-label="Like track"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-rose-500"
                      >
                        <BoldHeartIcon active={track.isLiked} className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => onAddToQueue(track)}
                        aria-label="Add to queue"
                        className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white"
                      >
                        <ListPlus className="w-4.5 h-4.5" />
                      </button>
                      <button
                        onClick={() => onToggleDownload(track)}
                        aria-label="Download"
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isDownloaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'
                        }`}
                      >
                        {isDownloaded ? (
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        ) : (
                          <BoldDownloadIcon className="w-4.5 h-4.5" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Albums Shelf */}
        {albums.length > 0 && (
          <section className="space-y-2.5">
            <h2 className="font-display text-lg font-extrabold">Albums to Explore</h2>
            <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-1">
              {albums.map((alb, idx) => (
                <button
                  key={`disc-alb-${alb.id}-${idx}`}
                  onClick={() =>
                    onOpenAlbum({
                      id: /^\d+$/.test(alb.id) ? alb.id : undefined,
                      title: alb.title,
                      artist: alb.artist
                    })
                  }
                  className="w-36 flex-shrink-0 text-left group"
                >
                  <div className="w-36 h-36 rounded-2xl overflow-hidden shadow-sm bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={alb.coverUrl}
                      alt={alb.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs font-bold truncate mt-2">{alb.title}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{alb.artist}</p>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
};
