// Single source of truth for the app's visual system.
//
// One container vocabulary (the dark-title "panel", see components/Panel.tsx)
// is used everywhere. Colors that double as inline styles (the comparison
// matrix builds <td> styles in JS) live here so they can't drift from the CSS.

// Brand surface — matches the black AppHeader + orange icon accent.
export const dark = 'rgb(37,43,50)';      // #252b32 — panel title bars, primary borders
export const darkHover = 'rgb(52,58,64)'; // #343a40
export const accent = '#e8731a';          // orange, used sparingly for emphasis only

// Borders
export const borderStrong = dark;
export const borderMuted = '#9ca3af';
export const borderFaint = '#dddddd';  // hairline rules (e.g. footer divider)

// Surfaces
export const panelBg = '#ffffff';
export const mutedBg = '#d1d5db';

// Text — all AA-compliant (>=4.5:1) on white.
export const textInk = '#1f2329';     // primary text
export const textMuted = '#4b5563';   // secondary text (~7:1)
export const textFaint = '#565c66';   // de-emphasized but still AA (~5.9:1); for zeroed cells
export const error = '#b00020';       // error/failure states (e.g. a doc that failed to load)

// Comparison-cell fills (better / worse / equal) + zebra-darker variants.
export const better = '#e8f5e9';
export const worse = '#ffebee';
export const equal = '#f5f5f5';
export const betterAlt = '#c8e6c9';
export const worseAlt = '#ffcdd2';
export const equalAlt = '#e0e0e0';

// Table zebra + wound-column striping.
export const zebraEven = '#ffffff';
export const zebraOdd = '#eef1f5';
export const wColEven = '#e2e8f0';
export const wColOdd = '#cbd5e1';
export const labelCellBg = '#eeeeee';
