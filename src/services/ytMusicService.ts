import { Track } from '../types/music';
import { NewPipeSearchItem, newpipeService } from './newpipeService';

export interface YTMusicArtistSummary {
  id: string;
  name: string;
  avatarUrl: string;
  role?: string;
}

export interface YTMusicAlbumSummary {
  id: string;
  title: string;
  artist: string;
  year: number;
  language?: string;
  trackCount: number;
  coverUrl: string;
}

export interface YTMusicPlaylistSummary {
  id: string;
  title: string;
  songCount: number;
  coverUrl: string;
}

export interface YTMusicArtistDetail {
  id: string;
  name: string;
  imageUrl: string;
  followerCount: number;
  fanCount: number;
  dominantLanguage: string;
  bio: string;
  topSongs: Track[];
  topAlbums: YTMusicAlbumSummary[];
  singles: YTMusicAlbumSummary[];
  similarArtists: YTMusicArtistSummary[];
}

export interface YTMusicAlbumDetail {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  year: number;
  language: string;
  description: string;
  songCount: number;
  artworkUrl: string;
  songs: Track[];
}

export interface YTMusicTopPick {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  accentHex: string;
  artworkUrl: string;
  tracks: Track[];
}

export interface YTMusicHomeRecommendations {
  seedArtist: string;
  secondaryArtist?: string;
  tertiaryArtist?: string;
  mood: string;
  contextLabel?: string;
  tasteSummary: string;
  topPicks: YTMusicTopPick[];
  biggestHits?: Track[];
  becauseYouListen: Track[];
  secondaryMix?: Track[];
  tertiaryMix?: Track[];
  discoveryMix: Track[];
  quickPicks: Track[];
  freshFinds: Track[];
  artistsForYou: YTMusicArtistSummary[];
  albumsForYou: YTMusicAlbumSummary[];
  newReleases: YTMusicAlbumSummary[];
}

export interface YTMusicUpNextResponse {
  seedVideoId: string | null;
  radioTitle: string;
  tracks: Track[];
}

const FOLLOWED_ARTISTS_KEY = 'masterwave_followed_artists';
const AUTOPLAY_RADIO_KEY = 'masterwave_autoplay_radio';

class YTMusicClientService {
  public getFollowedArtists(): string[] {
    try {
      const raw = localStorage.getItem(FOLLOWED_ARTISTS_KEY);
      return raw ? JSON.parse(raw) : ['Sai Abhyankkar'];
    } catch {
      return ['Sai Abhyankkar'];
    }
  }

  public isArtistFollowed(artistName: string): boolean {
    const clean = artistName.trim().toLowerCase();
    return this.getFollowedArtists().some((a) => a.toLowerCase() === clean);
  }

  public toggleFollowArtist(artistName: string): string[] {
    const current = this.getFollowedArtists();
    const clean = artistName.trim();
    const exists = current.some((a) => a.toLowerCase() === clean.toLowerCase());
    const updated = exists
      ? current.filter((a) => a.toLowerCase() !== clean.toLowerCase())
      : [clean, ...current];
    try {
      localStorage.setItem(FOLLOWED_ARTISTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
    return updated;
  }

  public getAutoplayRadio(): boolean {
    try {
      const raw = localStorage.getItem(AUTOPLAY_RADIO_KEY);
      return raw === null ? true : raw === 'true';
    } catch {
      return true;
    }
  }

  public setAutoplayRadio(enabled: boolean) {
    try {
      localStorage.setItem(AUTOPLAY_RADIO_KEY, String(enabled));
    } catch {
      // ignore
    }
  }

  public async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/ytmusic/suggestions?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const data = (await res.json()) as { suggestions?: string[] };
      return data.suggestions || [];
    } catch {
      return [];
    }
  }

  public async getUpNextRadio(track: Track): Promise<YTMusicUpNextResponse> {
    const params = new URLSearchParams();
    if (track.newpipeVideoId) params.set('videoId', track.newpipeVideoId);
    params.set('title', track.title);
    params.set('artist', track.artist);

    const res = await fetch(`/api/ytmusic/upnext?${params.toString()}`);
    if (!res.ok) {
      return { seedVideoId: null, radioTitle: 'Infinite Radio', tracks: [] };
    }
    const data = (await res.json()) as {
      seedVideoId: string | null;
      radioTitle: string;
      tracks: NewPipeSearchItem[];
    };
    return {
      seedVideoId: data.seedVideoId,
      radioTitle: data.radioTitle,
      tracks: (data.tracks || []).map((item) => newpipeService.mapSearchItemToTrack(item)),
    };
  }

  public async getHomeRecommendations(params: {
    recentTracks: Track[];
    likedArtists: string[];
    downloadedTitles?: string[];
    mood?: string;
    rotationSeed?: number;
  }): Promise<YTMusicHomeRecommendations | null> {
    try {
      const res = await fetch('/api/ytmusic/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recentTracks: params.recentTracks.slice(0, 15).map((t) => ({
            title: t.title,
            artist: t.artist,
            album: t.album,
          })),
          likedArtists: params.likedArtists,
          followedArtists: this.getFollowedArtists(),
          downloadedTitles: params.downloadedTitles || [],
          mood: params.mood || 'All',
          hour: new Date().getHours(),
          rotationSeed: params.rotationSeed || 0,
        }),
      });
      if (!res.ok) return null;
      const raw = (await res.json()) as {
        seedArtist: string;
        secondaryArtist?: string;
        tertiaryArtist?: string;
        mood: string;
        contextLabel?: string;
        tasteSummary: string;
        topPicks?: Array<{
          id: string;
          kicker: string;
          title: string;
          subtitle: string;
          accentHex: string;
          artworkUrl: string;
          tracks: NewPipeSearchItem[];
        }>;
        biggestHits?: NewPipeSearchItem[];
        becauseYouListen: NewPipeSearchItem[];
        secondaryMix?: NewPipeSearchItem[];
        tertiaryMix?: NewPipeSearchItem[];
        discoveryMix?: NewPipeSearchItem[];
        quickPicks: NewPipeSearchItem[];
        freshFinds: NewPipeSearchItem[];
        artistsForYou: YTMusicArtistSummary[];
        albumsForYou: YTMusicAlbumSummary[];
        newReleases: YTMusicAlbumSummary[];
      };
      return {
        seedArtist: raw.seedArtist,
        secondaryArtist: raw.secondaryArtist,
        tertiaryArtist: raw.tertiaryArtist,
        mood: raw.mood,
        contextLabel: raw.contextLabel,
        tasteSummary: raw.tasteSummary,
        topPicks: (raw.topPicks || []).map((p) => ({
          ...p,
          tracks: (p.tracks || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        })),
        biggestHits: (raw.biggestHits || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        becauseYouListen: (raw.becauseYouListen || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        secondaryMix: (raw.secondaryMix || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        tertiaryMix: (raw.tertiaryMix || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        discoveryMix: (raw.discoveryMix || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        quickPicks: (raw.quickPicks || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        freshFinds: (raw.freshFinds || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
        artistsForYou: raw.artistsForYou || [],
        albumsForYou: raw.albumsForYou || [],
        newReleases: raw.newReleases || [],
      };
    } catch {
      return null;
    }
  }

  public async getArtistDetail(opts: { id?: string; name: string }): Promise<YTMusicArtistDetail> {
    const params = new URLSearchParams();
    if (opts.id) params.set('id', opts.id);
    if (opts.name) params.set('name', opts.name);
    const res = await fetch(`/api/music/artist?${params.toString()}`);
    if (!res.ok) throw new Error('Unable to fetch artist page');
    const raw = (await res.json()) as Omit<YTMusicArtistDetail, 'topSongs'> & {
      topSongs: NewPipeSearchItem[];
    };
    return {
      ...raw,
      topSongs: (raw.topSongs || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
    };
  }

  public async getAlbumDetail(opts: { id?: string; query?: string }): Promise<YTMusicAlbumDetail> {
    const params = new URLSearchParams();
    if (opts.id) params.set('id', opts.id);
    if (opts.query) params.set('query', opts.query);
    const res = await fetch(`/api/music/album?${params.toString()}`);
    if (!res.ok) throw new Error('Unable to fetch album page');
    const raw = (await res.json()) as Omit<YTMusicAlbumDetail, 'songs'> & {
      songs: NewPipeSearchItem[];
    };
    return {
      ...raw,
      songs: (raw.songs || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
    };
  }

  public async searchEntities(query: string): Promise<{
    artists: YTMusicArtistSummary[];
    albums: YTMusicAlbumSummary[];
    playlists: YTMusicPlaylistSummary[];
  }> {
    if (!query.trim()) return { artists: [], albums: [], playlists: [] };
    try {
      const res = await fetch(`/api/music/search-entities?q=${encodeURIComponent(query)}`);
      if (!res.ok) return { artists: [], albums: [], playlists: [] };
      return res.json();
    } catch {
      return { artists: [], albums: [], playlists: [] };
    }
  }

  public async getPlaylistTracks(id: string): Promise<{
    id: string;
    title: string;
    description: string;
    coverUrl: string;
    songs: Track[];
  }> {
    const res = await fetch(`/api/music/playlist?id=${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error('Unable to fetch playlist');
    const raw = (await res.json()) as {
      id: string;
      title: string;
      description: string;
      coverUrl: string;
      songs: NewPipeSearchItem[];
    };
    return {
      ...raw,
      songs: (raw.songs || []).map((i) => newpipeService.mapSearchItemToTrack(i)),
    };
  }

  public async searchPodcasts(query: string): Promise<Track[]> {
    if (!query.trim()) return [];
    try {
      const res = await fetch(`/api/music/podcasts?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const raw = (await res.json()) as { items?: NewPipeSearchItem[] };
      return (raw.items || []).map((item) => newpipeService.mapSearchItemToTrack(item));
    } catch {
      return [];
    }
  }
}

export const ytMusicService = new YTMusicClientService();
