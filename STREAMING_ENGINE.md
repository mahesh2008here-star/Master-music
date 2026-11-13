# MasterWave Streaming Engine Specification

## 1. Provider-Based Music Streaming Architecture
MasterWave rejects hardcoding single proprietary APIs. Instead, it provides a clean extensible provider interface:

```kotlin
interface MusicProvider {
    val providerId: String
    val displayName: String
    val isLosslessSupported: Boolean

    suspend fun searchTracks(query: String, filter: SearchFilter): Result<List<Track>>
    suspend fun getTrackDetails(trackId: String): Result<TrackDetails>
    suspend fun getArtistDetails(artistId: String): Result<ArtistDetails>
    suspend fun getAlbumDetails(albumId: String): Result<AlbumDetails>
    suspend fun resolveStream(track: Track, requestedQuality: QualityTier): Result<StreamResolution>
    suspend fun getAvailableFormats(track: Track): Result<List<AudioFormatDescriptor>>
}
```

---

## 2. Integrated Streaming Sources

### 2.1 NewPipeExtractor & InnerTube Integration
- **Android Native (`NewPipeMusicProvider.kt` & `NewPipeDownloader.kt`):**
  - Uses `com.github.teamnewpipe:NewPipeExtractor:v0.24.8` via JitPack with `OkHttpClient` downloader (`NewPipe.init(...)`).
  - Supports `ServiceList.YouTube` (`music_songs` and video search, `StreamInfo.getInfo`, `AudioStream` resolution) and `ServiceList.SoundCloud` / `ServiceList.Bandcamp`.
- **Full-Stack Express Bridge (`server.ts` + `src/services/newpipeService.ts`):**
  - Routes `/api/newpipe/search`, `/api/newpipe/trending`, `/api/newpipe/streams/:videoId`, `/api/newpipe/config`, and Range-aware `/api/newpipe/proxy`.
  - Queries Piped (NewPipeExtractor HTTP backend pool) with `youtubei.js` InnerTube Music fallback and truthful upstream bot-check reporting (`SignInConfirmNotBotException`).
- **Audio Codecs:**
  - Opus in WebM container (`audio/webm; codecs="opus"`, typically 128 kbps to 160 kbps average bitrate, 48 kHz).
  - AAC-LC in MP4/M4A container (`audio/mp4; codecs="mp4a.40.2"`, 128 kbps to 256 kbps, 44.1 kHz).
- **Integrity Rule:** NewPipe / InnerTube streams are never labeled as FLAC or Lossless. MasterWave accurately displays `Opus • 139 kbps` or `AAC • 128 kbps`.

### 2.2 Genuine Hi-Res & Lossless Provider
- **Mechanism:** Integrates verified lossless streaming APIs and open archive FLAC repositories (e.g. Internet Archive Live Music Archive, Jamendo Lossless CDN, Free Music Archive FLAC streams).
- **Audio Codecs:**
  - Native FLAC (`audio/flac`, 16-bit / 44.1 kHz Red Book CD standard, and 24-bit / 96 kHz Studio Master).
  - Uncompressed PCM / WAV (`audio/wav`).
- **Stream Verification:** Headers are checked for the `fLaC` stream marker, STREAMINFO block (minimum/maximum block size, sample rate, bit depth, total samples).

### 2.3 Local Device Storage Provider
- Uses Android `MediaStore.Audio.Media` to query device storage.
- Reads `METADATA_KEY_BITRATE`, `METADATA_KEY_SAMPLERATE`, and `METADATA_KEY_MIMETYPE`.
- Directly streams bit-perfect audio from local storage with zero network overhead.

---

## 3. Playback Failover & Fallback Strategy
1. **Primary Provider Attempt:** Requests stream from preferred user tier (e.g. Hi-Res FLAC).
2. **Graceful Degrade:** If FLAC stream is unavailable, seamlessly attempts high-quality Opus/AAC stream while notifying the user via the audio telemetry badge.
3. **Format Negotiation:** ExoPlayer chooses the most resilient bitrate stream based on network condition measurements (`BandwidthMeter`).
4. **Offline Cache:** Tracks marked for offline use are cached in encrypted local storage with strict integrity checking.
