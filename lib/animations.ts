/**
 * Animation Constants & Utilities
 * Shared timings, easings, and animation presets for VibeProof
 *
 * Uses plain React Native Animated API — NO Reanimated worklets.
 */
import { Easing } from "react-native";

// ─── Durations ───────────────────────────────────────
export const DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  entrance: 400,
  exit: 250,
} as const;

// ─── Easings ─────────────────────────────────────────
export const EASING = {
  /** Standard ease-out for entrances */
  enter: Easing.bezier(0.25, 0.1, 0.25, 1),
  /** Quick ease-in for exits */
  exit: Easing.bezier(0.4, 0.0, 1, 1),
  /** Springy bounce for celebrations */
  bounce: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** Smooth decelerate for slides */
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1),
  /** Subtle ease for micro-interactions */
  subtle: Easing.bezier(0.4, 0.0, 0.2, 1),
} as const;

// ─── Spring Configs ──────────────────────────────────
export const SPRING = {
  /** Default spring for most animations */
  default: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  /** Bouncy spring for celebrations */
  bouncy: {
    damping: 10,
    stiffness: 200,
    mass: 0.8,
  },
  /** Gentle spring for subtle motions */
  gentle: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  /** Snappy spring for button presses */
  snappy: {
    damping: 18,
    stiffness: 300,
    mass: 0.6,
  },
} as const;

// ─── Preset Configs ──────────────────────────────────
export const ANIMATION_PRESETS = {
  /** Fade + slight scale-up for entering views */
  fadeInUp: {
    from: { opacity: 0, translateY: 20 },
    to: { opacity: 1, translateY: 0 },
    duration: DURATION.entrance,
    easing: EASING.enter,
  },
  /** Scale bounce for success states */
  successPop: {
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
    duration: DURATION.normal,
    easing: EASING.bounce,
  },
  /** Quick fade for overlays */
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: DURATION.fast,
    easing: EASING.subtle,
  },
  /** Button press scale */
  pressDown: {
    scale: 0.95,
    duration: DURATION.fast,
  },
  /** Slide in from right for list items */
  slideInRight: {
    from: { opacity: 0, translateX: 30 },
    to: { opacity: 1, translateX: 0 },
    duration: DURATION.entrance,
    easing: EASING.decelerate,
  },
} as const;

/**
 * Get stagger delay for list item animations
 * @param index Item index in list
 * @param baseDelay Base delay between items (ms)
 * @param maxDelay Maximum total delay (ms)
 */
export function getStaggerDelay(
  index: number,
  baseDelay = 50,
  maxDelay = 500
): number {
  return Math.min(index * baseDelay, maxDelay);
}
