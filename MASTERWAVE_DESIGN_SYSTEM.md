# MasterWave Design System Specification
**Version:** 5.2.0  
**Target Platform:** Native Android (Jetpack Compose / Material 3) & High-Fidelity Web Client  
**Primary Test Device Reference:** Motorola Moto G45 5G (Android 16, 120Hz display)

---

## 1. Visual Hierarchy & Design Philosophy
MasterWave follows a distinctive "Fluid Organic Audio" aesthetic derived from the supplied visual references. Unlike generic streaming clones, MasterWave utilizes:
- **Soft Tonal Surfaces:** Warm off-white `#F8F8FA` surfaces in light mode with delicate mauve/rose tinting (`#F4DCE1`, `#FCEEF0`).
- **Floating Pill Dock Navigation:** A pill-shaped navigation island that floats above the bottom edge, preserving screen real estate and thumb ergonomic reach.
- **Floating Mini-Player:** An elevated card with gentle drop shadow (`elevation 8dp`, corner radius `24dp`), rounded album art, high-contrast typography, and a prominent burgundy action circle (`#8E2848`).
- **Immersive Now Playing:** A full-bleed dark cinematic experience (`#0B0B0E`) featuring atmospheric artwork glow, custom audio waveform scrubbers, verified stream telemetry pills, and pill capsule play controls.

---

## 2. Color Palette & Semantic Tokens

### 2.1 Brand & Accent Palette
- **Burgundy Accent (Primary Action):** `#8E2848` (RGB: 142, 40, 72)
- **Deep Maroon / Pressed State:** `#6E1B33`
- **Soft Mauve Container (Selected Chips / Cards):** `#F4DCE1`
- **Subtle Rose Container Border:** `#EAD2D8`
- **Rose Highlight Glow:** `rgba(142, 40, 72, 0.12)`

### 2.2 Light Mode (Feed, Playlists, Stats, Settings)
- **Background (App Scaffold):** `#FFFFFF` / `#F8F8FA`
- **Surface Level 1 (Cards, Modules):** `#F3F3F5` (Corner radius `20dp`-`24dp`)
- **Surface Level 2 (Nested Items):** `#FFFFFF` with border `1px solid #ECECEF`
- **Text Primary (Headings, Track Titles):** `#111114`
- **Text Secondary (Artists, Subtitles, Dates):** `#6E6E77`
- **Text Tertiary / Metadata:** `#8E8E98`

### 2.3 Dark & Now Playing Mode
- **Now Playing Canvas:** `#08080A` to `#121217`
- **Atmospheric Artwork Blur:** Dynamic backdrop sampled from dominant artwork hue at 35% opacity with 48px Gaussian blur.
- **Text Primary (Dark):** `#FBFBFC`
- **Text Secondary (Dark):** `#A2A2AD`
- **Control Button Surface:** `#1C1C22` (Round icon buttons)
- **Play Capsule Surface:** `#FFFFFF` text / `#111114` fill or `#8E2848` accent

### 2.4 Quick Access Curated Card Gradients
1. **Liked Songs:** Soft Rose/Coral gradient (`#FCECEF` to `#F6D3DA`), Icon: `#8E2848` Heart
2. **Discover:** Warm Amber/Ochre gradient (`#FBF4E8` to `#EFE2C8`), Icon: `#6A5424` Compass
3. **Discover Mix:** Lavender/Lilac gradient (`#F5EFFF` to `#E5DAFA`), Icon: `#5E428B` Sparkles

---

## 3. Typography Hierarchy
MasterWave employs a clean, modern geometric sans-serif (Plus Jakarta Sans / Roboto Flex on Android):
- **Display Large (Screen Headers):** 32sp, SemiBold / Bold (e.g., "Home", "Playlist", "Statistics")
- **Headline Medium (Greeting / Banner):** 24sp, Bold (e.g., "Good evening", "Infinite Radio")
- **Title Medium (Section Headers):** 18sp, SemiBold (e.g., "Quick access", "Artists for you", "Albums for you")
- **Body Large (Track Title):** 16sp, SemiBold / Medium
- **Body Medium (Artist Name):** 14sp, Regular
- **Label Small (Timestamps, Telemetry Badges):** 11sp-12sp, Medium / JetBrains Mono for kHz/kbps numbers

---

## 4. Key Component Anatomy

### 4.1 Pill Filter Chips
- Height: `36dp`
- Padding: `Horizontal 16dp, Vertical 8dp`
- Shape: Rounded Full Capsule (`RoundedCornerShape(50)`)
- Selected: `#F4DCE1` background, `#241619` text weight SemiBold
- Unselected: Transparent background, `#66666F` text weight Medium

### 4.2 Floating Mini-Player
- Position: Floating `16dp` above Bottom Navigation Dock (or `80dp` above screen edge)
- Dimensions: Full width with `16dp` horizontal margins, height `64dp`
- Shape: `RoundedCornerShape(22dp)`
- Shadow: `shadow(elevation = 6.dp, spotColor = Color(0x18000000))`
- Surface: Glassmorphic or solid crisp light surface (`#FFFFFF` with `#ECECEF` border)
- Left: `48dp x 48dp` rounded artwork (`12dp` radius)
- Center: Track title (Single line marquee/truncate) + Artist name
- Right: Burgundy Play/Pause button (`44dp` diameter) + Next Track icon button (`40dp`)

### 4.3 Floating Bottom Navigation Dock
- Width: `240dp`-`280dp` centered capsule dock
- Height: `56dp`
- Shape: Capsule (`RoundedCornerShape(28dp)`)
- Surface: Frosted glass effect (`rgba(255, 255, 255, 0.88)` with `backdrop-filter: blur(20px)`)
- Items:
  1. **Feed** (Home icon + text)
  2. **Stats** (Bar Chart icon + text)
  3. **Playlists** (List Music icon + text)
- Active indicator: Pill highlight in soft rose tone `#F4DCE1` with dark text

### 4.4 Full-Screen Now Playing
- **Top Bar:** Down arrow (dismiss), "NOW PLAYING" overline, track source label, vertical 3-dot overflow.
- **Artwork Canvas:** Square aspect ratio `1:1`, corner radius `24dp`, elevation `12dp`.
- **Title Block:** Track name + Artist name with round Heart button and round Lyrics button.
- **Scrubber / Waveform:** Custom waveform progress bar with draggable thumb and live position / remaining duration.
- **Audio Telemetry Badge:** Clickable pill (e.g. `ll. Opus • OPUS 139 kbps >` or `ll. FLAC • 24-bit 96 kHz >`).
- **Main Controls:** Circular Previous, Giant Capsule Play/Pause (`[ > Play ]` / `[ || Pause ]`), Circular Next.
- **Secondary Bar:** Shuffle, Volume/Output Selector, Repeat modes.

---

## 5. Motion & Haptic Specifications
- **Page Transitions:** Shared axis horizontal slide with 250ms cubic-bezier curve (`(0.2, 0.0, 0.0, 1.0)`).
- **Mini-Player Expansion:** Vertical expand transition to Now Playing screen with shared artwork transition.
- **Touch Feedback:** Subtle haptic tick on play/pause, seek scrub, and tab switch.
