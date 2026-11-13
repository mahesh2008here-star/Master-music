# MasterWave Audio Quality & Hi-Res Verification Specification

## 1. Truth in Audio Engineering
Many streaming applications display misleading badges such as "Lossless", "Master", or "Ultra HD" when the audio is simply lossy Opus/AAC or upsampled MP3. MasterWave enforces absolute technical integrity:

### Core Verification Rules
1. **No Fake FLAC Badges:** Transcoding a 128 kbps Opus or 320 kbps MP3 stream into a FLAC container does not produce lossless audio.
2. **Explicit Codec & Container Telemetry:** The Now Playing screen reports the exact container, stream codec, measured bitrate, bit depth, and sample rate (e.g. `Opus • OPUS 139 kbps` or `FLAC • 24-bit 96 kHz`).
3. **Android Audio Mixer Disclosure:** Android standard audio routing (`AudioTrack` / `AudioFlinger`) frequently resamples all audio streams to 48 kHz / 16-bit unless direct PCM or USB DAC audio offload is active. MasterWave identifies whether resampling is taking place.

---

## 2. Quality Classification Tiers

| Tier Badge | Requirements | Verified Codecs | Container | Typical Bitrate |
| :--- | :--- | :--- | :--- | :--- |
| **Standard** | Lossy audio < 200 kbps | MP3, AAC-LC, Vorbis | `.mp3`, `.m4a` | 96 - 192 kbps |
| **High Quality** | Lossy audio >= 200 kbps or Opus 128-160 kbps | Opus (vbr), AAC-ELD | `.webm`, `.m4a` | 139 - 320 kbps |
| **Lossless** | Uncompressed/lossless 16-bit / 44.1 kHz (CD Standard) | FLAC, ALAC, WAV | `.flac`, `.wav` | 700 - 1000 kbps |
| **Hi-Res Lossless** | Lossless >= 24-bit and/or >= 88.2 kHz | FLAC 24/96, 24/192 | `.flac` | 1500 - 9216 kbps |

---

## 3. Technical Inspection Pipeline

### 3.1 Stream Header & Metadata Analysis
When a stream initializes, the `AudioQualityInspector` extracts:
- `audioCodec`: Extracted from MIME type (`audio/flac`, `audio/webm`, `audio/mp4`).
- `sampleRate`: Measured in Hertz (Hz) from decoder input format.
- `bitDepth`: 16-bit, 24-bit, or 32-bit float (N/A for lossy codecs).
- `channels`: Stereo (2 channels), 5.1 Surround (6 channels), or Mono.
- `bitrate`: Computed as `(totalBytesLoaded * 8) / streamDurationSeconds`.

### 3.2 Output Hardware Path Analysis
- **Internal Speaker / 3.5mm Jack:** Resampled via Snapdragon Audio HAL / Android AudioFlinger to 48 kHz.
- **Bluetooth A2DP:** Output codec negotiation inspected (SBC 328 kbps, AAC 256 kbps, aptX HD 576 kbps, or LDAC 990 kbps).
- **USB Audio Class 2 (External DAC):** Direct PCM stream passing up to 24-bit / 192 kHz without system resampling when USB permission is granted.
