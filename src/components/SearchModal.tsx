import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Play,
  Loader2,
  ListPlus,
  Disc3,
  UserRound,
  Mic,
  ListMusic,
  Shuffle,
  Download,
  CheckCircle2,
  BookmarkPlus,
  ChevronRight
} from 'lucide-react';
import { Track, Playlist } from '../types/music';
import { newpipeService } from '../services/newpipeService';
import {
  ytMusicService,
  YTMusicArtistSummary,
  YTMusicAlbumSummary,
  YTMusicPlaylistSummary
} from '../services/ytMusicService';
import { BoldSearchIcon } from './CustomIcons';

type SearchFilterTab = 'All' | 'Songs' | 'Albums' | 'Artists' | 'Podcasts' | 'Playlists';

interface SearchModalProps {
  tracks: Track[];
  initialQuery?: string;
  downloadedIds?: Set<string>;
  onSelectTrack: (track: Track, queue?: Track[]) => void;
  onAddToQueue?: (track: Track) => void;
  onToggleDownload?: (track: Track) => void;
  onOpenArtist?: (artist: { id?: string; name: string }) => void;
  onOpenAlbum?: (album: { id?: string; title?: string; artist?: string }) => void;
  onSaveAsPlaylist?: (playlist: Playlist, addedTracks: Track[]) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  tracks,
  initialQuery = '',
  downloadedIds = new Set(),
  onSelectTrack,
  onAddToQueue,
  onToggleDownload,
  onOpenArtist,
  onOpenAlbum,
  onSaveAsPlaylist,
  onClose
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<SearchFilterTab>('All');
  const [liveResults, setLiveResults] = useState<Track[]>([]);
  const [artistsResults, setArtistsResults] = useState<YTMusicArtistSummary[]>([]);
  const [albumsResults, setAlbumsResults] = useState<YTMusicAlbumSummary[]>([]);
  const [playlistsResults, setPlaylistsResults] = useState<YTMusicPlaylistSummary[]>([]);
  const [podcastResults, setPodcastResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [previewPlaylist, setPreviewPlaylist] = useState<{
    meta: YTMusicPlaylistSummary;
    songs: Track[];
    loading: boolean;
    saved?: boolean;
  } | null>(null);

  const tabs: SearchFilterTab[] = ['All', 'Songs', 'Albums', 'Artists', 'Podcasts', 'Playlists'];

  const matchingLibraryTracks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.album.toLowerCase().includes(q)
    );
  }, [tracks, query]);

  const runUnifiedSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setLiveResults([]);
      setArtistsResults([]);
      setAlbumsResults([]);
      setPlaylistsResults([]);
      setPodcastResults([]);
      return;
    }

    const directVideoId = newpipeService.extractVideoId(trimmed);
    if (directVideoId) {
      const directTrack = newpipeService.mapSearchItemToTrack({
        id: `newpipe-${directVideoId}`,
        videoId: directVideoId,
        title: `YouTube Stream (${directVideoId})`,
        artist: 'NewPipe Direct Stream',
        album: 'YouTube Music',
        duration: 210,
        artworkUrl: `https://i.ytimg.com/vi/${directVideoId}/sddefault.jpg`,
        source: 'NewPipe',
        providerType: 'newpipe'
      });
      setLiveResults([directTrack]);
      setArtistsResults([]);
      setAlbumsResults([]);
      setPlaylistsResults([]);
      setPodcastResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const [songsRes, entitiesRes, podcastsRes] = await Promise.allSettled([
        newpipeService.search(trimmed, 'all'),
        ytMusicService.searchEntities(trimmed),
        ytMusicService.searchPodcasts(trimmed)
      ]);

      if (songsRes.status === 'fulfilled') {
        setLiveResults(songsRes.value.items);
      } else {
        setLiveResults([]);
      }

      if (entitiesRes.status === 'fulfilled') {
        setArtistsResults(entitiesRes.value.artists || []);
        setAlbumsResults(entitiesRes.value.albums || []);
        setPlaylistsResults(entitiesRes.value.playlists || []);
      } else {
        setArtistsResults([]);
        setAlbumsResults([]);
        setPlaylistsResults([]);
      }

      if (podcastsRes.status === 'fulfilled') {
        setPodcastResults(podcastsRes.value);
      } else {
        setPodcastResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!query.trim()) {
      setLiveResults([]);
      setArtistsResults([]);
      setAlbumsResults([]);
      setPlaylistsResults([]);
      setPodcastResults([]);
      return;
    }
    const timer = setTimeout(() => {
      void runUnifiedSearch(query);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const unifiedSongs = useMemo(() => {
    const seenIds = new Set<string>();
    const seenMeta = new Set<string>();
    const combined: Track[] = [];

    for (const track of [...liveResults, ...matchingLibraryTracks]) {
      const normTitle = (track.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const normArtist = (track.artist || '').toLowerCase().split(',')[0].replace(/[^a-z0-9]/g, '');
      const metaKey = `${normTitle}::${normArtist}`;
      if (seenIds.has(track.id) || (normTitle && seenMeta.has(metaKey))) continue;
      seenIds.add(track.id);
      if (normTitle) seenMeta.add(metaKey);
      combined.push(track);
    }
    return combined;
  }, [liveResults, matchingLibraryTracks]);

  const openPlaylistPreview = async (pl: YTMusicPlaylistSummary) => {
    setPreviewPlaylist({ meta: pl, songs: [], loading: true, saved: false });
    try {
      const detail = await ytMusicService.getPlaylistTracks(pl.id);
      setPreviewPlaylist({
        meta: pl,
        songs: detail.songs,
        loading: false,
        saved: false
      });
    } catch {
      setPreviewPlaylist({ meta: pl, songs: [], loading: false, saved: false });
    }
  };

  const handleSavePreviewPlaylist = () => {
    if (!previewPlaylist || previewPlaylist.songs.length === 0 || !onSaveAsPlaylist) return;
    const pl: Playlist = {
      id: `pl-search-${previewPlaylist.meta.id}-${Date.now()}`,
      title: previewPlaylist.meta.title,
      description: 'Saved from Search',
      coverUrl: previewPlaylist.meta.coverUrl || previewPlaylist.songs[0]?.artworkUrl,
      trackIds: previewPlaylist.songs.map((s) => s.id),
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      isPinned: false
    };
    onSaveAsPlaylist(pl, previewPlaylist.songs);
    setPreviewPlaylist((prev) => (prev ? { ...prev, saved: true } : null));
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '--:--';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const renderSongRow = (track: Track, idx: number, list: Track[]) => {
    const isDl = downloadedIds.has(track.id);
    return (
      <div
        key={`sr-${track.id}-${idx}`}
        onClick={() => {
          onSelectTrack(track, list);
          onClose();
        }}
        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 flex-shrink-0">
            <img
              src={track.artworkUrl}
              alt={track.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-bold text-gray-900 dark:text-white truncate">
              {track.title}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
              {track.artist} · {formatDuration(track.duration)} · {track.quality.sourceProvider}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleDownload && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDownload(track);
              }}
              aria-label={isDl ? 'Downloaded' : 'Download'}
              className={`p-2 rounded-full ${
                isDl ? 'text-emerald-500' : 'text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              {isDl ? <CheckCircle2 className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            </button>
          )}
          {onAddToQueue && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue(track);
              }}
              aria-label="Add to Up Next"
              className="p-2 rounded-full text-gray-400 hover:text-gray-800 dark:hover:text-white"
            >
              <ListPlus className="w-4 h-4" />
            </button>
          )}
          <button
            aria-label={`Play ${track.title}`}
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          </button>
        </div>
      </div>
    );
  };

  const hasAnyResults =
    unifiedSongs.length > 0 ||
    albumsResults.length > 0 ||
    artistsResults.length > 0 ||
    podcastResults.length > 0 ||
    playlistsResults.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--mw-page-bg)] text-gray-900 dark:text-white select-none">
      <div className="max-w-2xl mx-auto w-full flex flex-col h-full px-4 pt-[max(14px,env(safe-area-inset-top))] pb-4">
        {/* Search Bar */}
        <div className="flex items-center gap-3 pb-2.5">
          <div className="flex-1 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white/90 dark:bg-white/10 border border-black/[0.06] dark:border-white/10 shadow-xs focus-within:ring-2 focus-within:ring-[var(--mw-primary)]">
            <BoldSearchIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search songs, movies, albums, artists, podcasts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void runUnifiedSearch(query);
              }}
              className="w-full bg-transparent text-sm focus:outline-none text-gray-900 dark:text-white placeholder-gray-500 font-semibold"
            />
            {isSearching ? (
              <Loader2 style={{ color: 'var(--mw-primary)' }} className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              query && (
                <button
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )
            )}
          </div>

          <button
            onClick={onClose}
            className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white px-1"
          >
            Cancel
          </button>
        </div>

        {/* Top Filter Tabs: All | Songs | Albums | Artists | Podcasts | Playlists */}
        {query.trim() && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-3 pt-0.5 flex-shrink-0">
            {tabs.map((tab) => {
              const selected = activeTab === tab;
              const badgeCount =
                tab === 'Songs'
                  ? unifiedSongs.length
                  : tab === 'Albums'
                  ? albumsResults.length
                  : tab === 'Artists'
                  ? artistsResults.length
                  : tab === 'Podcasts'
                  ? podcastResults.length
                  : tab === 'Playlists'
                  ? playlistsResults.length
                  : 0;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={
                    selected
                      ? { backgroundColor: 'var(--mw-primary)', color: '#ffffff' }
                      : undefined
                  }
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 ${
                    selected
                      ? 'shadow-xs'
                      : 'bg-black/[0.05] dark:bg-white/[0.08] text-gray-700 dark:text-gray-200 hover:bg-black/[0.08]'
                  }`}
                >
                  <span>{tab}</span>
                  {badgeCount > 0 && (
                    <span className={`text-[10px] ${selected ? 'opacity-85' : 'text-gray-500'}`}>
                      {badgeCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Results Region */}
        <div className="flex-1 overflow-y-auto space-y-5 py-1 scrollbar-none">
          {isSearching && !hasAnyResults ? (
            <div className="flex flex-col items-center justify-center h-56 gap-2.5 text-gray-500">
              <Loader2 style={{ color: 'var(--mw-primary)' }} className="w-7 h-7 animate-spin" />
              <p className="text-xs font-semibold">Searching across streaming services...</p>
            </div>
          ) : !query.trim() ? (
            <div className="py-16 text-center space-y-2 text-gray-500 dark:text-gray-400">
              <BoldSearchIcon className="w-9 h-9 mx-auto opacity-35" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Search songs, movie soundtracks, artists, podcasts &amp; playlists
              </p>
              <p className="text-xs max-w-xs mx-auto">
                Results aggregate YouTube Music, JioSaavn, Apple Podcasts, Audius &amp; your Library.
              </p>
            </div>
          ) : activeTab === 'All' ? (
            <>
              {artistsResults.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Artists
                    </h3>
                    <button
                      onClick={() => setActiveTab('Artists')}
                      style={{ color: 'var(--mw-primary)' }}
                      className="text-xs font-bold flex items-center gap-0.5"
                    >
                      <span>See all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3.5 overflow-x-auto pb-1 scrollbar-none">
                    {artistsResults.slice(0, 8).map((art, idx) => (
                      <div
                        key={`all-art-${art.id}-${idx}`}
                        onClick={() => {
                          if (onOpenArtist) {
                            onOpenArtist({
                              id: art.id.length < 18 ? art.id : undefined,
                              name: art.name
                            });
                          }
                        }}
                        className="w-22 flex flex-col items-center flex-shrink-0 cursor-pointer group"
                      >
                        <img
                          src={art.avatarUrl}
                          alt={art.name}
                          referrerPolicy="no-referrer"
                          className="w-20 h-20 rounded-full object-cover shadow-xs group-hover:scale-105 transition-transform bg-neutral-200 dark:bg-neutral-800"
                        />
                        <span className="text-xs font-bold mt-1.5 text-center truncate max-w-full">
                          {art.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {albumsResults.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Albums &amp; Soundtracks
                    </h3>
                    <button
                      onClick={() => setActiveTab('Albums')}
                      style={{ color: 'var(--mw-primary)' }}
                      className="text-xs font-bold flex items-center gap-0.5"
                    >
                      <span>See all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                    {albumsResults.slice(0, 8).map((alb, idx) => (
                      <div
                        key={`all-alb-${alb.id}-${idx}`}
                        onClick={() => {
                          if (onOpenAlbum) {
                            onOpenAlbum({
                              id: alb.id.startsWith('itunes-') ? undefined : alb.id,
                              title: alb.title,
                              artist: alb.artist
                            });
                          }
                        }}
                        className="w-32 flex-shrink-0 cursor-pointer group"
                      >
                        <img
                          src={alb.coverUrl}
                          alt={alb.title}
                          referrerPolicy="no-referrer"
                          className="w-32 h-32 rounded-2xl object-cover shadow-xs group-hover:scale-105 transition-transform bg-neutral-200 dark:bg-neutral-800"
                        />
                        <h4 className="text-xs font-bold mt-1.5 truncate">{alb.title}</h4>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {alb.artist} {alb.year ? `· ${alb.year}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {unifiedSongs.length > 0 && (
                <section className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Songs
                    </h3>
                    {unifiedSongs.length > 8 && (
                      <button
                        onClick={() => setActiveTab('Songs')}
                        style={{ color: 'var(--mw-primary)' }}
                        className="text-xs font-bold flex items-center gap-0.5"
                      >
                        <span>All {unifiedSongs.length} songs</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {unifiedSongs.slice(0, 12).map((t, idx) => renderSongRow(t, idx, unifiedSongs))}
                  </div>
                </section>
              )}

              {podcastResults.length > 0 && (
                <section className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Podcasts
                    </h3>
                    <button
                      onClick={() => setActiveTab('Podcasts')}
                      style={{ color: 'var(--mw-primary)' }}
                      className="text-xs font-bold flex items-center gap-0.5"
                    >
                      <span>See all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {podcastResults.slice(0, 4).map((ep, idx) => renderSongRow(ep, idx, podcastResults))}
                  </div>
                </section>
              )}

              {playlistsResults.length > 0 && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      Playlists
                    </h3>
                    <button
                      onClick={() => setActiveTab('Playlists')}
                      style={{ color: 'var(--mw-primary)' }}
                      className="text-xs font-bold flex items-center gap-0.5"
                    >
                      <span>See all</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {playlistsResults.slice(0, 4).map((pl, idx) => (
                      <div
                        key={`all-pl-${pl.id}-${idx}`}
                        onClick={() => void openPlaylistPreview(pl)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] cursor-pointer"
                      >
                        <img
                          src={pl.coverUrl}
                          alt={pl.title}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-bold truncate">{pl.title}</h4>
                          <p className="text-[11px] text-gray-500 truncate">
                            {pl.songCount > 0 ? `${pl.songCount} songs` : 'Playlist'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {!hasAnyResults && !isSearching && (
                <p className="text-center text-xs text-gray-500 dark:text-gray-400 py-16">
                  No results found for "{query}".
                </p>
              )}
            </>
          ) : activeTab === 'Songs' ? (
            unifiedSongs.length > 0 ? (
              <div className="space-y-1">
                {unifiedSongs.map((t, idx) => renderSongRow(t, idx, unifiedSongs))}
              </div>
            ) : (
              <p className="text-center text-xs text-gray-500 py-16">
                No matching songs for "{query}".
              </p>
            )
          ) : activeTab === 'Albums' ? (
            albumsResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {albumsResults.map((alb, idx) => (
                  <div
                    key={`tab-alb-${alb.id}-${idx}`}
                    onClick={() => {
                      if (onOpenAlbum) {
                        onOpenAlbum({
                          id: alb.id.startsWith('itunes-') ? undefined : alb.id,
                          title: alb.title,
                          artist: alb.artist
                        });
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] cursor-pointer group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 mb-2">
                      <img
                        src={alb.coverUrl}
                        alt={alb.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <h4 className="text-xs font-bold truncate">{alb.title}</h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {alb.artist} {alb.year ? `· ${alb.year}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-500">
                <Disc3 className="w-7 h-7 mx-auto mb-2 opacity-40" />
                No albums or movie soundtracks found for "{query}".
              </div>
            )
          ) : activeTab === 'Artists' ? (
            artistsResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {artistsResults.map((art, idx) => (
                  <button
                    key={`tab-art-${art.id}-${idx}`}
                    onClick={() => {
                      if (onOpenArtist) {
                        onOpenArtist({
                          id: art.id.length < 18 ? art.id : undefined,
                          name: art.name
                        });
                      }
                    }}
                    className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] flex items-center gap-3.5 text-left transition-colors"
                  >
                    <img
                      src={art.avatarUrl}
                      alt={art.name}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold truncate">{art.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {art.role || 'Artist'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-500">
                <UserRound className="w-7 h-7 mx-auto mb-2 opacity-40" />
                No artists found for "{query}".
              </div>
            )
          ) : activeTab === 'Podcasts' ? (
            podcastResults.length > 0 ? (
              <div className="space-y-1">
                {podcastResults.map((ep, idx) => renderSongRow(ep, idx, podcastResults))}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-500">
                <Mic className="w-7 h-7 mx-auto mb-2 opacity-40" />
                No podcast episodes found for "{query}".
              </div>
            )
          ) : playlistsResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {playlistsResults.map((pl, idx) => (
                <div
                  key={`tab-pl-${pl.id}-${idx}`}
                  onClick={() => void openPlaylistPreview(pl)}
                  className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] flex items-center gap-3.5 cursor-pointer transition-colors"
                >
                  <img
                    src={pl.coverUrl}
                    alt={pl.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 bg-neutral-200 dark:bg-neutral-800"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold truncate">{pl.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {pl.songCount > 0 ? `${pl.songCount} songs · ` : ''}Tap to open playlist
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-gray-500">
              <ListMusic className="w-7 h-7 mx-auto mb-2 opacity-40" />
              No playlists found for "{query}".
            </div>
          )}
        </div>
      </div>

      {previewPlaylist && (
        <div
          onClick={() => setPreviewPlaylist(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl h-[78dvh] bg-white dark:bg-[#141716] rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl border-t border-black/10 dark:border-white/10"
          >
            <div className="p-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={previewPlaylist.meta.coverUrl}
                  alt={previewPlaylist.meta.title}
                  className="w-13 h-13 rounded-xl object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="font-display text-base font-extrabold truncate">
                    {previewPlaylist.meta.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {previewPlaylist.songs.length} playable tracks
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPreviewPlaylist(null)}
                aria-label="Close playlist preview"
                className="w-9 h-9 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {previewPlaylist.songs.length > 0 && (
              <div className="px-4 py-2.5 flex items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.07]">
                <button
                  onClick={() => {
                    onSelectTrack(previewPlaylist.songs[0], previewPlaylist.songs);
                    setPreviewPlaylist(null);
                    onClose();
                  }}
                  style={{ backgroundColor: 'var(--mw-primary)' }}
                  className="px-4 py-2 rounded-full text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Play All</span>
                </button>

                <button
                  onClick={() => {
                    const shuffled = [...previewPlaylist.songs].sort(() => Math.random() - 0.5);
                    onSelectTrack(shuffled[0], shuffled);
                    setPreviewPlaylist(null);
                    onClose();
                  }}
                  style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                  className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Shuffle</span>
                </button>

                {onSaveAsPlaylist && (
                  <button
                    onClick={handleSavePreviewPlaylist}
                    className="ml-auto px-3.5 py-2 rounded-full bg-black/5 dark:bg-white/10 text-xs font-bold flex items-center gap-1.5"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>{previewPlaylist.saved ? 'Saved!' : 'Save'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-none">
              {previewPlaylist.loading ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-gray-500">
                  <Loader2 style={{ color: 'var(--mw-primary)' }} className="w-6 h-6 animate-spin" />
                  <span>Loading playlist songs...</span>
                </div>
              ) : previewPlaylist.songs.length > 0 ? (
                previewPlaylist.songs.map((song, idx) =>
                  renderSongRow(song, idx, previewPlaylist.songs)
                )
              ) : (
                <p className="py-16 text-center text-xs text-gray-500">
                  No tracks returned for this playlist.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
