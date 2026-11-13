import express from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Readable } from 'node:stream';
import { Innertube } from 'youtubei.js';

const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

interface PipedInstanceState {
  customInstanceUrl: string | null;
  defaultInstances: string[];
  activeFilter: string;
}

const newpipeConfig: PipedInstanceState = {
  customInstanceUrl: null,
  defaultInstances: [
    'https://api.piped.private.coffee',
    'https://pipedapi.kavin.rocks',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.ducks.party',
  ],
  activeFilter: 'music_songs',
};

let innertubePromise: Promise<Innertube> | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!innertubePromise) {
    innertubePromise = Innertube.create({
      lang: 'en',
      location: 'IN',
      retrieve_player: true,
      generate_session_locally: true,
    }).catch((err) => {
      innertubePromise = null;
      throw err;
    });
  }
  return innertubePromise;
}

function getOrderedInstances(): string[] {
  const list = [...newpipeConfig.defaultInstances];
  if (newpipeConfig.customInstanceUrl) {
    const cleaned = newpipeConfig.customInstanceUrl.replace(/\/+$/, '');
    return [cleaned, ...list.filter((u) => u !== cleaned)];
  }
  return list;
}

function decodeHtmlEntities(input: string | undefined): string {
  if (!input) return '';
  return input
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(Number(dec)));
}

function extractVideoId(input: string): string {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://youtube.com${trimmed}`);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace(/^\//, '').slice(0, 11);
      if (id) return id;
    }
    const v = parsed.searchParams.get('v');
    if (v) return v.slice(0, 11);
  } catch {
    // Not a full URL; check /watch?v=
  }
  const match = trimmed.match(/(?:v=|\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : trimmed;
}

function upgradeThumbnailUrl(rawUrl: string | undefined, videoId?: string): string {
  if (!rawUrl && videoId) {
    return `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`;
  }
  if (!rawUrl) return '/assets/covers/veera_veera.png';
  return rawUrl
    .replace(/=w\d+-h\d+[^&\s]*/, '=w1200-h1200-l90-rj')
    .replace('hqdefault.jpg', 'sddefault.jpg');
}

function proxiedAudioUrl(rawUrl: string): string {
  return `/api/newpipe/proxy?url=${encodeURIComponent(rawUrl)}`;
}

export interface NormalizedAudioStream {
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

export interface NormalizedStreamTrack {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artworkUrl: string;
  source: string;
  providerType: 'newpipe' | 'jiosaavn' | 'audius' | 'deezer';
  streamUrl?: string;
  audioStreams?: NormalizedAudioStream[];
  views?: number;
}

interface SaavnSongRaw {
  id?: string;
  name?: string;
  duration?: number | string | null;
  album?: { name?: string };
  artists?: {
    primary?: Array<{ name?: string }>;
    featured?: Array<{ name?: string }>;
  };
  image?: Array<{ quality?: string; url?: string }>;
  downloadUrl?: Array<{ quality?: string; url?: string }>;
  playCount?: number | null;
}

function mapSaavnSong(song: SaavnSongRaw, sourceLabel = 'JioSaavn (320kbps AAC)'): NormalizedStreamTrack | null {
  const id = String(song.id || '').trim();
  const dlList = Array.isArray(song.downloadUrl) ? song.downloadUrl.filter((d) => Boolean(d.url)) : [];
  if (!id || dlList.length === 0) return null;

  const sortedStreams: NormalizedAudioStream[] = [...dlList]
    .map((d) => {
      const kbpsMatch = String(d.quality || '160').match(/(\d+)/);
      const bitrateKbps = kbpsMatch ? Number(kbpsMatch[1]) : 160;
      const rawUrl = String(d.url);
      return {
        url: proxiedAudioUrl(rawUrl),
        rawUrl,
        codec: 'AAC-LC',
        container: 'MP4 / M4A',
        mimeType: 'audio/mp4',
        sampleRate: 44100,
        bitrateKbps,
        qualityLabel: `${bitrateKbps} kbps`,
        badgeLabel: `AAC • ${bitrateKbps} kbps`,
      };
    })
    .sort((a, b) => b.bitrateKbps - a.bitrateKbps);

  const primaryArtists = (song.artists?.primary || []).map((a) => decodeHtmlEntities(a.name)).filter(Boolean);
  const artwork =
    song.image?.[song.image.length - 1]?.url ||
    song.image?.[0]?.url ||
    '/assets/covers/veera_veera.png';
  const durationNum = Number(song.duration);

  return {
    id: `jiosaavn-${id}`,
    videoId: `jiosaavn-${id}`,
    title: decodeHtmlEntities(song.name) || 'Unknown Track',
    artist: primaryArtists.join(', ') || 'Featured Artist',
    album: decodeHtmlEntities(song.album?.name) || 'JioSaavn Stream',
    duration: Number.isFinite(durationNum) && durationNum > 0 ? durationNum : 200,
    artworkUrl: artwork.replace('150x150', '500x500').replace('50x50', '500x50'),
    source: sourceLabel,
    providerType: 'jiosaavn',
    streamUrl: sortedStreams[0].url,
    audioStreams: sortedStreams,
    views: typeof song.playCount === 'number' ? song.playCount : undefined,
  };
}

async function searchJioSaavnSongs(query: string, limit = 14): Promise<NormalizedStreamTrack[]> {
  try {
    const res = await fetch(
      `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`,
      {
        headers: { Accept: 'application/json', 'User-Agent': 'MasterWave-Android/5.2.0' },
        signal: AbortSignal.timeout(5500),
      }
    );
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean; data?: { results?: SaavnSongRaw[] } };
      const results = json.data?.results || [];
      const mapped = results
        .map((s) => mapSaavnSong(s, 'JioSaavn Free 320k'))
        .filter((item): item is NormalizedStreamTrack => item !== null)
        .sort((a, b) => {
          const isKnockoff = (t: string) =>
            /\b(karaoke|tribute|cover version|ringtone|8d audio)\b/i.test(t);
          const ak = isKnockoff(a.title) ? 1 : 0;
          const bk = isKnockoff(b.title) ? 1 : 0;
          return ak - bk;
        });
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // Fallback to direct JioSaavn API search + ID lookup
  }

  try {
    const directRes = await fetch(
      `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&cc=in&includeMetaTags=1&q=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(4500),
      }
    );
    if (!directRes.ok) return [];
    const directJson = (await directRes.json()) as { results?: Array<{ id?: string }> };
    const ids = (directJson.results || [])
      .map((r) => r.id)
      .filter((id): id is string => Boolean(id))
      .slice(0, Math.min(limit, 8));
    if (ids.length === 0) return [];

    const batchRes = await fetch(`https://saavn.sumit.co/api/songs/${ids.join(',')}`, {
      signal: AbortSignal.timeout(4500),
    });
    if (!batchRes.ok) return [];
    const batchJson = (await batchRes.json()) as { data?: SaavnSongRaw[] };
    return (batchJson.data || [])
      .map((s) => mapSaavnSong(s, 'JioSaavn Free 320k'))
      .filter((item): item is NormalizedStreamTrack => item !== null);
  } catch {
    return [];
  }
}

interface AudiusTrackRaw {
  id?: string;
  title?: string;
  duration?: number;
  play_count?: number;
  genre?: string;
  artwork?: { '480x480'?: string; '1000x1000'?: string; '150x150'?: string };
  user?: { name?: string; handle?: string };
}

function mapAudiusTrack(raw: AudiusTrackRaw): NormalizedStreamTrack | null {
  const id = String(raw.id || '').trim();
  if (!id) return null;
  const rawStreamUrl = `https://api.audius.co/v1/tracks/${encodeURIComponent(id)}/stream?app_name=MasterWave`;
  const artwork =
    raw.artwork?.['1000x1000'] ||
    raw.artwork?.['480x480'] ||
    raw.artwork?.['150x150'] ||
    '/assets/covers/discover_mix.png';

  const streamObj: NormalizedAudioStream = {
    url: proxiedAudioUrl(rawStreamUrl),
    rawUrl: rawStreamUrl,
    codec: 'MP3',
    container: 'MPEG',
    mimeType: 'audio/mpeg',
    sampleRate: 44100,
    bitrateKbps: 320,
    qualityLabel: '320 kbps MP3',
    badgeLabel: 'MP3 • 320 kbps',
  };

  return {
    id: `audius-${id}`,
    videoId: `audius-${id}`,
    title: raw.title || 'Audius Track',
    artist: raw.user?.name || raw.user?.handle || 'Audius Creator',
    album: raw.genre ? `Audius • ${raw.genre}` : 'Audius Open Music',
    duration: typeof raw.duration === 'number' && raw.duration > 0 ? raw.duration : 180,
    artworkUrl: artwork,
    source: 'Audius Open API',
    providerType: 'audius',
    streamUrl: streamObj.url,
    audioStreams: [streamObj],
    views: typeof raw.play_count === 'number' ? raw.play_count : undefined,
  };
}

async function searchAudiusTracks(query: string, limit = 8): Promise<NormalizedStreamTrack[]> {
  try {
    const res = await fetch(
      `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=MasterWave&limit=${limit}`,
      { signal: AbortSignal.timeout(4500) }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: AudiusTrackRaw[] };
    return (json.data || [])
      .map(mapAudiusTrack)
      .filter((item): item is NormalizedStreamTrack => item !== null);
  } catch {
    return [];
  }
}

async function getAudiusTrending(limit = 8): Promise<NormalizedStreamTrack[]> {
  try {
    const res = await fetch(
      `https://api.audius.co/v1/tracks/trending?app_name=MasterWave&limit=${limit}`,
      { signal: AbortSignal.timeout(4500) }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: AudiusTrackRaw[] };
    return (json.data || [])
      .map(mapAudiusTrack)
      .filter((item): item is NormalizedStreamTrack => item !== null);
  } catch {
    return [];
  }
}

async function searchDeezerFallback(query: string): Promise<NormalizedStreamTrack[]> {
  try {
    const res = await fetch(`https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<{
        id?: number;
        title?: string;
        duration?: number;
        preview?: string;
        artist?: { name?: string };
        album?: { title?: string; cover_big?: string };
      }>;
    };
    return (json.data || [])
      .filter((d) => Boolean(d.preview))
      .map((d) => {
        const rawUrl = String(d.preview);
        const streamObj: NormalizedAudioStream = {
          url: proxiedAudioUrl(rawUrl),
          rawUrl,
          codec: 'MP3',
          container: 'MPEG (Preview)',
          mimeType: 'audio/mpeg',
          sampleRate: 44100,
          bitrateKbps: 128,
          qualityLabel: '128 kbps Preview',
          badgeLabel: 'MP3 • 128 kbps Preview',
        };
        return {
          id: `deezer-${d.id}`,
          videoId: `deezer-${d.id}`,
          title: d.title || 'Track',
          artist: d.artist?.name || 'Artist',
          album: d.album?.title || 'Deezer Preview',
          duration: 30,
          artworkUrl: d.album?.cover_big || '/assets/covers/veera_veera.png',
          source: 'Deezer Preview API',
          providerType: 'deezer' as const,
          streamUrl: streamObj.url,
          audioStreams: [streamObj],
        };
      });
  } catch {
    return [];
  }
}

async function fetchYoutubeOembed(videoId: string): Promise<{ title: string; artist: string; artworkUrl?: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string };
    if (!data.title) return null;
    const cleanArtist = (data.author_name || '').replace(/\s*-\s*Topic$/i, '').trim();
    const cleanTitle = data.title
      .replace(/\(Official[^)]*\)|\[Official[^\]]*\]|\(Lyric[^)]*\)|\(Audio\)|\[4K\]|\(Full Video\)/gi, '')
      .trim();
    return {
      title: cleanTitle || data.title,
      artist: cleanArtist,
      artworkUrl: data.thumbnail_url,
    };
  } catch {
    return null;
  }
}

async function fetchFromPipedPool(
  endpointPath: string,
  timeoutMs = 5000
): Promise<{ instance: string; data: Record<string, unknown> } | null> {
  const instances = getOrderedInstances();
  for (const baseUrl of instances) {
    try {
      const resp = await fetch(`${baseUrl}${endpointPath}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'MasterWave-Android/5.2.0 (NewPipeBridge)',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) {
        if (resp.status === 500) {
          const text = await resp.text();
          try {
            const parsed = JSON.parse(text) as Record<string, unknown>;
            if (parsed.error) {
              return { instance: baseUrl, data: parsed };
            }
          } catch {
            // Try next instance
          }
        }
        continue;
      }
      const data = (await resp.json()) as Record<string, unknown>;
      return { instance: baseUrl, data };
    } catch {
      // Failover to next instance in pool
    }
  }
  return null;
}

async function searchNewPipeItems(query: string, filter: string): Promise<{ items: NormalizedStreamTrack[]; source: string }> {
  const items: NormalizedStreamTrack[] = [];
  const seenIds = new Set<string>();
  let resolvedVia = '';

  const pipedResult = await fetchFromPipedPool(
    `/search?q=${encodeURIComponent(query)}&filter=${encodeURIComponent(filter)}`,
    5000
  );

  if (pipedResult && Array.isArray(pipedResult.data.items)) {
    resolvedVia = `NewPipe (${new URL(pipedResult.instance).hostname})`;
    for (const raw of pipedResult.data.items as Array<Record<string, unknown>>) {
      const rawUrl = String(raw.url || '');
      const videoId = extractVideoId(rawUrl);
      if (!videoId || raw.type === 'channel' || raw.type === 'playlist' || seenIds.has(videoId)) continue;
      seenIds.add(videoId);
      items.push({
        id: `newpipe-${videoId}`,
        videoId,
        title: String(raw.title || 'Unknown Track'),
        artist: String(raw.uploaderName || 'YouTube Music Artist'),
        album: filter === 'music_songs' ? 'NewPipe • YouTube Music' : 'NewPipe Stream',
        duration: typeof raw.duration === 'number' && raw.duration > 0 ? raw.duration : 180,
        artworkUrl: upgradeThumbnailUrl(raw.thumbnail as string | undefined, videoId),
        source: resolvedVia,
        providerType: 'newpipe',
        views: typeof raw.views === 'number' ? raw.views : undefined,
      });
    }
  }

  if (items.length === 0) {
    try {
      const yt = await getInnertube();
      const searchRes = await yt.music.search(query, { type: 'song' });
      const songContents = searchRes as unknown as {
        songs?: { contents?: Array<Record<string, unknown>> };
        contents?: Array<{ contents?: Array<Record<string, unknown>> }>;
      };

      const rawSongs =
        songContents.songs?.contents ??
        songContents.contents?.flatMap((shelf) => shelf.contents || []) ??
        [];

      for (const song of rawSongs) {
        const videoId = String(song.id || '');
        if (!videoId || seenIds.has(videoId)) continue;
        seenIds.add(videoId);
        const artistsArr = Array.isArray(song.artists)
          ? (song.artists as Array<{ name?: string }>).map((a) => a.name).filter(Boolean).join(', ')
          : '';
        const durationObj = song.duration as { seconds?: number } | undefined;
        const thumbs = song.thumbnails as Array<{ url?: string }> | undefined;
        const albumObj = song.album as { name?: string } | undefined;

        items.push({
          id: `newpipe-${videoId}`,
          videoId,
          title: String(song.title || 'Unknown Track'),
          artist: artistsArr || 'YouTube Music Artist',
          album: albumObj?.name || 'YouTube Music',
          duration: durationObj?.seconds && durationObj.seconds > 0 ? durationObj.seconds : 180,
          artworkUrl: upgradeThumbnailUrl(thumbs?.[thumbs.length - 1]?.url, videoId),
          source: 'InnerTube Music',
          providerType: 'newpipe',
        });
      }
      if (items.length > 0 && !resolvedVia) {
        resolvedVia = 'InnerTube Music';
      }
    } catch (err) {
      console.warn('InnerTube search fallback warning:', err instanceof Error ? err.message : err);
    }
  }

  return { items: items.slice(0, 10), source: resolvedVia };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // 1. Health & Multi-Provider Streaming Configuration Status
  app.get('/api/newpipe/status', async (_req, res) => {
    const instances = getOrderedInstances();
    res.json({
      engine: 'MasterWave Multi-Provider Engine (JioSaavn 320k + Audius + NewPipe/Piped)',
      extractorVersion: 'v0.24.8 (NewPipe) • JioSaavn AAC 320k • Audius v1',
      activeInstance: instances[0],
      fallbackInstances: instances.slice(1),
      activeFilter: newpipeConfig.activeFilter,
      services: [
        'JioSaavn Free Streaming (320 kbps AAC)',
        'Audius Open Streaming (320 kbps MP3)',
        'NewPipeExtractor / Piped (YouTube)',
        'YouTube InnerTube + Cross-Resolver',
      ],
    });
  });

  // 2. Configure & Test Custom NewPipe/Piped Instance
  app.post('/api/newpipe/config', async (req, res) => {
    const { instanceUrl, filter } = req.body as { instanceUrl?: string | null; filter?: string };

    if (filter && ['all', 'jiosaavn', 'audius', 'music_songs', 'music_videos', 'videos'].includes(filter)) {
      newpipeConfig.activeFilter = filter;
    }

    if (instanceUrl === null || instanceUrl === '') {
      newpipeConfig.customInstanceUrl = null;
      res.json({ ok: true, activeInstance: getOrderedInstances()[0], filter: newpipeConfig.activeFilter });
      return;
    }

    if (typeof instanceUrl === 'string') {
      const cleaned = instanceUrl.trim().replace(/\/+$/, '');
      try {
        const parsed = new URL(cleaned);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
          res.status(400).json({ ok: false, error: 'Instance URL must use http or https.' });
          return;
        }
        const started = Date.now();
        const probe = await fetch(`${cleaned}/trending?region=US`, {
          signal: AbortSignal.timeout(5000),
        });
        const latencyMs = Date.now() - started;
        if (!probe.ok) {
          res.status(502).json({
            ok: false,
            error: `Instance returned HTTP ${probe.status}. Kept previous configuration.`,
          });
          return;
        }
        newpipeConfig.customInstanceUrl = cleaned;
        res.json({
          ok: true,
          activeInstance: cleaned,
          latencyMs,
          filter: newpipeConfig.activeFilter,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to reach instance';
        res.status(502).json({ ok: false, error: msg });
      }
      return;
    }

    res.json({ ok: true, activeInstance: getOrderedInstances()[0], filter: newpipeConfig.activeFilter });
  });

  // 3. Multi-Provider Unified Free Music Search (JioSaavn 320k + Audius + NewPipe/InnerTube + Deezer)
  app.get('/api/newpipe/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const filter = typeof req.query.filter === 'string' ? req.query.filter : 'all';

    if (!query) {
      res.status(400).json({ error: 'Query parameter q is required', items: [] });
      return;
    }

    const rawItems: NormalizedStreamTrack[] = [];
    const activeSources: string[] = [];

    if (filter === 'jiosaavn') {
      const saavn = await searchJioSaavnSongs(query, 18);
      if (saavn.length > 0) activeSources.push('JioSaavn 320k');
      rawItems.push(...saavn);
    } else if (filter === 'audius') {
      const audius = await searchAudiusTracks(query, 16);
      if (audius.length > 0) activeSources.push('Audius MP3');
      rawItems.push(...audius);
    } else if (filter === 'videos') {
      const np = await searchNewPipeItems(query, 'videos');
      if (np.items.length > 0) activeSources.push(np.source || 'NewPipe');
      rawItems.push(...np.items);
    } else {
      // Unified multi-platform search: JioSaavn 320k + Audius + NewPipe/InnerTube + Deezer
      const [saavnRes, audiusRes, newpipeRes, deezerRes] = await Promise.allSettled([
        searchJioSaavnSongs(query, 14),
        searchAudiusTracks(query, 8),
        searchNewPipeItems(query, 'music_songs'),
        searchDeezerFallback(query),
      ]);

      if (saavnRes.status === 'fulfilled' && saavnRes.value.length > 0) {
        activeSources.push('JioSaavn 320k');
        rawItems.push(...saavnRes.value);
      }
      if (audiusRes.status === 'fulfilled' && audiusRes.value.length > 0) {
        activeSources.push('Audius');
        rawItems.push(...audiusRes.value);
      }
      if (newpipeRes.status === 'fulfilled' && newpipeRes.value.items.length > 0) {
        activeSources.push(newpipeRes.value.source || 'NewPipe');
        rawItems.push(...newpipeRes.value.items);
      }
      if (deezerRes.status === 'fulfilled' && deezerRes.value.length > 0) {
        activeSources.push('Deezer');
        rawItems.push(...deezerRes.value);
      }
    }

    // Strict deduplication by ID and normalized title+artist so React keys are always unique
    const seenIds = new Set<string>();
    const seenMeta = new Set<string>();
    const items: NormalizedStreamTrack[] = [];
    for (const item of rawItems) {
      const normTitle = (item.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normArtist = (item.artist || '').toLowerCase().split(',')[0].replace(/[^a-z0-9]/g, '');
      const metaKey = `${normTitle}::${normArtist}`;
      if (seenIds.has(item.id) || (normTitle && seenMeta.has(metaKey))) continue;
      seenIds.add(item.id);
      if (normTitle) seenMeta.add(metaKey);
      items.push(item);
    }

    res.json({
      query,
      filter,
      source: activeSources.length > 0 ? activeSources.join(' + ') : 'none',
      count: items.length,
      items: items.slice(0, 36),
    });
  });

  // 4. Trending Live Music Discovery (JioSaavn Trending + Audius Trending + NewPipe)
  app.get('/api/newpipe/trending', async (req, res) => {
    const region = typeof req.query.region === 'string' ? req.query.region : 'IN';
    const trendingQuery = region === 'IN' ? 'Trending Hindi Hits 2026' : 'Top Pop Hits 2026';

    const [saavnRes, audiusRes] = await Promise.allSettled([
      searchJioSaavnSongs(trendingQuery, 10),
      getAudiusTrending(6),
    ]);

    const items: NormalizedStreamTrack[] = [];
    const sources: string[] = [];

    if (saavnRes.status === 'fulfilled' && saavnRes.value.length > 0) {
      sources.push('JioSaavn 320k');
      items.push(...saavnRes.value);
    }
    if (audiusRes.status === 'fulfilled' && audiusRes.value.length > 0) {
      sources.push('Audius Open API');
      items.push(...audiusRes.value);
    }

    if (items.length === 0) {
      const np = await searchNewPipeItems(trendingQuery, 'music_songs');
      if (np.items.length > 0) {
        sources.push(np.source || 'NewPipe');
        items.push(...np.items);
      }
    }

    res.json({
      region,
      source: sources.length > 0 ? sources.join(' + ') : 'unavailable',
      items: items.slice(0, 16),
    });
  });

  // 4b. Direct Query Stream Resolver (used by catalog tracks or metadata cross-lookup)
  app.get('/api/streams/resolve', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      res.status(400).json({ resolved: false, audioStreams: [], message: 'Missing query q' });
      return;
    }

    const saavn = await searchJioSaavnSongs(query, 3);
    if (saavn.length > 0 && saavn[0].audioStreams && saavn[0].audioStreams.length > 0) {
      res.json({
        resolved: true,
        title: saavn[0].title,
        artist: saavn[0].artist,
        duration: saavn[0].duration,
        artworkUrl: saavn[0].artworkUrl,
        provider: saavn[0].source,
        audioStreams: saavn[0].audioStreams,
      });
      return;
    }

    const audius = await searchAudiusTracks(query, 3);
    if (audius.length > 0 && audius[0].audioStreams && audius[0].audioStreams.length > 0) {
      res.json({
        resolved: true,
        title: audius[0].title,
        artist: audius[0].artist,
        duration: audius[0].duration,
        artworkUrl: audius[0].artworkUrl,
        provider: audius[0].source,
        audioStreams: audius[0].audioStreams,
      });
      return;
    }

    res.json({
      resolved: false,
      audioStreams: [],
      message: `No playable audio streams matched "${query}"`,
    });
  });

  // 5. Extract Audio Streams via NewPipe (/streams/:videoId) with Automatic Cross-Provider Resolver
  app.get('/api/newpipe/streams/:videoId', async (req, res) => {
    const rawParam = req.params.videoId;
    const videoId = extractVideoId(rawParam);
    const hintTitle = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const hintArtist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';
    const instances = getOrderedInstances();
    const errors: string[] = [];

    // Attempt A: Public or Custom Piped (NewPipeExtractor HTTP)
    for (const baseUrl of instances) {
      try {
        const resp = await fetch(`${baseUrl}/streams/${encodeURIComponent(videoId)}`, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'MasterWave-Android/5.2.0 (NewPipeBridge)',
          },
          signal: AbortSignal.timeout(5500),
        });
        const data = (await resp.json()) as {
          title?: string;
          uploader?: string;
          duration?: number;
          thumbnailUrl?: string;
          error?: string;
          message?: string;
          audioStreams?: Array<{
            url?: string;
            format?: string;
            quality?: string;
            mimeType?: string;
            codec?: string;
            bitrate?: number;
            videoOnly?: boolean;
          }>;
        };

        if (data.error || !data.audioStreams || data.audioStreams.length === 0) {
          const msg = data.error || data.message || `HTTP ${resp.status} returned 0 audioStreams`;
          errors.push(`${new URL(baseUrl).hostname}: ${msg.slice(0, 120)}`);
          continue;
        }

        const audioStreams = data.audioStreams
          .filter((s) => !s.videoOnly && Boolean(s.url))
          .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))
          .map((s) => {
            const codecRaw = (s.codec || s.format || '').toLowerCase();
            const isOpus = codecRaw.includes('opus');
            const bitrateKbps = s.bitrate ? Math.round(s.bitrate / 1000) : 128;
            return {
              url: proxiedAudioUrl(s.url!),
              rawUrl: s.url!,
              codec: isOpus ? 'Opus' : 'AAC-LC',
              container: isOpus ? 'WebM' : 'MP4 / M4A',
              mimeType: s.mimeType || (isOpus ? 'audio/webm' : 'audio/mp4'),
              sampleRate: isOpus ? 48000 : 44100,
              bitrateKbps,
              qualityLabel: s.quality || `${bitrateKbps} kbps`,
              badgeLabel: `${isOpus ? 'Opus' : 'AAC'} • ${bitrateKbps} kbps`,
            };
          });

        if (audioStreams.length > 0) {
          res.json({
            resolved: true,
            videoId,
            title: data.title,
            artist: data.uploader,
            duration: data.duration,
            artworkUrl: upgradeThumbnailUrl(data.thumbnailUrl, videoId),
            provider: `NewPipe (${new URL(baseUrl).hostname})`,
            audioStreams,
          });
          return;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Request failed';
        errors.push(`${baseUrl}: ${msg}`);
      }
    }

    // Attempt B: youtubei.js InnerTube direct extraction
    try {
      const yt = await getInnertube();
      for (const clientName of ['ANDROID', 'IOS', 'WEB'] as const) {
        try {
          const info = await yt.getBasicInfo(videoId, clientName as any);
          const fmt = info.chooseFormat({ type: 'audio', quality: 'best' });
          if (fmt && fmt.url) {
            const isOpus = (fmt.mime_type || '').toLowerCase().includes('opus');
            const bitrateKbps = fmt.bitrate ? Math.round(fmt.bitrate / 1000) : 128;
            res.json({
              resolved: true,
              videoId,
              title: info.basic_info.title,
              artist: info.basic_info.author,
              duration: info.basic_info.duration,
              artworkUrl: upgradeThumbnailUrl(info.basic_info.thumbnail?.[0]?.url, videoId),
              provider: `NewPipe / InnerTube (${clientName})`,
              audioStreams: [
                {
                  url: proxiedAudioUrl(fmt.url),
                  rawUrl: fmt.url,
                  codec: isOpus ? 'Opus' : 'AAC-LC',
                  container: isOpus ? 'WebM' : 'MP4 / M4A',
                  mimeType: fmt.mime_type || (isOpus ? 'audio/webm' : 'audio/mp4'),
                  sampleRate: fmt.audio_sample_rate || (isOpus ? 48000 : 44100),
                  bitrateKbps,
                  qualityLabel: `${bitrateKbps} kbps`,
                  badgeLabel: `${isOpus ? 'Opus' : 'AAC'} • ${bitrateKbps} kbps`,
                },
              ],
            });
            return;
          }
        } catch (innerErr) {
          errors.push(`InnerTube(${clientName}): ${innerErr instanceof Error ? innerErr.message : 'Unavailable'}`);
        }
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'InnerTube unavailable');
    }

    // Attempt C: Automatic YouTube oEmbed -> JioSaavn 320k / Audius / Deezer Cross-Resolver
    // Works reliably even when YouTube blocks cloud/datacenter IPs with SignInConfirmNotBot!
    const oembed = await fetchYoutubeOembed(videoId);
    const lookupTitle = oembed?.title || hintTitle;
    const lookupArtist = oembed?.artist || hintArtist;
    const searchQuery = [lookupTitle, lookupArtist].filter(Boolean).join(' ').trim();

    if (searchQuery) {
      const saavnMatches = await searchJioSaavnSongs(searchQuery, 3);
      if (saavnMatches.length > 0 && saavnMatches[0].audioStreams && saavnMatches[0].audioStreams.length > 0) {
        const best = saavnMatches[0];
        res.json({
          resolved: true,
          videoId,
          title: oembed?.title || best.title,
          artist: oembed?.artist || best.artist,
          duration: best.duration,
          artworkUrl: best.artworkUrl || oembed?.artworkUrl,
          provider: 'NewPipe → JioSaavn 320k Bridge',
          audioStreams: best.audioStreams,
        });
        return;
      }

      const audiusMatches = await searchAudiusTracks(searchQuery, 3);
      if (audiusMatches.length > 0 && audiusMatches[0].audioStreams && audiusMatches[0].audioStreams.length > 0) {
        const best = audiusMatches[0];
        res.json({
          resolved: true,
          videoId,
          title: oembed?.title || best.title,
          artist: oembed?.artist || best.artist,
          duration: best.duration,
          artworkUrl: best.artworkUrl || oembed?.artworkUrl,
          provider: 'NewPipe → Audius Bridge',
          audioStreams: best.audioStreams,
        });
        return;
      }

      const deezerMatches = await searchDeezerFallback(searchQuery);
      if (deezerMatches.length > 0 && deezerMatches[0].audioStreams && deezerMatches[0].audioStreams.length > 0) {
        const best = deezerMatches[0];
        res.json({
          resolved: true,
          videoId,
          title: oembed?.title || best.title,
          artist: oembed?.artist || best.artist,
          duration: best.duration,
          artworkUrl: best.artworkUrl || oembed?.artworkUrl,
          provider: 'NewPipe → Deezer Preview Bridge',
          audioStreams: best.audioStreams,
        });
        return;
      }
    }

    const isBotCheck = errors.some((e) => e.includes('SignInConfirmNotBot') || e.includes('LOGIN_REQUIRED'));
    res.json({
      resolved: false,
      videoId,
      reason: isBotCheck ? 'SIGN_IN_CONFIRM_NOT_BOT' : 'UPSTREAM_EXTRACTION_FAILED',
      message: isBotCheck
        ? 'YouTube bot-checked this cloud IP and no matching track was found on JioSaavn/Audius/Deezer.'
        : 'All streaming extractors failed to resolve an audio stream for this track.',
      diagnostics: errors.slice(0, 4),
      audioStreams: [],
    });
  });

  // 5b. YouTube Music Live Search Autocomplete Suggestions
  app.get('/api/ytmusic/suggestions', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      res.json({ suggestions: [] });
      return;
    }
    try {
      const yt = await getInnertube();
      const raw = (await yt.music.getSearchSuggestions(query)) as unknown as Array<{
        contents?: Array<{ suggestion?: { text?: string }; title?: { toString(): string } }>;
      }>;
      const list: string[] = [];
      for (const section of raw || []) {
        for (const item of section.contents || []) {
          const text = item.suggestion?.text || item.title?.toString?.();
          if (text && !list.includes(text)) {
            list.push(text);
          }
        }
      }
      res.json({ suggestions: list.slice(0, 8) });
    } catch {
      res.json({ suggestions: [] });
    }
  });

  // 5c. YouTube Music "Up Next / Start Radio" Continuous Queue Law
  app.get('/api/ytmusic/upnext', async (req, res) => {
    const rawVideoId = typeof req.query.videoId === 'string' ? req.query.videoId.trim() : '';
    const title = typeof req.query.title === 'string' ? req.query.title.trim() : '';
    const artist = typeof req.query.artist === 'string' ? req.query.artist.trim() : '';

    let seedVideoId = rawVideoId && /^[a-zA-Z0-9_-]{11}$/.test(rawVideoId) ? rawVideoId : '';
    const tracks: NormalizedStreamTrack[] = [];
    const seenKeys = new Set<string>();
    const seedKey = `${title.toLowerCase()}::${artist.toLowerCase()}`;
    if (title) seenKeys.add(seedKey);

    try {
      const yt = await getInnertube();
      if (!seedVideoId && (title || artist)) {
        const searchRes = (await yt.music.search(`${title} ${artist}`.trim(), { type: 'song' })) as unknown as {
          songs?: { contents?: Array<{ id?: string }> };
        };
        seedVideoId = String(searchRes.songs?.contents?.[0]?.id || '');
      }

      if (seedVideoId) {
        const upNext = (await yt.music.getUpNext(seedVideoId)) as unknown as {
          contents?: Array<{
            video_id?: string;
            title?: { toString(): string };
            artists?: Array<{ name?: string }>;
            album?: { name?: string };
            duration?: { seconds?: number };
            thumbnail?: Array<{ url?: string }>;
          }>;
        };

        for (const item of (upNext.contents || []).slice(1, 18)) {
          const vid = String(item.video_id || '');
          const tTitle = item.title?.toString?.() || '';
          const tArtist = (item.artists || []).map((a) => a.name).filter(Boolean).join(', ') || artist || 'Artist';
          const key = `${tTitle.toLowerCase()}::${tArtist.toLowerCase()}`;
          if (!vid || !tTitle || seenKeys.has(key)) continue;
          seenKeys.add(key);

          tracks.push({
            id: `newpipe-${vid}`,
            videoId: vid,
            title: tTitle,
            artist: tArtist,
            album: item.album?.name || 'YouTube Music Radio',
            duration: item.duration?.seconds && item.duration.seconds > 0 ? item.duration.seconds : 200,
            artworkUrl: upgradeThumbnailUrl(item.thumbnail?.[0]?.url, vid),
            source: 'YT Music Up Next',
            providerType: 'newpipe',
          });
        }
      }
    } catch (err) {
      console.warn('YT Music UpNext warning:', err instanceof Error ? err.message : err);
    }

    // Enrich top slots with instant-play JioSaavn 320k songs from seed artist / mood so radio transitions never stall
    const primaryArtist = artist.split(/[,&]/)[0]?.trim() || title;
    if (primaryArtist) {
      const saavnRadio = await searchJioSaavnSongs(`${primaryArtist} hits`, 10);
      for (const s of saavnRadio) {
        const key = `${s.title.toLowerCase()}::${s.artist.toLowerCase()}`;
        if (!seenKeys.has(key) && !s.title.toLowerCase().includes(title.toLowerCase())) {
          seenKeys.add(key);
          tracks.unshift(s); // instant 320k playable radio items first, followed by deep YT Music Up Next graph
        }
      }
    }

    res.json({
      seedVideoId: seedVideoId || null,
      radioTitle: title ? `Radio • ${title}` : 'Infinite Radio',
      tracks: tracks.slice(0, 24),
    });
  });

  // 5d. Unified Tri-Platform Home Recommendations Engine (Apple Music + Spotify + YouTube Music)
  app.post('/api/ytmusic/recommendations', async (req, res) => {
    const body = (req.body || {}) as {
      recentTracks?: Array<{ title?: string; artist?: string; album?: string }>;
      likedArtists?: string[];
      followedArtists?: string[];
      downloadedTitles?: string[];
      mood?: string;
      hour?: number;
      rotationSeed?: number;
    };

    const recentTracks = Array.isArray(body.recentTracks) ? body.recentTracks : [];
    const likedArtists = Array.isArray(body.likedArtists) ? body.likedArtists : [];
    const followedArtists = Array.isArray(body.followedArtists) ? body.followedArtists : [];
    const downloadedTitles = Array.isArray(body.downloadedTitles) ? body.downloadedTitles : [];
    const mood = typeof body.mood === 'string' && body.mood !== 'All' ? body.mood.trim() : '';
    const hour = typeof body.hour === 'number' ? body.hour : new Date().getHours();
    const rotationSeed = typeof body.rotationSeed === 'number' ? Math.max(0, Math.floor(body.rotationSeed)) : 0;

    // Time-of-day context
    const contextSlot =
      hour >= 5 && hour < 12
        ? { label: 'Morning Mix', moodQuery: 'acoustic morning chill' }
        : hour >= 12 && hour < 17
        ? { label: 'Afternoon Hits', moodQuery: 'upbeat pop hits' }
        : hour >= 17 && hour < 22
        ? { label: 'Evening Mix', moodQuery: 'evening chill hindi indie' }
        : { label: 'Late Night', moodQuery: 'late night lofi chill' };

    const artistScores = new Map<string, number>();
    for (const a of followedArtists) {
      const clean = a.split(/[,&]/)[0]?.trim();
      if (clean) artistScores.set(clean, (artistScores.get(clean) || 0) + 5);
    }
    for (const a of likedArtists) {
      const clean = a.split(/[,&]/)[0]?.trim();
      if (clean) artistScores.set(clean, (artistScores.get(clean) || 0) + 4);
    }
    recentTracks.forEach((t, idx) => {
      const clean = (t.artist || '').split(/[,&]/)[0]?.trim();
      if (clean) {
        const recencyBoost = idx < 2 ? 4 : idx < 5 ? 3 : 2;
        artistScores.set(clean, (artistScores.get(clean) || 0) + recencyBoost);
      }
    });

    const rankedArtists = [...artistScores.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    const fallbackPool = ['Sai Abhyankkar', 'Arijit Singh', 'Anirudh Ravichander', 'Shreya Ghoshal', 'AR Rahman', 'KR$NA'];
    const combinedPool = Array.from(new Set([...rankedArtists, ...fallbackPool]));
    const seedArtist = combinedPool[rotationSeed % Math.min(combinedPool.length, 3)] || 'Sai Abhyankkar';
    const secondaryArtist = combinedPool[(rotationSeed + 1) % combinedPool.length] || 'Arijit Singh';
    const tertiaryArtist = combinedPool[(rotationSeed + 2) % combinedPool.length] || 'Anirudh Ravichander';
    const recentTitles = new Set([
      ...recentTracks.map((t) => (t.title || '').toLowerCase()),
      ...downloadedTitles.map((d) => d.toLowerCase()),
    ]);

    const moodQueryMap: Record<string, string> = {
      Podcasts: 'podcast hindi',
      Sleep: 'ambient sleep',
      Relax: 'lofi chill',
      'Feel good': 'feel good pop',
      Energize: 'party hits',
      Workout: 'workout gym',
      Focus: 'study instrumental',
      Romance: 'romantic hindi',
      Commute: 'roadtrip hits',
    };

    const rotatingQueries = [
      contextSlot.moodQuery,
      `${secondaryArtist} best songs`,
      'new indie hindi tamil 2026',
      'acoustic unplugged sessions',
      `${tertiaryArtist} top tracks`,
    ];

    const quickPicksQuery = mood
      ? moodQueryMap[mood] || `${mood} hits`
      : rotatingQueries[rotationSeed % rotatingQueries.length];

    const discoveryVariants = [
      `Indie ${secondaryArtist} new songs 2026`,
      `${seedArtist} similar artists hits`,
      `${tertiaryArtist} soundtrack hits`,
      `Latest ${secondaryArtist} 2026`,
    ];
    const discoveryQuery = discoveryVariants[rotationSeed % discoveryVariants.length];

    const [
      becauseSongs,
      quickPicksSongs,
      discoverySongs,
      secondarySongs,
      tertiarySongs,
      chillMixSongs,
      upbeatSongs,
      audiusDiscovery,
      artistSearchRes,
      albumSearchRes,
      newReleasesRes,
    ] = await Promise.allSettled([
      searchJioSaavnSongs(seedArtist, 12),
      searchJioSaavnSongs(quickPicksQuery, 14),
      searchJioSaavnSongs(discoveryQuery, 12),
      searchJioSaavnSongs(`${secondaryArtist} top songs`, 10),
      searchJioSaavnSongs(`${tertiaryArtist} hits`, 10),
      searchJioSaavnSongs('lofi chill acoustic hindi indie', 10),
      searchJioSaavnSongs('trending top hits 2026 party workout', 10),
      getAudiusTrending(8),
      fetch(`https://saavn.sumit.co/api/search/artists?query=${encodeURIComponent(seedArtist)}&limit=6`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
      fetch(`https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(mood || secondaryArtist)}&limit=8`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
      fetch(`https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent('2026 Hindi Tamil Hits')}&limit=8`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
    ]);

    const becauseTracks = becauseSongs.status === 'fulfilled' ? becauseSongs.value : [];
    const discoveryTracksRaw = discoverySongs.status === 'fulfilled' ? discoverySongs.value : [];
    const secondaryTracks = secondarySongs.status === 'fulfilled' ? secondarySongs.value : [];
    const tertiaryTracks = tertiarySongs.status === 'fulfilled' ? tertiarySongs.value : [];
    const chillTracks = chillMixSongs.status === 'fulfilled' ? chillMixSongs.value : [];
    const upbeatTracks = upbeatSongs.status === 'fulfilled' ? upbeatSongs.value : [];
    const audiusTracks = audiusDiscovery.status === 'fulfilled' ? audiusDiscovery.value : [];
    let quickPicksTracks = quickPicksSongs.status === 'fulfilled' ? quickPicksSongs.value : [];

    if (quickPicksTracks.length < 6) {
      const seenQ = new Set(quickPicksTracks.map((t) => t.id));
      for (const bt of becauseTracks) {
        if (!seenQ.has(bt.id)) {
          seenQ.add(bt.id);
          quickPicksTracks = [...quickPicksTracks, bt];
        }
      }
    }

    // Blend YouTube Music InnerTube Up Next co-listening graph when available
    let ytCoListening: NormalizedStreamTrack[] = [];
    try {
      const seedTrack = recentTracks[0];
      if (seedTrack?.title) {
        const yt = await getInnertube();
        const sr = await yt.music.search(`${seedTrack.title} ${seedTrack.artist || ''}`.trim(), {
          type: 'song',
        });
        const firstVid = (sr as { songs?: { contents?: Array<{ id?: string }> } }).songs?.contents?.[0]?.id;
        if (firstVid) {
          const upNext = await yt.music.getUpNext(firstVid, true);
          const contents = (upNext as unknown as {
            contents?: Array<{
              video_id?: string;
              title?: { text?: string };
              artists?: Array<{ name?: string }>;
              thumbnail?: Array<{ url?: string }>;
              duration?: { seconds?: number };
            }>;
          }).contents || [];
          ytCoListening = contents
            .filter((c) => c.video_id && c.title?.text)
            .slice(0, 6)
            .map((c) => ({
              id: `ytmusic-${c.video_id}`,
              videoId: String(c.video_id),
              title: decodeHtmlEntities(c.title?.text) || 'Recommended Track',
              artist: (c.artists || []).map((a) => decodeHtmlEntities(a.name)).filter(Boolean).join(', ') || seedArtist,
              album: 'YouTube Music Radio',
              duration: Number(c.duration?.seconds) || 210,
              artworkUrl: upgradeThumbnailUrl(c.thumbnail?.[c.thumbnail.length - 1]?.url, String(c.video_id)),
              source: 'YouTube Music Co-Listen',
              providerType: 'newpipe',
            }));
        }
      }
    } catch {
      // keep fast non-blocking fallback if YouTube InnerTube times out
    }

    if (ytCoListening.length > 0) {
      const mergedQ: NormalizedStreamTrack[] = [];
      const seenMix = new Set<string>();
      const maxLen = Math.max(ytCoListening.length, quickPicksTracks.length);
      for (let i = 0; i < maxLen; i++) {
        const y = ytCoListening[i];
        const j = quickPicksTracks[i];
        if (j && !seenMix.has(j.id)) {
          seenMix.add(j.id);
          mergedQ.push(j);
        }
        if (y && !seenMix.has(y.id)) {
          seenMix.add(y.id);
          mergedQ.push(y);
        }
      }
      quickPicksTracks = mergedQ;
    }

    // Discovery Station / Discover Weekly: tracks outside immediate recent plays
    const discoveryMix = [...ytCoListening, ...discoveryTracksRaw, ...quickPicksTracks]
      .filter((t, i, arr) => !recentTitles.has(t.title.toLowerCase()) && arr.findIndex((x) => x.id === t.id) === i)
      .slice(0, 10);

    // Fetch a second artist pool so "Artists for you" has variety
    let recommendedArtists: Array<{ id: string; name: string; avatarUrl: string; role: string }> = [];
    const artistPoolQueries = [seedArtist, secondaryArtist, tertiaryArtist, 'KR$NA'];
    try {
      const extraArtists = await Promise.all(
        artistPoolQueries.slice(1).map((q) =>
          fetch(`https://saavn.sumit.co/api/search/artists?query=${encodeURIComponent(q)}&limit=2`, {
            signal: AbortSignal.timeout(4000),
          })
            .then((r) => r.json())
            .catch(() => null)
        )
      );

      const rawArtists: Array<{ id?: string; name?: string; role?: string; image?: Array<{ url?: string }> }> = [];
      if (artistSearchRes.status === 'fulfilled') {
        const d = artistSearchRes.value as { data?: { results?: typeof rawArtists } };
        rawArtists.push(...(d.data?.results || []).slice(0, 3));
      }
      for (const resObj of extraArtists) {
        const d = resObj as { data?: { results?: typeof rawArtists } } | null;
        if (d?.data?.results?.[0]) rawArtists.push(d.data.results[0]);
      }

      const seenArt = new Set<string>();
      for (const a of rawArtists) {
        const name = decodeHtmlEntities(a.name);
        if (!a.id || !name || seenArt.has(name.toLowerCase())) continue;
        seenArt.add(name.toLowerCase());
        recommendedArtists.push({
          id: a.id,
          name,
          role: a.role || 'Artist',
          avatarUrl:
            a.image?.[a.image.length - 1]?.url?.replace('150x150', '500x500') ||
            '/assets/covers/sai_abhyankkar.png',
        });
      }
    } catch {
      // keep empty fallback
    }

    type SaavnAlbumItem = {
      id?: string;
      name?: string;
      year?: number | string | null;
      language?: string;
      songCount?: number | null;
      artists?: { primary?: Array<{ name?: string }> };
      image?: Array<{ url?: string }>;
    };

    const mapAlbums = (list: SaavnAlbumItem[]) =>
      list
        .filter((al) => Boolean(al.id && al.name))
        .map((al) => ({
          id: String(al.id),
          title: decodeHtmlEntities(al.name),
          artist:
            (al.artists?.primary || []).map((p) => decodeHtmlEntities(p.name)).filter(Boolean).join(', ') ||
            'Various Artists',
          year: Number(al.year) || 2026,
          language: al.language || '',
          trackCount: Number(al.songCount) || 1,
          coverUrl:
            al.image?.[al.image.length - 1]?.url?.replace('150x150', '500x500') ||
            '/assets/covers/god_mode.png',
        }));

    const albumsForYou =
      albumSearchRes.status === 'fulfilled'
        ? mapAlbums(((albumSearchRes.value as { data?: { results?: SaavnAlbumItem[] } }).data?.results || []).slice(0, 8))
        : [];
    const newReleases =
      newReleasesRes.status === 'fulfilled'
        ? mapAlbums(((newReleasesRes.value as { data?: { results?: SaavnAlbumItem[] } }).data?.results || []).slice(0, 8))
        : [];

    const freshFinds = quickPicksTracks.filter((t) => !recentTitles.has(t.title.toLowerCase())).slice(0, 8);

    const pickPool = (...groups: NormalizedStreamTrack[][]) => {
      const merged: NormalizedStreamTrack[] = [];
      const seen = new Set<string>();
      for (const g of groups) {
        for (const t of g) {
          if (!seen.has(t.id)) {
            seen.add(t.id);
            merged.push(t);
          }
        }
      }
      return merged;
    };

    const deepCutsList = pickPool(discoveryTracksRaw.slice(2), becauseTracks.slice(3), quickPicksTracks.slice(3));
    const crossoverList = pickPool(audiusTracks, upbeatTracks, discoveryTracksRaw);
    const replayList = pickPool(becauseTracks, secondaryTracks, tertiaryTracks);

    const formatArtistsLabel = (list: NormalizedStreamTrack[], fallback: string) => {
      const names = Array.from(
        new Set(
          list
            .map((t) => t.artist.split(/[,&]/)[0]?.trim())
            .filter(Boolean)
        )
      ).slice(0, 3);
      return names.length > 0 ? names.join(', ') : fallback;
    };

    const rawTopPicks = [
      {
        id: 'pick-heavy-rotation',
        kicker: 'Heavy Rotation',
        title: becauseTracks[0]?.title || `${seedArtist} Essentials`,
        subtitle: formatArtistsLabel(becauseTracks, seedArtist),
        accentHex: '#165B33',
        artworkUrl: becauseTracks[0]?.artworkUrl || '/assets/covers/sai_abhyankkar.png',
        tracks: becauseTracks.slice(0, 8),
      },
      {
        id: 'pick-discovery-station',
        kicker: 'Discovery Mix',
        title: discoveryMix[0]?.title || (mood ? `${mood} Station` : contextSlot.label),
        subtitle: formatArtistsLabel(discoveryMix, `${secondaryArtist}, ${tertiaryArtist}`),
        accentHex: '#1D4ED8',
        artworkUrl: discoveryMix[0]?.artworkUrl || quickPicksTracks[0]?.artworkUrl || '/assets/covers/arjn.png',
        tracks: (discoveryMix.length > 0 ? discoveryMix : quickPicksTracks).slice(0, 8),
      },
      {
        id: 'pick-supermix',
        kicker: 'My Supermix',
        title: replayList[1]?.title || 'Daily Supermix',
        subtitle: formatArtistsLabel(replayList, `${seedArtist}, ${secondaryArtist}, ${tertiaryArtist}`),
        accentHex: '#7C3AED',
        artworkUrl: replayList[1]?.artworkUrl || becauseTracks[1]?.artworkUrl || '/assets/covers/bairan.png',
        tracks: replayList.slice(0, 10),
      },
      {
        id: 'pick-secondary-radio',
        kicker: 'Artist Radio',
        title: secondaryTracks[0]?.title || `${secondaryArtist} Mix`,
        subtitle: formatArtistsLabel(secondaryTracks, secondaryArtist),
        accentHex: '#DB2777',
        artworkUrl: secondaryTracks[0]?.artworkUrl || quickPicksTracks[2]?.artworkUrl || '/assets/covers/sheesha.png',
        tracks: pickPool(secondaryTracks, becauseTracks).slice(0, 8),
      },
      {
        id: 'pick-tertiary-radio',
        kicker: 'Similar Vibes',
        title: tertiaryTracks[0]?.title || `${tertiaryArtist} Mix`,
        subtitle: formatArtistsLabel(tertiaryTracks, tertiaryArtist),
        accentHex: '#D97706',
        artworkUrl: tertiaryTracks[0]?.artworkUrl || upbeatTracks[0]?.artworkUrl || '/assets/covers/boom_shaka.png',
        tracks: pickPool(tertiaryTracks, upbeatTracks).slice(0, 8),
      },
      {
        id: 'pick-release-radar',
        kicker: 'Release Radar',
        title: upbeatTracks[1]?.title || 'New Releases 2026',
        subtitle: formatArtistsLabel(upbeatTracks.slice(1), 'Latest Singles & Albums'),
        accentHex: '#059669',
        artworkUrl: upbeatTracks[1]?.artworkUrl || newReleases[0]?.coverUrl || '/assets/covers/god_mode.png',
        tracks: pickPool(upbeatTracks, discoveryTracksRaw).slice(0, 8),
      },
      {
        id: 'pick-chill-unwind',
        kicker: 'Chill Mix',
        title: chillTracks[0]?.title || 'Unwind & Acoustic',
        subtitle: formatArtistsLabel(chillTracks, 'Acoustic & Lo-Fi'),
        accentHex: '#0284C7',
        artworkUrl: chillTracks[0]?.artworkUrl || '/assets/covers/parvati.png',
        tracks: pickPool(chillTracks, quickPicksTracks).slice(0, 8),
      },
      {
        id: 'pick-deep-cuts',
        kicker: 'Archive Mix',
        title: deepCutsList[0]?.title || 'Saved Gems',
        subtitle: formatArtistsLabel(deepCutsList, seedArtist),
        accentHex: '#4F46E5',
        artworkUrl: deepCutsList[0]?.artworkUrl || becauseTracks[2]?.artworkUrl || '/assets/covers/veera_veera.png',
        tracks: deepCutsList.slice(0, 8),
      },
      {
        id: 'pick-energy-boost',
        kicker: 'Workout Mix',
        title: upbeatTracks[2]?.title || 'Energy Surge',
        subtitle: formatArtistsLabel(upbeatTracks.slice(2), tertiaryArtist),
        accentHex: '#DC2626',
        artworkUrl: upbeatTracks[2]?.artworkUrl || tertiaryTracks[1]?.artworkUrl || '/assets/covers/boom_shaka.png',
        tracks: pickPool(upbeatTracks, tertiaryTracks).slice(0, 8),
      },
      {
        id: 'pick-indie-crossover',
        kicker: 'Indie Spotlight',
        title: audiusTracks[0]?.title || 'Indie Electronic Mix',
        subtitle: formatArtistsLabel(audiusTracks, 'Independent Releases'),
        accentHex: '#9333EA',
        artworkUrl: audiusTracks[0]?.artworkUrl || discoveryMix[1]?.artworkUrl || '/assets/covers/arjn.png',
        tracks: crossoverList.slice(0, 8),
      },
      {
        id: 'pick-late-session',
        kicker: 'Late Night',
        title: chillTracks[1]?.title || 'After Hours',
        subtitle: formatArtistsLabel(chillTracks.slice(1), secondaryArtist),
        accentHex: '#0F766E',
        artworkUrl: chillTracks[1]?.artworkUrl || becauseTracks[3]?.artworkUrl || '/assets/covers/bairan.png',
        tracks: pickPool(chillTracks.slice(1), secondaryTracks).slice(0, 8),
      },
      {
        id: 'pick-spotlight-album',
        kicker: 'Album Radio',
        title: albumsForYou[0]?.title || 'Featured Album Mix',
        subtitle: albumsForYou[0]?.artist || seedArtist,
        accentHex: '#B45309',
        artworkUrl: albumsForYou[0]?.coverUrl || quickPicksTracks[3]?.artworkUrl || '/assets/covers/god_mode.png',
        tracks: pickPool(quickPicksTracks.slice(2), becauseTracks).slice(0, 8),
      },
    ];

    const rotatedTopPicks =
      rotationSeed > 0
        ? [
            ...rawTopPicks.slice(rotationSeed % rawTopPicks.length),
            ...rawTopPicks.slice(0, rotationSeed % rawTopPicks.length),
          ]
        : rawTopPicks;

    const topPicks = rotatedTopPicks.filter((p) => p.tracks.length > 0 || p.artworkUrl);

    res.json({
      seedArtist,
      secondaryArtist,
      tertiaryArtist,
      mood: mood || 'All',
      contextLabel: contextSlot.label,
      tasteSummary: `${seedArtist}, ${secondaryArtist}`,
      topPicks,
      biggestHits: pickPool(upbeatTracks, quickPicksTracks).slice(0, 10),
      becauseYouListen: becauseTracks.slice(0, 8),
      secondaryMix: secondaryTracks.slice(0, 8),
      tertiaryMix: tertiaryTracks.slice(0, 8),
      discoveryMix,
      quickPicks: quickPicksTracks.slice(0, 10),
      freshFinds,
      artistsForYou: recommendedArtists.slice(0, 8),
      albumsForYou,
      newReleases,
    });
  });

  // 5e. Artist Detail Page Endpoint (Hero, Top Songs, Albums, Singles, Similar Artists)
  app.get('/api/music/artist', async (req, res) => {
    const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';

    try {
      let artistId = id;
      if (!artistId && name) {
        const searchRes = await fetch(
          `https://saavn.sumit.co/api/search/artists?query=${encodeURIComponent(name)}&limit=3`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (searchRes.ok) {
          const sj = (await searchRes.json()) as { data?: { results?: Array<{ id?: string }> } };
          artistId = String(sj.data?.results?.[0]?.id || '');
        }
      }

      if (artistId) {
        const detailRes = await fetch(`https://saavn.sumit.co/api/artists/${encodeURIComponent(artistId)}`, {
          signal: AbortSignal.timeout(5500),
        });
        if (detailRes.ok) {
          const dj = (await detailRes.json()) as {
            data?: {
              id?: string;
              name?: string;
              followerCount?: number;
              fanCount?: string | number;
              dominantLanguage?: string;
              bio?: Array<{ title?: string; text?: string }>;
              image?: Array<{ url?: string }>;
              topSongs?: SaavnSongRaw[];
              topAlbums?: Array<{
                id?: string;
                name?: string;
                year?: number;
                songCount?: number;
                artists?: { primary?: Array<{ name?: string }> };
                image?: Array<{ url?: string }>;
              }>;
              singles?: Array<{
                id?: string;
                name?: string;
                year?: number;
                artists?: { primary?: Array<{ name?: string }> };
                image?: Array<{ url?: string }>;
              }>;
            };
          };
          const a = dj.data;
          if (a) {
            const topSongs = (a.topSongs || [])
              .map((s) => mapSaavnSong(s, 'JioSaavn Artist Top'))
              .filter((x): x is NormalizedStreamTrack => x !== null);

            const mapAlbList = (list: typeof a.topAlbums) =>
              (list || [])
                .filter((al) => Boolean(al.id && al.name))
                .map((al) => ({
                  id: String(al.id),
                  title: decodeHtmlEntities(al.name),
                  artist:
                    (al.artists?.primary || []).map((p) => decodeHtmlEntities(p.name)).filter(Boolean).join(', ') ||
                    decodeHtmlEntities(a.name) ||
                    name,
                  year: Number(al.year) || 2026,
                  trackCount: Number(al.songCount) || 1,
                  coverUrl:
                    al.image?.[al.image.length - 1]?.url?.replace('150x150', '500x500') ||
                    '/assets/covers/sai_abhyankkar.png',
                }));

            // Populate similar artists by searching genre/language peers
            const similarQuery = a.dominantLanguage ? `Top ${a.dominantLanguage} singers` : 'Trending Indian artists';
            let similarArtists: Array<{ id: string; name: string; avatarUrl: string }> = [];
            try {
              const simRes = await fetch(
                `https://saavn.sumit.co/api/search/artists?query=${encodeURIComponent(similarQuery)}&limit=6`,
                { signal: AbortSignal.timeout(4000) }
              );
              if (simRes.ok) {
                const simJson = (await simRes.json()) as {
                  data?: { results?: Array<{ id?: string; name?: string; image?: Array<{ url?: string }> }> };
                };
                similarArtists = (simJson.data?.results || [])
                  .filter((sa) => sa.id && sa.id !== a.id)
                  .slice(0, 5)
                  .map((sa) => ({
                    id: String(sa.id),
                    name: decodeHtmlEntities(sa.name),
                    avatarUrl:
                      sa.image?.[sa.image.length - 1]?.url?.replace('150x150', '500x500') ||
                      '/assets/covers/arjn.png',
                  }));
              }
            } catch {
              // ignore similar artist lookup failure
            }

            let bioText = decodeHtmlEntities(a.bio?.[0]?.text) || '';
            if (!bioText && (a.name || name)) {
              try {
                const wikiRes = await fetch(
                  `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
                    (a.name || name).replace(/\s+/g, '_')
                  )}`,
                  { signal: AbortSignal.timeout(3000) }
                );
                if (wikiRes.ok) {
                  const wj = (await wikiRes.json()) as { extract?: string };
                  if (wj.extract) bioText = wj.extract;
                }
              } catch {
                // ignore Wikipedia fallback errors
              }
            }

            res.json({
              id: a.id || artistId,
              name: decodeHtmlEntities(a.name) || name,
              imageUrl:
                a.image?.[a.image.length - 1]?.url?.replace('150x150', '500x500') ||
                '/assets/covers/sai_abhyankkar.png',
              followerCount: Number(a.followerCount) || 0,
              fanCount: Number(a.fanCount) || 0,
              dominantLanguage: a.dominantLanguage || 'music',
              bio: bioText,
              topSongs,
              topAlbums: mapAlbList(a.topAlbums).slice(0, 10),
              singles: mapAlbList(a.singles).slice(0, 10),
              similarArtists,
            });
            return;
          }
        }
      }

      // Fallback search by artist name if no JioSaavn artist ID matched
      const fallbackSongs = await searchJioSaavnSongs(name || 'Top Hits', 12);
      res.json({
        id: id || `artist-${Date.now()}`,
        name: name || 'Artist',
        imageUrl: fallbackSongs[0]?.artworkUrl || '/assets/covers/sai_abhyankkar.png',
        followerCount: 0,
        fanCount: 0,
        dominantLanguage: 'music',
        bio: '',
        topSongs: fallbackSongs,
        topAlbums: [],
        singles: [],
        similarArtists: [],
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load artist profile' });
    }
  });

  // 5f. Album Detail Page Endpoint (Artwork, Metadata, Full Tracklist)
  app.get('/api/music/album', async (req, res) => {
    const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';

    try {
      let albumId = id;
      if (!albumId && query) {
        const searchRes = await fetch(
          `https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(query)}&limit=3`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (searchRes.ok) {
          const sj = (await searchRes.json()) as { data?: { results?: Array<{ id?: string }> } };
          albumId = String(sj.data?.results?.[0]?.id || '');
        }
      }

      if (albumId) {
        const albRes = await fetch(`https://saavn.sumit.co/api/albums?id=${encodeURIComponent(albumId)}`, {
          signal: AbortSignal.timeout(5500),
        });
        if (albRes.ok) {
          const aj = (await albRes.json()) as {
            data?: {
              id?: string;
              name?: string;
              description?: string;
              year?: number;
              language?: string;
              songCount?: number;
              artists?: { primary?: Array<{ id?: string; name?: string }> };
              image?: Array<{ url?: string }>;
              songs?: SaavnSongRaw[];
            };
          };
          const al = aj.data;
          if (al) {
            const songs = (al.songs || [])
              .map((s) => mapSaavnSong(s, 'JioSaavn Album 320k'))
              .filter((x): x is NormalizedStreamTrack => x !== null);

            res.json({
              id: String(al.id || albumId),
              title: decodeHtmlEntities(al.name) || query || 'Album',
              artist:
                (al.artists?.primary || []).map((p) => decodeHtmlEntities(p.name)).filter(Boolean).join(', ') ||
                songs[0]?.artist ||
                'Artist',
              artistId: al.artists?.primary?.[0]?.id || '',
              year: Number(al.year) || 2026,
              language: al.language || '',
              description: decodeHtmlEntities(al.description) || '',
              songCount: Number(al.songCount) || songs.length,
              artworkUrl:
                al.image?.[al.image.length - 1]?.url?.replace('150x150', '500x500') ||
                songs[0]?.artworkUrl ||
                '/assets/covers/god_mode.png',
              songs,
            });
            return;
          }
        }
      }

      // Fallback: search matching songs by album query
      const songs = await searchJioSaavnSongs(query || 'Top Album', 10);
      res.json({
        id: id || `album-${Date.now()}`,
        title: query || 'Album',
        artist: songs[0]?.artist || 'Various Artists',
        artistId: '',
        year: 2026,
        language: '',
        description: '',
        songCount: songs.length,
        artworkUrl: songs[0]?.artworkUrl || '/assets/covers/god_mode.png',
        songs,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load album details' });
    }
  });

  // 5g. Tabbed Entity Search (Songs + Artists + Albums + Playlists)
  app.get('/api/music/search-entities', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (!query) {
      res.json({ artists: [], albums: [], playlists: [] });
      return;
    }

    const [artRes, albRes, plRes] = await Promise.allSettled([
      fetch(`https://saavn.sumit.co/api/search/artists?query=${encodeURIComponent(query)}&limit=8`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
      fetch(`https://saavn.sumit.co/api/search/albums?query=${encodeURIComponent(query)}&limit=10`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
      fetch(`https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(query)}&limit=8`, {
        signal: AbortSignal.timeout(4500),
      }).then((r) => r.json()),
    ]);

    const artists =
      artRes.status === 'fulfilled'
        ? (
            (artRes.value as { data?: { results?: Array<{ id?: string; name?: string; role?: string; image?: Array<{ url?: string }> }> } })
              .data?.results || []
          )
            .filter((a) => a.id && a.name)
            .map((a) => ({
              id: String(a.id),
              name: decodeHtmlEntities(a.name),
              role: a.role || 'Artist',
              avatarUrl:
                a.image?.[a.image.length - 1]?.url?.replace('150x150', '500x500') ||
                '/assets/covers/sai_abhyankkar.png',
            }))
        : [];

    const albums =
      albRes.status === 'fulfilled'
        ? (
            (
              albRes.value as {
                data?: {
                  results?: Array<{
                    id?: string;
                    name?: string;
                    year?: number;
                    songCount?: number;
                    artists?: { primary?: Array<{ name?: string }> };
                    image?: Array<{ url?: string }>;
                  }>;
                };
              }
            ).data?.results || []
          )
            .filter((al) => al.id && al.name)
            .map((al) => ({
              id: String(al.id),
              title: decodeHtmlEntities(al.name),
              artist:
                (al.artists?.primary || []).map((p) => decodeHtmlEntities(p.name)).filter(Boolean).join(', ') ||
                'Various Artists',
              year: Number(al.year) || 2026,
              trackCount: Number(al.songCount) || 1,
              coverUrl:
                al.image?.[al.image.length - 1]?.url?.replace('150x150', '500x500') ||
                '/assets/covers/god_mode.png',
            }))
        : [];

    const playlists =
      plRes.status === 'fulfilled'
        ? (
            (
              plRes.value as {
                data?: {
                  results?: Array<{
                    id?: string;
                    name?: string;
                    songCount?: number;
                    image?: Array<{ url?: string }>;
                  }>;
                };
              }
            ).data?.results || []
          )
            .filter((p) => p.id && p.name)
            .map((p) => ({
              id: String(p.id),
              title: decodeHtmlEntities(p.name),
              songCount: Number(p.songCount) || 20,
              coverUrl:
                p.image?.[p.image.length - 1]?.url?.replace('150x150', '500x500') ||
                '/assets/covers/badtameez_dil.png',
            }))
        : [];

    res.json({ artists, albums, playlists });
  });

  // 5h. Fetch Editorial Playlist Tracks by ID
  app.get('/api/music/playlist', async (req, res) => {
    const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
    if (!id) {
      res.status(400).json({ error: 'Missing playlist id' });
      return;
    }
    try {
      const r = await fetch(`https://saavn.sumit.co/api/playlists?id=${encodeURIComponent(id)}&limit=25`, {
        signal: AbortSignal.timeout(5500),
      });
      if (!r.ok) {
        res.status(r.status).json({ error: 'Failed to load playlist' });
        return;
      }
      const j = (await r.json()) as {
        data?: {
          id?: string;
          name?: string;
          description?: string;
          image?: Array<{ url?: string }>;
          songs?: SaavnSongRaw[];
        };
      };
      const pl = j.data;
      const songs = (pl?.songs || [])
        .map((s) => mapSaavnSong(s, 'JioSaavn Playlist 320k'))
        .filter((x): x is NormalizedStreamTrack => x !== null);
      res.json({
        id: pl?.id || id,
        title: decodeHtmlEntities(pl?.name) || 'Playlist',
        description: decodeHtmlEntities(pl?.description) || '',
        coverUrl: pl?.image?.[pl.image.length - 1]?.url?.replace('150x150', '500x500') || '',
        songs,
      });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Unable to load playlist' });
    }
  });

  // 5h2. Podcasts Search Endpoint (Playable Apple Podcasts Episodes + Audio Search Fallback)
  app.get('/api/music/podcasts', async (req, res) => {
    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : 'music stories';
    try {
      const itunesRes = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=podcast&entity=podcastEpisode&limit=16`,
        { signal: AbortSignal.timeout(5000) }
      );
      let items: NormalizedStreamTrack[] = [];
      if (itunesRes.ok) {
        const ij = (await itunesRes.json()) as {
          results?: Array<{
            trackId?: number;
            trackName?: string;
            collectionName?: string;
            artistName?: string;
            trackTimeMillis?: number;
            artworkUrl600?: string;
            artworkUrl160?: string;
            episodeUrl?: string;
            previewUrl?: string;
          }>;
        };
        items = (ij.results || [])
          .filter((ep) => Boolean(ep.episodeUrl || ep.previewUrl))
          .map((ep) => {
            const rawUrl = String(ep.episodeUrl || ep.previewUrl);
            const streamObj: NormalizedAudioStream = {
              url: proxiedAudioUrl(rawUrl),
              rawUrl,
              codec: 'MP3 / AAC',
              container: 'Podcast Episode',
              mimeType: 'audio/mpeg',
              sampleRate: 44100,
              bitrateKbps: 128,
              qualityLabel: 'Podcast Audio',
              badgeLabel: 'Podcast · Stream',
            };
            const art = (ep.artworkUrl600 || ep.artworkUrl160 || '/assets/covers/discover_mix.png')
              .replace('600x600bb', '1200x1200bb')
              .replace('160x160bb', '600x600bb');
            return {
              id: `pod-${ep.trackId || Math.random().toString(36).slice(2)}`,
              videoId: `pod-${ep.trackId || ''}`,
              title: ep.trackName || ep.collectionName || 'Podcast Episode',
              artist: ep.collectionName || ep.artistName || 'Podcast Show',
              album: 'Podcast',
              duration: ep.trackTimeMillis ? Math.round(ep.trackTimeMillis / 1000) : 1200,
              artworkUrl: art,
              source: 'Apple Podcasts',
              providerType: 'audius',
              streamUrl: streamObj.url,
              audioStreams: [streamObj],
            };
          });
      }
      res.json({ items });
    } catch {
      res.json({ items: [] });
    }
  });

  // 5i. Personalized Community Playlists (GET & POST based on user listening history)
  const buildCommunityPlaylists = async (opts: {
    mood: string;
    seedArtists: string[];
    seedTitles: string[];
  }) => {
    const queries = Array.from(
      new Set(
        [
          opts.mood && opts.mood !== 'All' ? `${opts.mood} Hits` : '',
          ...opts.seedArtists.slice(0, 3).map((a) => `${a} Mix`),
          ...opts.seedTitles.slice(0, 2),
          'Trending Hindi Tamil Hits',
          'Viral India 2026',
        ].filter(Boolean)
      )
    ).slice(0, 4);

    const searchResponses = await Promise.allSettled(
      queries.map((q) =>
        fetch(`https://saavn.sumit.co/api/search/playlists?query=${encodeURIComponent(q)}&limit=3`, {
          signal: AbortSignal.timeout(4500),
        }).then((r) => (r.ok ? r.json() : null))
      )
    );

    const seenPlIds = new Set<string>();
    const rawPlaylists: Array<{ id: string; name?: string; songCount?: number }> = [];
    for (const sr of searchResponses) {
      if (sr.status !== 'fulfilled' || !sr.value) continue;
      const results =
        ((sr.value as { data?: { results?: Array<{ id?: string; name?: string; songCount?: number }> } })
          .data?.results || []);
      for (const pl of results) {
        if (!pl.id || seenPlIds.has(String(pl.id))) continue;
        seenPlIds.add(String(pl.id));
        rawPlaylists.push({ id: String(pl.id), name: pl.name, songCount: pl.songCount });
        if (rawPlaylists.length >= 8) break;
      }
      if (rawPlaylists.length >= 8) break;
    }

    const enriched = await Promise.all(
      rawPlaylists.map(async (pl, idx) => {
        try {
          const detailRes = await fetch(
            `https://saavn.sumit.co/api/playlists?id=${encodeURIComponent(pl.id)}&limit=6`,
            { signal: AbortSignal.timeout(4500) }
          );
          const detailJson = detailRes.ok
            ? ((await detailRes.json()) as {
                data?: { name?: string; songs?: SaavnSongRaw[] };
              })
            : null;
          const songs = (detailJson?.data?.songs || [])
            .map((s) => mapSaavnSong(s, 'Community Playlist 320k'))
            .filter((x): x is NormalizedStreamTrack => x !== null)
            .slice(0, 6);
          if (songs.length === 0) return null;
          const collageCovers = songs.slice(0, 4).map((s) => s.artworkUrl);
          while (collageCovers.length < 4) {
            collageCovers.push(collageCovers[collageCovers.length - 1]);
          }
          return {
            id: String(pl.id),
            title: decodeHtmlEntities(detailJson?.data?.name || pl.name) || 'Community Mix',
            curator:
              opts.seedArtists[0] && idx === 0
                ? `Picked from ${opts.seedArtists[0]}`
                : songs[0]?.artist?.split(',')[0] || 'Curated Community',
            playsLabel: `${(1.8 + idx * 0.9).toFixed(1)}M plays · ${Number(pl.songCount) || songs.length} songs`,
            collageCovers,
            tracks: songs,
          };
        } catch {
          return null;
        }
      })
    );

    return enriched.filter((p): p is NonNullable<typeof p> => p !== null);
  };

  app.get('/api/ytmusic/community-playlists', async (req, res) => {
    const mood = typeof req.query.mood === 'string' ? req.query.mood.trim() : 'All';
    try {
      const playlists = await buildCommunityPlaylists({ mood, seedArtists: [], seedTitles: [] });
      res.json({ playlists });
    } catch {
      res.json({ playlists: [] });
    }
  });

  app.post('/api/ytmusic/community-playlists', async (req, res) => {
    const body = (req.body || {}) as {
      recentTracks?: Array<{ title?: string; artist?: string }>;
      likedArtists?: string[];
      followedArtists?: string[];
      mood?: string;
    };
    const seedArtists = Array.from(
      new Set([
        ...(Array.isArray(body.followedArtists) ? body.followedArtists : []),
        ...(Array.isArray(body.likedArtists) ? body.likedArtists : []),
        ...(Array.isArray(body.recentTracks)
          ? body.recentTracks.map((t) => (t.artist || '').split(/[,&]/)[0]?.trim()).filter(Boolean)
          : []),
      ])
    ) as string[];
    const seedTitles = Array.isArray(body.recentTracks)
      ? body.recentTracks.map((t) => String(t.title || '').trim()).filter(Boolean)
      : [];
    const mood = typeof body.mood === 'string' ? body.mood.trim() : 'All';

    try {
      const playlists = await buildCommunityPlaylists({ mood, seedArtists, seedTitles });
      res.json({ playlists });
    } catch {
      res.json({ playlists: [] });
    }
  });

  // 5i2. Offline Muxing Endpoint: Merges Audio + High-Res Cover Artwork + Tags into one file
  app.post('/api/downloads/mux', async (req, res) => {
    const body = (req.body || {}) as {
      streamUrl?: string;
      artworkUrl?: string;
      title?: string;
      artist?: string;
      album?: string;
    };
    const rawStreamUrl = typeof body.streamUrl === 'string' ? body.streamUrl.trim() : '';
    const artworkUrl = typeof body.artworkUrl === 'string' ? body.artworkUrl.trim() : '';
    const title = typeof body.title === 'string' ? body.title.trim() : 'MasterWave Track';
    const artist = typeof body.artist === 'string' ? body.artist.trim() : 'MasterWave Artist';
    const album = typeof body.album === 'string' ? body.album.trim() : 'MasterWave';

    if (!rawStreamUrl) {
      res.status(400).json({ error: 'Missing streamUrl' });
      return;
    }

    // Resolve local /api/newpipe/proxy URLs back to their upstream URL for clean server fetch
    let upstreamAudioUrl = rawStreamUrl;
    if (rawStreamUrl.startsWith('/api/newpipe/proxy?')) {
      const qStr = rawStreamUrl.split('?')[1] || '';
      const params = new URLSearchParams(qStr);
      upstreamAudioUrl = params.get('url') || rawStreamUrl;
    } else if (rawStreamUrl.startsWith('/')) {
      upstreamAudioUrl = `http://127.0.0.1:${PORT}${rawStreamUrl}`;
    }

    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mw-mux-'));
    try {
      const audioRes = await fetch(upstreamAudioUrl, {
        headers: { 'User-Agent': 'MasterWave-Android/5.2.0' },
        signal: AbortSignal.timeout(25000),
      });
      if (!audioRes.ok) {
        res.status(502).json({ error: `Audio fetch failed (${audioRes.status})` });
        return;
      }
      const audioContentType = audioRes.headers.get('content-type') || '';
      const audioBuf = Buffer.from(await audioRes.arrayBuffer());
      if (audioBuf.length < 4096 || audioContentType.includes('text/html') || audioContentType.startsWith('image/')) {
        res.status(502).json({ error: 'Upstream response was not valid audio' });
        return;
      }

      const isMp3 = audioContentType.includes('mpeg') || upstreamAudioUrl.toLowerCase().includes('.mp3');
      const inAudioPath = path.join(workDir, isMp3 ? 'in.mp3' : 'in.m4a');
      await fs.writeFile(inAudioPath, audioBuf);

      let hasArtwork = false;
      const coverPath = path.join(workDir, 'cover.jpg');
      if (artworkUrl && !artworkUrl.startsWith('data:')) {
        try {
          const fullArtUrl = artworkUrl.startsWith('/')
            ? `http://127.0.0.1:${PORT}${artworkUrl}`
            : artworkUrl;
          const artRes = await fetch(fullArtUrl, { signal: AbortSignal.timeout(8000) });
          if (artRes.ok) {
            const artBuf = Buffer.from(await artRes.arrayBuffer());
            if (artBuf.length > 512) {
              await fs.writeFile(coverPath, artBuf);
              hasArtwork = true;
            }
          }
        } catch {
          // proceed without embedded cover if artwork fetch failed
        }
      }

      const outExt = isMp3 ? 'mp3' : 'm4a';
      const outPath = path.join(workDir, `out.${outExt}`);
      const ffArgs: string[] = ['-y', '-i', inAudioPath];
      if (hasArtwork) {
        ffArgs.push('-i', coverPath);
      }

      ffArgs.push('-map', '0:a:0');
      if (hasArtwork) {
        ffArgs.push('-map', '1:0', '-c:v', 'copy', '-disposition:v:0', 'attached_pic');
      }

      if (isMp3) {
        ffArgs.push('-c:a', 'copy', '-id3v2_version', '3');
      } else {
        ffArgs.push('-c:a', 'copy', '-movflags', '+faststart');
      }

      ffArgs.push(
        '-metadata', `title=${title}`,
        '-metadata', `artist=${artist}`,
        '-metadata', `album=${album}`,
        outPath
      );

      await execFileAsync('ffmpeg', ffArgs, { timeout: 25000 });
      const outBuf = await fs.readFile(outPath);

      res.setHeader('Content-Type', isMp3 ? 'audio/mpeg' : 'audio/mp4');
      res.setHeader('X-File-Ext', outExt);
      res.setHeader('X-Artwork-Merged', hasArtwork ? 'true' : 'false');
      res.setHeader('Content-Length', String(outBuf.length));
      res.send(outBuf);
    } catch (err) {
      res.status(502).json({ error: err instanceof Error ? err.message : 'Muxing failed' });
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  // 5j. Lyrics Multi-Language Translation & Romanization
  app.post('/api/lyrics/transform', async (req, res) => {
    const body = (req.body || {}) as {
      lines?: string[];
      mode?: 'translate' | 'romanize';
      targetLang?: string;
    };
    const lines = Array.isArray(body.lines) ? body.lines.slice(0, 80) : [];
    const mode = body.mode === 'romanize' ? 'romanize' : 'translate';
    const targetLangMap: Record<string, string> = {
      English: 'en',
      Hindi: 'hi',
      Tamil: 'ta',
      Spanish: 'es',
      'Follows the app language': 'en',
    };
    const tl = targetLangMap[body.targetLang || 'English'] || 'en';

    if (lines.length === 0) {
      res.json({ lines: [] });
      return;
    }

    try {
      const joined = lines.join('\n');
      const gtxRes = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t&dt=rm&q=${encodeURIComponent(joined)}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(5500),
        }
      );

      if (gtxRes.ok) {
        const gtx = (await gtxRes.json()) as unknown[];
        const sentences = Array.isArray(gtx?.[0]) ? (gtx[0] as Array<Array<string | null>>) : [];

        if (mode === 'romanize') {
          const combinedRoman = sentences
            .map((s) => s?.[3] || s?.[2] || s?.[0] || '')
            .join('');
          const splitRoman = combinedRoman.split('\n');
          if (splitRoman.length === lines.length) {
            res.json({ lines: splitRoman });
            return;
          }
          // Fallback: return non-empty phonetic lines aligned by index
          const perLine = lines.map((orig, i) => (splitRoman[i] || '').trim() || orig);
          res.json({ lines: perLine });
          return;
        }

        const combinedTranslated = sentences.map((s) => s?.[0] || '').join('');
        const splitTranslated = combinedTranslated.split('\n');
        const perLine = lines.map((orig, i) => (splitTranslated[i] || '').trim() || orig);
        res.json({ lines: perLine });
        return;
      }
    } catch {
      // fallback below
    }

    res.json({ lines });
  });

  // 5k. Real-time MasterWave Jam Sessions (Host / Join / Playback Sync / In-Room Chat)
  interface JamRoomState {
    code: string;
    hostName: string;
    roomName: string;
    listeners: number;
    deviceLabel: string;
    isPlaying: boolean;
    positionSec: number;
    updatedAt: number;
    currentTrack: {
      id: string;
      title: string;
      artist: string;
      album: string;
      artworkUrl: string;
      streamUrl: string;
      duration: number;
      qualityBadge: string;
    };
    messages: Array<{ id: string; sender: string; text: string; time: string }>;
  }

  const jamRooms = new Map<string, JamRoomState>([
    [
      'MW-8429',
      {
        code: 'MW-8429',
        hostName: 'Aarav Patel',
        roomName: 'Night Drive Session',
        listeners: 4,
        deviceLabel: 'USB DAC Bit-Perfect',
        isPlaying: true,
        positionSec: 42,
        updatedAt: Date.now(),
        currentTrack: {
          id: 'veera-veera-01',
          title: 'Veera Veera',
          artist: 'Sai Abhyankkar',
          album: 'Veera Veera - Single',
          artworkUrl: '/assets/covers/sai_abhyankkar.png',
          streamUrl: '',
          duration: 214,
          qualityBadge: 'Hi-Res 24-bit',
        },
        messages: [
          {
            id: 'm1',
            sender: 'Aarav Patel',
            text: 'Listening together on synced AutoMix! Drop next track requests here.',
            time: 'Now',
          },
        ],
      },
    ],
    [
      'LW-2041',
      {
        code: 'LW-2041',
        hostName: 'Maya Sen',
        roomName: '24-bit Acoustic Lounge',
        listeners: 3,
        deviceLabel: 'Bluetooth LDAC 990k',
        isPlaying: true,
        positionSec: 18,
        updatedAt: Date.now(),
        currentTrack: {
          id: 'bairan-banjaare',
          title: 'Bairan',
          artist: 'Banjaare',
          album: 'Bairan Sessions',
          artworkUrl: '/assets/covers/bairan.png',
          streamUrl: '',
          duration: 228,
          qualityBadge: 'Lossless 16-bit',
        },
        messages: [
          {
            id: 'm2',
            sender: 'Maya Sen',
            text: 'Clean acoustic tuning tonight.',
            time: '2m ago',
          },
        ],
      },
    ],
  ]);

  app.get('/api/jam/rooms', (_req, res) => {
    res.json({ rooms: [...jamRooms.values()] });
  });

  app.post('/api/jam/create', (req, res) => {
    const body = (req.body || {}) as Partial<JamRoomState>;
    const code =
      (typeof body.code === 'string' && body.code.trim().toUpperCase()) ||
      `MW-${Math.floor(1000 + Math.random() * 9000)}`;

    const room: JamRoomState = {
      code,
      hostName: body.hostName || 'You (Host)',
      roomName: body.roomName || 'Friends Jam Room',
      listeners: 1,
      deviceLabel: body.deviceLabel || 'MasterWave Engine',
      isPlaying: Boolean(body.isPlaying ?? true),
      positionSec: Number(body.positionSec) || 0,
      updatedAt: Date.now(),
      currentTrack: body.currentTrack || {
        id: 'veera-veera-01',
        title: 'Veera Veera',
        artist: 'Sai Abhyankkar',
        album: 'MasterWave',
        artworkUrl: '/assets/covers/sai_abhyankkar.png',
        streamUrl: '',
        duration: 214,
        qualityBadge: '320 kbps',
      },
      messages: [
        {
          id: `sys-${Date.now()}`,
          sender: 'System',
          text: `Jam room ${code} started. Share code to sync playback.`,
          time: 'Just now',
        },
      ],
    };

    jamRooms.set(code, room);
    res.json({ room });
  });

  app.get('/api/jam/:code', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const room = jamRooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Jam room not found' });
      return;
    }
    res.json({ room });
  });

  app.post('/api/jam/:code/sync', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const room = jamRooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Jam room not found' });
      return;
    }
    const body = (req.body || {}) as Partial<JamRoomState>;
    if (body.currentTrack) room.currentTrack = body.currentTrack;
    if (typeof body.isPlaying === 'boolean') room.isPlaying = body.isPlaying;
    if (typeof body.positionSec === 'number') room.positionSec = body.positionSec;
    room.updatedAt = Date.now();
    res.json({ room });
  });

  app.post('/api/jam/:code/chat', (req, res) => {
    const code = req.params.code.trim().toUpperCase();
    const room = jamRooms.get(code);
    if (!room) {
      res.status(404).json({ error: 'Jam room not found' });
      return;
    }
    const body = (req.body || {}) as { sender?: string; text?: string };
    const text = (body.text || '').trim();
    if (!text) {
      res.status(400).json({ error: 'Empty message' });
      return;
    }
    room.messages.push({
      id: `msg-${Date.now()}`,
      sender: (body.sender || 'Listener').trim(),
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    if (room.messages.length > 40) room.messages = room.messages.slice(-40);
    res.json({ room });
  });

  // 6. Range-Aware Audio Stream Proxy (GET + HEAD, follows 302 redirects, CORS enabled)
  app.use('/api/newpipe/proxy', async (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    const targetUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!targetUrl || !targetUrl.startsWith('http')) {
      res.status(400).send('Invalid proxy stream URL');
      return;
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
      };
      if (req.headers.range) {
        headers.Range = String(req.headers.range);
      }

      const upstream = await fetch(targetUrl, {
        method: req.method,
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      res.status(upstream.status);
      const forwardHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
      for (const h of forwardHeaders) {
        const val = upstream.headers.get(h);
        if (val) res.setHeader(h, val);
      }
      res.setHeader('Access-Control-Allow-Origin', '*');

      if (req.method === 'HEAD' || !upstream.body) {
        res.end();
        return;
      }

      const nodeStream = Readable.fromWeb(upstream.body as unknown as import('node:stream/web').ReadableStream);
      nodeStream.on('error', () => {
        if (!res.headersSent) res.status(502);
        res.end();
      });
      nodeStream.pipe(res);
    } catch (err) {
      if (!res.headersSent) {
        res.status(502).send(err instanceof Error ? err.message : 'Upstream audio proxy error');
      }
    }
  });

  // 7. Mount Vite Dev Middlewares or Production Static Dist
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MasterWave server listening on http://0.0.0.0:${PORT} (JioSaavn 320k + Audius + NewPipe Bridge active)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MasterWave server:', err);
  process.exit(1);
});
