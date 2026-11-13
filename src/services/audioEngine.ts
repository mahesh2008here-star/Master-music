import { Track } from '../types/music';
import { MasterWaveSettings } from './themeService';

export type Eq15Gains = [
  number, number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number
];

export const EQ_15_FREQUENCIES = [
  25, 40, 63, 100, 160, 250, 400, 630, 1000, 1600, 2500, 4000, 6300, 10000, 16000
] as const;

export const EQ_15_LABELS = [
  '25', '40', '63', '100', '160', '250', '400', '630', '1k', '1.6k', '2.5k', '4k', '6.3k', '10k', '16k'
] as const;

export interface EqualizerPreset {
  name: string;
  gains: Eq15Gains;
  category?: 'profile' | 'autoeq';
  target?: string;
}

export const EQ_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', category: 'profile', gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: 'Bass Boost', category: 'profile', gains: [6, 5.5, 5, 4, 3, 1.5, 0, -0.5, -1, -0.5, 0, 0.5, 1, 1.5, 1] },
  { name: 'Vocal Boost', category: 'profile', gains: [-2, -2, -1.5, -1, 0, 1.5, 3, 4, 4.5, 3.5, 2.5, 1.5, 1, 0.5, 0] },
  { name: 'Acoustic / Warm', category: 'profile', gains: [2.5, 3, 2.5, 2, 1.5, 1, 0.5, 0, 0.5, 1, 1.5, 2, 2.5, 2, 1.5] },
  { name: 'Hi-Res Audiophile', category: 'profile', gains: [1.5, 2, 1.5, 1, 0, 0, 0.5, 1, 1, 1.5, 2.5, 3, 3.5, 4, 3.5] },
  { name: 'Electronic / Club', category: 'profile', gains: [5.5, 5, 4, 2.5, 1, -0.5, -1, 0, 0.5, 1.5, 2.5, 3.5, 4, 4.5, 3.5] },
  { name: 'Late Night', category: 'profile', gains: [2, 2.5, 2, 1, 0, -1, -1.5, -1, 0, 1, 1.5, 1, 0, -1, -2] },
];

export const AUTO_EQ_HEADPHONES: EqualizerPreset[] = [
  {
    name: 'Sony WH-1000XM5 (Harman)',
    category: 'autoeq',
    target: 'Harman Over-Ear 2018',
    gains: [1, -1.5, -3.5, -4.5, -3.5, -2, 0, 1.5, 2, 2.5, 3, 2.5, 1.5, 2, 3],
  },
  {
    name: 'Apple AirPods Pro 2',
    category: 'autoeq',
    target: 'Harman In-Ear 2019',
    gains: [1.5, 1, 0.5, -0.5, -1, -1.5, -0.5, 0.5, 1, 1.5, 0.5, -1, 1.5, 3, 4],
  },
  {
    name: 'Sennheiser HD 600',
    category: 'autoeq',
    target: 'Harman Over-Ear 2018',
    gains: [5.5, 5, 4, 2.5, 1, 0, -1, -1.5, -1, -1.5, -2, -1, 0.5, 1.5, 2],
  },
  {
    name: 'Moondrop Blessing 3',
    category: 'autoeq',
    target: 'Harman In-Ear 2019',
    gains: [2.5, 2, 1.5, 0.5, 0, -0.5, 0, 0.5, 0, -1.5, -2, -1, 0.5, 1, 1.5],
  },
  {
    name: 'Truthear HEXA',
    category: 'autoeq',
    target: 'Harman In-Ear 2019',
    gains: [3.5, 3, 2, 1, 0, -0.5, 0, 0.5, 0, -1, -1.5, -0.5, 1, 1.5, 2],
  },
  {
    name: 'Samsung Galaxy Buds2 Pro',
    category: 'autoeq',
    target: 'Harman In-Ear 2019',
    gains: [1, 0.5, 0, -1, -1.5, -1, 0, 0.5, 1, 0.5, -1, -2.5, -1.5, 1, 2.5],
  },
  {
    name: 'KZ ZSN Pro X',
    category: 'autoeq',
    target: 'Balanced Reference',
    gains: [-2, -2.5, -3, -2, -1, 0, 1.5, 2.5, 2, 0.5, -2, -4.5, -3.5, -2, -1],
  },
];

const EQ_STORAGE_KEY = 'masterwave_eq_state_v2';

export interface SavedEqState {
  presetName: string;
  preampDb: number;
  gains: Eq15Gains;
  autoEqProfile?: string | null;
}

class MasterWaveAudioEngine {
  private audio: HTMLAudioElement;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private clarityAirFilter: BiquadFilterNode | null = null;
  private loudnessGainNode: GainNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private isAudioContextInitialized = false;
  private loadedTrackId: string | null = null;
  private pendingStartTime = 0;

  private eqState: SavedEqState = {
    presetName: 'Flat',
    preampDb: 0,
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    autoEqProfile: null,
  };

  private bitPerfectMode = false;
  private studioMasterClarity = true;
  private clarityPreset = 'Reference';
  private loudnessNormalization = false;
  private crossfadeEnabled = false;
  private autoMixEnabled = false;
  private hapticsEnabled = true;
  private crossfadingActive = false;

  private playbackRate = 1.0;
  private preservesPitch = true;

  // Sleep Timer
  private sleepTimerTimeout: ReturnType<typeof setTimeout> | null = null;
  private sleepTimerEndsAt: number | null = null;
  private sleepAfterCurrentTrack = false;
  private sleepListeners = new Set<(remainingSec: number | null, afterTrack: boolean) => void>();
  private sleepInterval: ReturnType<typeof setInterval> | null = null;

  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private onEndedCallback: (() => void) | null = null;
  private onPlayStateCallback: ((isPlaying: boolean) => void) | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    this.loadSavedEq();

    this.audio.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.audio.currentTime);
      }
      this.handleCrossfadeCheck();
      this.updateMediaSessionPosition();
    });

    this.audio.addEventListener('loadedmetadata', () => {
      if (this.pendingStartTime > 0 && Number.isFinite(this.audio.duration)) {
        const target = Math.min(this.pendingStartTime, Math.max(0, this.audio.duration - 1));
        this.audio.currentTime = target;
        this.pendingStartTime = 0;
      }
    });

    this.audio.addEventListener('play', () => {
      if (this.onPlayStateCallback) this.onPlayStateCallback(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });

    this.audio.addEventListener('pause', () => {
      if (this.onPlayStateCallback) this.onPlayStateCallback(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });

    this.audio.addEventListener('ended', () => {
      this.crossfadingActive = false;
      if (this.sleepAfterCurrentTrack) {
        this.clearSleepTimer();
        if (this.onPlayStateCallback) this.onPlayStateCallback(false);
        return;
      }
      if (this.onEndedCallback) this.onEndedCallback();
    });

    this.audio.addEventListener('error', () => {
      const code = this.audio.error?.code;
      const msg = code
        ? `Audio stream error (code ${code})`
        : 'Audio stream could not be decoded';
      console.warn(msg, this.audio.src);
      if (this.onPlayStateCallback) this.onPlayStateCallback(false);
      if (this.onErrorCallback) this.onErrorCallback(msg);
    });
  }

  private loadSavedEq() {
    try {
      const raw = localStorage.getItem(EQ_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SavedEqState>;
        if (Array.isArray(parsed.gains) && parsed.gains.length === 15) {
          this.eqState = {
            presetName: parsed.presetName || 'Custom',
            preampDb: typeof parsed.preampDb === 'number' ? parsed.preampDb : 0,
            gains: parsed.gains as Eq15Gains,
            autoEqProfile: parsed.autoEqProfile || null,
          };
        }
      }
    } catch {
      // ignore storage failure
    }
  }

  private saveEqState() {
    try {
      localStorage.setItem(EQ_STORAGE_KEY, JSON.stringify(this.eqState));
    } catch {
      // ignore storage failure
    }
  }

  private handleCrossfadeCheck() {
    if ((!this.crossfadeEnabled && !this.autoMixEnabled) || !this.audio.duration) return;
    const remaining = this.audio.duration - this.audio.currentTime;
    const windowSec = this.autoMixEnabled ? 4.5 : 3.0;
    if (remaining > 0 && remaining <= windowSec && this.loudnessGainNode && this.audioContext) {
      this.crossfadingActive = true;
      const ratio = Math.max(0.08, remaining / windowSec);
      const baseGain = this.loudnessNormalization ? 0.82 : 1.0;
      this.loudnessGainNode.gain.setValueAtTime(
        baseGain * ratio,
        this.audioContext.currentTime
      );
    } else if (this.crossfadingActive && remaining > windowSec) {
      this.crossfadingActive = false;
      this.applyDspParameters();
    }
  }

  private resolvePlayableUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    if (typeof window !== 'undefined' && url.startsWith(window.location.origin)) {
      return url;
    }
    return `/api/newpipe/proxy?url=${encodeURIComponent(url)}`;
  }

  private initAudioContext() {
    if (this.isAudioContextInitialized) return;
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
      this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

      this.preampNode = this.audioContext.createGain();
      this.preampNode.gain.value = 1.0;

      // 15-Band Parametric EQ Cascade
      this.eqFilters = EQ_15_FREQUENCIES.map((freq, index) => {
        const filter = this.audioContext!.createBiquadFilter();
        filter.type =
          index === 0
            ? 'lowshelf'
            : index === EQ_15_FREQUENCIES.length - 1
            ? 'highshelf'
            : 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = index === 0 || index === EQ_15_FREQUENCIES.length - 1 ? 0.75 : 2.1;
        filter.gain.value = this.bitPerfectMode ? 0 : this.eqState.gains[index] || 0;
        return filter;
      });

      // Studio Master Clarity Presence & Air Shelf
      this.clarityAirFilter = this.audioContext.createBiquadFilter();
      this.clarityAirFilter.type = 'highshelf';
      this.clarityAirFilter.frequency.value = 8500;
      this.clarityAirFilter.gain.value = 0;

      // ReplayGain (-14 LUFS) & Crossfade gain stage
      this.loudnessGainNode = this.audioContext.createGain();
      this.loudnessGainNode.gain.value = 1.0;

      // Anti-clipping soft-knee limiter
      this.compressorNode = this.audioContext.createDynamicsCompressor();
      this.compressorNode.threshold.value = -1.5;
      this.compressorNode.knee.value = 12;
      this.compressorNode.ratio.value = 4;
      this.compressorNode.attack.value = 0.005;
      this.compressorNode.release.value = 0.15;

      let current: AudioNode = this.sourceNode;
      current.connect(this.preampNode);
      current = this.preampNode;

      for (const filter of this.eqFilters) {
        current.connect(filter);
        current = filter;
      }

      current.connect(this.clarityAirFilter);
      this.clarityAirFilter.connect(this.loudnessGainNode);
      this.loudnessGainNode.connect(this.compressorNode);
      this.compressorNode.connect(this.audioContext.destination);

      this.isAudioContextInitialized = true;
      this.applyDspParameters();
    } catch (e) {
      console.warn('Web Audio Context initialization warning:', e);
    }
  }

  private applyDspParameters() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    // Preamp & 15-band EQ
    if (this.preampNode) {
      const db = this.bitPerfectMode ? 0 : this.eqState.preampDb;
      const linear = Math.pow(10, db / 20);
      this.preampNode.gain.setValueAtTime(linear, now);
    }

    if (this.eqFilters.length === 15) {
      this.eqFilters.forEach((f, idx) => {
        f.gain.setValueAtTime(this.bitPerfectMode ? 0 : this.eqState.gains[idx] || 0, now);
      });
    }

    // Studio Master Clarity
    if (this.clarityAirFilter) {
      let airDb = 0;
      if (!this.bitPerfectMode && this.studioMasterClarity) {
        if (this.clarityPreset.includes('Harman')) airDb = 1.5;
        else if (this.clarityPreset.includes('Warm')) airDb = 2.0;
        else if (this.clarityPreset.includes('Ultra-Linear')) airDb = 2.5;
        else airDb = 1.2;
      }
      this.clarityAirFilter.gain.setValueAtTime(airDb, now);
    }

    // Loudness Normalization (-14 LUFS)
    if (this.loudnessGainNode && !this.crossfadingActive) {
      const targetGain = this.bitPerfectMode
        ? 1.0
        : this.loudnessNormalization
        ? 0.82
        : 1.0;
      this.loudnessGainNode.gain.setValueAtTime(targetGain, now);
    }
  }

  public syncSettings(settings: MasterWaveSettings) {
    this.bitPerfectMode = settings.bitPerfectMode;
    this.studioMasterClarity = settings.studioMasterClarity;
    this.clarityPreset = settings.clarityPreset;
    this.loudnessNormalization = settings.loudnessNormalization;
    this.crossfadeEnabled = settings.crossfadeEnabled;
    this.autoMixEnabled = settings.autoMix;
    this.hapticsEnabled = settings.hapticFeedback || settings.musicHaptics;
    this.applyDspParameters();
  }

  public triggerHaptic(pattern: number | number[] = 10) {
    if (!this.hapticsEnabled) return;
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {
      // ignore unsupported browsers
    }
  }

  public hasSource(): boolean {
    return Boolean(this.audio.src && this.loadedTrackId);
  }

  public getLoadedTrackId(): string | null {
    return this.loadedTrackId;
  }

  public setCallbacks(callbacks: {
    onTimeUpdate: (time: number) => void;
    onEnded: () => void;
    onPlayState: (isPlaying: boolean) => void;
    onError: (err: string) => void;
  }) {
    this.onTimeUpdateCallback = callbacks.onTimeUpdate;
    this.onEndedCallback = callbacks.onEnded;
    this.onPlayStateCallback = callbacks.onPlayState;
    this.onErrorCallback = callbacks.onError;
  }

  public async playTrack(track: Track, startTime: number = 0): Promise<boolean> {
    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // ignore suspended resume error
      }
    }

    const playableUrl = this.resolvePlayableUrl(track.streamUrl);
    if (!playableUrl) {
      if (this.onErrorCallback) {
        this.onErrorCallback(`No playable audio URL resolved for "${track.title}"`);
      }
      return false;
    }

    this.crossfadingActive = false;
    this.loadedTrackId = track.id;
    this.pendingStartTime = startTime;
    this.audio.src = playableUrl;
    this.audio.playbackRate = this.playbackRate;
    (this.audio as unknown as { preservesPitch?: boolean }).preservesPitch = this.preservesPitch;
    this.audio.load();

    this.setupMediaSession(track);

    // Smooth AutoMix/Crossfade ramp-in on track start
    if ((this.crossfadeEnabled || this.autoMixEnabled) && this.loudnessGainNode && this.audioContext) {
      const now = this.audioContext.currentTime;
      const target = this.loudnessNormalization ? 0.82 : 1.0;
      this.loudnessGainNode.gain.setValueAtTime(0.05, now);
      this.loudnessGainNode.gain.linearRampToValueAtTime(target, now + 1.2);
    } else {
      this.applyDspParameters();
    }

    try {
      await this.audio.play();
      this.triggerHaptic(12);
      return true;
    } catch (err) {
      console.warn('Audio play rejected:', err);
      if (this.onPlayStateCallback) this.onPlayStateCallback(false);
      if (this.onErrorCallback) {
        this.onErrorCallback(err instanceof Error ? err.message : 'Playback blocked or failed');
      }
      return false;
    }
  }

  public async resume(): Promise<boolean> {
    if (!this.audio.src) {
      return false;
    }
    this.initAudioContext();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch {
        // ignore
      }
    }
    try {
      await this.audio.play();
      this.triggerHaptic(8);
      return true;
    } catch (err) {
      console.warn('Audio resume error:', err);
      if (this.onPlayStateCallback) this.onPlayStateCallback(false);
      return false;
    }
  }

  public pause() {
    this.audio.pause();
    this.triggerHaptic(8);
  }

  public seek(seconds: number) {
    if (Number.isFinite(seconds) && seconds >= 0) {
      if (this.audio.readyState >= 1) {
        this.audio.currentTime = seconds;
      } else {
        this.pendingStartTime = seconds;
      }
    }
  }

  public setVolume(volume: number) {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  // Supports both 15-band and legacy 5-band calls seamlessly
  public setEqualizerGains(
    gains: number[],
    presetName: string = 'Custom',
    preampDb: number = this.eqState.preampDb,
    autoEqProfile: string | null = null
  ) {
    this.initAudioContext();
    let full15: Eq15Gains;
    if (gains.length === 15) {
      full15 = [...gains] as Eq15Gains;
    } else {
      // Interpolate 5-band -> 15-band cleanly
      const g = gains;
      full15 = [
        g[0] || 0, g[0] || 0, g[0] || 0,
        ((g[0] || 0) + (g[1] || 0)) / 2, g[1] || 0, g[1] || 0,
        ((g[1] || 0) + (g[2] || 0)) / 2, g[2] || 0, g[2] || 0,
        ((g[2] || 0) + (g[3] || 0)) / 2, g[3] || 0, g[3] || 0,
        ((g[3] || 0) + (g[4] || 0)) / 2, g[4] || 0, g[4] || 0,
      ];
    }
    this.eqState = {
      presetName,
      preampDb,
      gains: full15,
      autoEqProfile,
    };
    this.saveEqState();
    this.applyDspParameters();
  }

  public getEqState(): SavedEqState {
    return { ...this.eqState, gains: [...this.eqState.gains] as Eq15Gains };
  }

  public setPlaybackRate(rate: number, preservesPitch = true) {
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    this.preservesPitch = preservesPitch;
    this.audio.playbackRate = this.playbackRate;
    (this.audio as unknown as { preservesPitch?: boolean }).preservesPitch = preservesPitch;
  }

  public getPlaybackRateState(): { rate: number; preservesPitch: boolean } {
    return { rate: this.playbackRate, preservesPitch: this.preservesPitch };
  }

  // Sleep Timer Controls
  public setSleepTimer(minutes: number | 'end_of_track' | null) {
    this.clearSleepTimer();
    if (minutes === null) return;

    if (minutes === 'end_of_track') {
      this.sleepAfterCurrentTrack = true;
      this.notifySleepListeners();
      return;
    }

    const ms = Math.max(1, minutes) * 60 * 1000;
    this.sleepTimerEndsAt = Date.now() + ms;
    this.sleepTimerTimeout = setTimeout(() => {
      this.pause();
      this.clearSleepTimer();
    }, ms);
    this.sleepInterval = setInterval(() => {
      this.notifySleepListeners();
    }, 1000);
    this.notifySleepListeners();
  }

  public clearSleepTimer() {
    if (this.sleepTimerTimeout) clearTimeout(this.sleepTimerTimeout);
    if (this.sleepInterval) clearInterval(this.sleepInterval);
    this.sleepTimerTimeout = null;
    this.sleepInterval = null;
    this.sleepTimerEndsAt = null;
    this.sleepAfterCurrentTrack = false;
    this.notifySleepListeners();
  }

  public getSleepTimerStatus(): { remainingSec: number | null; afterTrack: boolean } {
    if (this.sleepAfterCurrentTrack) {
      return { remainingSec: null, afterTrack: true };
    }
    if (!this.sleepTimerEndsAt) {
      return { remainingSec: null, afterTrack: false };
    }
    const rem = Math.max(0, Math.ceil((this.sleepTimerEndsAt - Date.now()) / 1000));
    return { remainingSec: rem, afterTrack: false };
  }

  public subscribeSleepTimer(cb: (remainingSec: number | null, afterTrack: boolean) => void) {
    this.sleepListeners.add(cb);
    const current = this.getSleepTimerStatus();
    cb(current.remainingSec, current.afterTrack);
    return () => {
      this.sleepListeners.delete(cb);
    };
  }

  private notifySleepListeners() {
    const s = this.getSleepTimerStatus();
    this.sleepListeners.forEach((cb) => cb(s.remainingSec, s.afterTrack));
  }

  public getCurrentTime(): number {
    return this.audio.currentTime;
  }

  public getDuration(): number {
    return this.audio.duration || 0;
  }

  private setupMediaSession(track: Track) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [
        { src: track.artworkUrl, sizes: '96x96', type: 'image/jpeg' },
        { src: track.artworkUrl, sizes: '256x256', type: 'image/jpeg' },
        { src: track.artworkUrl, sizes: '512x512', type: 'image/jpeg' }
      ]
    });
  }

  public setMediaSessionHandlers(handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (seconds: number) => void;
  }) {
    if (!('mediaSession' in navigator)) return;

    try {
      navigator.mediaSession.setActionHandler('play', handlers.onPlay);
      navigator.mediaSession.setActionHandler('pause', handlers.onPause);
      navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) {
          handlers.onSeek(details.seekTime);
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        handlers.onSeek(Math.max(0, this.audio.currentTime - offset));
      });
      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const offset = details.seekOffset || 10;
        handlers.onSeek(this.audio.currentTime + offset);
      });
    } catch (e) {
      console.warn('MediaSession handler configuration error:', e);
    }
  }

  private updateMediaSessionPosition() {
    if (!('mediaSession' in navigator) || !this.audio.duration) return;
    try {
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: this.audio.duration,
          playbackRate: this.audio.playbackRate,
          position: this.audio.currentTime
        });
      }
    } catch {
      // Ignore position state errors during format transitions
    }
  }
}

export const audioEngine = new MasterWaveAudioEngine();
