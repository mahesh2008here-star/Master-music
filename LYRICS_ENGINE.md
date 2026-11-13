# MasterWave Lyrics Engine Specification (LRCLIB Integration)

## 1. Overview & Service Contract
MasterWave integrates **LRCLIB** (`https://lrclib.net`) as its primary synchronized lyrics provider. LRCLIB is a community-driven, open lyrics database that provides both plain text and millisecond-accurate timestamped LRC strings.

---

## 2. API Integration Protocol

### 2.1 Endpoints Used
1. **Direct Match (`GET /api/get`):**
   ```
   https://lrclib.net/api/get?track_name={track}&artist_name={artist}&album_name={album}&duration={duration_seconds}
   ```
   - Parameters:
     - `track_name` (required): Name of the song.
     - `artist_name` (required): Primary artist name.
     - `album_name` (optional): Album title.
     - `duration` (optional): Duration in seconds with tolerance for tighter matching.

2. **Search Fallback (`GET /api/search`):**
   ```
   https://lrclib.net/api/search?q={query}
   ```
   - Used when direct match returns HTTP 404.

3. **User-Agent Requirement:**
   - All requests are dispatched with: `User-Agent: MasterWave-Android/5.2.0 (https://github.com/masterwave)`

---

## 3. Parsing & Synchronization Logic

### 3.1 LRC Timestamp Parsing
LRC strings are parsed into an ordered timeline structure:
```typescript
interface LyricLine {
  id: string;
  startTimeMs: number;
  endTimeMs?: number;
  text: string;
}
```
Regular expressions matching standard and extended timestamp formats:
`\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]`

### 3.2 Dynamic Playback Highlighting
- As playback progresses, the active line is determined by finding the latest line where `startTimeMs <= currentTimeMs`.
- Auto-scroll gently animates the active lyric line to the vertical viewport center with easing.
- Interactive Seek: Clicking on any lyric line immediately dispatches a `seekTo(line.startTimeMs)` command to the playback engine.
- Visual state: Past lines fade to 35% opacity, active line glows at 100% white with subtle enlargement, and upcoming lines remain at 45% opacity.
