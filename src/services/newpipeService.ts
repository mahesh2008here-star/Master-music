import { AudioQualityInfo, NewPipeAudioStream, Track } from '../types/music';

export interface NewPipeStatus {
  engine: string;
  extractorVersion: string;
  activeInstance: string;
  fallbackInstances: string[];
  activeFilter: string;
  services: string[];
}

export interface NewPipeSearchItem {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artworkUrl: string;
  source: string;
  providerType?: 'newpipe' | 'jiosaavn' | 'audius' | 'deezer';
  streamUrl?: string;
  audioStreams?: NewPipeAudioStream[];
  views?: number;
}

export interface NewPipeStreamResolution {
  resolved: boolean;
  videoId: string;
  title?: string;
  artist?: string;
  duration?: number;
  artworkUrl?: string;
  provider?: string;
  reason?: string;
  message?: string;
  diagnostics?: string[];
  audioStreams: NewPipeAudioStream[];
}

const STORAGE_KEY_NEWPIPE_CONFIG = 'masterwave_newpipe_config';

class NewPipeClientService {
  private streamCache = new Map<string, NewPipeStreamResolution>();

  public getSavedConfig(): { enabled: boolean; instanceUrl: string; filter: string } {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NEWPIPE_CONFIG);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore storage errors
    }
    return {
      enabled: true,
      instanceUrl: 'https://api.piped.private.coffee',
      filter: 'all',
    };
  }

  public saveConfig(config: { enabled: boolean; instanceUrl: string; filter: string }) {
    try {
      localStorage.setItem(STORAGE_KEY_NEWPIPE_CONFIG, JSON.stringify(config));
    } catch {
      // ignore storage errors
    }
  }

  public extractVideoId(input: string): string | null {
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(
      /(?:youtube\.com\/watch\?v=|music\.youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }

  public async getStatus(): Promise<NewPipeStatus> {
    const res = await fetch('/api/newpipe/status');
    if (!res.ok) throw new Error('Unable to fetch streaming engine status');
    return res.json();
  }

  public async updateBackendConfig(
    instanceUrl: string | null,
    filter: string
  ): Promise<{ ok: boolean; activeInstance?: string; latencyMs?: number; error?: string }> {
    const res = await fetch('/api/newpipe/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instanceUrl, filter }),
    });
    return res.json();
  }

  public async search(query: string, filter?: string): Promise<{ items: Track[]; source: string }> {
    const cfg = this.getSavedConfig();
    const activeFilter = filter || cfg.filter || 'all';
    const res = await fetch(
      `/api/newpipe/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(activeFilter)}`
    );
    if (!res.ok) {
      throw new Error(`Streaming search failed (${res.status})`);
    }
    const data = (await res.json()) as { items: NewPipeSearchItem[]; source: string };
    return {
      source: data.source,
      items: (data.items || []).map((item) => this.mapSearchItemToTrack(item)),
    };
  }

  public async getTrending(region = 'IN'): Promise<{ items: Track[]; source: string }> {
    const res = await fetch(`/api/newpipe/trending?region=${encodeURIComponent(region)}`);
    if (!res.ok) {
      return { items: [], source: 'unavailable' };
    }
    const data = (await res.json()) as { items: NewPipeSearchItem[]; source: string };
    return {
      source: data.source,
      items: (data.items || []).map((item) => this.mapSearchItemToTrack(item)),
    };
  }

  public async resolveStream(
    videoId: string,
    hintTitle?: string,
    hintArtist?: string
  ): Promise<NewPipeStreamResolution> {
    const cached = this.streamCache.get(videoId);
    if (cached && cached.resolved) {
      return cached;
    }

    const params = new URLSearchParams();
    if (hintTitle) params.set('title', hintTitle);
    if (hintArtist) params.set('artist', hintArtist);
    const qs = params.toString() ? `?${params.toString()}` : '';

    const res = await fetch(`/api/newpipe/streams/${encodeURIComponent(videoId)}${qs}`);
    if (!res.ok) {
      return {
        resolved: false,
        videoId,
        reason: 'HTTP_ERROR',
        message: `Stream endpoint returned HTTP ${res.status}`,
        audioStreams: [],
      };
    }

    const data = (await res.json()) as NewPipeStreamResolution;
    if (data.resolved && data.audioStreams.length > 0) {
      this.streamCache.set(videoId, data);
    }
    return data;
  }

  public async resolveByQuery(query: string): Promise<NewPipeStreamResolution> {
    const res = await fetch(`/api/streams/resolve?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      return {
        resolved: false,
        videoId: '',
        reason: 'HTTP_ERROR',
        message: `Query resolution returned HTTP ${res.status}`,
        audioStreams: [],
      };
    }
    return res.json();
  }

  public mapStreamToQuality(stream: NewPipeAudioStream, providerName = 'NewPipeExtractor'): AudioQualityInfo {
    return {
      codec: stream.codec,
      container: stream.container,
      sampleRate: stream.sampleRate,
      bitDepth: null,
      channelCount: 2,
      bitrateKbps: stream.bitrateKbps,
      isLossless: false,
      isHiRes: false,
      isResampledByAndroidMixer: stream.sampleRate !== 48000,
      outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
      badgeLabel: stream.badgeLabel,
      tier: stream.bitrateKbps >= 128 ? 'high_quality' : 'standard',
      sourceProvider: providerName,
    };
  }

  public mapSearchItemToTrack(item: NewPipeSearchItem): Track {
    const bestStream = item.audioStreams?.[0];
    const resolvedUrl = item.streamUrl || bestStream?.url || '';
    const provider = item.providerType || 'newpipe';

    const quality: AudioQualityInfo = bestStream
      ? this.mapStreamToQuality(bestStream, item.source || 'MasterWave Free Stream')
      : {
          codec: 'Opus / AAC',
          container: 'WebM / M4A',
          sampleRate: 48000,
          bitDepth: null,
          channelCount: 2,
          bitrateKbps: 139,
          isLossless: false,
          isHiRes: false,
          isResampledByAndroidMixer: false,
          outputHardware: 'Snapdragon 6s Gen 3 Audio HAL (Moto G45)',
          badgeLabel: 'NewPipe • Ready',
          tier: 'high_quality',
          sourceProvider: item.source || 'NewPipe Extractor',
        };

    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      album: item.album,
      duration: item.duration,
      artworkUrl: item.artworkUrl,
      streamUrl: resolvedUrl,
      provider,
      newpipeVideoId: provider === 'newpipe' ? item.videoId : undefined,
      availableStreams: item.audioStreams,
      quality,
    };
  }
}

export const newpipeService = new NewPipeClientService();
