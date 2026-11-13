import { Track, ListeningStats, LastFmProfile } from '../types/music';

const LASTFM_STORAGE_KEY = 'masterwave_lastfm_profile';
const STATS_STORAGE_KEY = 'masterwave_listening_stats';

export class LastFmService {
  private profile: LastFmProfile;
  private stats: ListeningStats;

  constructor() {
    const savedProfile = localStorage.getItem(LASTFM_STORAGE_KEY);
    this.profile = savedProfile ? JSON.parse(savedProfile) : {
      username: 'Guest',
      isConnected: false,
      totalScrobbles: 0
    };

    const savedStats = localStorage.getItem(STATS_STORAGE_KEY);
    this.stats = savedStats ? JSON.parse(savedStats) : {
      totalPlays: 0,
      uniqueTracks: 0,
      uniqueArtists: 0,
      uniqueAlbums: 0,
      recentPlays: []
    };
  }

  public getProfile(): LastFmProfile {
    return this.profile;
  }

  public getStats(): ListeningStats {
    return this.stats;
  }

  public connectAccount(username: string): LastFmProfile {
    this.profile = {
      username: username.trim() || 'Audiosmith',
      isConnected: true,
      totalScrobbles: 1420 + this.stats.totalPlays
    };
    localStorage.setItem(LASTFM_STORAGE_KEY, JSON.stringify(this.profile));
    return this.profile;
  }

  public disconnectAccount(): LastFmProfile {
    this.profile = {
      username: 'Guest',
      isConnected: false,
      totalScrobbles: 0
    };
    localStorage.setItem(LASTFM_STORAGE_KEY, JSON.stringify(this.profile));
    return this.profile;
  }

  public recordPlay(track: Track) {
    this.stats.totalPlays += 1;
    this.stats.recentPlays.unshift({
      track,
      playedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    if (this.stats.recentPlays.length > 50) {
      this.stats.recentPlays.pop();
    }

    const uniqueTrackSet = new Set(this.stats.recentPlays.map(p => p.track.id));
    const uniqueArtistSet = new Set(this.stats.recentPlays.map(p => p.track.artist));
    const uniqueAlbumSet = new Set(this.stats.recentPlays.map(p => p.track.album));

    this.stats.uniqueTracks = uniqueTrackSet.size;
    this.stats.uniqueArtists = uniqueArtistSet.size;
    this.stats.uniqueAlbums = uniqueAlbumSet.size;

    if (this.profile.isConnected) {
      this.profile.totalScrobbles += 1;
      localStorage.setItem(LASTFM_STORAGE_KEY, JSON.stringify(this.profile));
    }

    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(this.stats));
  }
}

export const lastFmService = new LastFmService();
