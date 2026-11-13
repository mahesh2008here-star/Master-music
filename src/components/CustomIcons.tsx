import React from 'react';
import { motion } from 'motion/react';

interface IconProps {
  className?: string;
  active?: boolean;
  style?: React.CSSProperties;
}

export const BoldHomeIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={active ? { scale: [1, 1.12, 1], y: [0, -1, 0] } : { scale: 1, y: 0 }}
    transition={{ duration: 0.32, ease: 'easeOut' }}
  >
    {active ? (
      <path
        d="M3.5 10.6L12 3.5l8.5 7.1V19.5a2 2 0 0 1-2 2h-4.2v-5.5a2.3 2.3 0 0 0-4.6 0v5.5H5.5a2 2 0 0 1-2-2v-8.9z"
        fill="currentColor"
      />
    ) : (
      <path
        d="M4 10.5L12 4l8 6.5V19a2 2 0 0 1-2 2h-4v-5.2a2 2 0 0 0-4 0V21H6a2 2 0 0 1-2-2v-8.5z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </motion.svg>
);

export const BoldStatsIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <motion.rect
      x="3.5"
      y="12"
      width="4.2"
      height="8.5"
      rx="1.6"
      fill="currentColor"
      animate={active ? { height: [8.5, 11, 8.5], y: [12, 9.5, 12] } : undefined}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.rect
      x="9.9"
      y="4.5"
      width="4.2"
      height="16"
      rx="1.6"
      fill="currentColor"
      animate={active ? { height: [16, 12.5, 16], y: [4.5, 8, 4.5] } : undefined}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
    />
    <motion.rect
      x="16.3"
      y="8.5"
      width="4.2"
      height="12"
      rx="1.6"
      fill="currentColor"
      animate={active ? { height: [12, 15, 12], y: [8.5, 5.5, 8.5] } : undefined}
      transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
    />
  </motion.svg>
);

export const BoldLibraryIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={active ? { scale: [1, 1.1, 1] } : { scale: 1 }}
    transition={{ duration: 0.28 }}
  >
    <rect
      x="3.5"
      y="5.5"
      width="17"
      height="15"
      rx="3.2"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2.3"
    />
    <path
      d="M7 2.5h10"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <path
      d="M12.5 9.5v5.4a1.8 1.8 0 1 1-1.4-1.76V10l4.2-1v4.4a1.8 1.8 0 1 1-1.4-1.76"
      stroke={active ? '#FFFFFF' : 'currentColor'}
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </motion.svg>
);

export const BoldSearchIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="2.5" />
    <path d="M16 16l4.6 4.6" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
  </svg>
);

export const BoldDownloadIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M12 4v10.5m0 0l-4.2-4.2m4.2 4.2l4.2-4.2"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4.5 19.2h15" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const BoldHistoryIcon: React.FC<IconProps> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path
      d="M4.2 12a7.8 7.8 0 1 0 2.3-5.5L4 9"
      stroke="currentColor"
      strokeWidth="2.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M4 4.8V9h4.2" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12.2 8.2v4.1l2.7 1.6" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" />
  </svg>
);

export const BoldSparkleIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = true }) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={active ? { rotate: [0, 8, -6, 0], scale: [1, 1.08, 1] } : undefined}
    transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M12 2.5L14.4 9.1L21 11.5L14.4 13.9L12 20.5L9.6 13.9L3 11.5L9.6 9.1L12 2.5Z"
      fill="currentColor"
    />
    <circle cx="19" cy="5" r="1.4" fill="currentColor" />
  </motion.svg>
);

export const BoldHeartIcon: React.FC<IconProps & { style?: React.CSSProperties }> = ({
  className = 'w-5 h-5',
  active = false,
  style
}) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    style={style}
    className={className}
    animate={active ? { scale: [1, 1.24, 1] } : { scale: 1 }}
    transition={{ duration: 0.3 }}
  >
    <path
      d="M12 20.4s-7.4-4.7-9.1-9C1.7 8.4 3.4 4.8 6.9 4.5c2-.2 3.8.9 5.1 2.5 1.3-1.6 3.1-2.7 5.1-2.5 3.5.3 5.2 3.9 4 6.9-1.7 4.3-9.1 9-9.1 9z"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </motion.svg>
);

export const AnimatedEqualizerBars: React.FC<{ isPlaying?: boolean; className?: string }> = ({
  isPlaying = true,
  className = 'w-3.5 h-3.5'
}) => (
  <svg viewBox="0 0 16 16" fill="none" className={className}>
    <motion.rect
      x="1.5"
      y="5"
      width="2.4"
      height="9"
      rx="1.2"
      fill="currentColor"
      animate={isPlaying ? { height: [4, 11, 5, 10, 4], y: [10, 3, 9, 4, 10] } : { height: 5, y: 9 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.rect
      x="6.8"
      y="2"
      width="2.4"
      height="12"
      rx="1.2"
      fill="currentColor"
      animate={isPlaying ? { height: [12, 5, 11, 4, 12], y: [2, 9, 3, 10, 2] } : { height: 9, y: 5 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: 'easeInOut', delay: 0.12 }}
    />
    <motion.rect
      x="12.1"
      y="6"
      width="2.4"
      height="8"
      rx="1.2"
      fill="currentColor"
      animate={isPlaying ? { height: [6, 12, 4, 9, 6], y: [8, 2, 10, 5, 8] } : { height: 6, y: 8 }}
      transition={{ duration: 0.95, repeat: Infinity, ease: 'easeInOut', delay: 0.24 }}
    />
  </svg>
);

export const SpotifyEmblemIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="10.5" fill="#1ED760" />
    <path
      d="M7.1 9.7c3.3-1 7.2-.8 10.2.9M7.8 12.7c2.8-.8 6-.6 8.5.8M8.5 15.5c2.2-.6 4.7-.4 6.6.6"
      stroke="#101812"
      strokeWidth="1.95"
      strokeLinecap="round"
    />
  </svg>
);

export const BoldLyricsQuoteIcon: React.FC<IconProps> = ({ className = 'w-5 h-5', active = false }) => (
  <motion.svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    animate={active ? { scale: [1, 1.12, 1] } : { scale: 1 }}
    transition={{ duration: 0.25 }}
  >
    <path
      d="M5.2 9.5C5.2 7.5 6.8 6 8.8 6c1.9 0 3.3 1.4 3.3 3.4 0 3.1-1.9 5.9-4.7 7.6l-1.3-1.7c1.6-1 2.4-2 2.6-3.1h-.3c-1.8 0-3.2-1.2-3.2-2.7zm8.8 0C14 7.5 15.6 6 17.6 6c1.9 0 3.3 1.4 3.3 3.4 0 3.1-1.9 5.9-4.7 7.6l-1.3-1.7c1.6-1 2.4-2 2.6-3.1h-.3c-1.8 0-3.2-1.2-3.2-2.7z"
      fill="currentColor"
    />
  </motion.svg>
);
