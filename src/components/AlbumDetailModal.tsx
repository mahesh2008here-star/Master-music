import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Play,
  Shuffle,
  BookmarkPlus,
  Download,
  CheckCircle2,
  ListPlus,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { Playlist, Track } from '../types/music';
import { ytMusicService, YTMusicAlbumDetail } from '../services/ytMusicService';

interface AlbumDetailModalProps {
  albumQuery: { id?: string; title?: string; artist?: string };
  downloadedIds: Set<string>;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onAddToQueue: (track: Track) => void;
  onToggleDownload: (track: Track) => void;
  onOpenArtist: (artist: { id?: string; name: string }) => void;
  onSaveAsPlaylist: (playlist: Playlist, addedTracks: Track[]) => void;
  onClose: () => void;
}

export const AlbumDetailModal: React.FC<AlbumDetailModalProps> = ({
  albumQuery,
  downloadedIds,
  onPlayTrack,
  onAddToQueue,
  onToggleDownload,
  onOpenArtist,
  onSaveAsPlaylist,
  onClose
}) => {
  const [detail, setDetail] = useState<YTMusicAlbumDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setSavedToast(false);

    ytMusicService
      .getAlbumDetail({
        id: albumQuery.id,
        query: [albumQuery.title, albumQuery.artist].filter(Boolean).join(' ').trim()
      })
      .then((res) => {
        if (!active) return;
        setDetail(res);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load album');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [albumQuery.id, albumQuery.title, albumQuery.artist]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSaveAlbum = () => {
    if (!detail || detail.songs.length === 0) return;
    onSaveAsPlaylist(
      {
        id: `album-pl-${detail.id}-${Date.now()}`,
        title: detail.title,
        description: `Album • ${detail.artist} (${detail.year})`,
        coverUrl: detail.artworkUrl,
        trackIds: detail.songs.map((s) => s.id),
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        isPinned: false,
        isSystem: false
      },
      detail.songs
    );
    setSavedToast(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--mw-page-bg)] text-gray-900 dark:text-white select-none pb-36">
      <div className="max-w-4xl mx-auto min-h-[100dvh]">
        {/* Apple Music Frosted Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/88 dark:bg-black/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08] px-4 md:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={onClose}
              aria-label="Back"
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-extrabold truncate">
              {detail?.title || albumQuery.title || 'Album'}
            </h1>
          </div>

          {detail && detail.songs.length > 0 && (
            <button
              onClick={handleSaveAlbum}
              style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
              className="px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
            >
              {savedToast ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              <span>{savedToast ? 'Saved' : 'Add to Library'}</span>
            </button>
          )}
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-500">
            <Loader2 style={{ color: 'var(--mw-primary)' }} className="w-8 h-8 animate-spin" />
            <p className="text-xs font-semibold">Loading album tracklist...</p>
          </div>
        ) : error || !detail ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center gap-3">
            <AlertCircle className="w-8 h-8 text-amber-500" />
            <p className="text-sm font-bold">{error || 'Album unavailable'}</p>
            <button
              onClick={onClose}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="px-5 py-2 rounded-full text-white text-xs font-bold"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="px-4.5 pt-5 space-y-5">
            {/* Album Cover & Meta */}
            <div className="flex flex-col items-center text-center">
              <div className="w-52 h-52 rounded-3xl overflow-hidden shadow-xl border border-black/5 dark:border-white/10 bg-neutral-200 dark:bg-neutral-800">
                <img
                  src={detail.artworkUrl}
                  alt={detail.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="font-display text-2xl font-black tracking-tight mt-4">
                {detail.title}
              </h2>

              <button
                onClick={() => onOpenArtist({ id: detail.artistId, name: detail.artist })}
                style={{ color: 'var(--mw-primary)' }}
                className="text-sm font-bold mt-1 hover:underline"
              >
                {detail.artist}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Album • {detail.year} • {detail.songs.length} songs
                {detail.language ? ` • ${detail.language}` : ''}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 w-full mt-4">
                <button
                  disabled={detail.songs.length === 0}
                  onClick={() => {
                    if (detail.songs.length > 0) {
                      onPlayTrack(detail.songs[0], detail.songs);
                    }
                  }}
                  style={{ backgroundColor: 'var(--mw-primary)' }}
                  className="flex-1 py-2.5 rounded-full text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:brightness-95 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play</span>
                </button>
                <button
                  disabled={detail.songs.length === 0}
                  onClick={() => {
                    if (detail.songs.length > 0) {
                      const shuffled = [...detail.songs].sort(() => Math.random() - 0.5);
                      onPlayTrack(shuffled[0], shuffled);
                    }
                  }}
                  style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Shuffle className="w-4 h-4" />
                  <span>Shuffle</span>
                </button>
              </div>
            </div>

            {/* Tracklist */}
            <section className="space-y-1.5 pt-2">
              {detail.songs.map((song, idx) => {
                const isDl = downloadedIds.has(song.id);
                return (
                  <div
                    key={`${song.id}-${idx}`}
                    onClick={() => onPlayTrack(song, detail.songs)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                      <span className="w-6 text-center text-xs font-mono font-bold text-gray-400">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold truncate">{song.title}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {song.artist} • {formatDuration(song.duration)} • {song.quality.badgeLabel}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(song);
                        }}
                        aria-label="Add to Up Next"
                        className="p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
                      >
                        <ListPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDownload(song);
                        }}
                        aria-label="Download song"
                        className={`p-2 rounded-full ${
                          isDl ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
                        }`}
                      >
                        {isDl ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
