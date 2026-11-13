import React from 'react';
import { Play, Pause, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Track } from '../types/music';
import { AnimatedEqualizerBars } from './CustomIcons';

interface MiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  liquidGlass?: boolean;
  classicCardMode?: boolean;
  dockHidden?: boolean;
  isExpanded?: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  liquidGlass = true,
  classicCardMode = false,
  dockHidden = false,
  isExpanded = false,
  onPlayPause,
  onNext,
  onExpand
}) => {
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const bottomOffsetClass = dockHidden
    ? 'bottom-[calc(14px+env(safe-area-inset-bottom))]'
    : classicCardMode
    ? 'bottom-[calc(72px+env(safe-area-inset-bottom))]'
    : 'bottom-[calc(76px+env(safe-area-inset-bottom))]';

  return (
    <div
      className={`fixed left-0 right-0 z-30 flex justify-center pointer-events-none transition-all duration-300 ${bottomOffsetClass} ${
        classicCardMode ? 'px-2.5' : 'px-3'
      }`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTrack.id}
          initial={{ y: 42, opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
          animate={{
            y: isExpanded ? -16 : 0,
            opacity: isExpanded ? 0 : 1,
            scale: isExpanded ? 1.03 : 1,
            filter: isExpanded ? 'blur(12px)' : 'blur(0px)',
            transition: {
              duration: 0.28,
              ease: [0.22, 1, 0.36, 1]
            }
          }}
          exit={{
            y: 36,
            opacity: 0,
            scale: 0.95,
            filter: 'blur(8px)',
            transition: { duration: 0.16, ease: 'easeIn' }
          }}
          whileTap={isExpanded ? undefined : { scale: 0.985 }}
          onClick={isExpanded ? undefined : onExpand}
          className={`${isExpanded ? 'pointer-events-none' : 'pointer-events-auto'} w-full max-w-[440px] md:max-w-lg relative overflow-hidden cursor-pointer select-none ${
            classicCardMode ? 'rounded-2xl' : 'rounded-full'
          } ${
            liquidGlass
              ? 'liquid-glass-surface'
              : 'bg-white/95 dark:bg-[#1C1C1E]/95 border border-black/[0.08] dark:border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.16)]'
          }`}
        >
          <div className="flex items-center justify-between pl-2.5 pr-2 py-2 gap-3">
            {/* Circular / Rounded Artwork with Live Equalizer Overlay */}
            <div
              className={`relative w-12 h-12 flex-shrink-0 overflow-hidden shadow-md bg-neutral-200 dark:bg-neutral-800 ${
                classicCardMode ? 'rounded-xl' : 'rounded-full'
              }`}
            >
              <img
                src={currentTrack.artworkUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center text-white">
                  <AnimatedEqualizerBars isPlaying className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="font-display text-[15px] font-bold text-gray-900 dark:text-white truncate tracking-tight leading-tight">
                {currentTrack.title}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                <p className="text-[12.5px] font-medium text-gray-700/90 dark:text-gray-300 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Circular Play/Pause + Pastel Next Buttons */}
            <div
              className="flex items-center gap-1.5 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onPlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{ backgroundColor: 'var(--mw-primary)' }}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white shadow-sm hover:brightness-95 active:scale-90 transition-all"
              >
                {isPlaying ? (
                  <Pause className="w-4.5 h-4.5 fill-current" />
                ) : (
                  <Play className="w-4.5 h-4.5 fill-current translate-x-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                aria-label="Next track"
                style={{
                  backgroundColor: 'var(--mw-tint)',
                  color: 'var(--mw-tint-text)'
                }}
                className="w-11 h-11 rounded-full flex items-center justify-center hover:brightness-95 active:scale-90 transition-all"
              >
                <SkipForward className="w-4.5 h-4.5 fill-current" />
              </button>
            </div>
          </div>

          {/* Subtle Progress Hairline */}
          <div className="h-[2.5px] w-full bg-black/[0.06] dark:bg-white/10 relative">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progressPercent}%`, backgroundColor: 'var(--mw-primary)' }}
            />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
