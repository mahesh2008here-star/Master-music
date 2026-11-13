import React, { useState } from 'react';
import { User, Headphones, ArrowRight, BarChart3 } from 'lucide-react';
import { ListeningStats, LastFmProfile, Track } from '../types/music';
import { BoldDownloadIcon, BoldSearchIcon } from './CustomIcons';

interface StatisticsViewProps {
  stats: ListeningStats;
  lastFmProfile: LastFmProfile;
  showInlineNav?: boolean;
  onNavigateTab?: (tab: 'feed' | 'stats' | 'playlists') => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenDownloads?: () => void;
  onPlayTrack: (track: Track) => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({
  stats,
  lastFmProfile,
  showInlineNav = false,
  onNavigateTab,
  onOpenSearch,
  onOpenSettings,
  onOpenDownloads,
  onPlayTrack
}) => {
  const [filter, setFilter] = useState<'most_played' | 'recent'>('most_played');

  const exportCsvStats = () => {
    const rows = [
      ['Title', 'Artist', 'Album', 'PlayedAt'].join(','),
      ...stats.recentPlays.map((p) =>
        [
          `"${p.track.title.replace(/"/g, '""')}"`,
          `"${p.track.artist.replace(/"/g, '""')}"`,
          `"${p.track.album.replace(/"/g, '""')}"`,
          `"${p.playedAt}"`
        ].join(',')
      )
    ].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masterwave_scrobbles_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-40 select-none transition-colors">
      {/* Apple Music Replay Sticky Frosted Header */}
      <header className="sticky top-0 z-30 bg-white/88 dark:bg-black/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-display text-[30px] leading-none font-extrabold tracking-tight text-gray-900 dark:text-white">
              Replay
            </h1>

            {showInlineNav && onNavigateTab && (
              <div className="flex items-center gap-1 p-1 rounded-full bg-black/[0.05] dark:bg-white/[0.08]">
                {(['feed', 'stats', 'playlists'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => onNavigateTab(tab)}
                    style={
                      tab === 'stats'
                        ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                        : undefined
                    }
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${
                      tab === 'stats' ? '' : 'text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {tab === 'playlists' ? 'Library' : tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => (onOpenDownloads ? onOpenDownloads() : exportCsvStats())}
              aria-label="Downloads and export"
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <BoldDownloadIcon className="w-[20px] h-[20px]" />
            </button>

            <button
              onClick={onOpenSearch}
              aria-label="Search"
              className="w-11 h-11 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"
            >
              <BoldSearchIcon className="w-[20px] h-[20px]" />
            </button>

            <button
              onClick={onOpenSettings}
              aria-label="Profile & Settings"
              style={{
                backgroundColor: 'var(--mw-tint)',
                color: 'var(--mw-primary)'
              }}
              className="w-9 h-9 ml-1 rounded-full flex items-center justify-center transition-transform active:scale-95"
            >
              <User className="w-[18px] h-[18px] stroke-[2.3]" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 md:px-6 pt-4 space-y-6">
        {/* Account & CSV Export Header Strip */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <button
            onClick={onOpenSettings}
            className="font-semibold text-gray-900 dark:text-white hover:underline"
          >
            {lastFmProfile.isConnected ? `Last.fm · ${lastFmProfile.username}` : 'Guest Session · Connect Last.fm'}
          </button>

          <button
            onClick={exportCsvStats}
            className="flex items-center gap-1.5 font-mono tabular-nums font-semibold hover:text-gray-900 dark:hover:text-white"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{stats.totalPlays} scrobbles · Export CSV</span>
          </button>
        </div>

        {/* Highlighted Apple Music Replay Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div
            onClick={onOpenSettings}
            style={{
              backgroundColor: 'var(--mw-primary)'
            }}
            className="p-5 rounded-2xl text-white flex items-center justify-between cursor-pointer shadow-md hover:brightness-95 transition-all"
          >
            <div>
              <span className="text-xs font-medium text-white/80 block">Total Plays</span>
              <span className="font-display text-4xl font-extrabold tabular-nums mt-1 block">
                {stats.totalPlays > 0 ? stats.totalPlays : '0'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
              Unique Tracks
            </span>
            <span className="font-display text-3xl font-extrabold tabular-nums mt-1 block">
              {stats.uniqueTracks > 0 ? stats.uniqueTracks : '0'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
              Artists Discovered
            </span>
            <span className="font-display text-3xl font-extrabold tabular-nums mt-1 block">
              {stats.uniqueArtists > 0 ? stats.uniqueArtists : '0'}
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
              Albums Played
            </span>
            <span className="font-display text-3xl font-extrabold tabular-nums mt-1 block">
              {stats.uniqueAlbums > 0 ? stats.uniqueAlbums : '0'}
            </span>
          </div>
        </div>

        {/* Listening History / Most Played */}
        <section className="rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-extrabold tracking-tight">
              Listening History
            </h2>

            <div className="flex items-center p-1 rounded-lg bg-black/[0.05] dark:bg-white/[0.08]">
              <button
                onClick={() => setFilter('most_played')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filter === 'most_played'
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Most Played
              </button>
              <button
                onClick={() => setFilter('recent')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  filter === 'recent'
                    ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Recent
              </button>
            </div>
          </div>

          {stats.recentPlays.length > 0 ? (
            <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
              {stats.recentPlays.map((item, idx) => (
                <div
                  key={`${item.track.id}-${idx}`}
                  onClick={() => onPlayTrack(item.track)}
                  className="flex items-center justify-between py-2.5 hover:opacity-80 cursor-pointer transition-opacity"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <span className="text-xs font-mono tabular-nums font-semibold text-gray-400 w-5 text-center">
                      {idx + 1}
                    </span>
                    <img
                      src={item.track.artworkUrl}
                      alt={item.track.title}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover bg-neutral-200 dark:bg-neutral-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {item.track.title}
                      </h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                        {item.track.artist} · {item.track.album}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono tabular-nums text-gray-400 flex-shrink-0">
                    {item.playedAt}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <BarChart3 className="w-7 h-7 text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                No listening history yet
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
