import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  INITIAL_TRACKS,
  INITIAL_ARTISTS,
  INITIAL_ALBUMS,
  INITIAL_PLAYLISTS
} from './data/defaultCatalog';
import { Track, Playlist, ListeningStats, LastFmProfile, NewPipeAudioStream } from './types/music';
import { audioEngine } from './services/audioEngine';
import { lastFmService } from './services/lastFmService';
import { BottomNavDock, TabType } from './components/BottomNavDock';
import { MiniPlayer } from './components/MiniPlayer';
import { HomeFeed } from './components/HomeFeed';
import { PlaylistsView } from './components/PlaylistsView';
import { StatisticsView } from './components/StatisticsView';
import { SettingsView } from './components/SettingsView';
import { NowPlayingScreen } from './components/NowPlayingScreen';
import { LyricsModal } from './components/LyricsModal';
import { AudioQualityModal } from './components/AudioQualityModal';
import { EqualizerModal } from './components/EqualizerModal';
import { AudioOutputModal } from './components/AudioOutputModal';
import { SearchModal } from './components/SearchModal';
import { LocalMusicModal } from './components/LocalMusicModal';
import { DownloadsModal } from './components/DownloadsModal';
import { FriendsJamScreen } from './components/FriendsJamScreen';
import { LikedSongsScreen } from './components/LikedSongsScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { DiscoverNewScreen } from './components/DiscoverNewScreen';
import { PlaylistGeneratorModal } from './components/PlaylistGeneratorModal';
import { ArtistDetailModal } from './components/ArtistDetailModal';
import { AlbumDetailModal } from './components/AlbumDetailModal';
import { downloadService, DownloadedItem } from './services/downloadService';
import { newpipeService } from './services/newpipeService';
import { ytMusicService } from './services/ytMusicService';
import {
  MasterWaveSettings,
  AccentPalette,
  loadSettings,
  saveSettings,
  applyThemeVariables,
  extractDynamicPaletteFromArtwork,
  triggerAppHaptic
} from './services/themeService';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
  const [playlists, setPlaylists] = useState<Playlist[]>(INITIAL_PLAYLISTS);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [currentView, setCurrentView] = useState<'main' | 'settings'>('main');

  // App-wide Material You / Audio / UI Settings
  const [settings, setSettings] = useState<MasterWaveSettings>(() => loadSettings());

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const [dynamicPalette, setDynamicPalette] = useState<AccentPalette | null>(null);
  const [playContextLabel, setPlayContextLabel] = useState<string>('Home Feed');

  const effectiveIsDark =
    settings.themeMode === 'dark' || (settings.themeMode === 'system' && systemPrefersDark);

  useEffect(() => {
    applyThemeVariables(settings, effectiveIsDark, dynamicPalette);
    saveSettings(settings);
    audioEngine.syncSettings(settings);
  }, [settings, effectiveIsDark, dynamicPalette]);

  const handleUpdateSettings = useCallback((patch: Partial<MasterWaveSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  // Playback state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(300);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  useEffect(() => {
    let cancelled = false;
    if (!settings.dynamicColor || !currentTrack?.artworkUrl) {
      setDynamicPalette(null);
      return;
    }
    extractDynamicPaletteFromArtwork(currentTrack.artworkUrl).then((palette) => {
      if (!cancelled) {
        setDynamicPalette(palette);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [settings.dynamicColor, currentTrack?.artworkUrl]);

  // Offline Downloads
  const [downloads, setDownloads] = useState<DownloadedItem[]>([]);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [isOfflineOnly, setIsOfflineOnly] = useState<boolean>(false);

  // Modals & Panels
  const [isNowPlayingOpen, setIsNowPlayingOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isAudioQualityOpen, setIsAudioQualityOpen] = useState<boolean>(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState<boolean>(false);
  const [isAudioOutputOpen, setIsAudioOutputOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState<string>('');
  const [isLocalMusicOpen, setIsLocalMusicOpen] = useState<boolean>(false);
  const [isDownloadsOpen, setIsDownloadsOpen] = useState<boolean>(false);
  const [isJamOpen, setIsJamOpen] = useState<boolean>(false);
  const [isLikedSongsOpen, setIsLikedSongsOpen] = useState<boolean>(false);
  const [isDiscoverOpen, setIsDiscoverOpen] = useState<boolean>(false);
  const [isDiscoverNewOpen, setIsDiscoverNewOpen] = useState<boolean>(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [streamNotice, setStreamNotice] = useState<{ type: 'loading' | 'error'; message: string } | null>(null);

  // YouTube Music Queue / Radio & Entity Pages
  const [upNextQueue, setUpNextQueue] = useState<Track[]>(INITIAL_TRACKS.slice(1));
  const [radioTitle, setRadioTitle] = useState<string>('Infinite Radio');
  const [autoplayRadio, setAutoplayRadio] = useState<boolean>(() =>
    ytMusicService.getAutoplayRadio()
  );
  const [isLoadingRadio, setIsLoadingRadio] = useState<boolean>(false);
  const [activeArtistQuery, setActiveArtistQuery] = useState<{ id?: string; name: string } | null>(
    null
  );
  const [activeAlbumQuery, setActiveAlbumQuery] = useState<{
    id?: string;
    title?: string;
    artist?: string;
  } | null>(null);
  const [recommendationTick, setRecommendationTick] = useState<number>(0);
  const radioFetchIdRef = useRef<number>(0);

  useEffect(() => {
    downloadService
      .getAllDownloads()
      .then((items) => {
        setDownloads(items);
        setDownloadedIds(new Set(items.map((i) => i.id)));
      })
      .catch((err) => {
        console.warn('Could not initialize offline storage:', err);
      });

    const savedNewpipe = newpipeService.getSavedConfig();
    if (savedNewpipe.instanceUrl) {
      newpipeService.updateBackendConfig(savedNewpipe.instanceUrl, savedNewpipe.filter).catch(() => {});
    }
  }, []);

  // Automatically rotate recommendations every 3 minutes based on previous listens
  useEffect(() => {
    const timer = setInterval(() => {
      setRecommendationTick((prev) => prev + 1);
    }, 180_000);
    return () => clearInterval(timer);
  }, []);

  const [lastFmProfile, setLastFmProfile] = useState<LastFmProfile>(lastFmService.getProfile());
  const [stats, setStats] = useState<ListeningStats>(lastFmService.getStats());

  const getPlayableTrack = useCallback(
    (t: Track): Track => {
      const downloaded = downloads.find((d) => d.id === t.id);
      if (downloaded && downloaded.blobUrl) {
        return {
          ...t,
          streamUrl: downloaded.blobUrl,
          artworkUrl: downloaded.artworkDataUrl || t.artworkUrl
        };
      }
      return t;
    },
    [downloads]
  );

  const playWithNewPipeResolution = useCallback(
    async (track: Track, startAt: number = 0) => {
      const playable = getPlayableTrack(track);
      setCurrentTrack(playable);
      setDuration(playable.duration);
      setCurrentTime(startAt);

      const isBrowserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      if ((isBrowserOffline || isOfflineOnly) && !playable.streamUrl?.startsWith('blob:') && !playable.isLocal) {
        setIsPlaying(false);
        setStreamNotice({
          type: 'error',
          message: `"${playable.title}" is not downloaded for offline playback.`
        });
        return;
      }

      if (playable.provider === 'newpipe' && !playable.streamUrl && playable.newpipeVideoId) {
        setStreamNotice({
          type: 'loading',
          message: `Resolving audio stream for "${playable.title}"...`
        });
        const resolution = await newpipeService.resolveStream(
          playable.newpipeVideoId,
          playable.title,
          playable.artist
        );

        if (!resolution.resolved || resolution.audioStreams.length === 0) {
          setIsPlaying(false);
          setStreamNotice({
            type: 'error',
            message:
              resolution.message ||
              'Streaming extractors could not resolve an audio stream for this track.'
          });
          return;
        }

        const bestStream = resolution.audioStreams[0];
        const resolvedTrack: Track = {
          ...playable,
          title: resolution.title || playable.title,
          artist: resolution.artist || playable.artist,
          duration: resolution.duration || playable.duration,
          artworkUrl: resolution.artworkUrl || playable.artworkUrl,
          streamUrl: bestStream.url,
          availableStreams: resolution.audioStreams,
          quality: newpipeService.mapStreamToQuality(
            bestStream,
            resolution.provider || 'NewPipeExtractor'
          )
        };

        setStreamNotice(null);
        setCurrentTrack(resolvedTrack);
        setDuration(resolvedTrack.duration);
        setTracks((prev) => {
          const exists = prev.some((t) => t.id === resolvedTrack.id);
          return exists
            ? prev.map((t) => (t.id === resolvedTrack.id ? resolvedTrack : t))
            : [resolvedTrack, ...prev];
        });

        const started = await audioEngine.playTrack(resolvedTrack, startAt);
        setIsPlaying(started);
        if (started) {
          lastFmService.recordPlay(resolvedTrack);
          setStats({ ...lastFmService.getStats() });
        }
        return;
      }

      setStreamNotice(null);
      let started = await audioEngine.playTrack(playable, startAt);

      // Automatic query cross-resolution fallback if a track URL is missing or fails
      if (!started && !playable.isLocal) {
        setStreamNotice({
          type: 'loading',
          message: `Switching stream mirror for "${playable.title}"...`
        });
        const fallback = await newpipeService.resolveByQuery(`${playable.title} ${playable.artist}`);
        if (fallback.resolved && fallback.audioStreams.length > 0) {
          const best = fallback.audioStreams[0];
          const recoveredTrack: Track = {
            ...playable,
            streamUrl: best.url,
            availableStreams: fallback.audioStreams,
            quality: newpipeService.mapStreamToQuality(
              best,
              fallback.provider || 'MasterWave Free Stream'
            )
          };
          setCurrentTrack(recoveredTrack);
          started = await audioEngine.playTrack(recoveredTrack, startAt);
          if (started) {
            setStreamNotice(null);
            setIsPlaying(true);
            lastFmService.recordPlay(recoveredTrack);
            setStats({ ...lastFmService.getStats() });
            return;
          }
        }
        setStreamNotice(null);
      }

      setIsPlaying(started);
      if (started) {
        // Ensure played live tracks are tracked in catalog list
        setTracks((prev) => {
          if (prev.some((t) => t.id === playable.id)) return prev;
          return [playable, ...prev];
        });
        lastFmService.recordPlay(playable);
        setStats({ ...lastFmService.getStats() });
      } else {
        setStreamNotice({
          type: 'error',
          message: `Could not start playback for "${playable.title}". Tap another track or search to retry.`
        });
      }
    },
    [getPlayableTrack, isOfflineOnly]
  );

  // Handle Play / Pause — ensures audio source is actually loaded if pressed right on startup
  const handlePlayPause = useCallback(() => {
    if (!currentTrack) return;
    triggerAppHaptic(settings.hapticFeedback, 10);
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      return;
    }

    if (!audioEngine.hasSource() || audioEngine.getLoadedTrackId() !== currentTrack.id) {
      void playWithNewPipeResolution(currentTrack, currentTime);
      return;
    }

    audioEngine.resume().then((ok) => {
      if (ok) {
        setIsPlaying(true);
      } else {
        void playWithNewPipeResolution(currentTrack, currentTime);
      }
    });
  }, [currentTrack, isPlaying, currentTime, settings.hapticFeedback, playWithNewPipeResolution]);

  const topUpRadioQueue = useCallback((seedTrack: Track) => {
    const fetchId = ++radioFetchIdRef.current;
    setIsLoadingRadio(true);
    ytMusicService
      .getUpNextRadio(seedTrack)
      .then((res) => {
        if (radioFetchIdRef.current !== fetchId) return;
        if (res.tracks && res.tracks.length > 0) {
          const excluded = new Set(settings.excludedSongIds);
          setUpNextQueue((prev) => {
            const seen = new Set(prev.map((t) => t.id));
            seen.add(seedTrack.id);
            const additions = res.tracks.filter((t) => !seen.has(t.id) && !excluded.has(t.id));
            return [...prev, ...additions];
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (radioFetchIdRef.current === fetchId) {
          setIsLoadingRadio(false);
        }
      });
  }, [settings.excludedSongIds]);

  const handleNextTrack = useCallback(() => {
    if (!currentTrack) return;

    const isBrowserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if ((isOfflineOnly || isBrowserOffline) && downloads.length > 0) {
      const offlineTracks = downloads.map((d) => getPlayableTrack(d.track));
      const idx = offlineTracks.findIndex((t) => t.id === currentTrack.id);
      const nextIdx = shuffle
        ? Math.floor(Math.random() * offlineTracks.length)
        : (idx + 1) % offlineTracks.length;
      void playWithNewPipeResolution(offlineTracks[nextIdx], 0);
      return;
    }

    if (upNextQueue.length > 0) {
      const nextIndex = shuffle ? Math.floor(Math.random() * upNextQueue.length) : 0;
      const nextTrack = upNextQueue[nextIndex];
      const remaining = upNextQueue.filter((_, i) => i !== nextIndex);
      setUpNextQueue(remaining);
      void playWithNewPipeResolution(nextTrack, 0);
      setRecommendationTick((prev) => prev + 1);

      if (remaining.length <= 2 && autoplayRadio) {
        topUpRadioQueue(nextTrack);
      }
      return;
    }

    if (tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (currentIndex + 1) % tracks.length;
    const fallbackNext = tracks[nextIndex];
    void playWithNewPipeResolution(fallbackNext, 0);
    if (autoplayRadio) {
      topUpRadioQueue(fallbackNext);
    }
  }, [
    currentTrack,
    isOfflineOnly,
    downloads,
    getPlayableTrack,
    upNextQueue,
    tracks,
    shuffle,
    autoplayRadio,
    playWithNewPipeResolution,
    topUpRadioQueue
  ]);

  const handlePreviousTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) return;
    if (currentTime > 3) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    const isBrowserOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
    if ((isOfflineOnly || isBrowserOffline) && downloads.length > 0) {
      const offlineTracks = downloads.map((d) => getPlayableTrack(d.track));
      const idx = offlineTracks.findIndex((t) => t.id === currentTrack.id);
      const prevIdx = (idx - 1 + offlineTracks.length) % offlineTracks.length;
      void playWithNewPipeResolution(offlineTracks[prevIdx], 0);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    void playWithNewPipeResolution(tracks[prevIndex], 0);
  }, [currentTrack, tracks, currentTime, isOfflineOnly, downloads, getPlayableTrack, playWithNewPipeResolution]);

  const handlePlayTrack = useCallback(
    (track: Track, explicitQueue?: Track[], contextSource?: string) => {
      triggerAppHaptic(settings.hapticFeedback, 8);
      if (contextSource) {
        setPlayContextLabel(contextSource);
      } else if (isSearchOpen) {
        setPlayContextLabel('Search');
      } else if (activeTab === 'playlists') {
        setPlayContextLabel('Library');
      } else if (activeTab === 'stats') {
        setPlayContextLabel('Replay');
      } else {
        setPlayContextLabel('Home Feed');
      }

      void playWithNewPipeResolution(track, 0);
      setRecommendationTick((prev) => prev + 1);

      if (explicitQueue && explicitQueue.length > 0) {
        const idx = explicitQueue.findIndex((t) => t.id === track.id);
        const remaining =
          idx >= 0
            ? [...explicitQueue.slice(idx + 1), ...explicitQueue.slice(0, idx)]
            : explicitQueue.filter((t) => t.id !== track.id);
        setUpNextQueue(remaining);
        setRadioTitle(track.album || `${track.artist} Mix`);
        return;
      }

      const fetchId = ++radioFetchIdRef.current;
      setIsLoadingRadio(true);
      setRadioTitle(`${track.artist} Radio`);
      ytMusicService
        .getUpNextRadio(track)
        .then((res) => {
          if (radioFetchIdRef.current !== fetchId) return;
          if (res.tracks && res.tracks.length > 0) {
            const excluded = new Set(settings.excludedSongIds);
            setUpNextQueue(res.tracks.filter((t) => t.id !== track.id && !excluded.has(t.id)));
            if (res.radioTitle) setRadioTitle(res.radioTitle);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (radioFetchIdRef.current === fetchId) {
            setIsLoadingRadio(false);
          }
        });
    },
    [playWithNewPipeResolution, settings.excludedSongIds, settings.hapticFeedback, isSearchOpen, activeTab]
  );

  const handlePlayFromQueue = useCallback(
    (track: Track) => {
      const idx = upNextQueue.findIndex((t) => t.id === track.id);
      const remaining =
        idx >= 0 ? upNextQueue.slice(idx + 1) : upNextQueue.filter((t) => t.id !== track.id);
      setUpNextQueue(remaining);
      void playWithNewPipeResolution(track, 0);
      setRecommendationTick((prev) => prev + 1);
      if (remaining.length <= 2 && autoplayRadio) {
        topUpRadioQueue(track);
      }
    },
    [upNextQueue, autoplayRadio, playWithNewPipeResolution, topUpRadioQueue]
  );

  const handleAddToQueue = useCallback((track: Track) => {
    setUpNextQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) return prev;
      return [...prev, track];
    });
  }, []);

  const handleRemoveFromQueue = useCallback((trackId: string) => {
    setUpNextQueue((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const handleToggleAutoplay = useCallback(() => {
    setAutoplayRadio((prev) => {
      const next = !prev;
      ytMusicService.setAutoplayRadio(next);
      return next;
    });
  }, []);

  const handleSaveQueueAsPlaylist = useCallback(() => {
    const combined = [
      ...(currentTrack ? [currentTrack] : []),
      ...upNextQueue.filter((t) => t.id !== currentTrack?.id)
    ];
    if (combined.length === 0) return;

    setTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newOnes = combined.filter((t) => !existingIds.has(t.id));
      return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
    });

    const newPlaylist: Playlist = {
      id: `pl-radio-${Date.now()}`,
      title: radioTitle || 'MasterWave Radio Queue',
      trackIds: combined.map((t) => t.id),
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      isPinned: false,
      coverUrl: combined[0]?.artworkUrl
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
  }, [currentTrack, upNextQueue, radioTitle]);

  const handleSelectExtractedStream = async (stream: NewPipeAudioStream) => {
    if (!currentTrack) return;
    const resumeAt = currentTime;
    const updatedTrack: Track = {
      ...currentTrack,
      streamUrl: stream.url,
      quality: newpipeService.mapStreamToQuality(stream, currentTrack.quality.sourceProvider)
    };
    setCurrentTrack(updatedTrack);
    const ok = await audioEngine.playTrack(updatedTrack, resumeAt);
    setIsPlaying(ok);
  };

  const handleToggleDownload = async (track: Track) => {
    try {
      if (downloadedIds.has(track.id)) {
        await downloadService.removeDownload(track.id);
      } else {
        setStreamNotice({
          type: 'loading',
          message: `Downloading "${track.title}" with merged cover artwork...`
        });
        await downloadService.downloadTrack(track);
        setStreamNotice(null);
      }
      const updated = await downloadService.getAllDownloads();
      setDownloads(updated);
      setDownloadedIds(new Set(updated.map((i) => i.id)));
    } catch (err) {
      setStreamNotice({
        type: 'error',
        message: err instanceof Error ? err.message : `Unable to download "${track.title}".`
      });
    }
  };

  const handleRemoveDownload = async (trackId: string) => {
    try {
      await downloadService.removeDownload(trackId);
      const updated = await downloadService.getAllDownloads();
      setDownloads(updated);
      setDownloadedIds(new Set(updated.map((i) => i.id)));
    } catch (err) {
      console.warn('Remove download error:', err);
    }
  };

  const handleClearAllDownloads = async () => {
    try {
      for (const item of downloads) {
        await downloadService.removeDownload(item.id);
      }
      setDownloads([]);
      setDownloadedIds(new Set());
    } catch (err) {
      console.warn('Clear downloads error:', err);
    }
  };

  const handleExcludeTrack = useCallback(
    (trackId: string) => {
      setSettings((prev) => ({
        ...prev,
        excludedSongIds: Array.from(new Set([...prev.excludedSongIds, trackId]))
      }));
      setUpNextQueue((prev) => prev.filter((t) => t.id !== trackId));
      if (currentTrack?.id === trackId) {
        handleNextTrack();
      }
    },
    [currentTrack?.id, handleNextTrack]
  );

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  const handleToggleLike = (trackId: string) => {
    triggerAppHaptic(settings.hapticFeedback, 12);
    setTracks((prev) => prev.map((t) => (t.id === trackId ? { ...t, isLiked: !t.isLiked } : t)));
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isLiked: !prev.isLiked } : null));
    }
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id === 'liked-songs') {
          const exists = pl.trackIds.includes(trackId);
          return {
            ...pl,
            trackIds: exists
              ? pl.trackIds.filter((id) => id !== trackId)
              : [...pl.trackIds, trackId]
          };
        }
        return pl;
      })
    );
  };

  const handleAddLocalTrack = (newTrack: Track) => {
    setTracks((prev) => [newTrack, ...prev]);
    setPlaylists((prev) =>
      prev.map((pl) =>
        pl.id === 'local-songs' ? { ...pl, trackIds: [newTrack.id, ...pl.trackIds] } : pl
      )
    );
  };

  const handleCreatePlaylist = () => {
    const count = playlists.length + 1;
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      title: `My MasterWave Mix #${count}`,
      trackIds: currentTrack ? [currentTrack.id] : [],
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      isPinned: false
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  const handleGeneratedOrImportedPlaylist = (newPlaylist: Playlist, addedTracks: Track[]) => {
    if (addedTracks.length > 0) {
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const uniqueNew = addedTracks.filter((t) => !existingIds.has(t.id));
        return [...uniqueNew, ...prev];
      });
    }
    setPlaylists((prev) => [newPlaylist, ...prev]);
  };

  const handleTogglePinPlaylist = (playlistId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, isPinned: !p.isPinned } : p))
    );
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  const handleConnectLastFm = (username: string) => {
    const updated = lastFmService.connectAccount(username);
    setLastFmProfile({ ...updated });
  };

  const handleDisconnectLastFm = () => {
    const updated = lastFmService.disconnectAccount();
    setLastFmProfile({ ...updated });
  };

  useEffect(() => {
    audioEngine.setCallbacks({
      onTimeUpdate: (time) => setCurrentTime(time),
      onPlayState: (playing) => setIsPlaying(playing),
      onEnded: () => {
        if (repeatMode === 'one') {
          audioEngine.seek(0);
          void audioEngine.resume();
        } else {
          handleNextTrack();
        }
      },
      onError: (err) => {
        console.warn('Audio stream notification:', err);
        setIsPlaying(false);
      }
    });

    audioEngine.setMediaSessionHandlers({
      onPlay: () => handlePlayPause(),
      onPause: () => handlePlayPause(),
      onNext: () => handleNextTrack(),
      onPrevious: () => handlePreviousTrack(),
      onSeek: (seconds) => handleSeek(seconds)
    });
  }, [handleNextTrack, handlePlayPause, handlePreviousTrack, repeatMode]);

  return (
    <div
      className={`min-h-[100dvh] w-full ${
        effectiveIsDark ? 'dark' : ''
      } bg-[var(--mw-page-bg)] font-sans antialiased text-gray-900 dark:text-white transition-colors duration-200`}
    >
      {/* Primary Views */}
      {currentView === 'settings' ? (
        <SettingsView
          lastFmProfile={lastFmProfile}
          settings={settings}
          tracks={tracks}
          stats={stats}
          onUpdateSettings={handleUpdateSettings}
          onImportPlaylist={handleGeneratedOrImportedPlaylist}
          onConnectLastFm={handleConnectLastFm}
          onDisconnectLastFm={handleDisconnectLastFm}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onOpenAudioOutput={() => setIsAudioOutputOpen(true)}
          onOpenJam={() => setIsJamOpen(true)}
          onOpenDownloads={() => setIsDownloadsOpen(true)}
          onBack={() => setCurrentView('main')}
        />
      ) : (
        <>
          {activeTab === 'feed' && (
            <HomeFeed
              tracks={tracks}
              artists={INITIAL_ARTISTS}
              albums={INITIAL_ALBUMS}
              stats={stats}
              downloadedIds={downloadedIds}
              excludedSongIds={settings.excludedSongIds}
              visibleSectionsCount={settings.visibleHomeSectionsCount}
              podcastsEnabled={settings.podcastsEnabled}
              recommendationTick={recommendationTick}
              showInlineNav={settings.hideNavTabs}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onPlayTrack={(t, q) => handlePlayTrack(t, q, 'Home Feed')}
              onOpenSearch={(q) => {
                setSearchInitialQuery(q || '');
                setIsSearchOpen(true);
              }}
              onOpenLikedSongs={() => setIsLikedSongsOpen(true)}
              onOpenDiscover={() => setIsDiscoverOpen(true)}
              onOpenDiscoverNew={() => setIsDiscoverNewOpen(true)}
              onOpenSettings={() => setCurrentView('settings')}
              onOpenDownloads={() => setIsDownloadsOpen(true)}
              onOpenJam={() => setIsJamOpen(true)}
              onToggleDownload={handleToggleDownload}
              onOpenArtist={(artist) => {
                setActiveAlbumQuery(null);
                setActiveArtistQuery(artist);
              }}
              onOpenAlbum={(album) => {
                setActiveArtistQuery(null);
                setActiveAlbumQuery(album);
              }}
            />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsView
              playlists={playlists}
              tracks={tracks}
              albums={INITIAL_ALBUMS}
              artists={INITIAL_ARTISTS}
              stats={stats}
              downloadedIds={downloadedIds}
              showInlineNav={settings.hideNavTabs}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onSelectPlaylist={(pl) => {
                const plTracks = tracks.filter((t) => pl.trackIds.includes(t.id));
                if (plTracks.length > 0) handlePlayTrack(plTracks[0], plTracks, pl.title);
              }}
              onPlayTrack={(t, q) => handlePlayTrack(t, q, 'Library')}
              onCreatePlaylist={handleCreatePlaylist}
              onImportPlaylist={handleGeneratedOrImportedPlaylist}
              onOpenGenerator={() => setIsGeneratorOpen(true)}
              onOpenLocalMusic={() => setIsLocalMusicOpen(true)}
              onOpenDownloads={() => setIsDownloadsOpen(true)}
              onOpenStats={() => setActiveTab('stats')}
              onOpenJam={() => setIsJamOpen(true)}
              onOpenSettings={() => setCurrentView('settings')}
              onOpenArtist={(artist) => {
                setActiveAlbumQuery(null);
                setActiveArtistQuery(artist);
              }}
              onOpenAlbum={(album) => {
                setActiveArtistQuery(null);
                setActiveAlbumQuery(album);
              }}
              onTogglePinPlaylist={handleTogglePinPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
            />
          )}

          {activeTab === 'stats' && (
            <StatisticsView
              stats={stats}
              lastFmProfile={lastFmProfile}
              showInlineNav={settings.hideNavTabs}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenSearch={() => {
                setSearchInitialQuery('');
                setIsSearchOpen(true);
              }}
              onOpenSettings={() => setCurrentView('settings')}
              onOpenDownloads={() => setIsDownloadsOpen(true)}
              onPlayTrack={(t) => handlePlayTrack(t, undefined, 'Replay')}
            />
          )}
        </>
      )}

      {/* Floating Mini-Player (Persistent across all views) */}
      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        liquidGlass={settings.liquidGlass}
        classicCardMode={settings.buttonNowPlaying}
        dockHidden={settings.hideNavTabs || currentView !== 'main'}
        isExpanded={isNowPlayingOpen}
        onPlayPause={handlePlayPause}
        onNext={handleNextTrack}
        onExpand={() => setIsNowPlayingOpen(true)}
      />

      {/* Floating / Material 3 Bottom Navigation Dock */}
      {currentView === 'main' && !settings.hideNavTabs && (
        <BottomNavDock
          activeTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          liquidGlass={settings.liquidGlass}
          hideLabels={false}
          variant={settings.m3NavBar ? 'floating' : 'docked'}
          hapticEnabled={settings.hapticFeedback}
        />
      )}

      {/* Playlist Generator Full Screen (Page 7) */}
      {isGeneratorOpen && (
        <PlaylistGeneratorModal
          tracks={tracks}
          currentTrack={currentTrack}
          stats={stats}
          onGeneratedPlaylist={handleGeneratedOrImportedPlaylist}
          onClose={() => setIsGeneratorOpen(false)}
        />
      )}

      {/* Full-Screen Now Playing Screen with Coordinated Blur Transition */}
      <AnimatePresence>
        {isNowPlayingOpen && currentTrack && (
          <NowPlayingScreen
            key="now-playing-screen"
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            shuffle={shuffle}
            repeatMode={repeatMode}
            isDownloaded={downloadedIds.has(currentTrack.id)}
            wavySeekbar={settings.wavySeekbar}
            rotatingBackground={settings.rotatingBackground}
            fullScreenArtwork={settings.fullScreenArtwork}
            sourceLabel={playContextLabel}
            settings={settings}
            upNextQueue={upNextQueue}
            radioTitle={radioTitle}
            autoplayRadio={autoplayRadio}
            isLoadingRadio={isLoadingRadio}
            onToggleAutoplay={handleToggleAutoplay}
            onPlayFromQueue={handlePlayFromQueue}
            onRemoveFromQueue={handleRemoveFromQueue}
            onSaveQueueAsPlaylist={handleSaveQueueAsPlaylist}
            onExcludeTrack={handleExcludeTrack}
            onOpenArtist={(artistName) => {
              setIsNowPlayingOpen(false);
              setActiveAlbumQuery(null);
              setActiveArtistQuery({ name: artistName });
            }}
            onOpenAlbum={(albumTitle, artistName) => {
              setIsNowPlayingOpen(false);
              setActiveArtistQuery(null);
              setActiveAlbumQuery({ title: albumTitle, artist: artistName });
            }}
            onDismiss={() => setIsNowPlayingOpen(false)}
            onPlayPause={handlePlayPause}
            onPrevious={handlePreviousTrack}
            onNext={handleNextTrack}
            onSeek={handleSeek}
            onToggleShuffle={() => {
              triggerAppHaptic(settings.hapticFeedback, 8);
              setShuffle((prev) => !prev);
            }}
            onToggleRepeat={() => {
              triggerAppHaptic(settings.hapticFeedback, 8);
              setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
            }}
            onToggleLike={handleToggleLike}
            onToggleDownload={handleToggleDownload}
            onOpenLyrics={() => setIsLyricsOpen(true)}
            onOpenAudioQuality={() => setIsAudioQualityOpen(true)}
            onOpenEqualizer={() => setIsEqualizerOpen(true)}
            onOpenAudioOutput={() => setIsAudioOutputOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Synchronized Lyrics Modal */}
      {isLyricsOpen && currentTrack && (
        <LyricsModal
          track={currentTrack}
          currentTime={currentTime}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsLyricsOpen(false)}
          onSeek={handleSeek}
        />
      )}

      {/* Audio Quality Verification Modal */}
      {isAudioQualityOpen && currentTrack && (
        <AudioQualityModal
          quality={currentTrack.quality}
          availableStreams={currentTrack.availableStreams}
          currentStreamUrl={currentTrack.streamUrl}
          onSelectStream={handleSelectExtractedStream}
          onClose={() => setIsAudioQualityOpen(false)}
        />
      )}

      {/* 15-Band Parametric EQ & AutoEQ Modal */}
      {isEqualizerOpen && <EqualizerModal onClose={() => setIsEqualizerOpen(false)} />}

      {/* Audio Output Modal */}
      {isAudioOutputOpen && (
        <AudioOutputModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onOpenEqualizer={() => {
            setIsAudioOutputOpen(false);
            setIsEqualizerOpen(true);
          }}
          onClose={() => setIsAudioOutputOpen(false)}
        />
      )}

      {/* Search & Explore Modal */}
      {isSearchOpen && (
        <SearchModal
          tracks={tracks}
          downloads={downloads}
          isOfflineOnly={isOfflineOnly}
          initialQuery={searchInitialQuery}
          downloadedIds={downloadedIds}
          onToggleOfflineOnly={() => setIsOfflineOnly((prev) => !prev)}
          onSelectTrack={(track, queue) => handlePlayTrack(track, queue, 'Search')}
          onAddToQueue={handleAddToQueue}
          onToggleDownload={handleToggleDownload}
          onSaveAsPlaylist={handleGeneratedOrImportedPlaylist}
          onOpenArtist={(artist) => {
            setIsSearchOpen(false);
            setActiveAlbumQuery(null);
            setActiveArtistQuery(artist);
          }}
          onOpenAlbum={(album) => {
            setIsSearchOpen(false);
            setActiveArtistQuery(null);
            setActiveAlbumQuery(album);
          }}
          onClose={() => {
            setIsSearchOpen(false);
            setSearchInitialQuery('');
          }}
        />
      )}

      {/* YouTube Music Artist Detail Screen */}
      {activeArtistQuery && (
        <ArtistDetailModal
          artistQuery={activeArtistQuery}
          downloadedIds={downloadedIds}
          onPlayTrack={handlePlayTrack}
          onAddToQueue={handleAddToQueue}
          onToggleDownload={handleToggleDownload}
          onOpenAlbum={(alb) => {
            setActiveArtistQuery(null);
            setActiveAlbumQuery({
              id: alb.id,
              title: alb.title,
              artist: alb.artist
            });
          }}
          onOpenArtist={(art) => {
            setActiveAlbumQuery(null);
            setActiveArtistQuery(art);
          }}
          onFollowChanged={() => setRecommendationTick((prev) => prev + 1)}
          onClose={() => setActiveArtistQuery(null)}
        />
      )}

      {/* YouTube Music Album Detail Screen */}
      {activeAlbumQuery && (
        <AlbumDetailModal
          albumQuery={activeAlbumQuery}
          downloadedIds={downloadedIds}
          onPlayTrack={handlePlayTrack}
          onAddToQueue={handleAddToQueue}
          onToggleDownload={handleToggleDownload}
          onOpenArtist={(art) => {
            setActiveAlbumQuery(null);
            setActiveArtistQuery(art);
          }}
          onSaveAsPlaylist={handleGeneratedOrImportedPlaylist}
          onClose={() => setActiveAlbumQuery(null)}
        />
      )}

      {/* Local Music Importer Modal */}
      {isLocalMusicOpen && (
        <LocalMusicModal
          onAddLocalTrack={handleAddLocalTrack}
          onClose={() => setIsLocalMusicOpen(false)}
        />
      )}

      {/* Downloads & Offline Management Modal */}
      {isDownloadsOpen && (
        <DownloadsModal
          downloads={downloads}
          isOfflineOnly={isOfflineOnly}
          onToggleOfflineOnly={() => setIsOfflineOnly((prev) => !prev)}
          onPlayTrack={handlePlayTrack}
          onRemoveDownload={handleRemoveDownload}
          onClearAllDownloads={handleClearAllDownloads}
          onClose={() => setIsDownloadsOpen(false)}
        />
      )}

      {/* Full-Screen Liked Songs */}
      <AnimatePresence>
        {isLikedSongsOpen && (
          <LikedSongsScreen
            key="liked-songs-screen"
            tracks={tracks}
            currentTrackId={currentTrack?.id}
            downloadedIds={downloadedIds}
            onPlayTrack={(t, q) => handlePlayTrack(t, q, 'Liked Songs')}
            onToggleLike={handleToggleLike}
            onAddToQueue={handleAddToQueue}
            onToggleDownload={handleToggleDownload}
            onSaveAsPlaylist={handleGeneratedOrImportedPlaylist}
            onClose={() => setIsLikedSongsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Full-Screen Discover */}
      <AnimatePresence>
        {isDiscoverOpen && (
          <DiscoverScreen
            key="discover-screen"
            tracks={tracks}
            stats={stats}
            downloadedIds={downloadedIds}
            onPlayTrack={(t, q) => handlePlayTrack(t, q, 'Discover')}
            onToggleLike={handleToggleLike}
            onAddToQueue={handleAddToQueue}
            onToggleDownload={handleToggleDownload}
            onSaveAsPlaylist={handleGeneratedOrImportedPlaylist}
            onOpenArtist={(artist) => {
              setIsDiscoverOpen(false);
              setActiveAlbumQuery(null);
              setActiveArtistQuery(artist);
            }}
            onOpenAlbum={(album) => {
              setIsDiscoverOpen(false);
              setActiveArtistQuery(null);
              setActiveAlbumQuery(album);
            }}
            onClose={() => setIsDiscoverOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Full-Screen Discover New */}
      <AnimatePresence>
        {isDiscoverNewOpen && (
          <DiscoverNewScreen
            key="discover-new-screen"
            stats={stats}
            downloadedIds={downloadedIds}
            onPlayTrack={(t, q) => handlePlayTrack(t, q, 'Discover New')}
            onToggleLike={handleToggleLike}
            onAddToQueue={handleAddToQueue}
            onToggleDownload={handleToggleDownload}
            onSaveAsPlaylist={handleGeneratedOrImportedPlaylist}
            onOpenAlbum={(album) => {
              setIsDiscoverNewOpen(false);
              setActiveArtistQuery(null);
              setActiveAlbumQuery(album);
            }}
            onClose={() => setIsDiscoverNewOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Full-Screen Friends Jam */}
      <AnimatePresence>
        {isJamOpen && (
          <FriendsJamScreen
            key="friends-jam-screen"
            currentTrack={currentTrack}
            onPlayTrack={(t) => handlePlayTrack(t, undefined, 'Friends Jam')}
            onClose={() => setIsJamOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Non-blocking NewPipe / Playback Notice */}
      {streamNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-[412px] px-4 py-3 rounded-2xl bg-[#14141B]/95 border border-white/15 text-white shadow-2xl backdrop-blur-md flex items-start justify-between gap-3">
          <div className="text-xs leading-relaxed">
            <span
              style={{ color: streamNotice.type === 'error' ? '#FBBF24' : 'var(--mw-tint)' }}
              className="font-bold block mb-0.5"
            >
              {streamNotice.type === 'error' ? 'Playback / Extraction Notice' : 'NewPipe Extractor'}
            </span>
            <p className="text-gray-300">{streamNotice.message}</p>
            {streamNotice.type === 'error' && (
              <button
                onClick={() => {
                  setStreamNotice(null);
                  setIsNowPlayingOpen(false);
                  setCurrentView('settings');
                }}
                style={{ backgroundColor: 'var(--mw-primary)' }}
                className="mt-2 px-3 py-1 rounded-full text-white text-[11px] font-bold"
              >
                Configure Instance in Settings
              </button>
            )}
          </div>
          <button
            onClick={() => setStreamNotice(null)}
            className="text-xs text-gray-400 hover:text-white px-1.5 py-0.5"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
