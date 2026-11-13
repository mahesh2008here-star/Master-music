import React, { useState } from 'react';
import {
  ArrowLeft,
  Search,
  Users,
  Puzzle,
  Radio,
  Youtube,
  PlayCircle,
  Palette,
  Volume2,
  ListMusic,
  HardDrive,
  Info,
  ChevronRight,
  Check,
  Loader2
} from 'lucide-react';
import { LastFmProfile, ListeningStats, Playlist, Track } from '../types/music';
import { newpipeService } from '../services/newpipeService';
import { MasterWaveSettings } from '../services/themeService';
import {
  AppearanceVisualsScreen,
  AudioPlaybackScreen,
  LibraryContentScreen,
  AboutCommunityScreen
} from './SettingsSubScreens';

type SubScreen = 'main' | 'appearance' | 'audio' | 'library' | 'about';

interface SettingsViewProps {
  lastFmProfile: LastFmProfile;
  settings: MasterWaveSettings;
  tracks: Track[];
  stats: ListeningStats;
  onUpdateSettings: (patch: Partial<MasterWaveSettings>) => void;
  onImportPlaylist: (playlist: Playlist, importedTracks: Track[]) => void;
  onConnectLastFm: (username: string) => void;
  onDisconnectLastFm: () => void;
  onOpenEqualizer: () => void;
  onOpenAudioOutput: () => void;
  onOpenJam?: () => void;
  onOpenDownloads?: () => void;
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  lastFmProfile,
  settings,
  tracks,
  stats,
  onUpdateSettings,
  onImportPlaylist,
  onConnectLastFm,
  onDisconnectLastFm,
  onOpenEqualizer,
  onOpenAudioOutput,
  onOpenJam,
  onOpenDownloads,
  onBack
}) => {
  const [subScreen, setSubScreen] = useState<SubScreen>('main');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [lastFmInput, setLastFmInput] = useState('');
  const [ytSyncChannel, setYtSyncChannel] = useState('YouTube Music Guest Bridge');
  const [spotifyImportQuery, setSpotifyImportQuery] = useState('');
  const [isImportingSpotify, setIsImportingSpotify] = useState(false);

  const [providers, setProviders] = useState({
    newpipe: newpipeService.getSavedConfig().enabled,
    innertube: true,
    hires_flac: true,
    local: true
  });
  const [newpipeInstanceUrl, setNewpipeInstanceUrl] = useState(
    newpipeService.getSavedConfig().instanceUrl
  );
  const [newpipeFilter, setNewpipeFilter] = useState(
    newpipeService.getSavedConfig().filter
  );
  const [newpipeProbeStatus, setNewpipeProbeStatus] = useState<string | null>(null);
  const [isProbingNewpipe, setIsProbingNewpipe] = useState(false);

  // Delegate to sub-screens (Pages 10 - 18)
  if (subScreen === 'appearance') {
    return (
      <AppearanceVisualsScreen
        settings={settings}
        onUpdate={onUpdateSettings}
        onBack={() => setSubScreen('main')}
      />
    );
  }
  if (subScreen === 'audio') {
    return (
      <AudioPlaybackScreen
        settings={settings}
        onUpdate={onUpdateSettings}
        onOpenEqualizer={onOpenEqualizer}
        onOpenAudioOutput={onOpenAudioOutput}
        onBack={() => setSubScreen('main')}
      />
    );
  }
  if (subScreen === 'library') {
    return (
      <LibraryContentScreen
        settings={settings}
        tracks={tracks}
        onUpdate={onUpdateSettings}
        onImportPlaylist={onImportPlaylist}
        onBack={() => setSubScreen('main')}
      />
    );
  }
  if (subScreen === 'about') {
    return (
      <AboutCommunityScreen
        settings={settings}
        stats={stats}
        onUpdate={onUpdateSettings}
        onBack={() => setSubScreen('main')}
      />
    );
  }

  const matches = (label: string) =>
    !searchQuery.trim() || label.toLowerCase().includes(searchQuery.toLowerCase());

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-40 select-none transition-colors">
      {/* Apple Music Frosted Sticky Settings Header */}
      <header className="sticky top-0 z-30 bg-white/88 dark:bg-black/85 backdrop-blur-2xl border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 md:px-6 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onBack}
              aria-label="Back"
              style={{ color: 'var(--mw-primary)' }}
              className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <h1 className="font-display text-[26px] leading-none font-extrabold tracking-tight text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>

          <button
            onClick={() => setShowSearch((s) => !s)}
            aria-label="Search settings"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200"
          >
            <Search className="w-5 h-5 stroke-[2.1]" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-2">
        {showSearch && (
          <div className="pt-2">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter settings..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#E8EAE6] dark:bg-white/10 text-xs font-medium focus:outline-none"
            />
          </div>
        )}

        {/* SECTION 1: Collaboration & Social */}
        {matches('Collaboration Social MasterWave Jam') && (
          <section className="pt-5">
            <h2
              style={{ color: 'var(--mw-primary)' }}
              className="text-xs font-bold tracking-wide mb-2 px-1"
            >
              Collaboration & Social
            </h2>

            <div
              onClick={() => {
                if (onOpenJam) {
                  onOpenJam();
                } else {
                  setActiveModal('jam');
                }
              }}
              className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                >
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    MasterWave Jam
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    Listen together in real-time • Host or join ...
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
            </div>
          </section>
        )}

        {/* SECTION 2: Services & Add-ons */}
        <section className="pt-5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide mb-2 px-1"
          >
            Services & Add-ons
          </h2>

          <div className="space-y-2.5">
            {matches('Provider Modules NewPipeExtractor InnerTube') && (
              <div
                onClick={() => setActiveModal('providers')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#B5CDF5] dark:bg-blue-900/40 text-[#1D3E78] dark:text-blue-200 flex items-center justify-center flex-shrink-0">
                    <Puzzle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      Provider Modules
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Extra sources queried alongside the addon
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}

            {matches('Last.fm scrobbles statistics') && (
              <div
                onClick={() => setActiveModal('lastfm')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  >
                    <Radio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        Last.fm
                      </h3>
                      {lastFmProfile.isConnected && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                          {lastFmProfile.username}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Connect account, scrobbles & statistics sy...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}

            {matches('YouTube Sync channels history') && (
              <div
                onClick={() => setActiveModal('youtube_sync')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  >
                    <Youtube className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      YouTube & Sync
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      YouTube Music account, channels, history ...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}

            {matches('Spotify Canvas playlist import') && (
              <div
                onClick={() => setActiveModal('spotify')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  >
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      Spotify
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Account connection, Canvas, playlist imp...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 3: Playback & UI */}
        <section className="pt-5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide mb-2 px-1"
          >
            Playback & UI
          </h2>

          <div className="space-y-2.5">
            {matches('Appearance Visuals Themes Colors Artwork Lyrics') && (
              <div
                onClick={() => setSubScreen('appearance')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#B5CDF5] dark:bg-blue-900/40 text-[#1D3E78] dark:text-blue-200 flex items-center justify-center flex-shrink-0">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      Appearance & Visuals
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Themes, Colors, Artwork, Lyrics
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}

            {matches('Audio Playback Streaming quality Equalizer') && (
              <div
                onClick={() => setSubScreen('audio')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  >
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      Audio & Playback
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Streaming quality, Audio engine, Equalizer...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}

            {matches('Library Content Home layout Playlist imports Downloads') && (
              <div
                onClick={() => setSubScreen('library')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  >
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      Library & Content
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Home layout, Playlist imports, Downloads,...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}
          </div>
        </section>

        {/* SECTION 4: System & About */}
        <section className="pt-5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide mb-2 px-1"
          >
            System & About
          </h2>

          <div className="space-y-2.5">
            {matches('Data Storage Backup Restore Cache CSV') && (
              <div
                onClick={() => {
                  if (onOpenDownloads) onOpenDownloads();
                }}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#B5CDF5] dark:bg-blue-900/40 text-[#1D3E78] dark:text-blue-200 flex items-center justify-center flex-shrink-0">
                    <HardDrive className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      Data & Storage
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Backup & Restore, Cache clearing, CSV his...
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}

            {matches('About System Update Available 5.2.0') && (
              <div
                onClick={() => setSubScreen('about')}
                className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 cursor-pointer transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  >
                    <Info className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      About & System
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      Update Available (5.2.0) • v5.1.2
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Last.fm Modal */}
      {activeModal === 'lastfm' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#14141B] rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">Last.fm Integration</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Connect your Last.fm profile to scrobble tracks automatically and track your top artists.
            </p>

            {lastFmProfile.isConnected ? (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  Connected as <strong>{lastFmProfile.username}</strong>
                </div>
                <button
                  onClick={() => {
                    onDisconnectLastFm();
                    setActiveModal(null);
                  }}
                  className="w-full py-2.5 rounded-full bg-red-500/10 text-red-600 text-xs font-bold"
                >
                  Disconnect Account
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Last.fm username"
                  value={lastFmInput}
                  onChange={(e) => setLastFmInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-xs font-medium focus:outline-none"
                />
                <button
                  onClick={() => {
                    onConnectLastFm(lastFmInput || 'Audiosmith');
                    setActiveModal(null);
                  }}
                  style={{ backgroundColor: 'var(--mw-primary)' }}
                  className="w-full py-2.5 rounded-full text-white text-xs font-bold shadow-md"
                >
                  Connect & Sync
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Provider Modules Modal */}
      {activeModal === 'providers' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#14141B] rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Active Providers</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enable or disable streaming provider resolution modules and NewPipeExtractor bridge.
            </p>

            <div className="space-y-2">
              <label
                style={{
                  backgroundColor: 'var(--mw-tint)',
                  borderColor: 'var(--mw-stats-border)'
                }}
                className="flex items-center justify-between p-3 rounded-2xl border"
              >
                <div>
                  <span className="text-xs font-bold block text-gray-900 dark:text-white">
                    Free Streaming Engine (JioSaavn 320k + Audius + NewPipe)
                  </span>
                  <span className="text-[10px] text-gray-600 dark:text-gray-400">
                    320 kbps AAC, Open MP3 & YouTube / Piped Bridge
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={providers.newpipe}
                  onChange={(e) => setProviders({ ...providers, newpipe: e.target.checked })}
                />
              </label>

              {providers.newpipe && (
                <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 space-y-2.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                      Piped / NewPipe Instance URL (Primary Extractor)
                    </span>
                    <input
                      type="url"
                      value={newpipeInstanceUrl}
                      onChange={(e) => setNewpipeInstanceUrl(e.target.value)}
                      placeholder="https://api.piped.private.coffee"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                      Default Search Filter
                    </span>
                    <select
                      value={newpipeFilter}
                      onChange={(e) => setNewpipeFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-semibold focus:outline-none"
                    >
                      <option value="all">All Free Streaming APIs (Recommended)</option>
                      <option value="jiosaavn">JioSaavn 320 kbps AAC</option>
                      <option value="audius">Audius Open MP3</option>
                      <option value="music_songs">YouTube Music + Cross-Resolver</option>
                      <option value="videos">NewPipe YouTube Videos</option>
                    </select>
                  </div>

                  {newpipeProbeStatus && (
                    <p
                      style={{ color: 'var(--mw-primary)' }}
                      className="text-[11px] font-medium leading-snug"
                    >
                      {newpipeProbeStatus}
                    </p>
                  )}
                </div>
              )}

              <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-100 dark:bg-white/5">
                <span className="text-xs font-semibold">InnerTube (YouTube Music)</span>
                <input
                  type="checkbox"
                  checked={providers.innertube}
                  onChange={(e) => setProviders({ ...providers, innertube: e.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-100 dark:bg-white/5">
                <span className="text-xs font-semibold">Lossless Hi-Res Archive</span>
                <input
                  type="checkbox"
                  checked={providers.hires_flac}
                  onChange={(e) => setProviders({ ...providers, hires_flac: e.target.checked })}
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-gray-100 dark:bg-white/5">
                <span className="text-xs font-semibold">Device Local Storage</span>
                <input
                  type="checkbox"
                  checked={providers.local}
                  onChange={(e) => setProviders({ ...providers, local: e.target.checked })}
                />
              </label>
            </div>

            <button
              disabled={isProbingNewpipe}
              onClick={async () => {
                newpipeService.saveConfig({
                  enabled: providers.newpipe,
                  instanceUrl: newpipeInstanceUrl,
                  filter: newpipeFilter
                });
                if (providers.newpipe) {
                  setIsProbingNewpipe(true);
                  setNewpipeProbeStatus('Testing NewPipe / Piped backend...');
                  try {
                    const res = await newpipeService.updateBackendConfig(newpipeInstanceUrl, newpipeFilter);
                    if (res.ok) {
                      setNewpipeProbeStatus(`Connected (${res.latencyMs ?? 0}ms)`);
                      setTimeout(() => setActiveModal(null), 500);
                    } else {
                      setNewpipeProbeStatus(`Error: ${res.error || 'Could not reach instance'}`);
                    }
                  } catch {
                    setNewpipeProbeStatus('Network error testing NewPipe backend.');
                  } finally {
                    setIsProbingNewpipe(false);
                  }
                } else {
                  setActiveModal(null);
                }
              }}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-full py-2.5 rounded-full text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isProbingNewpipe && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Test & Save Configuration</span>
            </button>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-1.5 text-xs text-gray-400 hover:text-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* YouTube & Sync Modal */}
      {activeModal === 'youtube_sync' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#14141B] rounded-3xl p-6 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">YouTube & Sync</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              InnerTube / NewPipe Extractor handles live YouTube Music discovery and stream extraction.
            </p>
            <div className="p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs">
              <span className="font-bold block text-gray-900 dark:text-white">Active Mode</span>
              <span className="text-gray-500 dark:text-gray-400">{ytSyncChannel}</span>
            </div>
            <button
              onClick={() => {
                setYtSyncChannel('InnerTube + NewPipeExtractor Synced');
                setActiveModal(null);
              }}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-full py-2.5 rounded-full text-white text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Sync Catalog & Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Spotify Bridge Modal */}
      {activeModal === 'spotify' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#14141B] rounded-3xl p-6 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Spotify Canvas & Import</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Import a Spotify playlist theme via NewPipe search or toggle Canvas visualizers.
            </p>
            <input
              type="text"
              placeholder="Paste public playlist query (e.g. Late Night Vibes)..."
              value={spotifyImportQuery}
              onChange={(e) => setSpotifyImportQuery(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-xs focus:outline-none"
            />
            <button
              disabled={isImportingSpotify}
              onClick={async () => {
                const q = spotifyImportQuery.trim() || 'Bollywood Romantic Hits';
                setIsImportingSpotify(true);
                try {
                  const res = await newpipeService.search(q);
                  const items = res.items.slice(0, 6);
                  onImportPlaylist(
                    {
                      id: `spotify-imp-${Date.now()}`,
                      title: `Spotify: ${q}`,
                      description: 'Matched via MasterWave NewPipe bridge',
                      coverUrl: items[0]?.artworkUrl || tracks[0]?.artworkUrl || '',
                      trackIds: items.length > 0 ? items.map((i) => i.id) : tracks.slice(0, 4).map((t) => t.id),
                      createdAt: new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }),
                      isPinned: false,
                      isSystem: false
                    },
                    items
                  );
                  setActiveModal(null);
                  setSpotifyImportQuery('');
                } finally {
                  setIsImportingSpotify(false);
                }
              }}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-full py-2.5 rounded-full text-white text-xs font-bold disabled:opacity-60"
            >
              {isImportingSpotify ? 'Importing...' : 'Import Playlist'}
            </button>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-1.5 text-xs text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
