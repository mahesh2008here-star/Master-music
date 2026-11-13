import React from 'react';
import { BoldHomeIcon, BoldStatsIcon, BoldLibraryIcon } from './CustomIcons';
import { triggerAppHaptic } from '../services/themeService';

export type TabType = 'feed' | 'stats' | 'playlists';

interface BottomNavDockProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  liquidGlass?: boolean;
  hideLabels?: boolean;
  variant?: 'floating' | 'docked';
  hapticEnabled?: boolean;
}

export const BottomNavDock: React.FC<BottomNavDockProps> = ({
  activeTab,
  onTabChange,
  liquidGlass = true,
  hideLabels = false,
  variant = 'floating',
  hapticEnabled = true
}) => {
  const tabs: { id: TabType; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    {
      id: 'feed',
      label: 'Feed',
      icon: (active) => <BoldHomeIcon active={active} className="w-[20px] h-[20px]" />
    },
    {
      id: 'stats',
      label: 'Stats',
      icon: (active) => <BoldStatsIcon active={active} className="w-[20px] h-[20px]" />
    },
    {
      id: 'playlists',
      label: 'Library',
      icon: (active) => <BoldLibraryIcon active={active} className="w-[20px] h-[20px]" />
    }
  ];

  const handleSelect = (tab: TabType) => {
    triggerAppHaptic(hapticEnabled, 8);
    onTabChange(tab);
  };

  if (variant === 'docked') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <nav
          aria-label="Primary Navigation"
          className={`w-full px-6 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] flex items-center justify-around border-t ${
            liquidGlass
              ? 'bg-white/85 dark:bg-[#121417]/88 backdrop-blur-2xl border-black/[0.08] dark:border-white/[0.1]'
              : 'bg-white dark:bg-[#16171A] border-black/[0.08] dark:border-white/[0.1]'
          }`}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSelect(tab.id)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-1 min-w-[76px] py-1 active:scale-95 transition-transform"
              >
                <span
                  style={
                    isActive
                      ? { backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }
                      : undefined
                  }
                  className={`px-5 py-1.5 rounded-full transition-colors ${
                    isActive ? 'shadow-xs' : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tab.icon(isActive)}
                </span>
                {!hideLabels && (
                  <span
                    className={`text-[11px] font-bold tracking-tight ${
                      isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 flex justify-center pointer-events-none">
      <nav
        aria-label="Primary Navigation"
        className={`pointer-events-auto inline-flex items-center gap-1 p-1.5 rounded-full transition-all duration-200 ${
          liquidGlass
            ? 'liquid-glass-surface'
            : 'bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-[0_10px_28px_rgba(0,0,0,0.14)]'
        }`}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              style={
                isActive
                  ? {
                      backgroundColor: 'var(--mw-tint)',
                      color: 'var(--mw-tint-text)'
                    }
                  : undefined
              }
              className={`min-h-[44px] flex items-center justify-center gap-2 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap ${
                isActive
                  ? 'px-4.5 font-bold shadow-xs'
                  : 'min-w-[46px] px-3 text-gray-800 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {tab.icon(isActive)}
              {isActive && !hideLabels && (
                <span className="text-[12.5px] font-bold tracking-tight leading-none">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
