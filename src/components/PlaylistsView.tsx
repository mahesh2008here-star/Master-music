import React, { useState, useEffect } from 'react';
import {
  Plus,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Users,
  Settings,
  Heart,
  CheckCircle2,
  Download,
  RefreshCw,
  FolderOpen,
  ListMusic,
  Play,
  Pin,
  MoreHorizontal,
  Trash2,
  X,
  Loader2,
  Disc3,
  Mic,
  Check
} from 'lucide-react';
import { Playlist, Track, Album, Artist, ListeningStats } from '../types/music';
import { newpipeService } from '../services/newpipeService';
import { BoldHistoryIcon, SpotifyEmblemIcon } from './CustomIcons';

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: Track[];
  albums?: Album[];
  artists?: Artist[];
  stats?: ListeningStats;
  downloadedIds?: Set<string>;
  showInlineNav?: boolean;
  onNavigateTab?: (tab: 'feed' | 'stats' | 'playlists') => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onCreatePlaylist: () => void;
  onImportPlaylist?: (playlist: Playlist, addedTracks: Track[]) => void;
  onOpenGenerator: () => void;
  onOpenLocalMusic: () => void;
  onOpenDownloads?: () => void;
  onOpenStats?: () => void;
  onOpenJam?: () => void;
  onOpenSettings?: () => void;
  onOpenArtist?: (artist: { id?: string; name: string }) => void;
  onOpenAlbum?: (album: { id?: string; title?: string; artist?: string }) => void;
  onTogglePinPlaylist?: (playlistId: string) => void;
  onDeletePlaylist?: (playlistId: string) => void;
}

type CategoryTab = 'Playlists' | 'Songs' | 'Albums' | 'Artists' | 'Podcasts';
type SortMode = 'Date added' | 'A–Z' | 'Tracks' | 'Most Played';
type SmartSheetKind = 'liked' | 'exported' | 'cached' | 'top50' | 'bottom50' | 'history' | null;

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  tracks,
  albums = [],
  artists = [],
  stats,
  downloadedIds = new Set(),
  showInlineNav = false,
  onNavigateTab,
  onSelectPlaylist,
  onPlayTrack,
  onCreatePlaylist,
  onImportPlaylist,
  onOpenGenerator,
  onOpenLocalMusic,
  onOpenDownloads,
  onOpenStats,
  onOpenJam,
  onOpenSettings,
  onOpenArtist,
  onOpenAlbum,
  onTogglePinPlaylist,
  onDeletePlaylist
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('Playlists');
  const [sortMode, setSortMode] = useState<SortMode>('Date added');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [menuPlaylistId, setMenuPlaylistId] = useState<string | null>(null);
  const [smartSheet, setSmartSheet] = useState<SmartSheetKind>(null);
  const [exportedRecords, setExportedRecords] = useState<Array<{ title: string; date: string; tracks: Track[] }>>([]);

  // Spotify Importer Modal State
  const [spotifyModalOpen, setSpotifyModalOpen] = useState(false);
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyNotice, setSpotifyNotice] = useState<string | null>(null);
  const [spotifyConnectedUser, setSpotifyConnectedUser] = useState<string | null>(null);

  // Podcasts State when user switches to Podcasts tab
  const [podcastTracks, setPodcastTracks] = useState<Track[]>([]);
  const [isLoadingPodcasts, setIsLoadingPodcasts] = useState(false);

  useEffect(() => {
    if (activeCategory === 'Podcasts' && podcastTracks.length === 0) {
      setIsLoadingPodcasts(true);
      newpipeService
        .search('podcast audio show episode')
        .then((res) => setPodcastTracks(res.items.slice(0, 14)))
        .catch(() => {})
        .finally(() => setIsLoadingPodcasts(false));
    }
  }, [activeCategory, podcastTracks.length]);

  const cycleSort = () => {
    const order: SortMode[] = ['Date added', 'A–Z', 'Tracks', 'Most Played'];
    setSortMode(order[(order.indexOf(sortMode) + 1) % order.length]);
  };

  const sortedPlaylists = [...playlists].sort((a, b) => {
    let cmp = 0;
    if (sortMode === 'A–Z') {
      cmp = a.title.localeCompare(b.title);
    } else if (sortMode === 'Tracks') {
      cmp = b.trackIds.length - a.trackIds.length;
    } else {
      if (a.isPinned !== b.isPinned) cmp = a.isPinned ? -1 : 1;
    }
    return sortAsc ? -cmp : cmp;
  });

  const sortedSongs = [...tracks].sort((a, b) => {
    const cmp = sortMode === 'A–Z' ? a.title.localeCompare(b.title) : a.duration - b.duration;
    return sortAsc ? -cmp : cmp;
  });

  const likedTracks = tracks.filter((t) => t.isLiked);
  const recentPlaysList = (stats?.recentPlays || []).map((r) => r.track);
  const cachedList = tracks.filter((t) => downloadedIds.has(t.id) || t.streamUrl);

  const top50List = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const rp of stats?.recentPlays || []) {
      counts.set(rp.track.id, (counts.get(rp.track.id) || 0) + 1);
    }
    return [...tracks].sort((a, b) => (counts.get(b.id) || 0) - (counts.get(a.id) || 0)).slice(0, 50);
  }, [tracks, stats?.recentPlays]);

  const bottom50List = React.useMemo(() => [...top50List].reverse(), [top50List]);

  const handleExportLibraryBundle = () => {
    const m3uLines = [
      '#EXTM3U',
      ...tracks.map((t) => `#EXTINF:${Math.round(t.duration)},${t.artist} - ${t.title}\n${t.streamUrl || ''}`)
    ].join('\n');
    const blob = new Blob([m3uLines], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `lastwave_library_${new Date().toISOString().slice(0, 10)}.m3u`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportedRecords((prev) => [
      { title: filename, date: new Date().toLocaleTimeString(), tracks: tracks.slice(0, 12) },
      ...prev
    ]);
    setSmartSheet('exported');
  };

  const handleImportSpotify = async (presetName?: string) => {
    const raw = (presetName || spotifyQuery).trim();
    if (!raw) return;
    setSpotifyLoading(true);
    setSpotifyNotice(null);
    try {
      const cleanName = raw
        .replace(/^https?:\/\/open\.spotify\.com\/playlist\//i, '')
        .split('?')[0]
        .replace(/[^a-zA-Z0-9 ]/g, ' ')
        .trim();
      const searchRes = await newpipeService.search(cleanName || 'Spotify Top Hits 2026');
      const items = searchRes.items.slice(0, 14);
      if (items.length === 0) {
        setSpotifyNotice('No matching playable streams found for that playlist query.');
        return;
      }
      const plTitle = presetName || (raw.includes('spotify.com') ? 'Imported Spotify Playlist' : raw);
      const created: Playlist = {
        id: `sp-${Date.now()}`,
        title: `${plTitle} (Spotify)`,
        description: 'Imported via LastWave Spotify Resolver',
        coverUrl: items[0].artworkUrl,
        trackIds: items.map((t) => t.id),
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        isPinned: false
      };
      if (onImportPlaylist) {
        onImportPlaylist(created, items);
      }
      setSpotifyConnectedUser('Spotify Sync Active');
      setSpotifyModalOpen(false);
      setSpotifyQuery('');
    } finally {
      setSpotifyLoading(false);
    }
  };

  const smartGridItems: Array<{
    id: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }> = [
    {
      id: 'liked',
      label: 'Liked',
      icon: <Heart className="w-[18px] h-[18px] fill-current" />,
      onClick: () => setSmartSheet('liked')
    },
    {
      id: 'downloaded',
      label: 'Downloaded',
      icon: <CheckCircle2 className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: () => (onOpenDownloads ? onOpenDownloads() : setSmartSheet('cached'))
    },
    {
      id: 'exported',
      label: 'Exported',
      icon: <Download className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: handleExportLibraryBundle
    },
    {
      id: 'cached',
      label: 'Cached',
      icon: <RefreshCw className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: () => setSmartSheet('cached')
    },
    {
      id: 'top50',
      label: 'My top 50',
      icon: <TrendingUp className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: () => setSmartSheet('top50')
    },
    {
      id: 'bottom50',
      label: 'My bottom 50',
      icon: <TrendingDown className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: () => setSmartSheet('bottom50')
    },
    {
      id: 'local',
      label: 'Local',
      icon: <FolderOpen className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: onOpenLocalMusic
    },
    {
      id: 'tastemix',
      label: 'Taste Mix',
      icon: <ListMusic className="w-[18px] h-[18px] stroke-[2.2]" />,
      onClick: onOpenGenerator
    }
  ];

  const categories: CategoryTab[] = ['Playlists', 'Songs', 'Albums', 'Artists', 'Podcasts'];

  const sheetData: { title: string; items: Track[]; subtitle: string } | null =
    smartSheet === 'liked'
      ? { title: 'Liked Songs', subtitle: `${likedTracks.length} favorites`, items: likedTracks }
      : smartSheet === 'cached'
      ? { title: 'Cached & Stream-Ready', subtitle: `${cachedList.length} tracks`, items: cachedList }
      : smartSheet === 'top50'
      ? { title: 'My top 50', subtitle: 'Most played & heavy rotation', items: top50List }
      : smartSheet === 'bottom50'
      ? { title: 'My bottom 50', subtitle: 'Forgotten & least played gems', items: bottom50List }
      : smartSheet === 'history'
      ? { title: 'Listening History', subtitle: `${recentPlaysList.length} recent plays`, items: recentPlaysList }
      : smartSheet === 'exported'
      ? {
          title: 'Exported Playlists',
          subtitle: exportedRecords[0] ? `Saved ${exportedRecords[0].title}` : 'M3U Playlist Bundle',
          items: exportedRecords[0]?.tracks || tracks.slice(0, 10)
        }
      : null;

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-44 select-none transition-colors">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--mw-page-bg)]/92 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-5 pt-[max(14px,env(safe-area-inset-top))] pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display text-[28px] leading-none font-extrabold tracking-tight text-gray-900 dark:text-white">
              Library
            </h1>

            {showInlineNav && onNavigateTab && (
              <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                {(['feed', 'stats', 'playlists'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => onNavigateTab(tab)}
                    style={
                      tab === 'playlists'
                        ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                      tab === 'playlists' ? '' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {tab === 'playlists' ? 'Library' : tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => setSmartSheet('history')}
              aria-label="Listening history"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <BoldHistoryIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => onOpenStats && onOpenStats()}
              aria-label="Replay Statistics"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <TrendingUp className="w-5 h-5 stroke-[2.2]" />
            </button>

            <button
              onClick={() => onOpenJam && onOpenJam()}
              aria-label="Friends Jam"
              className="w-10 h-10 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <Users className="w-5 h-5 stroke-[2.1]" />
            </button>

            <button
              onClick={() => onOpenSettings && onOpenSettings()}
              aria-label="Settings"
              style={{
                backgroundColor: 'var(--mw-stats-bg)',
                color: 'var(--mw-primary)',
                borderColor: 'var(--mw-primary)'
              }}
              className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-transform active:scale-95"
            >
              <Settings className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 pt-1 space-y-4">
        {/* Category Chips: Playlists | Songs | Albums | Artists | Podcasts */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          {categories.map((cat) => {
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={
                  active
                    ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                    : { backgroundColor: 'var(--mw-stats-bg)' }
                }
                className={`px-4 py-2 rounded-xl text-[12.5px] font-bold whitespace-nowrap shrink-0 transition-all ${
                  active
                    ? 'shadow-xs ring-1 ring-[var(--mw-primary)]/30'
                    : 'text-gray-800 dark:text-gray-200 dark:!bg-white/[0.08] hover:brightness-97'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sort Pill & Direction Arrow */}
        <div className="flex items-center gap-2">
          <button
            onClick={cycleSort}
            style={{ backgroundColor: 'var(--mw-stats-bg)' }}
            className="px-4 py-2 rounded-full dark:!bg-white/[0.08] text-xs font-bold text-gray-800 dark:text-gray-200 hover:brightness-97 transition-all"
          >
            {sortMode}
          </button>

          <button
            onClick={() => setSortAsc((p) => !p)}
            aria-label="Toggle sort direction"
            style={{ backgroundColor: 'var(--mw-stats-bg)' }}
            className="w-9 h-9 rounded-full dark:!bg-white/[0.08] flex items-center justify-center text-gray-800 dark:text-gray-200 hover:brightness-97 transition-all"
          >
            {sortAsc ? (
              <ChevronDown className="w-4 h-4 stroke-[2.4]" />
            ) : (
              <ChevronUp className="w-4 h-4 stroke-[2.4]" />
            )}
          </button>
        </div>

        {/* 2x4 Pastel Bento Smart Collection Grid */}
        <section className="grid grid-cols-2 gap-2.5">
          {smartGridItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              style={{ backgroundColor: 'var(--mw-stats-bg)' }}
              className="dark:!bg-white/[0.06] rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left hover:brightness-97 active:scale-[0.98] transition-all border border-black/[0.03] dark:border-white/[0.06]"
            >
              <span className="text-gray-900 dark:text-white flex-shrink-0">{item.icon}</span>
              <span className="text-[14px] font-bold text-gray-900 dark:text-white truncate">
                {item.label}
              </span>
            </button>
          ))}
        </section>

        {/* Main Content Switcher per Top Category Chip */}
        {activeCategory === 'Playlists' && (
          <section className="pt-2 space-y-3.5">
            <h2 className="font-display text-[22px] font-extrabold tracking-tight text-gray-900 dark:text-white">
              Playlists
            </h2>

            {/* Spotify Playlists Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SpotifyEmblemIcon className="w-6 h-6" />
                <span className="font-display text-[15px] font-bold text-gray-900 dark:text-white">
                  Spotify Playlists
                </span>
                {spotifyConnectedUser && (
                  <span
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                  >
                    Connected
                  </span>
                )}
              </div>

              <button
                onClick={onCreatePlaylist}
                aria-label="Create new playlist"
                className="w-10 h-10 rounded-full bg-[#3A3A3A] dark:bg-white/20 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-5 h-5 stroke-[2.3]" />
              </button>
            </div>

            {/* Spotify Connect Card */}
            <div
              style={{ backgroundColor: 'var(--mw-stats-bg)' }}
              className="dark:!bg-white/[0.05] rounded-3xl p-6 flex flex-col items-center justify-center gap-4 border border-black/[0.03] dark:border-white/[0.07]"
            >
              <div className="w-16 h-16 rounded-full bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center">
                <SpotifyEmblemIcon className="w-9 h-9" />
              </div>

              <button
                onClick={() => setSpotifyModalOpen(true)}
                style={{ backgroundColor: 'var(--mw-primary)' }}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-white shadow-sm hover:brightness-95 active:scale-95 transition-all"
              >
                {spotifyConnectedUser ? 'Import Another Spotify Playlist' : 'Connect Spotify Account'}
              </button>
            </div>

            {/* Saved & Custom Playlists List */}
            <div className="rounded-3xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.07] overflow-hidden">
              {sortedPlaylists.map((playlist) => {
                const isExpanded = expandedPlaylistId === playlist.id;
                const playlistTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));

                return (
                  <div key={playlist.id}>
                    <div
                      onClick={() =>
                        playlist.id === 'local-songs'
                          ? onOpenLocalMusic()
                          : setExpandedPlaylistId(isExpanded ? null : playlist.id)
                      }
                      className="flex items-center justify-between p-3.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-black/[0.05] dark:bg-white/[0.08] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {playlist.coverUrl ? (
                            <img
                              src={playlist.coverUrl}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : playlist.id === 'liked-songs' ? (
                            <Heart className="w-5 h-5 fill-[#FA243C] text-[#FA243C]" />
                          ) : playlist.id === 'local-songs' ? (
                            <FolderOpen className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          ) : (
                            <ListMusic className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-[14.5px] font-bold text-gray-900 dark:text-white truncate">
                              {playlist.title}
                            </h3>
                            {playlist.isPinned && (
                              <Pin
                                style={{ color: 'var(--mw-primary)' }}
                                className="w-3.5 h-3.5 fill-current rotate-45 flex-shrink-0"
                              />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate tabular-nums">
                            {playlist.trackIds.length} tracks · {playlist.createdAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        {playlistTracks.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPlaylist(playlist);
                            }}
                            aria-label={`Play ${playlist.title}`}
                            style={{ color: 'var(--mw-primary)' }}
                            className="w-10 h-10 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center"
                          >
                            <Play className="w-4 h-4 fill-current translate-x-0.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuPlaylistId(menuPlaylistId === playlist.id ? null : playlist.id);
                          }}
                          aria-label="Playlist options"
                          className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-800 dark:hover:text-white"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {menuPlaylistId === playlist.id && (
                      <div className="px-4 py-2.5 bg-black/[0.03] dark:bg-white/[0.04] border-t border-black/[0.05] dark:border-white/[0.06] flex items-center gap-2">
                        {onTogglePinPlaylist && (
                          <button
                            onClick={() => {
                              onTogglePinPlaylist(playlist.id);
                              setMenuPlaylistId(null);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-white/10 text-xs font-semibold"
                          >
                            <Pin className="w-3 h-3" />
                            <span>{playlist.isPinned ? 'Unpin' : 'Pin'}</span>
                          </button>
                        )}
                        {!playlist.isSystem && onDeletePlaylist && (
                          <button
                            onClick={() => {
                              onDeletePlaylist(playlist.id);
                              setMenuPlaylistId(null);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-xs font-semibold text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onSelectPlaylist(playlist);
                            setMenuPlaylistId(null);
                          }}
                          style={{ backgroundColor: 'var(--mw-primary)' }}
                          className="ml-auto px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white"
                        >
                          Play All
                        </button>
                      </div>
                    )}

                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.05] dark:border-white/[0.06] divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                        {playlistTracks.length === 0 ? (
                          <p className="text-xs text-gray-500 py-4 text-center">No tracks yet.</p>
                        ) : (
                          playlistTracks.map((t, idx) => (
                            <div
                              key={`${t.id}-${idx}`}
                              onClick={() => onPlayTrack(t, playlistTracks)}
                              className="flex items-center gap-3 py-2 cursor-pointer hover:opacity-80"
                            >
                              <img
                                src={t.artworkUrl}
                                alt={t.title}
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold truncate">{t.title}</h4>
                                <p className="text-[11px] text-gray-500 truncate">{t.artist}</p>
                              </div>
                              <Play className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeCategory === 'Songs' && (
          <section className="pt-2 space-y-3">
            <h2 className="font-display text-[20px] font-extrabold">Songs ({sortedSongs.length})</h2>
            <div className="rounded-3xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.07] overflow-hidden">
              {sortedSongs.map((t, idx) => (
                <div
                  key={`lib-song-${t.id}-${idx}`}
                  onClick={() => onPlayTrack(t, sortedSongs)}
                  className="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={t.artworkUrl}
                      alt={t.title}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold truncate">{t.title}</h4>
                      <p className="text-xs text-gray-500 truncate">
                        {t.artist} · {t.quality.badgeLabel}
                      </p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-[var(--mw-primary)] fill-current flex-shrink-0" />
                </div>
              ))}
            </div>
          </section>
        )}

        {activeCategory === 'Albums' && (
          <section className="pt-2 space-y-3">
            <h2 className="font-display text-[20px] font-extrabold">Albums</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {albums.map((alb) => (
                <div
                  key={alb.id}
                  onClick={() => onOpenAlbum && onOpenAlbum({ title: alb.title, artist: alb.artist })}
                  className="p-2.5 rounded-2xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] cursor-pointer"
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 mb-2">
                    <img src={alb.coverUrl} alt={alb.title} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="text-xs font-bold truncate">{alb.title}</h4>
                  <p className="text-[11px] text-gray-500 truncate">{alb.artist}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeCategory === 'Artists' && (
          <section className="pt-2 space-y-3">
            <h2 className="font-display text-[20px] font-extrabold">Artists</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {artists.map((art) => (
                <button
                  key={art.id}
                  onClick={() => onOpenArtist && onOpenArtist({ name: art.name })}
                  className="p-3 rounded-2xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] flex items-center gap-3 text-left"
                >
                  <img src={art.avatarUrl} alt={art.name} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold truncate">{art.name}</h4>
                    <p className="text-[11px] text-gray-500 truncate">{art.genre}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {activeCategory === 'Podcasts' && (
          <section className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <Mic style={{ color: 'var(--mw-primary)' }} className="w-4 h-4" />
              <h2 className="font-display text-[20px] font-extrabold">Podcasts &amp; Shows</h2>
            </div>
            {isLoadingPodcasts ? (
              <div className="py-10 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading podcasts...</span>
              </div>
            ) : (
              <div className="rounded-3xl bg-white/80 dark:bg-white/[0.05] border border-black/[0.05] dark:border-white/[0.08] divide-y divide-black/[0.05] dark:divide-white/[0.07] overflow-hidden">
                {podcastTracks.map((ep, idx) => (
                  <div
                    key={`pod-${ep.id}-${idx}`}
                    onClick={() => onPlayTrack(ep, podcastTracks)}
                    className="flex items-center justify-between p-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={ep.artworkUrl} alt={ep.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">{ep.title}</h4>
                        <p className="text-[11px] text-gray-500 truncate">{ep.artist}</p>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-[var(--mw-primary)] fill-current flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Spotify Account / Playlist Importer Sheet */}
      {spotifyModalOpen && (
        <div
          onClick={() => setSpotifyModalOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-3"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#161918] p-5 shadow-2xl space-y-4 border border-black/[0.06] dark:border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <SpotifyEmblemIcon className="w-7 h-7" />
                <div>
                  <h3 className="font-display text-base font-extrabold">Connect &amp; Import Spotify</h3>
                  <p className="text-[11px] text-gray-500">Sync public playlists into playable 320 kbps queues</p>
                </div>
              </div>
              <button onClick={() => setSpotifyModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={spotifyQuery}
                onChange={(e) => setSpotifyQuery(e.target.value)}
                placeholder="Paste Spotify playlist URL or enter playlist name..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/[0.05] dark:bg-white/[0.08] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1ED760]"
              />
              {spotifyNotice && <p className="text-xs text-amber-500">{spotifyNotice}</p>}
              <button
                onClick={() => void handleImportSpotify()}
                disabled={spotifyLoading || !spotifyQuery.trim()}
                className="w-full py-2.5 rounded-full bg-[#1ED760] text-[#0D1A12] font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {spotifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                <span>{spotifyLoading ? 'Resolving Streams...' : 'Import & Sync Playlist'}</span>
              </button>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 mb-2">Quick Curated Spotify Playlists</p>
              <div className="flex flex-wrap gap-1.5">
                {["Today's Top Hits", 'Hot Hits India', 'Lofi Beats', 'Bollywood Mush'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => void handleImportSpotify(preset)}
                    disabled={spotifyLoading}
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="px-3 py-1.5 rounded-full text-[11px] font-bold hover:brightness-95"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Collection Sheet (Liked / Cached / My top 50 / My bottom 50 / History / Exported) */}
      {sheetData && (
        <div
          onClick={() => setSmartSheet(null)}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg h-[72dvh] bg-white dark:bg-[#141716] rounded-t-[28px] flex flex-col overflow-hidden shadow-2xl border-t border-black/10 dark:border-white/10"
          >
            <div className="px-5 py-4 border-b border-black/[0.06] dark:border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-extrabold">{sheetData.title}</h3>
                <p className="text-xs text-gray-500">{sheetData.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                {sheetData.items.length > 0 && (
                  <button
                    onClick={() => {
                      onPlayTrack(sheetData.items[0], sheetData.items);
                      setSmartSheet(null);
                    }}
                    style={{ backgroundColor: 'var(--mw-primary)' }}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play All</span>
                  </button>
                )}
                <button
                  onClick={() => setSmartSheet(null)}
                  className="w-9 h-9 rounded-full bg-black/[0.05] dark:bg-white/10 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-black/[0.05] dark:divide-white/[0.06] scrollbar-none">
              {sheetData.items.length === 0 ? (
                <div className="py-16 text-center text-xs text-gray-500">
                  <Disc3 className="w-7 h-7 mx-auto mb-2 opacity-40" />
                  No tracks in this collection yet.
                </div>
              ) : (
                sheetData.items.map((tr, i) => (
                  <div
                    key={`sheet-${tr.id}-${i}`}
                    onClick={() => {
                      onPlayTrack(tr, sheetData.items);
                      setSmartSheet(null);
                    }}
                    className="flex items-center justify-between py-2.5 cursor-pointer hover:opacity-80"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <img src={tr.artworkUrl} alt={tr.title} className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold truncate">{tr.title}</h4>
                        <p className="text-[11px] text-gray-500 truncate">{tr.artist}</p>
                      </div>
                    </div>
                    <Play className="w-4 h-4 text-[var(--mw-primary)] fill-current flex-shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
