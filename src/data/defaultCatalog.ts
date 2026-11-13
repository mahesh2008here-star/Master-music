import { Track, Artist, Album, Playlist } from '../types/music';

export const INITIAL_TRACKS: Track[] = [
  {
    id: 'veera-veera-01',
    title: 'Radhimaa (From "Think Indie")',
    artist: 'Sai Abhyankkar',
    album: 'iSaiAbhyankkar (The Indie Isai)',
    duration: 259,
    artworkUrl: '/assets/covers/veera_veera.png',
    streamUrl: 'https://aac.saavncdn.com/877/875e41134def3f76517ce29ea7819fc8_320.mp4',
    quality: {
      codec: 'AAC-LC',
      container: 'MP4 / M4A',
      sampleRate: 44100,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: 320,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: false,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: 'AAC • 320 kbps',
      tier: 'high_quality',
      sourceProvider: 'JioSaavn Free 320k'
    },
    isLiked: true,
    provider: 'jiosaavn'
  },
  {
    id: 'bairan-banjaare',
    title: 'Bairan',
    artist: 'Banjaare',
    album: 'Bairan - Single',
    duration: 150,
    artworkUrl: '/assets/covers/bairan.png',
    streamUrl: 'https://aac.saavncdn.com/236/c25c1597f09422b0a9dee8b7af0e9bae_320.mp4',
    quality: {
      codec: 'AAC-LC',
      container: 'MP4 / M4A',
      sampleRate: 44100,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: 320,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: false,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: 'AAC • 320 kbps',
      tier: 'high_quality',
      sourceProvider: 'JioSaavn Free 320k'
    },
    isLiked: false,
    provider: 'jiosaavn'
  },
  {
    id: 'sheesha-mitta-ror',
    title: 'Sheesha (Aakhya Mai Aakh Ghali Jo Bairan)',
    artist: 'Mitta Ror',
    album: 'Sheesha - Haryanvi Hit',
    duration: 196,
    artworkUrl: '/assets/covers/sheesha.png',
    streamUrl: 'https://aac.saavncdn.com/034/c9725383991c4dd1870b9da17f549b1e_320.mp4',
    quality: {
      codec: 'AAC-LC',
      container: 'MP4 / M4A',
      sampleRate: 44100,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: 320,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: false,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: 'AAC • 320 kbps',
      tier: 'high_quality',
      sourceProvider: 'JioSaavn Free 320k'
    },
    isLiked: false,
    provider: 'jiosaavn'
  },
  {
    id: 'parvati-sadhu-tiwari',
    title: 'Parvati',
    artist: 'Sadhu Tiwari',
    album: 'Hanuman Aksh',
    duration: 284,
    artworkUrl: '/assets/covers/parvati.png',
    streamUrl: 'https://aac.saavncdn.com/058/6048e52e4fd7a14cd7955b28b0dc1134_320.mp4',
    quality: {
      codec: 'AAC-LC',
      container: 'MP4 / M4A',
      sampleRate: 44100,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: 320,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: false,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: 'AAC • 320 kbps',
      tier: 'high_quality',
      sourceProvider: 'JioSaavn Free 320k'
    },
    isLiked: true,
    provider: 'jiosaavn'
  },
  {
    id: 'boom-shaka-krsna',
    title: 'Boom Shaka',
    artist: 'KR$NA & Dhanda Nyoliwala',
    album: 'Boom Shaka - Single',
    duration: 218,
    artworkUrl: '/assets/covers/boom_shaka.png',
    streamUrl: 'https://aac.saavncdn.com/307/ccb54f2680dcf02b3a76509d4e25787d_320.mp4',
    quality: {
      codec: 'AAC-LC',
      container: 'MP4 / M4A',
      sampleRate: 44100,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: 320,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: false,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: 'AAC • 320 kbps',
      tier: 'high_quality',
      sourceProvider: 'JioSaavn Free 320k'
    },
    isLiked: false,
    provider: 'jiosaavn'
  },
  {
    id: 'tu-mil-jaaye-king',
    title: 'Tu Mil Jaaye (From "KING")',
    artist: 'Sachin-Jigar, Ed Sheeran, Arijit Singh',
    album: 'Tu Mil Jaaye (From "KING")',
    duration: 315,
    artworkUrl: '/assets/covers/god_mode.png',
    streamUrl: 'https://aac.saavncdn.com/320/4d91932291471256b3c9313360ebb834_320.mp4',
    quality: {
      codec: 'AAC-LC',
      container: 'MP4 / M4A',
      sampleRate: 44100,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: 320,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: false,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: 'AAC • 320 kbps',
      tier: 'high_quality',
      sourceProvider: 'JioSaavn Free 320k'
    },
    isLiked: true,
    provider: 'jiosaavn'
  }
];

export const INITIAL_ARTISTS: Artist[] = [
  {
    id: 'sai-abhyankkar',
    name: 'Sai Abhyankkar',
    avatarUrl: '/assets/covers/sai_abhyankkar.png',
    isTrending: true,
    genre: 'Indie Film & Electro-Folk'
  },
  {
    id: 'krsna',
    name: 'KR$NA',
    avatarUrl: '/assets/covers/krsna.png',
    isTrending: true,
    genre: 'Desi Hip Hop / Rap'
  },
  {
    id: 'arjn',
    name: 'ARJN',
    avatarUrl: '/assets/covers/arjn.png',
    isTrending: true,
    genre: 'Pop / R&B'
  },
  {
    id: 'udit-narayan',
    name: 'Udit Narayan',
    avatarUrl: '/assets/covers/sai_abhyankkar.png',
    isTrending: false,
    genre: 'Bollywood Classics'
  }
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: 'badtameez-dil-album',
    title: 'Badtameez Dil - OST',
    artist: 'Pritam, Benny Dayal',
    year: 2024,
    coverUrl: '/assets/covers/badtameez_dil.png',
    trackCount: 8
  },
  {
    id: 'god-mode-begins',
    title: 'Original Score: Side B (God Mode)',
    artist: 'Sai Abhyankkar',
    year: 2026,
    coverUrl: '/assets/covers/god_mode.png',
    trackCount: 12
  },
  {
    id: 'gangstas-paradise',
    title: "Gangsta's Paradise",
    artist: 'Coolio',
    year: 1995,
    coverUrl: '/assets/covers/gangstas_paradise.png',
    trackCount: 14
  }
];

export const INITIAL_PLAYLISTS: Playlist[] = [
  {
    id: 'liked-songs',
    title: 'Liked Songs',
    description: 'Tracks you have marked with love',
    coverUrl: '',
    trackIds: ['veera-veera-01', 'tu-mil-jaaye-king', 'parvati-sadhu-tiwari', 'boom-shaka-krsna'],
    createdAt: 'Nov 11, 2026',
    isPinned: true,
    isSystem: true
  },
  {
    id: 'local-songs',
    title: 'Local songs',
    description: 'Audio files found on device storage',
    coverUrl: '',
    trackIds: [],
    createdAt: 'Nov 11, 2026',
    isPinned: true,
    isSystem: true
  }
];
