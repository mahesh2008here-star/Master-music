export type QualityTier = 'standard' | 'high_quality' | 'lossless' | 'hi_res_lossless';

export interface AudioQualityInfo {
  codec: string;              // e.g. "Opus", "FLAC", "AAC", "MP3"
  container: string;          // e.g. "WebM", "Native FLAC", "MP4", "MPEG"
  sampleRate: number;         // e.g. 48000, 44100, 96000, 192000
  bitDepth: number | null;    // e.g. 16, 24, null for lossy
  channelCount: number;       // e.g. 2
  bitrateKbps: number;        // e.g. 139, 256, 1411, 4608
  isLossless: boolean;
  isHiRes: boolean;
  isResampledByAndroidMixer: boolean;
  outputHardware: string;     // e.g. "Snapdragon 6s Gen 3 Audio HAL (Moto G45)", "USB Audio DAC (Bit-Perfect)"
  badgeLabel: string;         // e.g. "Opus • OPUS 139 kbps", "FLAC • 24-bit 96 kHz"
  tier: QualityTier;
  sourceProvider: string;     // e.g. "InnerTube (YouTube Music)", "Lossless Archive", "Local Device"
}

export interface NewPipeAudioStream {
  url: string;
  rawUrl: string;
  codec: string;
  container: string;
  mimeType: string;
  sampleRate: number;
  bitrateKbps: number;
  qualityLabel: string;
  badgeLabel: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  artworkUrl: string;
  streamUrl: string;
  quality: AudioQualityInfo;
  isLiked?: boolean;
  isLocal?: boolean;
  isDownloaded?: boolean;
  provider: 'innertube' | 'newpipe' | 'jiosaavn' | 'audius' | 'deezer' | 'hires_flac' | 'local';
  newpipeVideoId?: string;
  availableStreams?: NewPipeAudioStream[];
}

export interface Artist {
  id: string;
  name: string;
  avatarUrl: string;
  isTrending?: boolean;
  genre?: string;
  topTracks?: string[];
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: number;
  coverUrl: string;
  trackCount: number;
  isDownloaded?: boolean;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverUrl?: string;
  trackIds: string[];
  createdAt: string;
  isPinned?: boolean;
  isSystem?: boolean;
}

export interface LyricLine {
  id: string;
  timeMs: number;
  text: string;
}

export interface LyricsData {
  trackName: string;
  artistName: string;
  syncedLyrics: LyricLine[] | null;
  plainLyrics: string | null;
  isInstrumental?: boolean;
  source: 'lrclib' | 'local' | 'none';
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  shuffle: boolean;
  repeatMode: 'off' | 'all' | 'one';
  queue: Track[];
  queueIndex: number;
}

export interface LastFmProfile {
  username: string;
  isConnected: boolean;
  totalScrobbles: number;
  sessionKey?: string;
}

export interface ListeningStats {
  totalPlays: number;
  uniqueTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  recentPlays: {
    track: Track;
    playedAt: string;
  }[];
}

export interface FriendActivity {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  track: Track;
  status: 'listening' | 'jamming' | 'idle';
  timestamp: string;
  qualityBadge: string;
  listenersCount?: number;
}
