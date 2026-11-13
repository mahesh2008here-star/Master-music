export type AccentId =
  | 'crimson'
  | 'violet'
  | 'ocean'
  | 'sage'
  | 'amber'
  | 'rose'
  | 'mono'
  | 'custom';

export interface AccentPalette {
  id: AccentId;
  name: string;
  quadrants: [string, string, string, string];
  primary: string;
  primaryHover: string;
  tint: string;
  tintStrong: string;
  tintText: string;
  tintDark: string;
  tintTextDark: string;
  statsCardBg: string;
  statsCardBorder: string;
  statsCardDarkBg: string;
}

export const ACCENT_PALETTES: AccentPalette[] = [
  {
    id: 'crimson',
    name: 'Apple Rose',
    quadrants: ['#FA243C', '#FF375F', '#FF8FA0', '#B81024'],
    primary: '#FA243C',
    primaryHover: '#D9142B',
    tint: '#FFE5E9',
    tintStrong: '#FFD0D7',
    tintText: '#8C0C1D',
    tintDark: 'rgba(250, 36, 60, 0.22)',
    tintTextDark: '#FF7587',
    statsCardBg: '#F9EAEB',
    statsCardBorder: '#F2D3D6',
    statsCardDarkBg: '#231618',
  },
  {
    id: 'violet',
    name: 'Violet',
    quadrants: ['#6949B8', '#8F6EE0', '#BFA8F5', '#4E3194'],
    primary: '#6949B8',
    primaryHover: '#54389C',
    tint: '#EAE2FA',
    tintStrong: '#D5C7F5',
    tintText: '#231542',
    tintDark: '#2C2147',
    tintTextDark: '#D2C1FF',
    statsCardBg: '#EFE9FC',
    statsCardBorder: '#DACCF7',
    statsCardDarkBg: '#221A36',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    quadrants: ['#2B6D91', '#4290BA', '#88C3E3', '#1D506E'],
    primary: '#236488',
    primaryHover: '#1A4E6B',
    tint: '#D9EEF9',
    tintStrong: '#BCE0F2',
    tintText: '#0F2C3D',
    tintDark: '#193242',
    tintTextDark: '#A3D9F7',
    statsCardBg: '#E3F2FA',
    statsCardBorder: '#C4E2F2',
    statsCardDarkBg: '#162733',
  },
  {
    id: 'sage',
    name: 'Sage',
    quadrants: ['#1B5E34', '#4B7D5D', '#A7CFAF', '#2F6844'],
    primary: '#165B33',
    primaryHover: '#104727',
    tint: '#BCE5C4',
    tintStrong: '#A7DEB2',
    tintText: '#0D2E1A',
    tintDark: '#1A3B26',
    tintTextDark: '#A8E5B5',
    statsCardBg: '#DCEEE0',
    statsCardBorder: '#BFDDC5',
    statsCardDarkBg: '#193322',
  },
  {
    id: 'amber',
    name: 'Amber',
    quadrants: ['#967236', '#C29547', '#E6CA8E', '#755622'],
    primary: '#8D6725',
    primaryHover: '#73531C',
    tint: '#F5E7C6',
    tintStrong: '#EBD4A0',
    tintText: '#36260B',
    tintDark: '#3B2E16',
    tintTextDark: '#F2D28B',
    statsCardBg: '#F7ECD2',
    statsCardBorder: '#EAD9B0',
    statsCardDarkBg: '#2B2214',
  },
  {
    id: 'rose',
    name: 'Rose',
    quadrants: ['#8E2848', '#BF5073', '#E8A5B9', '#6D1B35'],
    primary: '#8E2848',
    primaryHover: '#751E39',
    tint: '#F4DCE1',
    tintStrong: '#EAC2CD',
    tintText: '#241619',
    tintDark: '#3D1B25',
    tintTextDark: '#FFAEC0',
    statsCardBg: '#F5E5E7',
    statsCardBorder: '#ECCFD4',
    statsCardDarkBg: '#2A1820',
  },
  {
    id: 'mono',
    name: 'Mono',
    quadrants: ['#2E2E32', '#64646A', '#D8D8DC', '#1A1A1D'],
    primary: '#2B2B30',
    primaryHover: '#18181B',
    tint: '#E4E4E7',
    tintStrong: '#D4D4D8',
    tintText: '#18181B',
    tintDark: '#27272A',
    tintTextDark: '#F4F4F5',
    statsCardBg: '#EAEAEF',
    statsCardBorder: '#D4D4D8',
    statsCardDarkBg: '#1F1F24',
  },
  {
    id: 'custom',
    name: 'Custom',
    quadrants: ['#FF4D4D', '#4DFF88', '#4DA6FF', '#FFD24D'],
    primary: '#165B33',
    primaryHover: '#104727',
    tint: '#BCE5C4',
    tintStrong: '#A7DEB2',
    tintText: '#0D2E1A',
    tintDark: '#1A3B26',
    tintTextDark: '#A8E5B5',
    statsCardBg: '#DCEEE0',
    statsCardBorder: '#BFDDC5',
    statsCardDarkBg: '#193322',
  },
];

export const SIGNATURE_PALETTE: AccentPalette = {
  id: 'sage',
  name: 'LastWave Signature',
  quadrants: ['#65A30D', '#165B33', '#BEF264', '#0F3D22'],
  primary: '#165B33',
  primaryHover: '#0F4425',
  tint: '#D9F5BE',
  tintStrong: '#BFEA9C',
  tintText: '#0D2D19',
  tintDark: 'rgba(132, 204, 22, 0.2)',
  tintTextDark: '#BEF264',
  statsCardBg: '#E6F5DB',
  statsCardBorder: '#CBE8B8',
  statsCardDarkBg: '#132419',
};

export interface MasterWaveSettings {
  themeMode: 'system' | 'light' | 'dark';
  appIcon: string;
  signatureTheme: boolean;
  amoledMode: boolean;
  dynamicColor: boolean;
  liquidGlass: boolean;
  m3NavBar: boolean;
  hideNavTabs: boolean;
  hapticFeedback: boolean;
  accent: AccentId;
  customAccentHex: string;
  wordByWordLyrics: boolean;
  wavySeekbar: boolean;
  rotatingBackground: boolean;
  lyricsBackgroundMotion: boolean;
  lyricsProvider: string;
  lyricsSyncOffsetMs: number;
  lyricsTextSize: number;
  hideLyricsButtons: string;
  translationLanguage: string;
  musicVideoEnabled: boolean;
  buttonNowPlaying: boolean;
  animatedAlbumCanvas: boolean;
  fullScreenArtwork: boolean;
  gradientBlurCanvas: boolean;
  canvasOverCellular: boolean;

  streamingQuality: 'max_hires' | 'high_opus' | 'standard';
  downloadQuality: 'hires_flac' | 'lossless_flac' | 'high_opus';
  bitPerfectMode: boolean;
  autoMix: boolean;
  musicHaptics: boolean;
  autoplaySimilar: boolean;
  crossfadeEnabled: boolean;
  keepScreenAwakeLyrics: boolean;
  downloadSyncedLyrics: boolean;
  backgroundPlayback: boolean;
  usbExclusiveOutput: boolean;
  internalDirectOutput: boolean;
  softwareVolumeUsbDac: boolean;
  loudnessNormalization: boolean;
  systemAudioEffects: boolean;
  studioMasterClarity: boolean;
  clarityPreset: string;
  claritySpatialBypass: boolean;
  autoEqEnabled: boolean;
  showAutoEqInVolume: boolean;

  podcastsEnabled: boolean;
  visibleHomeSectionsCount: number;
  excludedSongIds: string[];

  appLanguage: string;
}

export const DEFAULT_SETTINGS: MasterWaveSettings = {
  themeMode: 'light',
  appIcon: 'Original Electric Lime & Obsidian Teal',
  signatureTheme: false,
  amoledMode: false,
  dynamicColor: true,
  liquidGlass: true,
  m3NavBar: true,
  hideNavTabs: false,
  hapticFeedback: true,
  accent: 'sage',
  customAccentHex: '#165B33',
  wordByWordLyrics: true,
  wavySeekbar: true,
  rotatingBackground: true,
  lyricsBackgroundMotion: false,
  lyricsProvider: 'Auto • Fastest word-sync wins, LRCLIB fallback',
  lyricsSyncOffsetMs: 0,
  lyricsTextSize: 100,
  hideLyricsButtons: 'After 5 s',
  translationLanguage: 'Follows the app language',
  musicVideoEnabled: true,
  buttonNowPlaying: false,
  animatedAlbumCanvas: true,
  fullScreenArtwork: true,
  gradientBlurCanvas: false,
  canvasOverCellular: true,

  streamingQuality: 'max_hires',
  downloadQuality: 'hires_flac',
  bitPerfectMode: false,
  autoMix: false,
  musicHaptics: false,
  autoplaySimilar: true,
  crossfadeEnabled: false,
  keepScreenAwakeLyrics: false,
  downloadSyncedLyrics: true,
  backgroundPlayback: true,
  usbExclusiveOutput: false,
  internalDirectOutput: false,
  softwareVolumeUsbDac: false,
  loudnessNormalization: false,
  systemAudioEffects: false,
  studioMasterClarity: true,
  clarityPreset: 'Reference • Unmodified shipping curve',
  claritySpatialBypass: false,
  autoEqEnabled: false,
  showAutoEqInVolume: true,

  podcastsEnabled: true,
  visibleHomeSectionsCount: 44,
  excludedSongIds: [],

  appLanguage: 'System default',
};

const STORAGE_KEY_SETTINGS = 'masterwave_liquid_settings_v3';

export function loadSettings(): MasterWaveSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore storage errors
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: MasterWaveSettings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (Number.isNaN(num)) return null;
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function buildDerivedPalette(r: number, g: number, b: number, id: AccentId = 'custom'): AccentPalette {
  const toHex = (nr: number, ng: number, nb: number) =>
    `#${[nr, ng, nb].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;

  const primary = toHex(r * 0.86, g * 0.86, b * 0.86);
  const primaryHover = toHex(r * 0.72, g * 0.72, b * 0.72);
  const tint = toHex(r + (255 - r) * 0.82, g + (255 - g) * 0.82, b + (255 - b) * 0.82);
  const tintStrong = toHex(r + (255 - r) * 0.72, g + (255 - g) * 0.72, b + (255 - b) * 0.72);
  const tintText = toHex(r * 0.38, g * 0.38, b * 0.38);
  const statsCardBg = toHex(r + (255 - r) * 0.87, g + (255 - g) * 0.87, b + (255 - b) * 0.87);
  const statsCardBorder = toHex(r + (255 - r) * 0.76, g + (255 - g) * 0.76, b + (255 - b) * 0.76);
  const tintDark = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0.24)`;
  const tintTextDark = toHex(r + (255 - r) * 0.56, g + (255 - g) * 0.56, b + (255 - b) * 0.56);
  const statsCardDarkBg = toHex(r * 0.16, g * 0.16, b * 0.16);

  return {
    id,
    name: 'Dynamic',
    quadrants: [primary, primaryHover, tint, tintText],
    primary,
    primaryHover,
    tint,
    tintStrong,
    tintText,
    tintDark,
    tintTextDark,
    statsCardBg,
    statsCardBorder,
    statsCardDarkBg,
  };
}

export async function extractDynamicPaletteFromArtwork(artworkUrl: string): Promise<AccentPalette | null> {
  if (!artworkUrl) return null;
  try {
    const src =
      artworkUrl.startsWith('http') && !artworkUrl.startsWith(window.location.origin)
        ? `/api/newpipe/proxy?url=${encodeURIComponent(artworkUrl)}`
        : artworkUrl;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = src;
      setTimeout(() => reject(new Error('Timeout')), 2500);
    });

    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, 24, 24);
    const data = ctx.getImageData(0, 0, 24, 24).data;

    let bestScore = -1;
    let bestR = 22;
    let bestG = 91;
    let bestB = 51;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 180) continue;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      sumR += r;
      sumG += g;
      sumB += b;
      count++;

      // Favor vivid saturated mid-tones for Material You seed color
      if (lum > 0.16 && lum < 0.82) {
        const score = sat * 2.4 + (1 - Math.abs(lum - 0.48)) * 0.6;
        if (score > bestScore) {
          bestScore = score;
          bestR = r;
          bestG = g;
          bestB = b;
        }
      }
    }

    if (bestScore < 0.25 && count > 0) {
      bestR = sumR / count;
      bestG = sumG / count;
      bestB = sumB / count;
    }

    return buildDerivedPalette(bestR, bestG, bestB, 'sage');
  } catch {
    return null;
  }
}

export function getPaletteForSettings(
  settings: MasterWaveSettings,
  dynamicPalette?: AccentPalette | null
): AccentPalette {
  if (settings.signatureTheme) {
    return SIGNATURE_PALETTE;
  }
  if (settings.dynamicColor && dynamicPalette) {
    return dynamicPalette;
  }
  const base = ACCENT_PALETTES.find((p) => p.id === settings.accent) || ACCENT_PALETTES[3];
  if (settings.accent === 'custom' && settings.customAccentHex) {
    const rgb = hexToRgb(settings.customAccentHex);
    if (rgb) {
      return buildDerivedPalette(rgb.r, rgb.g, rgb.b, 'custom');
    }
    return {
      ...base,
      primary: settings.customAccentHex,
      primaryHover: settings.customAccentHex,
    };
  }
  return base;
}

export function applyAppIconFavicon(appIconName: string) {
  if (typeof document === 'undefined') return;
  let bg = '#165B33';
  let fg = '#BEF264';
  if (appIconName.includes('Sage')) {
    bg = '#2F6844';
    fg = '#D9F5BE';
  } else if (appIconName.includes('Rose')) {
    bg = '#8E2848';
    fg = '#F9D6DE';
  } else if (appIconName.includes('Obsidian')) {
    bg = '#141417';
    fg = '#FFFFFF';
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${bg}"/><path d="M16 38c6-12 10 12 16 0s10-12 16 0" fill="none" stroke="${fg}" stroke-width="6" stroke-linecap="round"/><circle cx="32" cy="20" r="4" fill="${fg}"/></svg>`;
  const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = uri;
}

export function triggerAppHaptic(enabled: boolean, ms: number = 10) {
  if (!enabled || typeof navigator === 'undefined') return;
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  } catch {
    // ignore browser restrictions
  }
}

export function applyThemeVariables(
  settings: MasterWaveSettings,
  isDark: boolean,
  dynamicPalette?: AccentPalette | null
) {
  const palette = getPaletteForSettings(settings, dynamicPalette);
  const root = document.documentElement;

  const isWarmAccent = palette.id === 'crimson' || palette.id === 'amber' || palette.id === 'rose';
  const secondaryHex = isWarmAccent ? '#2563EB' : '#0EA5E9';

  root.style.setProperty('--mw-primary', palette.primary);
  root.style.setProperty('--mw-primary-hover', palette.primaryHover);
  root.style.setProperty('--mw-secondary', secondaryHex);
  root.style.setProperty('--mw-tint', isDark ? palette.tintDark : palette.tint);
  root.style.setProperty('--mw-tint-strong', isDark ? palette.tintDark : palette.tintStrong);
  root.style.setProperty('--mw-tint-text', isDark ? palette.tintTextDark : palette.tintText);
  root.style.setProperty('--mw-stats-bg', isDark ? palette.statsCardDarkBg : palette.statsCardBg);
  root.style.setProperty(
    '--mw-stats-border',
    isDark ? 'rgba(255,255,255,0.08)' : palette.statsCardBorder
  );

  if (isDark) {
    root.classList.add('dark');
    if (settings.amoledMode) {
      root.classList.add('amoled');
      root.style.setProperty('--mw-page-bg', '#000000');
      root.style.setProperty('--mw-surface', '#0A0B0B');
      root.style.setProperty('--mw-surface-elevated', '#141616');
    } else {
      root.classList.remove('amoled');
      const darkCanvas = isWarmAccent ? '#100E0E' : '#0D0F0E';
      const darkSurface = isWarmAccent ? '#191616' : '#161918';
      root.style.setProperty('--mw-page-bg', darkCanvas);
      root.style.setProperty('--mw-surface', darkSurface);
      root.style.setProperty('--mw-surface-elevated', isWarmAccent ? '#231F1F' : '#1F2321');
    }
  } else {
    root.classList.remove('dark');
    root.classList.remove('amoled');
    const lightCanvas = isWarmAccent ? '#F7F5F4' : '#F4F6F5';
    root.style.setProperty('--mw-page-bg', lightCanvas);
    root.style.setProperty('--mw-surface', '#FFFFFF');
    root.style.setProperty('--mw-surface-elevated', isWarmAccent ? '#EFECEB' : '#EAEFED');
  }

  const themeMeta = document.querySelector<HTMLMetaElement>("meta[name='theme-color']");
  if (themeMeta) {
    themeMeta.content = isDark
      ? settings.amoledMode
        ? '#000000'
        : isWarmAccent
        ? '#100E0E'
        : '#0D0F0E'
      : isWarmAccent
      ? '#F7F5F4'
      : '#F4F6F5';
  }

  applyAppIconFavicon(settings.appIcon);
}
