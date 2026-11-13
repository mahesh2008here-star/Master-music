import React, { useState } from 'react';
import {
  ArrowLeft,
  History,
  Music,
  Users,
  Tag,
  Shuffle,
  Sparkles,
  Compass,
  Library,
  Loader2,
  Check
} from 'lucide-react';
import { Playlist, Track, ListeningStats } from '../types/music';
import { newpipeService } from '../services/newpipeService';

interface PlaylistGeneratorModalProps {
  tracks: Track[];
  currentTrack: Track | null;
  stats: ListeningStats;
  onGeneratedPlaylist: (playlist: Playlist, addedTracks: Track[]) => void;
  onClose: () => void;
}

interface GeneratorMode {
  id: string;
  title: string;
  subtitle: string;
  icon: 'history' | 'music' | 'users' | 'tag' | 'shuffle' | 'sparkles' | 'compass' | 'library';
  accentTile?: 'blue' | 'theme';
}

const GENERATOR_MODES: GeneratorMode[] = [
  {
    id: 'recent_tracks',
    title: 'Recent Tracks',
    subtitle: "What you've been listening to lately",
    icon: 'history'
  },
  {
    id: 'song_radio',
    title: 'Song Radio',
    subtitle: 'YouTube Music radio from any song',
    icon: 'music'
  },
  {
    id: 'similar_artists',
    title: 'Similar Artists',
    subtitle: 'YouTube-first artist discovery',
    icon: 'users'
  },
  {
    id: 'by_tag',
    title: 'By Tag / Genre',
    subtitle: 'YouTube-first genre picks',
    icon: 'tag'
  },
  {
    id: 'my_mix',
    title: 'My Mix',
    subtitle: 'Your taste, mixes & local favorites',
    icon: 'shuffle'
  },
  {
    id: 'my_recommendation',
    title: 'My Recommendation',
    subtitle: '35 YouTube-first discoveries',
    icon: 'sparkles'
  },
  {
    id: 'never_heard',
    title: 'Never Heard',
    subtitle: "Fresh discoveries you've never listened to before",
    icon: 'compass',
    accentTile: 'blue'
  },
  {
    id: 'my_library',
    title: 'My Library',
    subtitle: 'Re-discover the sounds of your past',
    icon: 'library'
  }
];

export const PlaylistGeneratorModal: React.FC<PlaylistGeneratorModalProps> = ({
  tracks,
  currentTrack,
  stats,
  onGeneratedPlaylist,
  onClose
}) => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [selectedGenrePrompt, setSelectedGenrePrompt] = useState<boolean>(false);
  const [customSeed, setCustomSeed] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const renderIcon = (icon: GeneratorMode['icon']) => {
    switch (icon) {
      case 'history':
        return <History className="w-5 h-5" />;
      case 'music':
        return <Music className="w-5 h-5" />;
      case 'users':
        return <Users className="w-5 h-5" />;
      case 'tag':
        return <Tag className="w-5 h-5" />;
      case 'shuffle':
        return <Shuffle className="w-5 h-5" />;
      case 'sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'compass':
        return <Compass className="w-5 h-5" />;
      case 'library':
        return <Library className="w-5 h-5" />;
    }
  };

  const generateForMode = async (mode: GeneratorMode, overrideQuery?: string) => {
    if (mode.id === 'by_tag' && !overrideQuery && !selectedGenrePrompt) {
      setSelectedGenrePrompt(true);
      return;
    }

    setGeneratingId(mode.id);
    setStatusMessage(null);

    try {
      let chosenTracks: Track[] = [];
      let playlistTitle = mode.title;
      let description = mode.subtitle;

      if (mode.id === 'recent_tracks') {
        const recent = stats.recentPlays.map((p) => p.track);
        const deduped: Track[] = [];
        for (const t of recent) {
          if (!deduped.some((d) => d.id === t.id)) deduped.push(t);
        }
        chosenTracks = deduped.length > 0 ? deduped : tracks.slice(0, 4);
        playlistTitle = 'Recent Rotation';
        description = 'Generated from your latest listening session';
      } else if (mode.id === 'song_radio') {
        const seed = currentTrack || tracks[0];
        playlistTitle = seed ? `${seed.title.split('(')[0].trim()} Radio` : 'Song Radio';
        description = `YouTube Music / NewPipe radio seeded by ${seed?.artist || 'MasterWave'}`;
        try {
          const searchRes = await newpipeService.search(`${seed?.artist || 'Sai Abhyankkar'} mix`);
          if (searchRes.items.length > 0) {
            chosenTracks = [seed, ...searchRes.items.slice(0, 6)].filter(Boolean) as Track[];
          }
        } catch {
          // fallback below
        }
        if (chosenTracks.length === 0) {
          chosenTracks = [...tracks].sort(() => Math.random() - 0.5).slice(0, 5);
        }
      } else if (mode.id === 'similar_artists') {
        const seedArtist = currentTrack?.artist || 'Sai Abhyankkar';
        playlistTitle = `Artists Like ${seedArtist}`;
        try {
          const searchRes = await newpipeService.search(`${seedArtist} similar artists songs`);
          chosenTracks = searchRes.items.slice(0, 8);
        } catch {
          // ignore
        }
        if (chosenTracks.length === 0) {
          chosenTracks = tracks.slice(0, 5);
        }
      } else if (mode.id === 'by_tag') {
        const genre = overrideQuery || customSeed.trim() || 'Indie Pop';
        playlistTitle = `${genre} Picks`;
        description = `YouTube-first ${genre} radio mix`;
        try {
          const searchRes = await newpipeService.search(`${genre} music songs`);
          chosenTracks = searchRes.items.slice(0, 8);
        } catch {
          // ignore
        }
        if (chosenTracks.length === 0) {
          chosenTracks = [...tracks].sort(() => Math.random() - 0.5);
        }
      } else if (mode.id === 'my_recommendation' || mode.id === 'never_heard') {
        try {
          const trendingRes = await newpipeService.getTrending('IN');
          const playedIds = new Set(stats.recentPlays.map((p) => p.track.id));
          const fresh = trendingRes.items.filter((t) => !playedIds.has(t.id));
          chosenTracks = fresh.length > 0 ? fresh.slice(0, 10) : trendingRes.items.slice(0, 10);
        } catch {
          // ignore
        }
        if (chosenTracks.length === 0) {
          chosenTracks = [...tracks].reverse();
        }
        playlistTitle = mode.id === 'never_heard' ? 'Never Heard Discoveries' : 'YouTube-First Recommendations';
      } else if (mode.id === 'my_mix') {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        chosenTracks = shuffled;
        playlistTitle = 'My Daily Mix';
        description = 'Blend of your favorites, lossless archive & recent vibes';
      } else {
        // My Library
        chosenTracks = tracks.filter((t) => t.isLiked || t.provider === 'hires_flac' || t.isLocal);
        if (chosenTracks.length === 0) chosenTracks = tracks;
        playlistTitle = 'Library Throwback';
        description = 'Saved favorites and lossless gems';
      }

      const createdAt = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const newPlaylist: Playlist = {
        id: `gen-${mode.id}-${Date.now()}`,
        title: playlistTitle,
        description,
        coverUrl: chosenTracks[0]?.artworkUrl || '',
        trackIds: chosenTracks.map((t) => t.id),
        createdAt,
        isPinned: false,
        isSystem: false
      };

      onGeneratedPlaylist(newPlaylist, chosenTracks);
      setStatusMessage(`Created "${playlistTitle}" with ${chosenTracks.length} tracks.`);
      setTimeout(() => {
        onClose();
      }, 650);
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--mw-page-bg)] text-gray-900 dark:text-white overflow-y-auto pb-32 select-none transition-colors">
      <div className="max-w-3xl mx-auto">
        {/* Elevated Android Header (Page 7) */}
        <header className="sticky top-0 z-30 rounded-b-[28px] bg-white/95 dark:bg-[#14141B]/95 backdrop-blur-xl shadow-[0_6px_24px_rgba(0,0,0,0.05)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.4)] border-b border-black/[0.04] dark:border-white/5 px-5 pt-[max(14px,env(safe-area-inset-top))] pb-4 flex items-start gap-3">
          <button
            onClick={onClose}
            aria-label="Back to playlists"
            className="p-1.5 -ml-1 mt-0.5 text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white rounded-full"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
          </button>
          <div>
            <h1 className="font-display text-[24px] leading-tight font-extrabold tracking-tight text-gray-900 dark:text-white">
              Generator
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Choose a mode to generate a playlist
            </p>
          </div>
        </header>

        <div className="px-4.5 pt-2">

        {/* Status Toast */}
        {statusMessage && (
          <div
            style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
            className="mt-3 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Quick Genre / Tag Picker when tapping "By Tag / Genre" */}
        {selectedGenrePrompt && (
          <div className="mt-3 p-4 rounded-3xl bg-[#E8EAE6] dark:bg-white/[0.06] border border-black/[0.05] dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                Pick a Tag or Enter Custom Genre
              </span>
              <button
                onClick={() => setSelectedGenrePrompt(false)}
                className="text-[11px] font-semibold text-gray-500"
              >
                Cancel
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Bollywood Romance', 'Desi Hip Hop', 'Tamil Acoustic', 'Chill Lo-Fi', '24-bit Classical', 'Synthwave'].map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    const tagMode = GENERATOR_MODES.find((m) => m.id === 'by_tag')!;
                    void generateForMode(tagMode, g);
                  }}
                  style={{ backgroundColor: 'var(--mw-tint)', color: 'var(--mw-tint-text)' }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold hover:brightness-95"
                >
                  {g}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Custom genre or mood..."
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-black/30 text-xs focus:outline-none"
              />
              <button
                onClick={() => {
                  const tagMode = GENERATOR_MODES.find((m) => m.id === 'by_tag')!;
                  void generateForMode(tagMode, customSeed || 'Indie');
                }}
                style={{ backgroundColor: 'var(--mw-primary)' }}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {/* 8 Generator Mode Cards (Page 7 exact list) */}
        <div className="space-y-2.5 pt-4">
          {GENERATOR_MODES.map((mode) => {
            const isBusy = generatingId === mode.id;
            const tileStyle =
              mode.accentTile === 'blue'
                ? undefined
                : {
                    backgroundColor: 'var(--mw-tint)',
                    color: 'var(--mw-tint-text)'
                  };

            return (
              <button
                key={mode.id}
                disabled={Boolean(generatingId)}
                onClick={() => void generateForMode(mode)}
                className="w-full text-left p-3.5 rounded-3xl bg-[#E8EAE6]/90 dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/5 hover:brightness-97 dark:hover:bg-white/10 active:scale-[0.99] transition-all flex items-center gap-3.5 disabled:opacity-60"
              >
                <div
                  style={tileStyle}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                    mode.accentTile === 'blue'
                      ? 'bg-[#B5CDF5] dark:bg-blue-900/40 text-[#1D3E78] dark:text-blue-200'
                      : ''
                  }`}
                >
                  {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : renderIcon(mode.icon)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {mode.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {mode.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        </div>
      </div>
    </div>
  );
};
