// Design tokens mapped 1:1 from the Hunter System UI Reference Prototype
export const COLORS = {
  // Backgrounds
  bg: '#05080D',        // Deep void abyss
  bg2: '#080F19',       // Elevated dark slate navy
  panel: '#0A1420',     // System panel card background
  panelGradientStart: 'rgba(57, 191, 255, 0.08)',
  panelGradientEnd: 'rgba(10, 20, 32, 0.95)',
  
  // Electric Cyan Accents
  c1: '#39BFFF',        // Electric cyan: borders, active indicators, XP bars, primary buttons
  c2: '#7DE8FF',        // Luminous bright cyan: highlights, corner brackets, text glow
  
  // Typography Colors
  tx: '#F2F7FF',        // Primary text: bright luminescent white
  tx2: '#8CA5BC',       // Secondary text: muted blue-grey
  tx3: '#526A81',       // Tertiary text: dark slate blue
  
  // Status & Rarity
  ok: '#54E6A1',        // Emerald green: complete / success
  warn: '#FFC66D',      // Amber gold: in progress / XP rewards
  err: '#FF647C',       // Crimson red: alerts / notification dot
  rare: '#B8A1FF',      // Mystic purple: epic rarity / special tiers
  
  // Borders & Glow
  line: 'rgba(57, 191, 255, 0.32)',       // Translucent electric cyan border
  lineSubtle: 'rgba(57, 191, 255, 0.12)', // Subtle item dividers
  glow: 'rgba(57, 191, 255, 0.35)',       // Cyan glow
  hotGlow: 'rgba(57, 191, 255, 0.55)',    // Active panel glow
  
  // Interactive Overlays
  btnBg: 'rgba(57, 191, 255, 0.16)',
  btnBgActive: 'rgba(57, 191, 255, 0.32)',
  chipBgActive: 'rgba(57, 191, 255, 0.12)',
  overlayBg: 'rgba(2, 5, 9, 0.88)',
  barTrack: '#0D1D2E',
} as const;

export type ColorKey = keyof typeof COLORS;
