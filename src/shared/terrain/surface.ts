/**
 * What the ground is made of at a point, for footsteps and landings: the painted roads, paths and plaza, sand
 * along the water, the water itself, or grass. Built things say what they are made of by their material.
 */
import type { MaterialName } from '../structure/types';
import { polylineDist, type TerrainField } from './field';

export type Surface = 'grass' | 'gravel' | 'stone' | 'wood' | 'sand' | 'water' | 'metal';

/** Sand reaches this far above the water level, as the ground is painted. */
const SAND_ABOVE = 0.75;

export function groundSurface(field: TerrainField | null, x: number, z: number): Surface {
  if (!field) return 'grass';
  const spec = field.spec;
  if (field.isWater(x, z, 0.02)) return 'water';
  if (spec.pads.some((p) => p.r !== undefined && Math.hypot(x - p.x, z - p.z) < p.r)) return 'stone';
  if (spec.roads.some((r) => polylineDist(x, z, r.pts).d < r.width / 2)) return 'gravel';
  if (spec.paths.some((p) => polylineDist(x, z, p.pts).d < p.width / 2)) return 'gravel';
  if (field.height(x, z) - field.waterLevel < SAND_ABOVE) return 'sand';
  return 'grass';
}

export function materialSurface(mat: MaterialName): Surface {
  switch (mat) {
    case 'plank':
    case 'shingle':
    case 'thatch':
    case 'gingerbread':
    case 'flat':
      return 'wood';
    case 'metal':
      return 'metal';
    case 'water':
      return 'water';
    default:
      return 'stone';
  }
}
