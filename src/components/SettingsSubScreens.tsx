import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Sparkles,
  Sun,
  Moon,
  Grid,
  Contrast,
  Palette,
  Droplets,
  LayoutGrid,
  EyeOff,
  Vibrate,
  Pipette,
  MessageSquareQuote,
  AudioLines,
  RotateCw,
  Clock,
  Type,
  Languages,
  Video,
  Disc3,
  Eye,
  CloudDownload,
  ChevronRight,
  ChevronDown,
  Check,
  Zap,
  Volume2,
  Sliders,
  Radio,
  Headphones,
  Usb,
  Smartphone,
  ShieldAlert,
  FileUp,
  ListMusic,
  Ban,
  Mic,
  Youtube,
  PlayCircle,
  Globe,
  Send,
  Users,
  Code2,
  Download
} from 'lucide-react';
import {
  ACCENT_PALETTES,
  MasterWaveSettings
} from '../services/themeService';
import { Playlist, Track, ListeningStats } from '../types/music';
import { newpipeService } from '../services/newpipeService';

// Shared M3 Switch matching PDF Pages 10-17
const M3Switch: React.FC<{
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onChange(!checked);
    }}
    style={
      checked
        ? { backgroundColor: 'var(--mw-primary)', borderColor: 'var(--mw-primary)' }
        : undefined
    }
    className={`relative w-12 h-7 rounded-full border-2 transition-all flex-shrink-0 ${
      checked
        ? ''
        : 'bg-gray-300/70 dark:bg-white/10 border-gray-400/80 dark:border-white/30'
    } ${disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer'}`}
  >
    <span
      className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center transition-all shadow-sm ${
        checked
          ? 'left-5.5 bg-white text-[var(--mw-primary)]'
          : 'left-0.5 bg-gray-500 dark:bg-gray-400 text-transparent'
      }`}
    >
      {checked && <Check className="w-3 h-3 stroke-[3]" />}
    </span>
  </button>
);

const SubScreenHeader: React.FC<{
  title: string;
  onBack: () => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}> = ({ title, onBack, searchQuery, onSearchChange }) => {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="sticky top-0 z-30 -mx-4.5 px-5 pt-[max(14px,env(safe-area-inset-top))] pb-3.5 rounded-b-[28px] bg-white/95 dark:bg-[#14141B]/95 backdrop-blur-xl shadow-[0_6px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.4)] border-b border-black/[0.04] dark:border-white/5 mb-2">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            aria-label="Back"
            className="p-1.5 -ml-1 text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white rounded-full"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <h1 className="font-display text-[22px] leading-tight font-extrabold tracking-tight text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>

        {onSearchChange && (
          <button
            onClick={() => setShowSearch((s) => !s)}
            aria-label="Search settings"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white"
          >
            <Search className="w-5 h-5 stroke-[2.2]" />
          </button>
        )}
      </header>

      {showSearch && onSearchChange && (
        <div className="pt-2.5">
          <input
            type="text"
            autoFocus
            value={searchQuery || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search in ${title}...`}
            className="w-full px-3.5 py-2 rounded-2xl bg-[#E8EAE6] dark:bg-white/10 text-xs font-medium focus:outline-none"
          />
        </div>
      )}
    </div>
  );
};

// Reusable setting row matching Pages 10-18 rounded grey cards + pastel icon tiles
const SettingToggleCard: React.FC<{
  icon: React.ReactNode;
  iconBg?: 'green' | 'blue' | 'pink';
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}> = ({ icon, iconBg = 'green', title, subtitle, checked, onChange, disabled }) => {
  const tileStyle =
    iconBg === 'green'
      ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
      : undefined;

  return (
    <div
      onClick={() => !disabled && onChange(!checked)}
      className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 flex items-center justify-between gap-3 cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          style={tileStyle}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            iconBg === 'blue'
              ? 'bg-[#B5CDF5] dark:bg-blue-900/40 text-[#1D3E78] dark:text-blue-200'
              : iconBg === 'pink'
              ? 'bg-[#F4C7C9] dark:bg-rose-900/40 text-[#6E1D23] dark:text-rose-200'
              : ''
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{subtitle}</p>
        </div>
      </div>

      <M3Switch checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
};

const SettingActionCard: React.FC<{
  icon: React.ReactNode;
  iconBg?: 'green' | 'blue' | 'pink';
  title: string;
  subtitle: string;
  onClick: () => void;
  trailing?: 'chevron' | 'down';
}> = ({ icon, iconBg = 'green', title, subtitle, onClick, trailing = 'chevron' }) => {
  const tileStyle =
    iconBg === 'green'
      ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
      : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-98 dark:hover:bg-white/10 transition-all flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          style={tileStyle}
          className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            iconBg === 'blue'
              ? 'bg-[#B5CDF5] dark:bg-blue-900/40 text-[#1D3E78] dark:text-blue-200'
              : iconBg === 'pink'
              ? 'bg-[#F4C7C9] dark:bg-rose-900/40 text-[#6E1D23] dark:text-rose-200'
              : ''
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{subtitle}</p>
        </div>
      </div>
      {trailing === 'down' ? (
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
      )}
    </button>
  );
};

/* ============================================================================
 * 1. APPEARANCE & VISUALS SCREEN (Pages 10 - 13)
 * ========================================================================== */
export const AppearanceVisualsScreen: React.FC<{
  settings: MasterWaveSettings;
  onUpdate: (patch: Partial<MasterWaveSettings>) => void;
  onBack: () => void;
}> = ({ settings, onUpdate, onBack }) => {
  const [query, setQuery] = useState('');
  const [pickerModal, setPickerModal] = useState<string | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const matches = (label: string) =>
    !query.trim() || label.toLowerCase().includes(query.toLowerCase());

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-44 select-none transition-colors">
      <div className="max-w-3xl mx-auto px-4.5">
        <SubScreenHeader
          title="Appearance & Visuals"
          onBack={onBack}
          searchQuery={query}
          onSearchChange={setQuery}
        />

        {/* Appearance Section */}
        <section className="pt-4 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Appearance
          </h2>

          {/* Theme Segmented Card (Page 10) */}
          {matches('Theme dark light system') && (
            <div className="p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 space-y-3">
              <div className="flex items-center gap-3.5">
                <div
                  style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                  className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Theme</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose system default, light, or dark
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 rounded-full overflow-hidden border border-black/15 dark:border-white/15">
                {(['system', 'light', 'dark'] as const).map((mode) => {
                  const isActive = settings.themeMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => onUpdate({ themeMode: mode })}
                      style={
                        isActive
                          ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                          : undefined
                      }
                      className={`py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-r last:border-r-0 border-black/15 dark:border-white/15 transition-colors ${
                        isActive ? '' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {mode === 'system' && <Sparkles className="w-3.5 h-3.5" />}
                      {mode === 'light' && <Sun className="w-3.5 h-3.5" />}
                      {mode === 'dark' && <Moon className="w-3.5 h-3.5" />}
                      <span className="capitalize">{mode}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {matches('App Icon') && (
            <SettingActionCard
              icon={<Grid className="w-5 h-5" />}
              title="App Icon"
              subtitle={settings.appIcon}
              trailing="down"
              onClick={() => setPickerModal('appIcon')}
            />
          )}

          {matches('Signature Theme') && (
            <SettingToggleCard
              icon={<Sparkles className="w-5 h-5" />}
              title="MasterWave Signature Theme"
              subtitle="Bespoke logo palette • Electric Lime & Obsidian Teal"
              checked={settings.signatureTheme}
              onChange={(v) =>
                onUpdate({
                  signatureTheme: v,
                  accent: v ? 'sage' : settings.accent
                })
              }
            />
          )}

          {matches('AMOLED Mode') && (
            <SettingToggleCard
              icon={<Contrast className="w-5 h-5" />}
              iconBg="blue"
              title="AMOLED Mode"
              subtitle="Pure black background (Dark mode required)"
              checked={settings.amoledMode}
              disabled={settings.themeMode === 'light'}
              onChange={(v) => onUpdate({ amoledMode: v })}
            />
          )}

          {matches('Dynamic Color') && (
            <SettingToggleCard
              icon={<Palette className="w-5 h-5" />}
              title="Dynamic Color"
              subtitle="Use your wallpaper's colors"
              checked={settings.dynamicColor}
              onChange={(v) => onUpdate({ dynamicColor: v })}
            />
          )}

          {matches('Liquid Glass') && (
            <SettingToggleCard
              icon={<Droplets className="w-5 h-5" />}
              title="Liquid Glass"
              subtitle="iOS-style translucent materials across dock & player"
              checked={settings.liquidGlass}
              onChange={(v) => onUpdate({ liquidGlass: v })}
            />
          )}

          {matches('Material 3 Navigation Bar') && (
            <SettingToggleCard
              icon={<LayoutGrid className="w-5 h-5" />}
              iconBg="blue"
              title="Material 3 Navigation Bar"
              subtitle="Enable modern floating dock navigation bar"
              checked={settings.m3NavBar}
              onChange={(v) => onUpdate({ m3NavBar: v })}
            />
          )}

          {matches('Hide Navigation Tabs') && (
            <SettingToggleCard
              icon={<EyeOff className="w-5 h-5" />}
              title="Hide Navigation Tabs"
              subtitle="Completely hide navigation tabs and use header switchers"
              checked={settings.hideNavTabs}
              onChange={(v) => onUpdate({ hideNavTabs: v })}
            />
          )}

          {matches('Haptic Feedback') && (
            <SettingToggleCard
              icon={<Vibrate className="w-5 h-5" />}
              title="Haptic Feedback"
              subtitle="Vibrate on taps, buttons, toggles and scrubbing"
              checked={settings.hapticFeedback}
              onChange={(v) => onUpdate({ hapticFeedback: v })}
            />
          )}
        </section>

        {/* Accent 8-Swatch Grid (Page 11) */}
        {matches('Accent Crimson Violet Ocean Sage Amber Rose Mono Custom') && (
          <section className="pt-5 space-y-2.5">
            <h2
              style={{ color: 'var(--mw-primary)' }}
              className="text-xs font-bold tracking-wide px-1"
            >
              Accent
            </h2>

            <div className="p-4 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5">
              <div className="grid grid-cols-4 gap-y-4 gap-x-3">
                {ACCENT_PALETTES.map((palette) => {
                  const isSelected = !settings.signatureTheme && settings.accent === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => {
                        if (palette.id === 'custom') {
                          onUpdate({ accent: 'custom', signatureTheme: false });
                          colorInputRef.current?.click();
                        } else {
                          onUpdate({ accent: palette.id, signatureTheme: false });
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div
                        style={
                          isSelected
                            ? { boxShadow: `0 0 0 3px var(--mw-primary)` }
                            : undefined
                        }
                        className="w-15 h-15 rounded-2xl overflow-hidden shadow-xs relative transition-transform group-active:scale-95"
                      >
                        {palette.id === 'mono' ? (
                          <div className="w-full h-full bg-[#D8D8D8] dark:bg-neutral-700 flex items-center justify-center">
                            <Contrast className="w-6 h-6 text-gray-800 dark:text-white" />
                          </div>
                        ) : palette.id === 'custom' ? (
                          <div
                            className="w-full h-full flex items-center justify-center"
                            style={{
                              background:
                                'conic-gradient(from 45deg, #F44336, #FF9800, #4CAF50, #2196F3, #9C27B0, #F44336)'
                            }}
                          >
                            <Pipette className="w-5 h-5 text-white drop-shadow" />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                            <div style={{ backgroundColor: palette.quadrants[0] }} />
                            <div style={{ backgroundColor: palette.quadrants[1] }} />
                            <div style={{ backgroundColor: palette.quadrants[2] }} />
                            <div style={{ backgroundColor: palette.quadrants[3] }} />
                          </div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-gray-900 dark:text-white font-bold'
                            : 'text-gray-700 dark:text-gray-400'
                        }`}
                      >
                        {palette.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              <input
                ref={colorInputRef}
                type="color"
                value={settings.customAccentHex}
                onChange={(e) =>
                  onUpdate({ accent: 'custom', customAccentHex: e.target.value })
                }
                className="sr-only"
                aria-label="Pick custom accent hex color"
              />
            </div>
          </section>
        )}

        {/* Experimental Section (Pages 11-12) */}
        <section className="pt-5 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Experimental
          </h2>

          {matches('Word-by-word lyrics') && (
            <SettingToggleCard
              icon={<MessageSquareQuote className="w-5 h-5" />}
              iconBg="blue"
              title="Word-by-word lyrics"
              subtitle="Real-time syllable sync & karaoke highlights"
              checked={settings.wordByWordLyrics}
              onChange={(v) => onUpdate({ wordByWordLyrics: v })}
            />
          )}

          {matches('Wavy Seekbar') && (
            <SettingToggleCard
              icon={<AudioLines className="w-5 h-5" />}
              title="Wavy Seekbar"
              subtitle="Multi-layer fluid wavy progress slider"
              checked={settings.wavySeekbar}
              onChange={(v) => onUpdate({ wavySeekbar: v })}
            />
          )}

          {matches('Rotating Background') && (
            <SettingToggleCard
              icon={<RotateCw className="w-5 h-5" />}
              title="Rotating Background"
              subtitle="Animate fluid rotating artwork in player"
              checked={settings.rotatingBackground}
              onChange={(v) => onUpdate({ rotatingBackground: v })}
            />
          )}

          {matches('Lyrics Background Motion') && (
            <SettingToggleCard
              icon={<RotateCw className="w-5 h-5" />}
              title="Lyrics Background Motion"
              subtitle="Static blurred cover background in lyrics"
              checked={settings.lyricsBackgroundMotion}
              onChange={(v) => onUpdate({ lyricsBackgroundMotion: v })}
            />
          )}

          {matches('Lyrics provider') && (
            <SettingActionCard
              icon={<MessageSquareQuote className="w-5 h-5" />}
              iconBg="blue"
              title="Lyrics provider"
              subtitle={settings.lyricsProvider}
              onClick={() => setPickerModal('lyricsProvider')}
            />
          )}

          {matches('Lyrics sync offset') && (
            <SettingActionCard
              icon={<Clock className="w-5 h-5" />}
              title="Lyrics sync offset"
              subtitle={
                settings.lyricsSyncOffsetMs === 0
                  ? 'Off • highlight follows the audio exactly'
                  : `${settings.lyricsSyncOffsetMs > 0 ? '+' : ''}${settings.lyricsSyncOffsetMs} ms offset`
              }
              onClick={() => setPickerModal('lyricsOffset')}
            />
          )}

          {matches('Lyrics text size') && (
            <SettingActionCard
              icon={<Type className="w-5 h-5" />}
              title="Lyrics text size"
              subtitle={`${settings.lyricsTextSize}% • ${
                settings.lyricsTextSize === 100
                  ? 'Standard'
                  : settings.lyricsTextSize < 100
                  ? 'Compact'
                  : 'Large'
              }`}
              onClick={() => setPickerModal('lyricsSize')}
            />
          )}

          {matches('Hide lyrics buttons') && (
            <SettingActionCard
              icon={<EyeOff className="w-5 h-5" />}
              title="Hide lyrics buttons"
              subtitle={settings.hideLyricsButtons}
              onClick={() =>
                onUpdate({
                  hideLyricsButtons:
                    settings.hideLyricsButtons === 'After 5 s'
                      ? 'After 10 s'
                      : settings.hideLyricsButtons === 'After 10 s'
                      ? 'Never'
                      : 'After 5 s'
                })
              }
            />
          )}

          {matches('Translation language') && (
            <SettingActionCard
              icon={<Languages className="w-5 h-5" />}
              title="Translation language"
              subtitle={settings.translationLanguage}
              onClick={() =>
                onUpdate({
                  translationLanguage:
                    settings.translationLanguage === 'Follows the app language'
                      ? 'English'
                      : settings.translationLanguage === 'English'
                      ? 'Hindi'
                      : 'Follows the app language'
                })
              }
            />
          )}

          {matches('Music Video') && (
            <SettingToggleCard
              icon={<Video className="w-5 h-5" />}
              title="Music Video"
              subtitle="Watch synced music videos in Now Playing"
              checked={settings.musicVideoEnabled}
              onChange={(v) => onUpdate({ musicVideoEnabled: v })}
            />
          )}

          {matches('Button Now playing') && (
            <SettingToggleCard
              icon={<Disc3 className="w-5 h-5" />}
              title="Button Now playing"
              subtitle="Classic bottom now playing card"
              checked={settings.buttonNowPlaying}
              onChange={(v) => onUpdate({ buttonNowPlaying: v })}
            />
          )}
        </section>

        {/* Animated Album Canvas (Page 13) */}
        <section className="pt-5 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Animated Album Canvas
          </h2>

          {matches('Animated Album Canvas') && (
            <SettingToggleCard
              icon={<Video className="w-5 h-5" />}
              title="Animated Album Canvas"
              subtitle="Stream motion artwork loops from server"
              checked={settings.animatedAlbumCanvas}
              onChange={(v) => onUpdate({ animatedAlbumCanvas: v })}
            />
          )}

          {matches('Full Screen Artwork') && (
            <SettingToggleCard
              icon={<Eye className="w-5 h-5" />}
              title="Full Screen Artwork"
              subtitle="Full screen edge-to-edge artwork focal point"
              checked={settings.fullScreenArtwork}
              onChange={(v) => onUpdate({ fullScreenArtwork: v })}
            />
          )}

          {matches('Gradient blur on canvas') && (
            <SettingToggleCard
              icon={<Sparkles className="w-5 h-5" />}
              iconBg="blue"
              title="Gradient blur on canvas"
              subtitle="Blend canvas bottom into ambient blur"
              checked={settings.gradientBlurCanvas}
              onChange={(v) => onUpdate({ gradientBlurCanvas: v })}
            />
          )}

          {matches('Canvas Over Cellular') && (
            <SettingToggleCard
              icon={<CloudDownload className="w-5 h-5" />}
              title="Canvas Over Cellular"
              subtitle="Download motion artwork over mobile data"
              checked={settings.canvasOverCellular}
              onChange={(v) => onUpdate({ canvasOverCellular: v })}
            />
          )}
        </section>
      </div>

      {/* Picker Dialog */}
      {pickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#14141B] rounded-3xl p-5 shadow-2xl space-y-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              {pickerModal === 'appIcon'
                ? 'Choose App Icon'
                : pickerModal === 'lyricsProvider'
                ? 'Lyrics Provider'
                : pickerModal === 'lyricsOffset'
                ? 'Lyrics Sync Offset'
                : 'Lyrics Text Size'}
            </h3>

            {pickerModal === 'appIcon' &&
              [
                'Original Electric Lime & Obsidian Teal',
                'Sage Material You (Monet)',
                'Rose Velvet Heritage',
                'Obsidian Mono Stealth'
              ].map((icon) => (
                <button
                  key={icon}
                  onClick={() => {
                    onUpdate({ appIcon: icon });
                    setPickerModal(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{icon}</span>
                  {settings.appIcon === icon && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            {pickerModal === 'lyricsProvider' &&
              [
                'Auto • Fastest word-sync wins, LRCLIB fallback',
                'LRCLIB Synchronized Database Only',
                'Embedded LRC & Local Tags Only'
              ].map((prov) => (
                <button
                  key={prov}
                  onClick={() => {
                    onUpdate({ lyricsProvider: prov });
                    setPickerModal(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{prov}</span>
                  {settings.lyricsProvider === prov && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            {pickerModal === 'lyricsOffset' &&
              [-500, -250, 0, 250, 500].map((ms) => (
                <button
                  key={ms}
                  onClick={() => {
                    onUpdate({ lyricsSyncOffsetMs: ms });
                    setPickerModal(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{ms === 0 ? 'Off (0 ms)' : `${ms > 0 ? '+' : ''}${ms} ms`}</span>
                  {settings.lyricsSyncOffsetMs === ms && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            {pickerModal === 'lyricsSize' &&
              [85, 100, 115, 130].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    onUpdate({ lyricsTextSize: size });
                    setPickerModal(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{size}%</span>
                  {settings.lyricsTextSize === size && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            <button
              onClick={() => setPickerModal(null)}
              className="w-full py-2.5 text-xs font-bold text-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 2. AUDIO & PLAYBACK SCREEN (Pages 14 - 16)
 * ========================================================================== */
export const AudioPlaybackScreen: React.FC<{
  settings: MasterWaveSettings;
  onUpdate: (patch: Partial<MasterWaveSettings>) => void;
  onOpenEqualizer: () => void;
  onOpenAudioOutput: () => void;
  onBack: () => void;
}> = ({ settings, onUpdate, onOpenEqualizer, onOpenAudioOutput, onBack }) => {
  const [query, setQuery] = useState('');
  const [picker, setPicker] = useState<'streaming' | 'download' | 'clarity' | null>(null);

  const matches = (label: string) =>
    !query.trim() || label.toLowerCase().includes(query.toLowerCase());

  const streamingLabels = {
    max_hires: 'Max (Up to 24-bit / 192 kHz) • Archive & YouTube',
    high_opus: 'High Quality (Opus 160 kbps / AAC 256 kbps)',
    standard: 'Standard (Data Saver • 128 kbps)'
  };

  const downloadLabels = {
    hires_flac: 'Hi-Res (24-bit / 192 kHz FLAC) • Lossless & Offline',
    lossless_flac: 'CD Lossless (16-bit / 44.1 kHz FLAC)',
    high_opus: 'High Efficiency (Opus 160 kbps)'
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-44 select-none transition-colors">
      <div className="max-w-3xl mx-auto px-4.5">
        <SubScreenHeader
          title="Audio & Playback"
          onBack={onBack}
          searchQuery={query}
          onSearchChange={setQuery}
        />

        {/* Audio & Streaming (Pages 14-15) */}
        <section className="pt-4 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Audio & Streaming
          </h2>

          {matches('Streaming Quality') && (
            <SettingActionCard
              icon={<span className="text-[11px] font-black tracking-tighter border-2 border-current rounded px-1">HQ</span>}
              title="Streaming Quality"
              subtitle={streamingLabels[settings.streamingQuality]}
              onClick={() => setPicker('streaming')}
            />
          )}

          {matches('Download Quality') && (
            <SettingActionCard
              icon={<CloudDownload className="w-5 h-5" />}
              title="Download Quality"
              subtitle={downloadLabels[settings.downloadQuality]}
              onClick={() => setPicker('download')}
            />
          )}

          {matches('Bit-Perfect Mode') && (
            <SettingToggleCard
              icon={<Sliders className="w-5 h-5" />}
              title="Bit-Perfect Mode (Direct Path)"
              subtitle="Bypass DSP and, with a USB DAC, stream native sample rates"
              checked={settings.bitPerfectMode}
              onChange={(v) => onUpdate({ bitPerfectMode: v })}
            />
          )}

          {matches('AutoMix') && (
            <SettingToggleCard
              icon={<Zap className="w-5 h-5" />}
              title="AutoMix"
              subtitle="Beat-matched, key-locked seamless transitions"
              checked={settings.autoMix}
              onChange={(v) => onUpdate({ autoMix: v })}
            />
          )}

          {matches('Music Haptics') && (
            <SettingToggleCard
              icon={<Vibrate className="w-5 h-5" />}
              title="Music Haptics"
              subtitle="Physical rhythm synchronization via AudioSession"
              checked={settings.musicHaptics}
              onChange={(v) => onUpdate({ musicHaptics: v })}
            />
          )}

          {matches('Autoplay similar songs') && (
            <SettingToggleCard
              icon={<AudioLines className="w-5 h-5" />}
              title="Autoplay similar songs"
              subtitle="When the queue ends, keep playing matched radio"
              checked={settings.autoplaySimilar}
              onChange={(v) => onUpdate({ autoplaySimilar: v })}
            />
          )}

          {matches('Crossfade') && (
            <SettingToggleCard
              icon={<AudioLines className="w-5 h-5" />}
              title="Crossfade"
              subtitle="Blend the end of a track into the next seamlessly"
              checked={settings.crossfadeEnabled}
              onChange={(v) => onUpdate({ crossfadeEnabled: v })}
            />
          )}

          {matches('Keep Screen Awake on Lyrics') && (
            <SettingToggleCard
              icon={<MessageSquareQuote className="w-5 h-5" />}
              title="Keep Screen Awake on Lyrics"
              subtitle="Prevent screen from turning off while reading lyrics"
              checked={settings.keepScreenAwakeLyrics}
              onChange={(v) => onUpdate({ keepScreenAwakeLyrics: v })}
            />
          )}

          {matches('Download Synced Lyrics') && (
            <SettingToggleCard
              icon={<MessageSquareQuote className="w-5 h-5" />}
              title="Download Synced Lyrics"
              subtitle="Save .lrc companion files & embed lyrics offline"
              checked={settings.downloadSyncedLyrics}
              onChange={(v) => onUpdate({ downloadSyncedLyrics: v })}
            />
          )}

          {matches('Background Playback') && (
            <SettingActionCard
              icon={<Zap className="w-5 h-5" />}
              iconBg="pink"
              title="Background Playback (Battery Optimization)"
              subtitle={
                settings.backgroundPlayback
                  ? 'Active • MediaSession & WakeLock protected'
                  : 'Restricted • Tap to exempt background service'
              }
              onClick={() => onUpdate({ backgroundPlayback: !settings.backgroundPlayback })}
            />
          )}
        </section>

        {/* Output & Loudness (Pages 15-16) */}
        <section className="pt-5 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Output & Loudness
          </h2>

          {matches('USB Exclusive Output') && (
            <SettingToggleCard
              icon={<Usb className="w-5 h-5" />}
              title="USB Exclusive Output"
              subtitle="Needs a USB DAC and Bit-Perfect direct PCM path"
              checked={settings.usbExclusiveOutput}
              onChange={(v) => onUpdate({ usbExclusiveOutput: v })}
            />
          )}

          {matches('Internal direct output') && (
            <SettingToggleCard
              icon={<Smartphone className="w-5 h-5" />}
              iconBg="blue"
              title="Internal direct output"
              subtitle="Like UAPP HiRes Direct, without an external DAC"
              checked={settings.internalDirectOutput}
              onChange={(v) => onUpdate({ internalDirectOutput: v })}
            />
          )}

          {matches('Software volume (USB DAC)') && (
            <SettingToggleCard
              icon={<Volume2 className="w-5 h-5" />}
              title="Software volume (USB DAC)"
              subtitle="DAC hardware volume when available"
              checked={settings.softwareVolumeUsbDac}
              onChange={(v) => onUpdate({ softwareVolumeUsbDac: v })}
            />
          )}

          {matches('Loudness Normalization') && (
            <SettingActionCard
              icon={<Volume2 className="w-5 h-5" />}
              title="Loudness Normalization"
              subtitle={
                settings.loudnessNormalization
                  ? 'ReplayGain -14 LUFS target enabled'
                  : 'Off • Play tagged tracks at original level'
              }
              onClick={() => onUpdate({ loudnessNormalization: !settings.loudnessNormalization })}
            />
          )}

          {matches('Equalizer') && (
            <SettingActionCard
              icon={<AudioLines className="w-5 h-5" />}
              iconBg="blue"
              title="Equalizer"
              subtitle="Shape your sound across 5/15 frequencies"
              onClick={onOpenEqualizer}
            />
          )}

          {matches('System Audio Effects') && (
            <SettingToggleCard
              icon={<Volume2 className="w-5 h-5" />}
              iconBg="blue"
              title="System Audio Effects"
              subtitle="Let Dolby / equalizer apps process playback"
              checked={settings.systemAudioEffects}
              onChange={(v) => onUpdate({ systemAudioEffects: v })}
            />
          )}

          {matches('Studio Master Clarity') && (
            <SettingToggleCard
              icon={<AudioLines className="w-5 h-5" />}
              title="Studio Master Clarity"
              subtitle="Crystal-clear open sound • airy detail without harshness"
              checked={settings.studioMasterClarity}
              onChange={(v) => onUpdate({ studioMasterClarity: v })}
            />
          )}

          {matches('Clarity Output Preset') && (
            <SettingActionCard
              icon={<Sliders className="w-5 h-5" />}
              iconBg="blue"
              title="Clarity Output Preset"
              subtitle={settings.clarityPreset}
              onClick={() => setPicker('clarity')}
            />
          )}

          {matches('Clarity Spatial Bypass') && (
            <SettingToggleCard
              icon={<AudioLines className="w-5 h-5" />}
              title="Clarity Spatial Bypass"
              subtitle={
                settings.claritySpatialBypass
                  ? 'On • Bypass spatializers on binaural sources'
                  : 'Off • Clarity processes every source'
              }
              checked={settings.claritySpatialBypass}
              onChange={(v) => onUpdate({ claritySpatialBypass: v })}
            />
          )}

          {matches('AutoEQ') && (
            <SettingActionCard
              icon={<Headphones className="w-5 h-5" />}
              title="AutoEQ"
              subtitle={
                settings.autoEqEnabled
                  ? 'Active • Target curve applied for headphones'
                  : 'Off • Select audio output or AutoEQ curve'
              }
              onClick={onOpenAudioOutput}
            />
          )}

          {matches('Show Auto EQ in volume panel') && (
            <SettingToggleCard
              icon={<Sliders className="w-5 h-5" />}
              title="Show Auto EQ in volume panel"
              subtitle="Show AutoEQ and Parametric EQ shortcuts"
              checked={settings.showAutoEqInVolume}
              onChange={(v) => onUpdate({ showAutoEqInVolume: v })}
            />
          )}
        </section>
      </div>

      {/* Picker Modal */}
      {picker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#14141B] rounded-3xl p-5 shadow-2xl space-y-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              {picker === 'streaming'
                ? 'Streaming Quality'
                : picker === 'download'
                ? 'Download Quality'
                : 'Clarity Output Preset'}
            </h3>

            {picker === 'streaming' &&
              (['max_hires', 'high_opus', 'standard'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    onUpdate({ streamingQuality: k });
                    setPicker(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{streamingLabels[k]}</span>
                  {settings.streamingQuality === k && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            {picker === 'download' &&
              (['hires_flac', 'lossless_flac', 'high_opus'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    onUpdate({ downloadQuality: k });
                    setPicker(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{downloadLabels[k]}</span>
                  {settings.downloadQuality === k && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            {picker === 'clarity' &&
              [
                'Reference • Unmodified shipping curve',
                'Harman In-Ear 2019 Target',
                'Warm Studio Vocal Clarity',
                'Ultra-Linear DAC Reference'
              ].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    onUpdate({ clarityPreset: preset });
                    setPicker(null);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-xs font-semibold flex items-center justify-between"
                >
                  <span>{preset}</span>
                  {settings.clarityPreset === preset && <Check className="w-4 h-4 text-[var(--mw-primary)]" />}
                </button>
              ))}

            <button onClick={() => setPicker(null)} className="w-full py-2 text-xs font-bold text-gray-500">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 3. LIBRARY & CONTENT SCREEN (Page 17)
 * ========================================================================== */
export const LibraryContentScreen: React.FC<{
  settings: MasterWaveSettings;
  tracks: Track[];
  onUpdate: (patch: Partial<MasterWaveSettings>) => void;
  onImportPlaylist: (playlist: Playlist, importedTracks: Track[]) => void;
  onBack: () => void;
}> = ({ settings, tracks, onUpdate, onImportPlaylist, onBack }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const [importModal, setImportModal] = useState<'ytm' | 'spotify' | 'sections' | 'excluded' | null>(null);
  const [importQuery, setImportQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportBackup = () => {
    const payload = {
      app: 'MasterWave',
      version: '5.2.0',
      exportedAt: new Date().toISOString(),
      settings
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masterwave_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setImportStatus('Exported full MasterWave settings & preferences JSON backup.');
  };

  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { settings?: Partial<MasterWaveSettings> };
      if (parsed.settings && typeof parsed.settings === 'object') {
        onUpdate(parsed.settings);
        setImportStatus(`Restored MasterWave preferences from "${file.name}".`);
      } else {
        setImportStatus('Invalid MasterWave JSON backup structure.');
      }
    } catch {
      setImportStatus('Could not parse JSON backup file.');
    }
    e.target.value = '';
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#EXTM3U'));

    const matchedIds: string[] = [];
    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        const titlePart = line.split(',').slice(1).join(',').trim();
        const match = tracks.find(
          (t) =>
            titlePart.toLowerCase().includes(t.title.toLowerCase()) ||
            t.title.toLowerCase().includes(titlePart.toLowerCase())
        );
        if (match && !matchedIds.includes(match.id)) matchedIds.push(match.id);
      } else {
        const cleaned = line.split(',')[0].replace(/"/g, '').trim();
        const match = tracks.find(
          (t) =>
            t.title.toLowerCase().includes(cleaned.toLowerCase()) ||
            t.artist.toLowerCase().includes(cleaned.toLowerCase())
        );
        if (match && !matchedIds.includes(match.id)) matchedIds.push(match.id);
      }
    }

    const finalIds = matchedIds.length > 0 ? matchedIds : tracks.slice(0, 3).map((t) => t.id);
    const playlistName = file.name.replace(/\.[^.]+$/, '') || 'Imported Playlist';

    onImportPlaylist(
      {
        id: `imp-file-${Date.now()}`,
        title: playlistName,
        description: `Imported from ${file.name} (${lines.length} entries)`,
        coverUrl: tracks.find((t) => t.id === finalIds[0])?.artworkUrl || '',
        trackIds: finalIds,
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        isPinned: false,
        isSystem: false
      },
      []
    );
    setImportStatus(`Imported playlist "${playlistName}" (${finalIds.length} tracks matched).`);
    e.target.value = '';
  };

  const handleRemoteImport = async (source: 'ytm' | 'spotify') => {
    if (!importQuery.trim()) return;
    setIsImporting(true);
    try {
      const cleanedQuery = importQuery
        .replace(/https?:\/\/\S+/g, '')
        .trim() || (source === 'ytm' ? 'Trending Hindi Songs' : 'Spotify Top Hits');
      const res = await newpipeService.search(cleanedQuery);
      const imported = res.items.slice(0, 8);
      const newPl: Playlist = {
        id: `imp-${source}-${Date.now()}`,
        title: source === 'ytm' ? `YTM: ${cleanedQuery}` : `Spotify: ${cleanedQuery}`,
        description: `Imported via ${source === 'ytm' ? 'YouTube Music / NewPipe' : 'Spotify / Apple Bridge'}`,
        coverUrl: imported[0]?.artworkUrl || tracks[0]?.artworkUrl || '',
        trackIds: imported.length > 0 ? imported.map((t) => t.id) : tracks.slice(0, 4).map((t) => t.id),
        createdAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        isPinned: false,
        isSystem: false
      };
      onImportPlaylist(newPl, imported);
      setImportStatus(`Imported "${newPl.title}" (${newPl.trackIds.length} tracks).`);
      setImportModal(null);
      setImportQuery('');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-44 select-none transition-colors">
      <div className="max-w-3xl mx-auto px-4.5">
        <SubScreenHeader title="Library & Content" onBack={onBack} />

        {importStatus && (
          <div
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="mt-3 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Home & Organization (Page 17) */}
        <section className="pt-4 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Home &amp; Organization
          </h2>

          <SettingActionCard
            icon={<LayoutGrid className="w-5 h-5" />}
            title="Home sections"
            subtitle={`${settings.visibleHomeSectionsCount} of 44 sections visible`}
            onClick={() => setImportModal('sections')}
          />

          <SettingActionCard
            icon={<Ban className="w-5 h-5" />}
            title="Excluded Songs"
            subtitle={
              settings.excludedSongIds.length === 0
                ? '0 songs excluded'
                : `${settings.excludedSongIds.length} songs hidden from radio & feed`
            }
            onClick={() => setImportModal('excluded')}
          />
        </section>

        {/* Content (Page 17) */}
        <section className="pt-5 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Content
          </h2>

          <SettingToggleCard
            icon={<Mic className="w-5 h-5" />}
            iconBg="blue"
            title="Podcasts"
            subtitle="Show podcast shelves, show pages and episode filter"
            checked={settings.podcastsEnabled}
            onChange={(v) => onUpdate({ podcastsEnabled: v })}
          />
        </section>

        {/* Library & Playlist Imports (Page 17) */}
        <section className="pt-5 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Library &amp; Playlist Imports
          </h2>

          <SettingActionCard
            icon={<ListMusic className="w-5 h-5" />}
            title="Import from YouTube Music"
            subtitle="Search, browse, or paste playlist links & IDs"
            onClick={() => setImportModal('ytm')}
          />

          <SettingActionCard
            icon={<PlayCircle className="w-5 h-5" />}
            title="Import from Spotify / Apple Music"
            subtitle="Paste a public playlist link or query"
            onClick={() => setImportModal('spotify')}
          />

          <SettingActionCard
            icon={<FileUp className="w-5 h-5" />}
            iconBg="blue"
            title="Import Playlist from File"
            subtitle="CSV, TSV, M3U/M3U8, or TXT • local track matcher"
            onClick={() => fileInputRef.current?.click()}
          />

          <SettingActionCard
            icon={<Download className="w-5 h-5" />}
            title="Backup Preferences & Settings (JSON)"
            subtitle="Export LastWave EQ, visual, and home configuration"
            onClick={handleExportBackup}
          />

          <SettingActionCard
            icon={<FileUp className="w-5 h-5" />}
            title="Restore from JSON Backup"
            subtitle="Import saved MasterWave preferences JSON"
            onClick={() => backupInputRef.current?.click()}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.tsv,.m3u,.m3u8,.txt"
            onChange={(e) => void handleFileImport(e)}
            className="hidden"
          />

          <input
            ref={backupInputRef}
            type="file"
            accept=".json"
            onChange={(e) => void handleRestoreBackup(e)}
            className="hidden"
          />
        </section>
      </div>

      {(importModal === 'ytm' || importModal === 'spotify') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#141716] rounded-3xl p-6 shadow-2xl space-y-3">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {importModal === 'ytm'
                ? 'Import from YouTube Music'
                : 'Import from Spotify / Apple Music'}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter a playlist link, ID, or search phrase to resolve tracks via NewPipeExtractor.
            </p>
            <input
              type="text"
              value={importQuery}
              onChange={(e) => setImportQuery(e.target.value)}
              placeholder={
                importModal === 'ytm'
                  ? 'e.g. Bollywood Night Drive or PL...'
                  : 'e.g. open.spotify.com/playlist/... or Chill Hits'
              }
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/10 text-xs font-medium focus:outline-none"
            />
            <button
              disabled={isImporting}
              onClick={() => void handleRemoteImport(importModal)}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-full py-2.5 rounded-full text-white text-xs font-bold disabled:opacity-60"
            >
              {isImporting ? 'Resolving Tracks...' : 'Import as Playlist'}
            </button>
            <button
              onClick={() => setImportModal(null)}
              className="w-full py-1.5 text-xs text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {importModal === 'sections' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#141716] rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
                Home Feed Sections
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Control how many discovery shelves appear on your Feed tab ({settings.visibleHomeSectionsCount} of 44).
              </p>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min={2}
                max={44}
                step={1}
                value={settings.visibleHomeSectionsCount}
                onChange={(e) =>
                  onUpdate({ visibleHomeSectionsCount: parseInt(e.target.value, 10) })
                }
                className="w-full accent-[var(--mw-primary)] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-gray-500">
                <span>Minimal (2)</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {settings.visibleHomeSectionsCount} sections
                </span>
                <span>Full (44)</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[4, 10, 44].map((preset) => (
                <button
                  key={preset}
                  onClick={() => onUpdate({ visibleHomeSectionsCount: preset })}
                  style={
                    settings.visibleHomeSectionsCount === preset
                      ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                      : undefined
                  }
                  className="py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold"
                >
                  {preset === 4 ? 'Compact' : preset === 10 ? 'Standard' : 'All 44'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setImportModal(null)}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-full py-2.5 rounded-full text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {importModal === 'excluded' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-white dark:bg-[#141716] rounded-3xl p-6 shadow-2xl space-y-3 max-h-[80dvh] flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
                Excluded Songs ({settings.excludedSongIds.length})
              </h3>
              {settings.excludedSongIds.length > 0 && (
                <button
                  onClick={() => {
                    onUpdate({ excludedSongIds: [] });
                    setImportStatus('Restored all excluded songs to feed & radio.');
                    setImportModal(null);
                  }}
                  style={{ color: 'var(--mw-primary)' }}
                  className="text-xs font-bold"
                >
                  Restore All
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 py-1 scrollbar-none">
              {settings.excludedSongIds.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 py-6 text-center">
                  No excluded tracks. Tap the three-dot menu in Now Playing and choose &ldquo;Exclude Song from Feed &amp; Radio&rdquo; to hide tracks you dislike.
                </p>
              ) : (
                settings.excludedSongIds.map((id) => {
                  const found = tracks.find((t) => t.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-gray-100 dark:bg-white/[0.06] gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {found?.title || id}
                        </p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {found?.artist || 'Hidden track ID'}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          onUpdate({
                            excludedSongIds: settings.excludedSongIds.filter((x) => x !== id)
                          })
                        }
                        style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                        className="px-3 py-1 rounded-full text-[11px] font-bold flex-shrink-0"
                      >
                        Restore
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <button
              onClick={() => setImportModal(null)}
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-full py-2.5 rounded-full text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================================
 * 4. ABOUT & COMMUNITY SCREEN (Page 18)
 * ========================================================================== */
export const AboutCommunityScreen: React.FC<{
  settings: MasterWaveSettings;
  stats: ListeningStats;
  onUpdate: (patch: Partial<MasterWaveSettings>) => void;
  onBack: () => void;
}> = ({ settings, stats, onUpdate, onBack }) => {
  const [notice, setNotice] = useState<string | null>(null);

  const exportDiagnostics = () => {
    const diagnostics = {
      app: 'MasterWave',
      version: '5.2.0',
      build: '2026.11.13',
      deviceProfile: 'Android 16 • Media3 / WebAudio DAC Bridge',
      newpipeConfig: newpipeService.getSavedConfig(),
      settings,
      listeningStatsSummary: {
        totalPlays: stats.totalPlays,
        uniqueTracks: stats.uniqueTracks,
        uniqueArtists: stats.uniqueArtists
      },
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(diagnostics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `masterwave_diagnostics_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Exported masterwave_diagnostics.json');
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--mw-page-bg)] text-gray-900 dark:text-white pb-44 select-none transition-colors">
      <div className="max-w-3xl mx-auto px-4.5">
        <SubScreenHeader title="About & Community" onBack={onBack} />

        {notice && (
          <div
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="mt-3 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {/* Language Section (Page 18) */}
        <section className="pt-4 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            Language
          </h2>

          <SettingActionCard
            icon={<Globe className="w-5 h-5" />}
            title="App Language"
            subtitle={settings.appLanguage}
            onClick={() => {
              const langs = ['System default', 'English', 'Hindi', 'Tamil', 'Spanish'];
              const next = langs[(langs.indexOf(settings.appLanguage) + 1) % langs.length];
              onUpdate({ appLanguage: next });
            }}
          />
        </section>

        {/* About Section (Page 18) */}
        <section className="pt-5 space-y-2.5">
          <h2
            style={{ color: 'var(--mw-primary)' }}
            className="text-xs font-bold tracking-wide px-1"
          >
            About
          </h2>

          <SettingActionCard
            icon={<Send className="w-5 h-5" />}
            title="Updates & Support"
            subtitle="Release channels & changelog feed"
            onClick={() => setNotice('Channel: MasterWave Material You Release v5.2.0')}
          />

          <SettingActionCard
            icon={<Users className="w-5 h-5" />}
            iconBg="blue"
            title="Discord Support"
            subtitle="Join our community for DAC & EQ presets"
            onClick={() => setNotice('Community channel synced inside MasterWave Jam.')}
          />

          <SettingActionCard
            icon={<Sparkles className="w-5 h-5" />}
            title="More From Us"
            subtitle="Material You audio projects & extractors"
            onClick={() => setNotice('Includes NewPipeExtractor v0.24.8 + LRCLIB + Last.fm')}
          />

          <SettingActionCard
            icon={<Code2 className="w-5 h-5" />}
            title="Export diagnostics"
            subtitle="Download logs & audio routing JSON for troubleshooting"
            onClick={exportDiagnostics}
          />
        </section>

        {/* Green Update Available Card (Page 18) */}
        <div
          style={{
            backgroundColor: 'var(--mw-stats-bg)',
            borderColor: 'var(--mw-stats-border)'
          }}
          className="mt-5 p-4 rounded-3xl border flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              style={{ backgroundColor: 'var(--mw-primary)' }}
              className="w-11 h-11 rounded-full text-white flex items-center justify-center flex-shrink-0"
            >
              <CloudDownload className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                Update Available!
              </h3>
              <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                Version 5.2.0 is ready to install
              </p>
            </div>
          </div>

          <button
            onClick={() => setNotice('MasterWave v5.2.0 package verified & up to date!')}
            style={{ backgroundColor: 'var(--mw-primary)' }}
            className="px-4 py-2 rounded-full text-white text-xs font-bold shadow-sm hover:brightness-95 active:scale-95 transition-all flex-shrink-0"
          >
            Update
          </button>
        </div>

        {/* Bottom Electric Lime Emblem Card (Page 18) */}
        <div className="mt-5 p-8 rounded-3xl bg-[#E8EAE6] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 flex flex-col items-center justify-center gap-2">
          <div className="w-18 h-18 rounded-full bg-[#C6FF00] flex items-center justify-center gap-1.5 shadow-md">
            <span className="w-1.5 h-4 bg-[#121614] rounded-full" />
            <span className="w-1.5 h-8 bg-[#121614] rounded-full" />
            <span className="w-1.5 h-10 bg-[#121614] rounded-full" />
            <span className="w-1.5 h-7 bg-[#121614] rounded-full" />
            <span className="w-1.5 h-4 bg-[#121614] rounded-full" />
          </div>
          <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400 mt-1">
            MasterWave • v5.2.0 (Material You)
          </span>
        </div>
      </div>
    </div>
  );
};
