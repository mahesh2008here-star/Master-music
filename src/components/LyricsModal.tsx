import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  RefreshCw,
  AlertCircle,
  Languages,
  Copy,
  Minus,
  Plus,
  Check
} from 'lucide-react';
import { Track, LyricsData, LyricLine } from '../types/music';
import { fetchLyricsFromLrclib } from '../services/lrclibService';
import { MasterWaveSettings } from '../services/themeService';

interface LyricsModalProps {
  track: Track;
  currentTime: number;
  settings?: MasterWaveSettings;
  onUpdateSettings?: (patch: Partial<MasterWaveSettings>) => void;
  onClose: () => void;
  onSeek: (seconds: number) => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  track,
  currentTime,
  settings,
  onUpdateSettings,
  onClose,
  onSeek
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transformMode, setTransformMode] = useState<'original' | 'romanize' | 'translate'>('original');
  const [transformedLines, setTransformedLines] = useState<string[] | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);

  const [controlsVisible, setControlsVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLButtonElement>(null);

  const wordByWord = settings?.wordByWordLyrics ?? true;
  const syncOffsetMs = settings?.lyricsSyncOffsetMs ?? 0;
  const textSizePercent = settings?.lyricsTextSize ?? 100;
  const motionBg = settings?.lyricsBackgroundMotion ?? false;
  const keepAwake = settings?.keepScreenAwakeLyrics ?? false;
  const hideSetting = settings?.hideLyricsButtons ?? 'After 5 s';
  const targetLang = settings?.translationLanguage ?? 'English';

  const loadLyrics = async () => {
    setIsLoading(true);
    setTransformMode('original');
    setTransformedLines(null);
    const data = await fetchLyricsFromLrclib(
      track.title,
      track.artist,
      track.album,
      track.duration,
      track.id
    );
    setLyricsData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadLyrics();
  }, [track.id]);

  // Keep Screen Awake on Lyrics (Screen Wake Lock API)
  useEffect(() => {
    if (!keepAwake || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;
    let lock: { release: () => Promise<void> } | null = null;
    (navigator as unknown as { wakeLock: { request: (type: string) => Promise<{ release: () => Promise<void> }> } })
      .wakeLock.request('screen')
      .then((sentinel) => {
        lock = sentinel;
      })
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, [keepAwake]);

  // Auto-hide toolbar buttons based on user preference
  useEffect(() => {
    if (hideSetting === 'Never') {
      setControlsVisible(true);
      return;
    }
    const ms = hideSetting === 'After 10 s' ? 10000 : 5000;
    const t = setTimeout(() => setControlsVisible(false), ms);
    return () => clearTimeout(t);
  }, [hideSetting, controlsVisible]);

  const syncedLines = lyricsData?.syncedLyrics || [];
  const effectiveMs = currentTime * 1000 + syncOffsetMs;

  const activeIdx = React.useMemo(() => {
    if (syncedLines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < syncedLines.length; i++) {
      if (effectiveMs >= syncedLines[i].timeMs) idx = i;
      else break;
    }
    return idx;
  }, [effectiveMs, syncedLines]);

  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIdx]);

  const handleTransform = async (mode: 'original' | 'romanize' | 'translate') => {
    if (mode === 'original') {
      setTransformMode('original');
      setTransformedLines(null);
      return;
    }
    const baseLines =
      syncedLines.length > 0
        ? syncedLines.map((l) => l.text)
        : (lyricsData?.plainLyrics || '').split('\n').filter(Boolean);
    if (baseLines.length === 0) return;

    setTransformMode(mode);
    setIsTransforming(true);
    try {
      const res = await fetch('/api/lyrics/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lines: baseLines,
          mode,
          targetLang: targetLang === 'Follows the app language' ? 'English' : targetLang
        })
      });
      if (res.ok) {
        const data = (await res.json()) as { lines?: string[] };
        if (Array.isArray(data.lines)) setTransformedLines(data.lines);
      }
    } finally {
      setIsTransforming(false);
    }
  };

  const handleCopyLyrics = () => {
    const lines =
      transformedLines && transformedLines.length > 0
        ? transformedLines
        : syncedLines.length > 0
        ? syncedLines.map((l) => l.text)
        : (lyricsData?.plainLyrics || '').split('\n');
    const text = `${track.title} — ${track.artist}\n\n${lines.join('\n')}`.trim();
    navigator.clipboard?.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const fontScale = textSizePercent / 100;

  return (
    <div
      onMouseMove={() => setControlsVisible(true)}
      onClick={() => setControlsVisible(true)}
      className="fixed inset-0 z-50 flex flex-col bg-[#070605] text-white select-none overflow-hidden"
    >
      {/* Atmospheric Blur Thumbnail Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src={track.artworkUrl}
          alt=""
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover scale-150 blur-[68px] saturate-150 brightness-[0.42] ${
            motionBg ? 'animate-slow-spin' : 'animate-canvas-breathe'
          }`}
        />
        <img
          src={track.artworkUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover scale-125 blur-[110px] opacity-35 mix-blend-screen"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(245, 196, 81, 0.08) 0%, rgba(10, 9, 8, 0.72) 55%, rgba(6, 5, 4, 0.94) 100%)'
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full max-w-2xl mx-auto w-full px-5 sm:px-6 py-5">
        {/* Header */}
        <header className="flex items-center justify-between pb-3.5 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.artworkUrl}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-xl object-cover shadow-lg flex-shrink-0 ring-1 ring-white/15"
            />
            <div className="min-w-0">
              <h2 className="font-display text-base font-extrabold text-white truncate">
                {track.title}
              </h2>
              <p className="text-xs text-white/65 truncate">{track.artist}</p>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity duration-300 ${
              controlsVisible ? 'opacity-100' : 'opacity-20'
            }`}
          >
            <button
              onClick={handleCopyLyrics}
              aria-label="Copy lyrics"
              title="Copy lyrics"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/18 flex items-center justify-center text-gray-200 transition-all"
            >
              {copiedNotice ? (
                <Check className="w-4 h-4 text-[#FFE382]" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => void loadLyrics()}
              disabled={isLoading}
              aria-label="Refresh lyrics"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/18 flex items-center justify-center text-gray-200 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/18 flex items-center justify-center text-gray-200 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Translation / Romanization & Offset Controls */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 pt-3 transition-opacity duration-300 ${
            controlsVisible ? 'opacity-100' : 'opacity-15'
          }`}
        >
          <div className="flex items-center p-1 rounded-xl bg-white/[0.08] backdrop-blur-md">
            {(['original', 'romanize', 'translate'] as const).map((m) => (
              <button
                key={m}
                onClick={() => void handleTransform(m)}
                disabled={isTransforming}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all flex items-center gap-1 ${
                  transformMode === m
                    ? 'bg-[#FFE382] text-[#1A1405] shadow-xs'
                    : 'text-white/75 hover:text-white'
                }`}
              >
                {m !== 'original' && <Languages className="w-3 h-3" />}
                <span>{m}</span>
              </button>
            ))}
          </div>

          {onUpdateSettings && (
            <div className="flex items-center gap-1.5 bg-white/[0.08] backdrop-blur-md rounded-xl px-2.5 py-1 text-xs">
              <span className="text-white/60 text-[11px]">Sync</span>
              <button
                onClick={() => onUpdateSettings({ lyricsSyncOffsetMs: syncOffsetMs - 100 })}
                aria-label="Decrease lyrics offset"
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono tabular-nums font-bold w-14 text-center text-[11px]">
                {syncOffsetMs === 0 ? '0ms' : `${syncOffsetMs > 0 ? '+' : ''}${syncOffsetMs}`}
              </span>
              <button
                onClick={() => onUpdateSettings({ lyricsSyncOffsetMs: syncOffsetMs + 100 })}
                aria-label="Increase lyrics offset"
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Lyrics Scrollable Container with Golden Glowing Active Sync */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto py-10 px-1 space-y-6 scrollbar-none scroll-smooth"
        >
          {isLoading || isTransforming ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/70">
              <RefreshCw className="w-6 h-6 animate-spin text-[#FFE382]" />
              <p className="text-sm">
                {isTransforming ? 'Updating lyrics...' : 'Loading synchronized lyrics...'}
              </p>
            </div>
          ) : syncedLines.length > 0 ? (
            syncedLines.map((line: LyricLine, idx: number) => {
              const isActive = idx === activeIdx;
              const isPast = idx < activeIdx;
              const displayedText = transformedLines?.[idx] || line.text;

              const nextMs = syncedLines[idx + 1]?.timeMs ?? line.timeMs + 3600;
              const lineSpanMs = Math.max(800, nextMs - line.timeMs);
              const lineProgress = isActive
                ? Math.max(0, Math.min(1, (effectiveMs - line.timeMs) / lineSpanMs))
                : isPast
                ? 1
                : 0;
              const words = displayedText.split(' ');

              return (
                <button
                  key={`${line.id}-${idx}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(Math.max(0, (line.timeMs - syncOffsetMs) / 1000))}
                  style={{ fontSize: `${(isActive ? 27 : 21) * fontScale}px` }}
                  className={`w-full text-left font-display leading-snug transition-all duration-300 cursor-pointer block rounded-2xl py-1.5 px-2 ${
                    isActive
                      ? 'font-extrabold lyrics-gold-active scale-[1.02] origin-left'
                      : isPast
                      ? 'font-bold text-white/25 hover:text-white/55'
                      : 'font-bold text-white/42 hover:text-white/75'
                  }`}
                >
                  {isActive && wordByWord ? (
                    <span>
                      {words.map((w, wIdx) => {
                        const threshold = wIdx / Math.max(1, words.length);
                        const lit = lineProgress >= threshold;
                        return (
                          <span
                            key={wIdx}
                            className={`transition-all duration-150 ${
                              lit ? 'lyrics-gold-word' : 'text-amber-100/35'
                            }`}
                          >
                            {w}
                            {wIdx < words.length - 1 ? ' ' : ''}
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    displayedText
                  )}
                </button>
              );
            })
          ) : lyricsData?.plainLyrics ? (
            <div
              style={{ fontSize: `${18 * fontScale}px` }}
              className="text-left whitespace-pre-line text-amber-50/85 leading-loose py-6"
            >
              {transformedLines ? transformedLines.join('\n') : lyricsData.plainLyrics}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
              <AlertCircle className="w-8 h-8 text-white/40" />
              <p className="text-base font-semibold text-white/80">No synchronized lyrics found</p>
              <p className="text-xs text-white/50 max-w-xs text-center">
                Synced lyrics are not available for this recording yet.
              </p>
            </div>
          )}
        </div>

        {/* Clean Footer */}
        <footer className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/55">
          <span>
            LRCLIB · {wordByWord ? 'Word-by-Word' : 'Line Sync'}
            {keepAwake ? ' · Awake' : ''}
          </span>
          <span>Tap any line to seek</span>
        </footer>
      </div>
    </div>
  );
};
