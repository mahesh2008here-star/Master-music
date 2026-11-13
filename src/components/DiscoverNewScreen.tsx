import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Play,
  Disc3,
  RotateCw,
  ListPlus,
  CheckCircle2,
  BookmarkPlus,
  Loader2
} from 'lucide-react';
import { Track, Playlist, ListeningStats } from '../types/music';
import { ytMusicService, YTMusicAlbumSummary } from '../services/ytMusicService';
import { newpipeService } from '../services/newpipeService';
import { BoldDownloadIcon, BoldHeartIcon, BoldSparkleIcon } from './CustomIcons';

interface DiscoverNewScreenProps {
  stats: ListeningStats;
  downloadedIds: Set<string>;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onToggleDownload: (track: Track) => void;
  onSaveAsPlaylist: (playlist: Playlist, addedTracks: Track[]) => void;
  onOpenAlbum: (album: { id?: string; title?: string; artist?: string }) => void;
  onClose: () => void;
}

export const DiscoverNewScreen: React.FC<DiscoverNewScreenProps> = ({
  stats,
  downloadedIds,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  onToggleDownload,
  onSaveAsPlaylist,
  onOpenAlbum,
  onClose
}) => {
  const [category, setCategory] = useState<'2026 Releases' | 'Hindi Fresh' | 'Tamil Fresh' | 'Indie Drops'>('2026 Releases');
  const [newTracks, setNewTracks] = useState<Track[]>([]);
  const [newAlbums, setNewAlbums] = useState<YTMusicAlbumSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  const loadNewMusic = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const queryMap: Record<string, string> = {
        '2026 Releases': 'new releases 2026 latest songs',
        'Hindi Fresh': 'latest hindi songs 2026',
        'Tamil Fresh': 'latest tamil hits 2026',
        'Indie Drops': 'new indie singles 2026'
      };

      const [searchRes, recsRes] = await Promise.all([
        newpipeService.search(queryMap[cat] || 'latest songs 2026'),
        ytMusicService.getHomeRecommendations({
          recentTracks: stats.recentPlays.map((p) => p.track),
          likedArtists: [],
          mood: 'All'
        })
      ]);

      const playedTitles = new Set(stats.recentPlays.map((p) => p.track.title.toLowerCase()));
      const unseen = searchRes.items.filter((t) => !playedTitles.has(t.title.toLowerCase()));
      setNewTracks(unseen.length > 0 ? unseen : searchRes.items);
      if (recsRes?.newReleases) {
        setNewAlbums(recsRes.newReleases);
      }
    } finally {
      setLoading(false);
    }
  }, [stats.recentPlays]);

  useEffect(() => {
    void loadNewMusic(category);
  }, [category, loadNewMusic]);

  const handleSaveRadar = () => {
    if (newTracks.length === 0) return;
    onSaveAsPlaylist(
      {
        id: `pl-new-${Date.now()}`,
        title: `${category} Radar`,
        trackIds: newTracks.slice(0, 15).map((t) => t.id),
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        isPinned: false,
        coverUrl: newTracks[0]?.artworkUrl
      },
      newTracks.slice(0, 15)
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
      {/* Color-Theory Royal Indigo / Amethyst Hero */}
      <div className="bg-gradient-to-b from-[#4C1D95] via-[#6D28D9]/85 to-[var(--mw-page-bg)] text-white pt-[max(14px,env(safe-area-inset-top))] pb-6 px-4 md:px-6">
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
                onClick={handleSaveRadar}
                disabled={newTracks.length === 0}
                className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-bold flex items-center gap-1.5"
              >
                <BookmarkPlus className="w-4 h-4" />
                <span>{savedToast ? 'Saved' : 'Save Radar'}</span>
              </button>
              <button
                onClick={() => void loadNewMusic(category)}
                aria-label="Refresh new releases"
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center"
              >
                <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#A78BFA] via-[#7C3AED] to-[#4C1D95] flex items-center justify-center shadow-2xl flex-shrink-0">
              <BoldSparkleIcon className="w-12 h-12 text-white" />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                Discover New
              </h1>
              <p className="text-xs text-white/80 mt-2">
                Fresh singles, latest album drops &amp; unheard releases
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => newTracks[0] && onPlayTrack(newTracks[0], newTracks)}
              disabled={newTracks.length === 0}
              className="h-11 px-6 rounded-full bg-white text-[#4C1D95] font-display font-extrabold text-sm flex items-center gap-2 shadow-lg hover:brightness-95 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play New Drops</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-6 mt-2">
        {/* Category Switcher */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {(['2026 Releases', 'Hindi Fresh', 'Tamil Fresh', 'Indie Drops'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 h-10 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'bg-[var(--mw-surface)] border border-black/[0.06] dark:border-white/[0.08] text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* New Albums Carousel */}
        {newAlbums.length > 0 && (
          <section className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4.5 h-4.5 text-[#7C3AED]" />
              <h2 className="font-display text-lg font-extrabold">New Albums &amp; EPs</h2>
            </div>
            <div className="flex gap-3.5 overflow-x-auto scrollbar-none pb-1">
              {newAlbums.map((alb, idx) => (
                <button
                  key={`dn-alb-${alb.id}-${idx}`}
                  onClick={() =>
                    onOpenAlbum({
                      id: /^\d+$/.test(alb.id) ? alb.id : undefined,
                      title: alb.title,
                      artist: alb.artist
                    })
                  }
                  className="w-36 flex-shrink-0 text-left group"
                >
                  <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-sm bg-neutral-200 dark:bg-neutral-800">
                    <img
                      src={alb.coverUrl}
                      alt={alb.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs font-bold truncate mt-2">{alb.title}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    {alb.artist} · {alb.year}
                  </p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Fresh Tracks List */}
        <section className="space-y-2.5">
          <h2 className="font-display text-lg font-extrabold">{category}</h2>

          {loading ? (
            <div className="py-14 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-[#7C3AED]" />
              <span>Fetching latest drops...</span>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] bg-[var(--mw-surface)] rounded-3xl border border-black/[0.05] dark:border-white/[0.07] px-3">
              {newTracks.map((track, idx) => {
                const isDownloaded = downloadedIds.has(track.id);
                return (
                  <div
                    key={`dn-tr-${track.id}-${idx}`}
                    onClick={() => onPlayTrack(track, newTracks)}
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
                          {track.artist} · {track.album}
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
      </main>
    </motion.div>
  );
};
