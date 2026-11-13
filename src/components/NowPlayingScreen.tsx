import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import {
  ChevronDown,
  MoreVertical,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Shuffle,
  Repeat,
  Repeat1,
  Radio,
  ListMusic,
  Disc3,
  UserRound,
  X,
  Trash2,
  BookmarkPlus,
  Loader2,
  Download,
  CheckCircle2,
  SlidersHorizontal,
  Volume2,
  Infinity as InfinityIcon,
  Maximize2,
  Moon,
  Gauge,
  Ban,
  Share2,
  Video,
  SquarePlay
} from 'lucide-react';
import { Track, LyricsData, LyricLine } from '../types/music';
import { fetchLyricsFromLrclib } from '../services/lrclibService';
import { audioEngine } from '../services/audioEngine';
import { MasterWaveSettings, triggerAppHaptic } from '../services/themeService';
import {
  AnimatedEqualizerBars,
  BoldHeartIcon,
  BoldLyricsQuoteIcon
} from './CustomIcons';
import { WaveformSeekbar } from './WaveformSeekbar';

interface NowPlayingScreenProps {
  track: Track;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isDownloaded?: boolean;
  wavySeekbar?: boolean;
  rotatingBackground?: boolean;
  fullScreenArtwork?: boolean;
  sourceLabel?: string;
  settings?: MasterWaveSettings;
  upNextQueue: Track[];
  radioTitle: string;
  autoplayRadio: boolean;
  isLoadingRadio?: boolean;
  onToggleAutoplay: () => void;
  onPlayFromQueue: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onSaveQueueAsPlaylist: () => void;
  onExcludeTrack?: (trackId: string) => void;
  onOpenArtist: (artistName: string) => void;
  onOpenAlbum: (albumTitle: string, artistName: string) => void;
  onDismiss: () => void;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onToggleDownload: (track: Track) => void;
  onOpenLyrics: () => void;
  onOpenAudioQuality: () => void;
  onOpenEqualizer: () => void;
  onOpenAudioOutput: () => void;
}

export const NowPlayingScreen: React.FC<NowPlayingScreenProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  shuffle,
  repeatMode,
  isDownloaded = false,
  wavySeekbar = true,
  rotatingBackground = true,
  fullScreenArtwork = true,
  sourceLabel,
  settings,
  upNextQueue,
  radioTitle,
  autoplayRadio,
  isLoadingRadio = false,
  onToggleAutoplay,
  onPlayFromQueue,
  onRemoveFromQueue,
  onSaveQueueAsPlaylist,
  onExcludeTrack,
  onOpenArtist,
  onOpenAlbum,
  onDismiss,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleDownload,
  onOpenLyrics,
  onOpenAudioQuality,
  onOpenEqualizer,
  onOpenAudioOutput
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(currentTime);
  const [viewMode, setViewMode] = useState<'artwork' | 'lyrics'>('artwork');
  const [mediaMode, setMediaMode] = useState<'art' | 'video'>('art');
  const [drawerTab, setDrawerTab] = useState<'upnext' | 'related' | null>(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSleepPicker, setShowSleepPicker] = useState(false);
  const [sleepStatus, setSleepStatus] = useState<{ remainingSec: number | null; afterTrack: boolean }>({
    remainingSec: null,
    afterTrack: false
  });
  const [playbackRate, setPlaybackRate] = useState(() => audioEngine.getPlaybackRateState().rate);
  const [discordCopied, setDiscordCopied] = useState(false);

  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const activeLyricRef = useRef<HTMLButtonElement>(null);

  const hapticsEnabled = settings?.hapticFeedback ?? true;

  useEffect(() => {
    const unsub = audioEngine.subscribeSleepTimer((remainingSec, afterTrack) => {
      setSleepStatus({ remainingSec, afterTrack });
    });
    return unsub;
  }, []);

  useEffect(() => {
    setMediaMode('art');
  }, [track.id]);

  useEffect(() => {
    let active = true;
    setIsLyricsLoading(true);
    fetchLyricsFromLrclib(track.title, track.artist, track.album, track.duration, track.id)
      .then((res) => {
        if (active) setLyricsData(res);
      })
      .finally(() => {
        if (active) setIsLyricsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [track.id, track.title, track.artist, track.album, track.duration]);

  const offsetMs = settings?.lyricsSyncOffsetMs ?? 0;
  const wordByWord = settings?.wordByWordLyrics ?? true;
  const gradientBlurCanvas = settings?.gradientBlurCanvas ?? false;
  const animatedAlbumCanvas = settings?.animatedAlbumCanvas ?? true;
  const musicVideoEnabled = settings?.musicVideoEnabled ?? true;
  const currentMs = currentTime * 1000 + offsetMs;

  const activeLyricIndex = React.useMemo(() => {
    if (!lyricsData?.syncedLyrics?.length) return -1;
    let found = -1;
    for (let i = 0; i < lyricsData.syncedLyrics.length; i++) {
      if (currentMs >= lyricsData.syncedLyrics[i].timeMs) {
        found = i;
      } else {
        break;
      }
    }
    return found;
  }, [currentMs, lyricsData]);

  useEffect(() => {
    if (viewMode === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, viewMode]);

  const displayTime = isSeeking ? seekValue : currentTime;
  const remainingTime = Math.max(0, duration - displayTime);
  const progressPercent = duration > 0 ? Math.min(100, (displayTime / duration) * 100) : 0;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const handleSeekCommit = () => {
    setIsSeeking(false);
    triggerAppHaptic(hapticsEnabled, 8);
    onSeek(seekValue);
  };

  const primaryArtist = track.artist.split(/[,&]/)[0]?.trim() || track.artist;

  const cycleSpeed = () => {
    const speeds = [0.75, 1.0, 1.15, 1.25, 1.5];
    const next = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    setPlaybackRate(next);
    audioEngine.setPlaybackRate(next, true);
  };

  const copyDiscordPresence = () => {
    const text = `Listening to ${track.title} — ${track.artist} [${track.quality.badgeLabel}] on LastWave`;
    navigator.clipboard?.writeText(text);
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2000);
  };

  const contextDisplay =
    sourceLabel || (track.provider === 'newpipe' ? 'Search' : track.album || 'Search');

  return (
    <motion.div
      initial={{ opacity: 0, y: 36, scale: 0.97, filter: 'blur(18px)' }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] }
      }}
      exit={{
        opacity: 0,
        y: 32,
        scale: 0.97,
        filter: 'blur(16px)',
        transition: { duration: 0.24, ease: [0.4, 0, 1, 1] }
      }}
      className="fixed inset-0 z-50 flex flex-col bg-[#000000] text-white overflow-hidden select-none"
    >
      {/* Full-Bleed Edge-to-Edge Artwork Backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-black">
        {fullScreenArtwork && viewMode === 'artwork' && mediaMode === 'art' ? (
          <>
            <img
              src={track.artworkUrl}
              alt=""
              referrerPolicy="no-referrer"
              className={`w-full h-[76%] object-cover object-center scale-[1.01] transition-all duration-700 ${
                animatedAlbumCanvas && isPlaying ? 'animate-canvas-breathe' : ''
              }`}
            />
            {rotatingBackground && isPlaying && (
              <img
                src={track.artworkUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover scale-150 blur-[90px] opacity-25 mix-blend-screen animate-slow-spin"
              />
            )}
            {/* Smooth multi-stop gradient fading seamlessly into pitch black bottom */}
            <div
              className="absolute inset-0"
              style={{
                background: gradientBlurCanvas
                  ? 'linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 28%, rgba(8,8,10,0.72) 55%, rgba(0,0,0,0.97) 70%, #000000 100%)'
                  : 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.58) 54%, rgba(0,0,0,0.95) 68%, #000000 100%)'
              }}
            />
          </>
        ) : (
          <>
            <img
              src={track.artworkUrl}
              alt=""
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover scale-150 blur-[68px] saturate-150 brightness-[0.42] ${
                (rotatingBackground || settings?.lyricsBackgroundMotion) && isPlaying
                  ? 'animate-slow-spin'
                  : ''
              }`}
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  viewMode === 'lyrics'
                    ? 'radial-gradient(circle at 50% 34%, rgba(255, 200, 75, 0.16), transparent 62%), linear-gradient(180deg, rgba(8,8,10,0.42) 0%, rgba(6,6,8,0.68) 55%, rgba(0,0,0,0.94) 100%)'
                    : 'linear-gradient(180deg, rgba(0,0,0,0.48) 0%, rgba(0,0,0,0.65) 55%, rgba(0,0,0,0.95) 100%)'
              }}
            />
          </>
        )}
      </div>

      {/* Main Layout Shell */}
      <div className="relative z-10 flex flex-col justify-between h-full max-w-[460px] mx-auto w-full">
        {/* Top Overlay Header Bar: Down Button | NOW PLAYING + Source | 3-Dots Vertical */}
        <header className="px-5 pt-[max(14px,env(safe-area-inset-top))] pb-2 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              triggerAppHaptic(hapticsEnabled, 8);
              onDismiss();
            }}
            aria-label="Minimize Now Playing"
            className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/12 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <ChevronDown className="w-5 h-5 stroke-[2.3]" />
          </button>

          <button
            onClick={() => onOpenAlbum(track.album, primaryArtist)}
            className="min-w-0 text-center px-2 hover:opacity-85 transition-opacity"
          >
            <span className="block text-[11px] font-extrabold tracking-[0.14em] uppercase text-white drop-shadow-sm">
              NOW PLAYING
            </span>
            <span className="block text-[13px] font-medium text-white/85 truncate max-w-[210px] drop-shadow-sm">
              {contextDisplay}
            </span>
          </button>

          <button
            onClick={() => {
              triggerAppHaptic(hapticsEnabled, 8);
              setShowMoreMenu(true);
            }}
            aria-label="More options"
            className="w-11 h-11 rounded-full bg-black/45 hover:bg-black/65 backdrop-blur-md border border-white/12 flex items-center justify-center text-white active:scale-90 transition-all"
          >
            <MoreVertical className="w-5 h-5 stroke-[2.2]" />
          </button>
        </header>

        {/* Center Region: Empty spacer on Fullscreen Art, OR Framed Card, OR Video, OR Lyrics */}
        {viewMode === 'lyrics' ? (
          <div className="flex-1 my-2 px-6 overflow-y-auto scrollbar-none py-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div
                onClick={() => setViewMode('artwork')}
                className="flex items-center gap-3 min-w-0 cursor-pointer"
              >
                <img
                  src={track.artworkUrl}
                  alt={track.title}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover shadow-md flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-display text-sm font-bold text-white truncate">
                    {track.title}
                  </h3>
                  <p className="text-xs text-white/70 truncate">{track.artist}</p>
                </div>
              </div>
              <button
                onClick={onOpenLyrics}
                aria-label="Open full screen lyrics studio"
                className="w-9 h-9 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {isLyricsLoading ? (
              <div className="h-64 flex items-center justify-center gap-2 text-white/70 text-sm">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Syncing lyrics...</span>
              </div>
            ) : lyricsData?.syncedLyrics && lyricsData.syncedLyrics.length > 0 ? (
              lyricsData.syncedLyrics.map((line: LyricLine, idx: number) => {
                const isActive = idx === activeLyricIndex;
                const isPast = idx < activeLyricIndex;
                const nextMs = lyricsData.syncedLyrics![idx + 1]?.timeMs ?? line.timeMs + 3600;
                const spanMs = Math.max(800, nextMs - line.timeMs);
                const progress = isActive
                  ? Math.max(0, Math.min(1, (currentMs - line.timeMs) / spanMs))
                  : isPast
                  ? 1
                  : 0;
                const words = line.text.split(' ');

                return (
                  <button
                    key={`${line.id}-${idx}`}
                    ref={isActive ? activeLyricRef : null}
                    onClick={() => onSeek(Math.max(0, (line.timeMs - offsetMs) / 1000))}
                    className={`block w-full text-left font-display leading-snug transition-all duration-300 ${
                      isActive
                        ? 'text-[25px] font-extrabold lyrics-gold-active opacity-100 scale-[1.015] origin-left'
                        : isPast
                        ? 'text-[19px] font-bold text-amber-100/28 hover:text-amber-100/55'
                        : 'text-[20px] font-bold text-white/45 hover:text-amber-100/75'
                    }`}
                  >
                    {isActive && wordByWord ? (
                      <span>
                        {words.map((w, wIdx) => (
                          <span
                            key={wIdx}
                            className={`transition-all duration-150 ${
                              progress >= wIdx / Math.max(1, words.length)
                                ? 'lyrics-gold-word'
                                : 'text-amber-100/38'
                            }`}
                          >
                            {w}
                            {wIdx < words.length - 1 ? ' ' : ''}
                          </span>
                        ))}
                      </span>
                    ) : (
                      line.text
                    )}
                  </button>
                );
              })
            ) : lyricsData?.plainLyrics ? (
              <div className="whitespace-pre-line text-lg font-semibold text-white/80 leading-relaxed">
                {lyricsData.plainLyrics}
              </div>
            ) : (
              <div className="h-56 flex flex-col items-center justify-center text-center text-white/60 gap-2">
                <BoldLyricsQuoteIcon className="w-8 h-8 opacity-50" />
                <p className="text-sm font-semibold">Lyrics unavailable for this track</p>
              </div>
            )}
          </div>
        ) : mediaMode === 'video' && track.newpipeVideoId ? (
          <div className="my-auto px-5">
            <div className="w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/15">
              <iframe
                title={track.title}
                src={`https://www.youtube-nocookie.com/embed/${track.newpipeVideoId}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => setMediaMode('art')}
              className="mt-3 mx-auto block px-4 py-1.5 rounded-full bg-white/12 text-xs font-semibold text-white/90"
            >
              Back to Artwork
            </button>
          </div>
        ) : !fullScreenArtwork ? (
          <div className="my-auto px-7 flex items-center justify-center">
            <div
              onClick={onPlayPause}
              className={`w-full max-w-[310px] aspect-square rounded-[24px] overflow-hidden shadow-2xl border border-white/10 cursor-pointer transition-transform duration-500 ${
                isPlaying ? 'scale-100' : 'scale-92'
              }`}
            >
              <img
                src={track.artworkUrl}
                alt={track.title}
                referrerPolicy="no-referrer"
                className={`w-full h-full object-cover ${
                  animatedAlbumCanvas && isPlaying ? 'animate-canvas-breathe' : ''
                }`}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {/* Bottom Control Stack */}
        <div className="px-5 pb-[max(22px,env(safe-area-inset-bottom))] pt-2">
          {/* Title + Artist on Left, Heart + Quote Circles on Right */}
          {viewMode === 'artwork' && (
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[23px] font-extrabold text-white truncate tracking-tight leading-tight">
                  {track.title}
                </h2>
                <button
                  onClick={() => onOpenArtist(primaryArtist)}
                  className="text-[15.5px] font-medium text-white/75 hover:text-white truncate block text-left max-w-full mt-0.5 transition-colors"
                >
                  {track.artist}
                </button>
              </div>

              <div className="flex items-center gap-2.5 flex-shrink-0">
                <button
                  onClick={() => {
                    triggerAppHaptic(hapticsEnabled, 12);
                    onToggleLike(track.id);
                  }}
                  aria-label={track.isLiked ? 'Unlike track' : 'Like track'}
                  className="w-11 h-11 rounded-full bg-white/[0.10] hover:bg-white/[0.18] border border-white/15 backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
                >
                  <BoldHeartIcon
                    active={track.isLiked}
                    style={track.isLiked ? { color: 'var(--mw-primary)' } : undefined}
                    className={`w-5 h-5 ${track.isLiked ? '' : 'text-white'}`}
                  />
                </button>

                <button
                  onClick={() => {
                    triggerAppHaptic(hapticsEnabled, 10);
                    setViewMode('lyrics');
                  }}
                  aria-label="Toggle synchronized lyrics"
                  className="w-11 h-11 rounded-full bg-white/[0.10] hover:bg-white/[0.18] border border-white/15 text-white backdrop-blur-md flex items-center justify-center active:scale-90 transition-all"
                >
                  <BoldLyricsQuoteIcon active={false} className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Precision Mirrored Acoustic Micro-Filament Waveform Seekbar & Timestamp / Codec Row */}
          <div className="space-y-2">
            <div className="relative h-11 flex items-center group">
              <WaveformSeekbar
                trackId={track.id}
                progressPercent={progressPercent}
                isPlaying={isPlaying}
                isSeeking={isSeeking}
                enabled={wavySeekbar}
              />

              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={displayTime}
                onChange={handleSeekChange}
                onMouseDown={() => setIsSeeking(true)}
                onTouchStart={() => setIsSeeking(true)}
                onMouseUp={handleSeekCommit}
                onTouchEnd={handleSeekCommit}
                aria-label="Seek timeline"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-[12px] font-bold tabular-nums">
              <span className="text-white/95">{formatTime(displayTime)}</span>
              <button
                onClick={onOpenAudioQuality}
                className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-white/80 hover:text-white transition-colors"
              >
                <AnimatedEqualizerBars isPlaying={isPlaying} className="w-3.5 h-3.5 text-white/85" />
                <span>
                  {track.quality.badgeLabel}
                  {playbackRate !== 1 ? ` · ${playbackRate}×` : ''} &rsaquo;
                </span>
              </button>
              <span className="text-white/95">-{formatTime(remainingTime)}</span>
            </div>
          </div>

          {/* Main Transport Row: Circle Prev | Wide Pill Pause/Play | Circle Next */}
          <div className="pt-5 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                triggerAppHaptic(hapticsEnabled, 10);
                onPrevious();
              }}
              aria-label="Previous track"
              className="w-14 h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/14 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={() => {
                triggerAppHaptic(hapticsEnabled, 14);
                onPlayPause();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="h-14 min-w-[164px] px-7 rounded-full bg-white/[0.12] hover:bg-white/[0.20] border border-white/15 backdrop-blur-md flex items-center justify-center gap-2.5 text-white font-display text-[15.5px] font-bold active:scale-95 transition-all shadow-lg"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                triggerAppHaptic(hapticsEnabled, 10);
                onNext();
              }}
              aria-label="Next track"
              className="w-14 h-14 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/14 flex items-center justify-center text-white active:scale-90 transition-all"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          {/* Bottom 3-Capsule Row: Shuffle | [Speaker | Queue/Video] | Repeat */}
          <div className="pt-5 grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                triggerAppHaptic(hapticsEnabled, 8);
                onToggleShuffle();
              }}
              aria-label="Toggle shuffle"
              style={
                shuffle
                  ? { backgroundColor: 'var(--mw-primary)', borderColor: 'var(--mw-primary)' }
                  : undefined
              }
              className={`h-11 rounded-full border flex items-center justify-center active:scale-95 transition-all ${
                shuffle
                  ? 'text-white shadow-md'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/12 text-white/85'
              }`}
            >
              <Shuffle className="w-4.5 h-4.5 stroke-[2.3]" />
            </button>

            <div className="h-11 rounded-full bg-white/[0.08] border border-white/12 flex items-center divide-x divide-white/15 overflow-hidden">
              <button
                onClick={() => {
                  triggerAppHaptic(hapticsEnabled, 8);
                  onOpenAudioOutput();
                }}
                aria-label="Audio output device and AutoEQ"
                className="flex-1 h-full flex items-center justify-center text-white/85 hover:bg-white/10 transition-colors relative"
              >
                <Volume2 className="w-4.5 h-4.5 stroke-[2.2]" />
                {(sleepStatus.remainingSec !== null || sleepStatus.afterTrack) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute top-2 right-2.5" />
                )}
              </button>
              <button
                onClick={() => {
                  triggerAppHaptic(hapticsEnabled, 8);
                  setDrawerTab('upnext');
                }}
                aria-label="Open Playing Next queue"
                className="flex-1 h-full flex items-center justify-center text-white/85 hover:bg-white/10 transition-colors relative"
              >
                <SquarePlay className="w-4.5 h-4.5 stroke-[2.2]" />
                {autoplayRadio && (
                  <span
                    style={{ backgroundColor: 'var(--mw-primary)' }}
                    className="w-1.5 h-1.5 rounded-full absolute top-2 right-2.5"
                  />
                )}
              </button>
            </div>

            <button
              onClick={() => {
                triggerAppHaptic(hapticsEnabled, 8);
                onToggleRepeat();
              }}
              aria-label="Toggle repeat mode"
              style={
                repeatMode !== 'off'
                  ? { backgroundColor: 'var(--mw-primary)', borderColor: 'var(--mw-primary)' }
                  : undefined
              }
              className={`h-11 rounded-full border flex items-center justify-center active:scale-95 transition-all ${
                repeatMode !== 'off'
                  ? 'text-white shadow-md'
                  : 'bg-white/[0.08] hover:bg-white/[0.14] border-white/12 text-white/85'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4.5 h-4.5 stroke-[2.3]" />
              ) : (
                <Repeat className="w-4.5 h-4.5 stroke-[2.3]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Track Options & LastWave Utilities Action Sheet */}
      {showMoreMenu && (
        <div
          onClick={() => setShowMoreMenu(false)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[430px] rounded-3xl bg-[#161918]/95 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl divide-y divide-white/10 max-h-[85dvh] overflow-y-auto"
          >
            <div className="p-4 flex items-center gap-3">
              <img
                src={track.artworkUrl}
                alt={track.title}
                referrerPolicy="no-referrer"
                className="w-12 h-12 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
                <p className="text-xs text-white/60 truncate">
                  {track.artist} · {track.album}
                </p>
              </div>
            </div>

            <div className="divide-y divide-white/[0.07] text-sm font-medium">
              {musicVideoEnabled && track.newpipeVideoId && (
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setViewMode('artwork');
                    setMediaMode((m) => (m === 'video' ? 'art' : 'video'));
                  }}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
                >
                  <span>{mediaMode === 'video' ? 'Switch to Artwork Mode' : 'Watch Synced Music Video'}</span>
                  <Video className="w-4.5 h-4.5 text-emerald-400" />
                </button>
              )}

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onToggleDownload(track);
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>{isDownloaded ? 'Downloaded Offline' : 'Download for Offline'}</span>
                {isDownloaded ? (
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                ) : (
                  <Download className="w-4.5 h-4.5 text-white/70" />
                )}
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenLyrics();
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>Full-Screen Lyrics</span>
                <BoldLyricsQuoteIcon className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  setShowSleepPicker(true);
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>
                  Sleep Timer{' '}
                  {sleepStatus.afterTrack
                    ? '· End of Track'
                    : sleepStatus.remainingSec !== null
                    ? `· ${Math.ceil(sleepStatus.remainingSec / 60)}m left`
                    : ''}
                </span>
                <Moon className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={cycleSpeed}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>Playback Speed / Tempo · {playbackRate}×</span>
                <Gauge className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenEqualizer();
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>15-Band Parametric EQ &amp; AutoEQ</span>
                <SlidersHorizontal className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenAudioQuality();
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>Audio Quality · {track.quality.badgeLabel}</span>
                <Radio className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenArtist(primaryArtist);
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>Go to Artist · {primaryArtist}</span>
                <UserRound className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  onOpenAlbum(track.album, primaryArtist);
                }}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>Go to Album</span>
                <Disc3 className="w-4.5 h-4.5 text-white/70" />
              </button>

              <button
                onClick={copyDiscordPresence}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left"
              >
                <span>
                  {discordCopied ? 'Copied Discord Rich Presence!' : 'Copy Discord Rich Presence'}
                </span>
                <Share2 className="w-4.5 h-4.5 text-white/70" />
              </button>

              {onExcludeTrack && (
                <button
                  onClick={() => {
                    onExcludeTrack(track.id);
                    setShowMoreMenu(false);
                    onNext();
                  }}
                  className="w-full px-5 py-3 flex items-center justify-between hover:bg-white/5 text-left text-rose-400"
                >
                  <span>Exclude Track from Recommendations</span>
                  <Ban className="w-4.5 h-4.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowMoreMenu(false)}
              className="w-full py-3.5 text-center text-sm font-bold text-white/80 hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sleep Timer Picker Modal */}
      {showSleepPicker && (
        <div
          onClick={() => setShowSleepPicker(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-3xl bg-[#161918] border border-white/10 p-5 space-y-2.5 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="font-display text-base font-bold text-white">Sleep Timer</h3>
              <Moon className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            {[
              { label: 'Off', val: null as number | 'end_of_track' | null },
              { label: '5 minutes', val: 5 },
              { label: '15 minutes', val: 15 },
              { label: '30 minutes', val: 30 },
              { label: '45 minutes', val: 45 },
              { label: '60 minutes', val: 60 },
              { label: 'End of current track', val: 'end_of_track' as const }
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  audioEngine.setSleepTimer(opt.val);
                  setShowSleepPicker(false);
                }}
                className="w-full py-2.5 px-3.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-left text-xs font-semibold text-white flex items-center justify-between"
              >
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Playing Next Queue & Infinity Autoplay Drawer */}
      {drawerTab && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm">
          <div className="w-full max-w-[460px] h-[78dvh] bg-[#141716] border-t border-white/10 rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl">
            <div className="pt-2.5 flex justify-center">
              <div className="w-10 h-1 rounded-full bg-white/25" />
            </div>

            <div className="px-5 pt-3 pb-3 border-b border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center p-1 rounded-xl bg-white/[0.08]">
                <button
                  onClick={() => setDrawerTab('upnext')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === 'upnext'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Playing Next ({upNextQueue.length})
                </button>
                <button
                  onClick={() => setDrawerTab('related')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    drawerTab === 'related'
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  Discovery
                </button>
              </div>

              <button
                onClick={() => setDrawerTab(null)}
                aria-label="Close queue"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {drawerTab === 'upnext' ? (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-none">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={onToggleShuffle}
                    style={shuffle ? { backgroundColor: 'var(--mw-primary)' } : undefined}
                    className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      shuffle
                        ? 'text-white'
                        : 'bg-white/[0.08] text-white/75 hover:bg-white/[0.14]'
                    }`}
                  >
                    <Shuffle className="w-4 h-4" />
                    <span>Shuffle</span>
                  </button>

                  <button
                    onClick={onToggleRepeat}
                    style={repeatMode !== 'off' ? { backgroundColor: 'var(--mw-primary)' } : undefined}
                    className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      repeatMode !== 'off'
                        ? 'text-white'
                        : 'bg-white/[0.08] text-white/75 hover:bg-white/[0.14]'
                    }`}
                  >
                    {repeatMode === 'one' ? (
                      <Repeat1 className="w-4 h-4" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                    <span>
                      {repeatMode === 'one' ? 'Repeat 1' : repeatMode === 'all' ? 'Repeat All' : 'Repeat'}
                    </span>
                  </button>

                  <button
                    onClick={onToggleAutoplay}
                    style={autoplayRadio ? { backgroundColor: 'var(--mw-primary)' } : undefined}
                    className={`py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      autoplayRadio
                        ? 'text-white'
                        : 'bg-white/[0.08] text-white/75 hover:bg-white/[0.14]'
                    }`}
                  >
                    <InfinityIcon className="w-4 h-4" />
                    <span>Autoplay</span>
                  </button>
                </div>

                <div className="flex items-center justify-between px-1 pt-1">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/50">
                      Continuing from {radioTitle}
                    </p>
                  </div>
                  {upNextQueue.length > 0 && (
                    <button
                      onClick={onSaveQueueAsPlaylist}
                      className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1 flex-shrink-0"
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save Playlist</span>
                    </button>
                  )}
                </div>

                {isLoadingRadio && upNextQueue.length === 0 ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-xs text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Building Autoplay station...</span>
                  </div>
                ) : upNextQueue.length === 0 ? (
                  <p className="text-center text-xs text-white/55 py-10">
                    Queue is empty. Enable Autoplay (∞) to continue playing similar music.
                  </p>
                ) : (
                  <div className="divide-y divide-white/[0.07]">
                    {upNextQueue.map((qTrack, idx) => (
                      <div
                        key={`${qTrack.id}-${idx}`}
                        onClick={() => {
                          onPlayFromQueue(qTrack);
                          setDrawerTab(null);
                        }}
                        className="flex items-center justify-between py-2.5 px-1 hover:bg-white/[0.04] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <img
                            src={qTrack.artworkUrl}
                            alt={qTrack.title}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="text-[13.5px] font-semibold text-white truncate">
                              {qTrack.title}
                            </h4>
                            <p className="text-xs text-white/55 truncate">
                              {qTrack.artist} · {qTrack.quality.sourceProvider}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromQueue(qTrack.id);
                          }}
                          aria-label="Remove from queue"
                          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-none">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setDrawerTab(null);
                      onOpenArtist(primaryArtist);
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] flex items-center gap-2.5 text-left"
                  >
                    <UserRound className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-white/55 block">Artist</span>
                      <span className="text-xs font-bold text-white truncate block">
                        {primaryArtist}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setDrawerTab(null);
                      onOpenAlbum(track.album, primaryArtist);
                    }}
                    className="p-3.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] flex items-center gap-2.5 text-left"
                  >
                    <Disc3 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[11px] text-white/55 block">Album</span>
                      <span className="text-xs font-bold text-white truncate block">
                        {track.album}
                      </span>
                    </div>
                  </button>
                </div>

                <div>
                  <h4 className="font-display text-sm font-bold mb-2">
                    Similar Songs &amp; Station Picks
                  </h4>
                  <div className="divide-y divide-white/[0.07]">
                    {upNextQueue.slice(0, 12).map((rel, i) => (
                      <div
                        key={`rel-${rel.id}-${i}`}
                        onClick={() => {
                          onPlayFromQueue(rel);
                          setDrawerTab(null);
                        }}
                        className="flex items-center justify-between py-2.5 px-1 hover:bg-white/[0.04] cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                          <img
                            src={rel.artworkUrl}
                            alt={rel.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">{rel.title}</h5>
                            <p className="text-[11px] text-white/55 truncate">{rel.artist}</p>
                          </div>
                        </div>
                        <ListMusic className="w-4 h-4 text-white/40 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
