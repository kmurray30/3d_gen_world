/**
 * The bridge between a code-drawn figure and the entity that shows it in the world: which way the solid model
 * faces, how its parts are moved away from their rest pose (`pose` steps, operated movers, pieces taken off),
 * where its sockets are in the world, and the figure of a piece taken off it.
 *
 * Shared by the engine (sockets, detaching) and every renderer, so they agree on where things are.
 */
import type { Entity, PartPose, Vec3 } from '../types';
import type { Figure, FigPart } from './types';
import { apply, euler, measure, solve } from './math';

const DEG = Math.PI / 180;

/**
 * Which way the solid model faces when it is not walking or looking at something: degrees about y, turning the
 * figure's +z. Front-view figures face the entity's yaw; profile figures (vehicles, animals) show their side to
 * it, nose to the left (or the right when flipped), like their paper cutout.
 */
export function restFacing(e: Pick<Entity, 'yaw' | 'flip'>, fig: Pick<Figure, 'view'>): number {
  const yaw = e.yaw ?? 0;
  return fig.view === 'side' ? yaw + (e.flip ? 90 : -90) : yaw;
}

/** Joint deltas for the animator from the entity's part poses, at clock `time` (spinning parts keep turning).
 *  Parts that came off (`off_<name>`) are hidden. With the figure, movers that start on (and were never
 *  operated) show on. */
export function partOverrides(e: Pick<Entity, 'pose' | 'state'>, time: number, fig?: Figure): { j: Record<string, Vec3>; t: Record<string, Vec3>; sc: Record<string, number> } {
  const j: Record<string, Vec3> = {};
  const t: Record<string, Vec3> = {};
  const sc: Record<string, number> = {};
  if (fig) {
    for (const p of fig.parts) {
      const m = p.mover;
      if (!m?.on || typeof e.state[`op_${p.name}`] === 'boolean' || e.pose?.[p.name]) continue;
      const ax = m.axis ?? (m.kind === 'slide' || m.kind === 'spin' ? 'z' : 'x');
      const v = (k: number): Vec3 => [ax === 'x' ? k : 0, ax === 'y' ? k : 0, ax === 'z' ? k : 0];
      if (m.kind === 'swing') j[p.name] = v(m.amount ?? 100);
      else if (m.kind === 'slide') t[p.name] = v(m.amount ?? 0.3);
      else if (m.kind === 'spin') j[p.name] = v((m.amount ?? 720) * time);
    }
  }
  for (const [name, p] of Object.entries(e.pose ?? {})) {
    const r = p.r ?? [0, 0, 0];
    const w = p.w;
    j[name] = w ? [r[0] + w[0] * time, r[1] + w[1] * time, r[2] + w[2] * time] : [...r];
    if (p.t) t[name] = [...p.t];
    if (p.s !== undefined) sc[name] = p.s;
  }
  for (const [k, v] of Object.entries(e.state)) {
    if (v !== true || !k.startsWith('off_')) continue;
    // a piece taken off is hidden with everything hanging off it
    if (fig) for (const p of subtree(fig, k.slice(4))) sc[p.name] = 0;
    else sc[k.slice(4)] = 0;
  }
  return { j, t, sc };
}

/** Merge part overrides into an animation pose (turns and shifts add, sizes multiply). */
export function applyOverrides(pose: { j: Record<string, Vec3>; t?: Record<string, Vec3>; sc?: Record<string, number> }, o: ReturnType<typeof partOverrides>): void {
  for (const [k, v] of Object.entries(o.j)) {
    const a = pose.j[k];
    pose.j[k] = a ? [a[0] + v[0], a[1] + v[1], a[2] + v[2]] : v;
  }
  if (Object.keys(o.t).length) {
    pose.t ??= {};
    for (const [k, v] of Object.entries(o.t)) {
      const a = pose.t[k];
      pose.t[k] = a ? [a[0] + v[0], a[1] + v[1], a[2] + v[2]] : v;
    }
  }
  if (Object.keys(o.sc).length) {
    pose.sc ??= {};
    for (const [k, v] of Object.entries(o.sc)) pose.sc[k] = (pose.sc[k] ?? 1) * v;
  }
}

/**
 * A socket's spot relative to the entity's feet point, in world axes (metres): the socket rides its part as the
 * part is posed, the figure is scaled by the entity and turned to its rest facing.
 */
export function socketOffset(e: Pick<Entity, 'yaw' | 'flip' | 'scale' | 'pose' | 'state'>, fig: Figure, name: string): Vec3 | null {
  const s = fig.sockets?.find((k) => k.name === name);
  if (!s) return null;
  let p: Vec3 = s.at;
  if (s.part) {
    const o = partOverrides(e, 0);
    const f = solve(fig, { j: o.j, t: o.t }).get(s.part);
    if (f) p = [f.T[0] + apply(f.R, s.at)[0], f.T[1] + apply(f.R, s.at)[1], f.T[2] + apply(f.R, s.at)[2]];
  }
  const a = restFacing(e, fig) * DEG;
  const k = e.scale;
  // turning about y by a: +z goes to (sin a, 0, cos a)
  return [(p[0] * Math.cos(a) + p[2] * Math.sin(a)) * k, p[1] * k, (-p[0] * Math.sin(a) + p[2] * Math.cos(a)) * k];
}

/** The parts hanging off `part` (it included), in figure order. */
export function subtree(fig: Figure, part: string): FigPart[] {
  const keep = new Set([part]);
  for (const p of fig.parts) if (p.parent && keep.has(p.parent)) keep.add(p.name);
  return fig.parts.filter((p) => keep.has(p.name));
}

/**
 * A piece taken off a figure as a figure of its own (key `owner#part`), standing on its lowest point, and where
 * that new figure's origin was in the owner's figure space (so the piece appears exactly where it was).
 */
export function pieceFigure(fig: Figure, part: string): { fig: Figure; origin: Vec3 } | null {
  const parts = subtree(fig, part);
  if (!parts.length) return null;
  const frames = solve(fig);
  const root = frames.get(part)!;
  // re-root: the piece keeps its rest orientation; its joint sits over the new origin, its lowest point on y = 0
  const top: FigPart = { ...parts[0], parent: undefined, at: [0, 0, 0], rot: undefined };
  const R = root.R;
  // fold the joint's world rotation into the root part's rotation (degrees, XYZ) so it keeps its tilt
  top.rot = toEuler(R);
  const rest = parts.slice(1);
  const draft = measure({ key: `${fig.key}#${part}`, view: fig.view, rig: 'prop', group: 'things', parts: [top, ...rest], edge: fig.edge });
  // lowest point of the re-rooted piece
  const fr = solve(draft);
  let low = Infinity;
  for (const p of draft.parts) {
    const f = fr.get(p.name)!;
    for (const q of cornerPoints(p)) low = Math.min(low, f.T[1] + apply(f.R, q)[1]);
  }
  if (!Number.isFinite(low)) low = 0;
  top.at = [0, -low, 0];
  const out = measure({ key: `${fig.key}#${part}`, view: fig.view, rig: 'prop', group: 'things', parts: [top, ...rest], edge: fig.edge });
  return { fig: out, origin: [root.T[0], root.T[1] + low, root.T[2]] };
}

function cornerPoints(p: FigPart): Vec3[] {
  const e = p.size.map((v) => v / 2);
  const off = p.off ?? [0, 0, 0];
  const R = euler(p.srot);
  const out: Vec3[] = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const c = apply(R, [sx * e[0], sy * e[1], sz * e[2]]);
    out.push([off[0] + c[0], off[1] + c[1], off[2] + c[2]]);
  }
  return out;
}

/** Euler XYZ degrees of a rotation matrix (row-major, as math.ts builds them). */
export function toEuler(m: number[]): Vec3 {
  // m = Rx * Ry * Rz for XYZ order: m[2] = sin(y)
  const sy = Math.max(-1, Math.min(1, m[2]));
  const y = Math.asin(sy);
  let x: number, z: number;
  if (Math.abs(sy) < 0.9999) {
    x = Math.atan2(-m[5], m[8]);
    z = Math.atan2(-m[1], m[0]);
  } else {
    x = Math.atan2(m[7], m[4]);
    z = 0;
  }
  return [x / DEG, y / DEG, z / DEG];
}

/** The part a name means: exact, then ignoring case and spaces/underscores, then the first part it starts. */
export function findPart(fig: Figure, name: string): FigPart | undefined {
  const norm = (v: string) => v.toLowerCase().replace(/[\s_-]+/g, '');
  const w = norm(name);
  if (!w) return undefined; // "_" is no part at all (and must not match the root)
  return fig.parts.find((p) => p.name === name) ?? fig.parts.find((p) => norm(p.name) === w) ?? (w.length >= 2 ? fig.parts.find((p) => norm(p.name).startsWith(w)) : undefined);
}
