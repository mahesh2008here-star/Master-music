# MasterWave System Architecture

## 1. Architectural Overview
MasterWave is architected following Clean Architecture and MVVM (Model-View-ViewModel) principles for native Android and modern reactive clients. The architecture strictly isolates the audio streaming engine, data providers, media session management, and presentation layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  Jetpack Compose Screens & Reusable UI Components           │
│  (HomeFeed, Stats, Playlists, NowPlaying, Lyrics, Settings) │
└───────────────▲─────────────────────────────▲───────────────┘
                │ StateFlow / Events          │
┌───────────────┴─────────────────────────────┴───────────────┐
│                      ViewModel Layer                        │
│  (PlayerViewModel, FeedViewModel, LyricsViewModel, etc.)    │
└───────────────▲─────────────────────────────▲───────────────┘
                │ UseCases / Interactors      │
┌───────────────┴─────────────────────────────┴───────────────┐
│                       Domain Layer                          │
│  - PlaybackManager & QueueController                        │
│  - StreamResolver & AudioQualityInspector                   │
│  - LyricsMatcher & LastFmScrobbler                          │
└───────────────▲─────────────────────────────▲───────────────┘
                │ Repository Interfaces       │
┌───────────────┴─────────────────────────────┴───────────────┐
│                        Data Layer                           │
│  ┌───────────────────────┐       ┌──────────────────────┐   │
│  │    Media3 Service     │       │    Data Sources      │   │
│  │ (ExoPlayer + Session) │       │ - InnerTube Provider │   │
│  │                       │       │ - FLAC Hi-Res Repo   │   │
│  │ - Foreground Service  │       │ - LRCLIB API Client  │   │
│  │ - Notification Mgr    │       │ - Last.fm API Client │   │
│  │ - AudioFocusHandler   │       │ - Room / Local Audio │   │
│  └───────────────────────┘       └──────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Modules & Packages

### 2.1 `core:audio`
- **`MasterWavePlayerService`:** AndroidX `MediaSessionService` running as an Android Foreground Service with continuous audio focus handling.
- **`ExoPlayerFactory`:** Configures `DefaultRenderersFactory`, `AudioSink` with float output support, low latency buffer policies, and offload mode detection.
- **`AudioQualityInspector`:** Inspects audio stream headers, format MIME types, sample rate, bit depth, channel configuration, and container bitrate.

### 2.2 `core:provider`
- **`MusicProvider` Interface:**
  - `searchTracks(query: String): Flow<List<Track>>`
  - `getTrackDetails(trackId: String): TrackDetails`
  - `resolveStream(track: Track, preferredQuality: QualityTier): StreamResolution`
  - `getAvailableFormats(trackId: String): List<AudioFormatDescriptor>`
- **Provider Implementations:**
  - `InnerTubeProvider`: YouTube Music track metadata and stream resolution.
  - `HiResFlacProvider`: Genuine lossless FLAC repositories (Internet Archive Hi-Res Audio, Jamendo Lossless).
  - `LocalMediaStoreProvider`: Scans device storage using `MediaStore.Audio` for local FLAC/MP3/WAV files.

### 2.3 `core:lyrics`
- **`LrclibClient`:** Communicates with LRCLIB (`https://lrclib.net/api/`).
- **`LrcParser`:** Parses timestamp-synchronized lyrics into a line and word token hierarchy with millisecond accuracy.
- **`LyricsCache`:** Local database caching of retrieved lyrics to eliminate redundant network roundtrips.

### 2.4 `core:database & storage`
- **Room Database / IndexedDB:** Stores playlists, user likes, listening history, cached track metadata, and scrobble queue.
- **DataStore:** Stores user settings, preferred streaming quality, Last.fm credentials, and audio output settings.

---

## 3. Playback State Machine
The playback engine coordinates between four states:
1. **Idle / Unloaded:** No active audio track.
2. **Buffering / Resolving:** Resolving stream URL from chosen provider, inspecting MIME headers and container flags.
3. **Playing:** Audio decoding active, MediaSession publication, lyrics synchronized ticker running, Last.fm scrobble timer active (50% or 4 minutes threshold).
4. **Paused / Stalled:** Audio paused, state preserved, lock screen controls updated.
