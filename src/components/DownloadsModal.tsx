import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  Trash2,
  HardDrive,
  CheckCircle2,
  Play,
  Shuffle,
  WifiOff,
  Music,
  FileCheck,
  FileText,
  Smartphone,
  Search,
  Image as ImageIcon,
  FolderDown,
  X
} from 'lucide-react';
import { Track } from '../types/music';
import { DownloadedItem, downloadService } from '../services/downloadService';

interface DownloadsModalProps {
  downloads: DownloadedItem[];
  isOfflineOnly: boolean;
  onToggleOfflineOnly: () => void;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onRemoveDownload: (trackId: string) => void;
  onClearAllDownloads?: () => void;
  onClose: () => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({
  downloads,
  isOfflineOnly,
  onToggleOfflineOnly,
  onPlayTrack,
  onRemoveDownload,
  onClearAllDownloads,
  onClose
}) => {
  const [notice, setNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoSaveDevice, setAutoSaveDevice] = useState<boolean>(() =>
    downloadService.getAutoSaveToDevice()
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  const totalSizeBytes = downloads.reduce((acc, item) => acc + (item.fileSizeBytes || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  const filteredDownloads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return downloads;
    return downloads.filter(
      (item) =>
        item.track.title.toLowerCase().includes(q) ||
        item.track.artist.toLowerCase().includes(q) ||
        item.track.album.toLowerCase().includes(q)
    );
  }, [downloads, searchQuery]);

  const playableOfflineQueue = useMemo(
    () =>
      filteredDownloads.map((item) => ({
        ...item.track,
        streamUrl: item.blobUrl || item.track.streamUrl,
        artworkUrl: item.artworkDataUrl || item.track.artworkUrl
      })),
    [filteredDownloads]
  );

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2600);
  };

  const handleToggleAutoSave = () => {
    const next = !autoSaveDevice;
    setAutoSaveDevice(next);
    downloadService.setAutoSaveToDevice(next);
    showNotice(
      next
        ? 'Auto-save enabled: merged audio + cover files will save to phone storage'
        : 'Auto-save disabled: downloads remain cached inside offline app storage'
    );
  };

  const handleSaveToPhoneStorage = async (item: DownloadedItem) => {
    setSavingId(item.id);
    try {
      const ok = await downloadService.saveItemToDeviceStorage(item);
      if (ok) {
        showNotice(
          `Saved "${item.track.title}.${item.fileExt || 'm4a'}" with embedded cover to Downloads`
        );
      } else {
        showNotice('Could not export file to phone storage.');
      }
    } finally {
      setSavingId(null);
    }
  };

  const handleExportLrc = (item: DownloadedItem) => {
    if (!item.lyricsData) return;
    const formatTs = (timeMs: number) => {
      const totalSec = timeMs / 1000;
      const m = Math.floor(totalSec / 60);
      const s = Math.floor(totalSec % 60);
      const cs = Math.floor((totalSec % 1) * 100);
      return `[${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs
        .toString()
        .padStart(2, '0')}]`;
    };
    const body =
      item.lyricsData.syncedLyrics && item.lyricsData.syncedLyrics.length > 0
        ? item.lyricsData.syncedLyrics.map((l) => `${formatTs(l.timeMs)}${l.text}`).join('\n')
        : item.lyricsData.plainLyrics || '';
    if (!body) return;
    const header = `[ti:${item.track.title}]\n[ar:${item.track.artist}]\n[al:${item.track.album}]\n\n`;
    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.track.artist} - ${item.track.title}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
    showNotice(`Saved .lrc sidecar for "${item.track.title}"`);
  };

  const handlePlayAllOffline = (shuffled = false) => {
    if (playableOfflineQueue.length === 0) return;
    const list = shuffled
      ? [...playableOfflineQueue].sort(() => Math.random() - 0.5)
      : playableOfflineQueue;
    onPlayTrack(list[0], list);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[var(--mw-page-bg)] text-gray-900 dark:text-white select-none pb-36">
      <header className="sticky top-0 z-30 bg-[var(--mw-page-bg)]/90 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-[max(14px,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              aria-label="Back"
              className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-xl font-extrabold tracking-tight truncate">
                Downloads &amp; Offline
              </h1>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                Play without internet · Audio + merged artwork saved
              </p>
            </div>
          </div>

          <span
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 flex-shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{downloads.length} Offline</span>
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 pt-4 space-y-5">
        <section className="rounded-3xl bg-white/85 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                style={{ backgroundColor: 'var(--mw-primary)' }}
                className="w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-sm flex-shrink-0"
              >
                <Download className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[var(--mw-primary)]" />
                  <span className="font-display text-base font-extrabold tabular-nums">
                    {totalSizeMB} MB Stored
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {downloads.length} {downloads.length === 1 ? 'track' : 'tracks'} cached with cover art &amp; synced lyrics
                </p>
              </div>
            </div>

            {downloads.length > 0 && onClearAllDownloads && (
              <button
                onClick={onClearAllDownloads}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/15 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {downloads.length > 0 && (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handlePlayAllOffline(false)}
                style={{ backgroundColor: 'var(--mw-primary)' }}
                className="py-3 rounded-2xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:brightness-95 active:scale-[0.98] transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Play All Offline</span>
              </button>
              <button
                onClick={() => handlePlayAllOffline(true)}
                style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                className="py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.98] transition-all"
              >
                <Shuffle className="w-4 h-4" />
                <span>Shuffle Offline</span>
              </button>
            </div>
          )}

          <div className="divide-y divide-black/[0.05] dark:divide-white/[0.06] pt-1">
            <div className="py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <WifiOff className="w-4.5 h-4.5 text-amber-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold">Offline Mode Only</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    Queue automatically stays inside downloaded tracks
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleOfflineOnly}
                aria-label="Toggle Offline Mode Only"
                style={isOfflineOnly ? { backgroundColor: 'var(--mw-primary)' } : undefined}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex-shrink-0 ${
                  isOfflineOnly ? '' : 'bg-black/15 dark:bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    isOfflineOnly ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Smartphone className="w-4.5 h-4.5 text-[var(--mw-primary)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold">Save Merged Song + Cover to Phone Storage</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                    Muxes audio &amp; cover art into internal Downloads folder automatically
                  </p>
                </div>
              </div>
              <button
                onClick={handleToggleAutoSave}
                aria-label="Toggle auto-save merged file to device storage"
                style={autoSaveDevice ? { backgroundColor: 'var(--mw-primary)' } : undefined}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 flex-shrink-0 ${
                  autoSaveDevice ? '' : 'bg-black/15 dark:bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                    autoSaveDevice ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {notice && (
          <div
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {downloads.length > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white/80 dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/[0.08]">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter downloaded songs, artists, albums..."
              className="flex-1 bg-transparent text-xs font-medium focus:outline-none placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {filteredDownloads.length > 0 ? (
          <section className="space-y-2.5">
            {filteredDownloads.map((item, idx) => {
              const offlineTrack: Track = {
                ...item.track,
                streamUrl: item.blobUrl || item.track.streamUrl,
                artworkUrl: item.artworkDataUrl || item.track.artworkUrl
              };
              const isSaving = savingId === item.id;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/85 dark:bg-white/[0.05] hover:bg-black/[0.02] dark:hover:bg-white/[0.08] border border-black/[0.05] dark:border-white/[0.08] transition-all group gap-2.5"
                >
                  <div
                    onClick={() => onPlayTrack(offlineTrack, playableOfflineQueue)}
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                  >
                    <div className="relative w-13 h-13 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0 shadow-xs">
                      <img
                        src={item.artworkDataUrl || item.track.artworkUrl}
                        alt={item.track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-4.5 h-4.5 fill-white text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate">{item.track.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.track.artist}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                        <span className="font-mono font-bold text-[var(--mw-primary)]">
                          {(item.fileExt || 'M4A').toUpperCase()} ·{' '}
                          {(item.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        {item.artworkMerged && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            · <ImageIcon className="w-2.5 h-2.5" /> Cover Merged
                          </span>
                        )}
                        {item.lyricsData && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            · <FileCheck className="w-2.5 h-2.5" /> Lyrics
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => void handleSaveToPhoneStorage(item)}
                      disabled={isSaving}
                      title="Save merged audio + cover to phone storage"
                      aria-label="Save merged file to phone storage"
                      style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                      className="px-2.5 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1 hover:brightness-95 active:scale-95 transition-all"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {item.savedToDevice ? 'Save Again' : 'Save File'}
                      </span>
                    </button>

                    {item.lyricsData && (
                      <button
                        onClick={() => handleExportLrc(item)}
                        title="Export .lrc synced lyrics file"
                        aria-label="Export .lrc file"
                        className="p-2 text-gray-500 hover:text-[var(--mw-primary)] transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => onRemoveDownload(item.id)}
                      aria-label="Remove offline download"
                      className="p-2 text-gray-400 hover:text-rose-500 transition-colors rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <section className="py-16 px-6 rounded-3xl bg-white/60 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mb-3">
              <Music className="w-7 h-7 text-gray-400" />
            </div>
            <h3 className="font-display text-base font-extrabold">
              {downloads.length > 0 ? 'No matching offline songs' : 'No downloaded songs yet'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 max-w-sm leading-relaxed">
              Tap Download on any song across Home, Search, or Now Playing. Each download merges the full audio stream with high-res album artwork and synced .lrc lyrics for 100% offline playback and phone storage export.
            </p>
          </section>
        )}
      </main>
    </div>
  );
};
