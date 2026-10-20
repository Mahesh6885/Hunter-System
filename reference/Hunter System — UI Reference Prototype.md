# Hunter System — UI Reference Prototype Specification

## Overview
A Solo Leveling themed fitness RPG application designed for mobile devices. The app uses an authentic "System" aesthetic inspired by the manhwa/anime: dark abyss void backgrounds, electric cyan accents, luminous borders, futuristic angular corner brackets, RPG rank progressions, XP meters, and stat attributes.

---

## 1. Design Tokens (Map 1:1 to `src/theme/`)

### Colors
- `bg`: `#05080D` (Deep void abyss / primary background)
- `bg2`: `#080F19` (Elevated dark slate navy)
- `panel`: `#0A1420` (System card panel background)
- `c1`: `#39BFFF` (Electric cyan - borders, active tabs, XP bars, primary buttons)
- `c2`: `#7DE8FF` (Luminous bright cyan - highlights, badges, corner brackets)
- `tx`: `#F2F7FF` (Primary text - bright luminescent white)
- `tx2`: `#8CA5BC` (Secondary text - muted blue-grey)
- `tx3`: `#526A81` (Tertiary text - dark slate blue)
- `ok`: `#54E6A1` (Emerald green - complete / success / verified)
- `warn`: `#FFC66D` (Amber gold - XP rewards / in progress)
- `err`: `#FF647C` (Crimson red - notification badges / alerts)
- `rare`: `#B8A1FF` (Mystic purple - epic rarity / special tiers)

### Lines & Borders
- `line`: `rgba(57, 191, 255, 0.32)` (Translucent electric cyan border)
- `lineSubtle`: `rgba(57, 191, 255, 0.12)` (Separator line)
- `glow`: `0 0 14px rgba(57, 191, 255, 0.25)`

### Spacing Tokens
- `s1`: `4px`
- `s2`: `8px`
- `s3`: `12px`
- `s4`: `16px`
- `s5`: `24px`

### Typography
- Headings / Sci-fi Numbers / Buttons: `Orbitron` (500, 700) or bold monospace sci-fi fallback
- Body Text / Labels: `Rajdhani` (500, 600, 700) or clean high-legibility sans-serif fallback

---

## 2. Core UI Components

1. **System Panel (`<SystemPanel>` / `.p`)**:
   - Background: Dark gradient (`rgba(57, 191, 255, 0.07)` to `rgba(10, 20, 32, 0.9)`)
   - Border: 1px `line` (`rgba(57, 191, 255, 0.32)`)
   - Corner brackets: Distinctive 10x10px L-shaped luminous borders at Top-Left and Bottom-Right (`c2`)
   - Header bar with title, optional right-aligned badge/button, and bottom separator line
   - "Hot" variant: adds outer glow and intensified cyan border

2. **Rank Badge (`<RankBadge>` / `.rank`)**:
   - 44x44px diamond (rotated 45deg container)
   - 2px cyan border (`c1`), glow effect
   - Counter-rotated (-45deg) centered letter (`E`, `D`, `C`, `B`, `A`, `S`) in Orbitron font

3. **XP / Progress Bar (`<ProgressBar>` / `.bar`)**:
   - Track: `#0D1D2E` with 1px `line` border, 6px or 8px height
   - Fill: Cyan gradient (`c1` -> `c2`) with smooth width transition
   - Color variants: default (cyan), green (`ok`), amber (`warn`), purple (`rare`)

4. **Hunter Avatar (`<HunterAvatar>`)**:
   - 56x56px square box with 1px cyan border, dark navy background `#08121E`, stylized hunter silhouette

5. **Action Buttons (`<SystemButton>` / `.btn` & `.btn2`)**:
   - Primary: 52px min-height, uppercase Orbitron font, cyan border, cyan translucent fill (`rgba(57,191,255,0.16)`), cyan glow
   - Secondary: 44-48px min-height, border `line`, muted text, cyan highlight when active

6. **Chips & Badges (`<SystemBadge>`, `<SystemChip>`)**:
   - Outlined pill badges with uppercase tracking
   - Category chips with active state highlight

7. **System Switch (`<SystemSwitch>`)**:
   - Rectangular sci-fi toggle with slider pip

---

## 3. Screen Structure

### Navigation Bar (5 tabs)
- **System (`dash`)**: Main dashboard
- **Quests (`quests`)**: Daily, Weekly, Recovery quest board
- **Train (`lib` / `active` / `done`)**: Workout library and active session
- **Status (`status`)**: Hunter attributes, ranks, stat point allocation
- **More (`more` -> `nutri`, `stats`, `ach`, `prof`)**: Nutrition, Analytics, Achievements, Settings

### Dashboard (`dash`)
1. **Top Header**: "HUNTER SYSTEM" brand label + Notification Bell icon with red unread dot
2. **System Status Panel**:
   - Avatar, Name ("ARJUN"), Subtitle ("Hunter · Level 14")
   - Diamond Rank Badge ("D")
   - XP Progress: "2,780 / 3,000 XP" with progress bar
   - Streak: "12 days" with 7-day dot/bar indicators
3. **Daily Quest Panel (Hot / Glowing)**:
   - "Prove your discipline today."
   - 3 interactive checklist items:
     - Complete today's workout
     - Reach 120 g protein
     - Drink 2 L of water
   - Counter: "X/3 complete" and "+150 XP" badge
   - "START QUEST" primary luminous button
4. **Today's Training Panel**:
   - Routine title: "Beginner Home A" (35 min · 3 exercises)
   - "VIEW" secondary button
5. **Attributes Panel**:
   - Strength (42), Endurance (35), Agility (28), Vitality (39), Discipline (51) with progress bars
6. **Nutrition Panel**:
   - Quick stats: 1,640 KCAL / 2,100, 92 g PROTEIN / 120
   - Macro progress bar and Carbs/Fat distribution
   - "OPEN" button
