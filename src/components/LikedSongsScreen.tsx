import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Play,
  Shuffle,
  Search,
  CheckCircle2,
  ListPlus,
  Plus,
  BookmarkPlus,
  X
} from 'lucide-react';
import { Track, Playlist } from '../types/music';
import { BoldDownloadIcon, BoldHeartIcon } from './CustomIcons';

interface LikedSongsScreenProps {
  tracks: Track[];
  currentTrackId?: string;
  downloadedIds: Set<string>;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onToggleDownload: (track: Track) => void;
  onSaveAsPlaylist?: (playlist: Playlist, addedTracks: Track[]) => void;
  onClose: () => void;
}

export const LikedSongsScreen: React.FC<LikedSongsScreenProps> = ({
  tracks,
  currentTrackId,
  downloadedIds,
  onPlayTrack,
  onToggleLike,
  onAddToQueue,
  onToggleDownload,
  onSaveAsPlaylist,
  onClose
}) => {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'artist'>('recent');
  const [savedToast, setSavedToast] = useState(false);

  const likedTracks = useMemo(() => {
    const base = tracks.filter((t) => t.isLiked);
    const filtered = query.trim()
      ? base.filter(
          (t) =>
            t.title.toLowerCase().includes(query.toLowerCase()) ||
            t.artist.toLowerCase().includes(query.toLowerCase()) ||
            t.album.toLowerCase().includes(query.toLowerCase())
        )
      : base;

    const sorted = [...filtered];
    if (sortBy === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'artist') sorted.sort((a, b) => a.artist.localeCompare(b.artist));
    return sorted;
  }, [tracks, query, sortBy]);

  const unlikedSuggestions = useMemo(
    () => tracks.filter((t) => !t.isLiked).slice(0, 6),
    [tracks]
  );

  const totalMinutes = Math.max(
    1,
    Math.round(likedTracks.reduce((acc, t) => acc + (t.duration || 0), 0) / 60)
  );

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSaveCollection = () => {
    if (!onSaveAsPlaylist || likedTracks.length === 0) return;
    onSaveAsPlaylist(
      {
        id: `pl-liked-${Date.now()}`,
        title: `Liked Favorites (${likedTracks.length})`,
        trackIds: likedTracks.map((t) => t.id),
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        isPinned: false,
        coverUrl: likedTracks[0]?.artworkUrl
      },
      likedTracks
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
      {/* Color-Theory Emerald Atmospheric Hero */}
      <div className="relative bg-gradient-to-b from-[#14532D] via-[#1B4332]/90 to-[var(--mw-page-bg)] text-white pt-[max(14px,env(safe-area-inset-top))] pb-6 px-4 md:px-6">
        <div className="max-w-4xl mx-auto space-y-5">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              aria-label="Back to Home"
              className="w-11 h-11 rounded-full bg-black/25 hover:bg-black/40 backdrop-blur-md flex items-center justify-center active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={handleSaveCollection}
              disabled={likedTracks.length === 0}
              className="px-3.5 py-2 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 disabled:opacity-40"
            >
              <BookmarkPlus className="w-4 h-4" />
              <span>{savedToast ? 'Saved Playlist' : 'Save Copy'}</span>
            </button>
          </div>

          <div className="flex items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#34D399] via-[#10B981] to-[#065F46] flex items-center justify-center shadow-2xl flex-shrink-0">
              <BoldHeartIcon active className="w-12 h-12 text-white drop-shadow" />
            </div>
            <div className="min-w-0 pb-1">
              <h1 className="font-editorial text-3xl sm:text-4xl font-extrabold tracking-tight leading-none">
                Liked Songs
              </h1>
              <p className="text-xs font-mono tabular-nums text-white/80 mt-2">
                {likedTracks.length} {likedTracks.length === 1 ? 'track' : 'tracks'} · {totalMinutes} min
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={() => likedTracks[0] && onPlayTrack(likedTracks[0], likedTracks)}
              disabled={likedTracks.length === 0}
              className="h-11 px-6 rounded-full bg-white text-[#0D2E1A] font-display font-extrabold text-sm flex items-center gap-2 shadow-lg hover:brightness-95 active:scale-95 transition-all disabled:opacity-45"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All</span>
            </button>

            <button
              onClick={() => {
                if (likedTracks.length === 0) return;
                const shuffled = [...likedTracks].sort(() => Math.random() - 0.5);
                onPlayTrack(shuffled[0], shuffled);
              }}
              disabled={likedTracks.length === 0}
              className="h-11 px-5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-sm flex items-center gap-2 active:scale-95 transition-all disabled:opacity-45"
            >
              <Shuffle className="w-4 h-4" />
              <span>Shuffle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 space-y-4 mt-2">
        {/* Search & Sort Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter liked songs, artists, albums..."
              className="w-full h-11 pl-10 pr-9 rounded-2xl bg-[var(--mw-surface)] border border-black/[0.06] dark:border-white/[0.08] text-sm font-medium focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {(['recent', 'title', 'artist'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortBy(mode)}
                style={
                  sortBy === mode
                    ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                    : undefined
                }
                className={`px-3.5 h-10 rounded-full text-xs font-bold capitalize transition-colors ${
                  sortBy === mode
                    ? ''
                    : 'bg-[var(--mw-surface-elevated)] text-gray-600 dark:text-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Liked Tracks List */}
        {likedTracks.length > 0 ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] bg-[var(--mw-surface)] rounded-3xl border border-black/[0.05] dark:border-white/[0.07] px-3">
            {likedTracks.map((track, idx) => {
              const isPlayingHere = track.id === currentTrackId;
              const isDownloaded = downloadedIds.has(track.id);
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track, likedTracks)}
                  className="flex items-center justify-between py-3 px-1.5 gap-3 cursor-pointer hover:opacity-85 transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                    />
                    <div className="min-w-0 flex-1">
                      <h4
                        style={isPlayingHere ? { color: 'var(--mw-primary)' } : undefined}
                        className="text-sm font-bold truncate"
                      >
                        {track.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {track.artist} · <span className="font-mono">{formatDuration(track.duration)}</span>
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-0.5 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onToggleLike(track.id)}
                      aria-label="Unlike track"
                      style={{ color: '#10B981' }}
                      className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <BoldHeartIcon active className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => onAddToQueue(track)}
                      aria-label="Add to queue"
                      className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    >
                      <ListPlus className="w-4.5 h-4.5" />
                    </button>
                    <button
                      onClick={() => onToggleDownload(track)}
                      aria-label={isDownloaded ? 'Downloaded' : 'Download track'}
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
        ) : (
          <div className="py-16 px-4 text-center rounded-3xl bg-[var(--mw-surface)] border border-black/[0.05] dark:border-white/[0.07]">
            <BoldHeartIcon active className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
            <h3 className="font-display text-lg font-extrabold">
              {query ? 'No matching liked songs' : 'No liked songs yet'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tap the heart icon on any track or add favorites below.
            </p>
          </div>
        )}

        {/* Quick Add Suggestions */}
        {unlikedSuggestions.length > 0 && (
          <section className="pt-2 space-y-2.5">
            <h2 className="font-display text-base font-extrabold px-1">Add to Liked Songs</h2>
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08] bg-[var(--mw-surface)] rounded-3xl border border-black/[0.05] dark:border-white/[0.07] px-3">
              {unlikedSuggestions.map((track) => (
                <div
                  key={`add-${track.id}`}
                  className="flex items-center justify-between py-2.5 px-1.5 gap-3"
                >
                  <div
                    onClick={() => onPlayTrack(track, unlikedSuggestions)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <img
                      src={track.artworkUrl}
                      alt={track.title}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{track.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onToggleLike(track.id)}
                    aria-label={`Like ${track.title}`}
                    className="h-9 px-3.5 rounded-full bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Like</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </motion.div>
  );
};
