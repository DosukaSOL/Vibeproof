/**
 * VibeProof Design System
 * Shared colors, spacing, and design tokens.
 * Dark-first, soft green accent, easy on the eyes.
 */

export const T = {
  // ─── Backgrounds ─────────────────────────
  bg:        "#0D1117",  // deep dark
  surface:   "#161B22",  // card / panel
  surface2:  "#1C2128",  // elevated surface
  overlay:   "rgba(0, 0, 0, 0.6)",

  // ─── Borders ─────────────────────────────
  border:    "#30363D",
  borderLight: "#21262D",

  // ─── Text ────────────────────────────────
  text:      "#E6EDF3",
  textSec:   "#8B949E",
  textMuted: "#484F58",

  // ─── Accent (green) ─────────────────────
  accent:      "#3FB950",   // primary green
  accentDim:   "#238636",   // darker / pressed green
  accentBg:    "rgba(63, 185, 80, 0.12)",  // subtle green tint

  // ─── Semantic ────────────────────────────
  error:     "#F85149",
  errorBg:   "rgba(248, 81, 73, 0.10)",
  warning:   "#D29922",
  warningBg: "rgba(210, 153, 34, 0.10)",
  success:   "#3FB950",
  successBg: "rgba(63, 185, 80, 0.10)",

  // ─── Special ─────────────────────────────
  xp:        "#58A6FF",   // blue for XP — pops against green
  purple:    "#BC8CFF",   // badges / one-time labels
  purpleBg:  "rgba(188, 140, 255, 0.12)",

  // ─── Radius ──────────────────────────────
  r:  12,   // default
  rS: 8,    // small
  rL: 16,   // large
  rXL: 24,  // extra large (buttons)
} as const;
