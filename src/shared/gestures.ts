/**
 * Gestures and expressions things can act out. Rigged drawings move their own pieces (an arm waves, a tail
 * wags, eyebrows appear for a frown); drawings without a rig move as one card. The engine only times them.
 */

/** Gestures, with how long one takes in seconds. */
export const GESTURE_SECONDS = {
  wave: 1.8,
  point: 1.6,
  clap: 1.6,
  shrug: 1.3,
  thumbs_up: 1.4,
  cover_eyes: 1.8,
  hands_on_hips: 1.8,
  arms_up: 1.4,
  dance: 2.4,
  bow: 1.4,
  nod: 0.8,
  shake_head: 1,
  wink: 0.8,
  laugh: 1.8,
  cry: 2.2,
  gasp: 1,
  look_around: 2,
  wag: 1.4,
  flap: 1.2,
  apart: 2.2,
} as const;

export type Gesture = keyof typeof GESTURE_SECONDS;
export const GESTURES = Object.keys(GESTURE_SECONDS) as Gesture[];

export function isGesture(name: string): name is Gesture {
  return Object.prototype.hasOwnProperty.call(GESTURE_SECONDS, name);
}

/** Faces: brows only show for the ones that need them; neutral is the drawing as drawn. */
export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'scared', 'sleepy', 'laughing', 'confused'] as const;
export type Expression = (typeof EXPRESSIONS)[number];
