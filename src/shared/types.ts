/**
 * Shared types used by the client, the server and the headless engine.
 * World coordinates: x right, y up, z toward the viewer at yaw 0 (Three.js convention).
 * An entity's `pos` is its feet point; sprites stand upright on it.
 */
export type Kind = 'object' | 'human' | 'humanoid' | 'animal' | 'other';
export type MassClass = 'light' | 'medium' | 'heavy' | 'animal' | 'person';
export type Anchor = 'top' | 'front' | 'held' | 'inside';
export type Vec3 = [number, number, number];

/** Which image to draw. `file` null means "no sprite": draw a placeholder card with the label. */
export interface SpriteRef {
  file: string | null;
  w: number;
  h: number;
}

export interface Entity {
  id: string;
  word: string;
  label: string;
  sprite: SpriteRef;
  /** Feet point. When `parent` is set this is relative to the parent's anchor point. */
  pos: Vec3;
  /** Mirror the sprite horizontally. */
  flip: boolean;
  /** Entity id or 'player' the sprite keeps facing (mirror only); overrides `flip` while set. */
  facing?: string;
  /** Multiplier on the natural height. */
  scale: number;
  /** Natural height in metres (already clamped). */
  heightM: number;
  /** Rotation about the sprite centre in degrees (pouring, bowing, falling over). */
  tilt: number;
  /** 0..1 opacity, used for fades. Undefined = 1. */
  alpha?: number;
  hidden?: boolean;
  parent?: string;
  anchor?: Anchor;
  state: Record<string, boolean | number | string>;
  /** Persistent named effects (e.g. "fire"), restarted on load. */
  effects: string[];
  kind: Kind;
  solid: boolean;
  massClass: MassClass;
  huge: boolean;
  /** Seconds to live from creation; undefined = permanent. */
  ttl?: number;
  createdAt: number;
}

export interface PlayerState {
  /** Feet position. */
  pos: Vec3;
  /** Radians. yaw 0 looks toward -z; pitch > 0 looks up. */
  yaw: number;
  pitch: number;
}

export interface World {
  slug: string;
  rev: number;
  player: PlayerState;
  entities: Entity[];
  createdAt: number;
}

export interface HealthResponse {
  ok: boolean;
  sprites: number;
  version: string;
}

export const PLAYER_RADIUS = 0.35;
export const PLAYER_EYE_HEIGHT = 1.6;
export const WORLD_RADIUS = 60;
export const MAX_ENTITIES = 150;
