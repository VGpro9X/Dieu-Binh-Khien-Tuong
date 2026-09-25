import type { TerrainId, UnitClassId } from '../core/types';

/** All V0.9 visual decisions live here; no gameplay rules depend on visual quality. */
export type VisualQuality = 'day-du' | 'gon';
export type ProjectileStyle = 'kiem' | 'ten' | 'lao' | 'khien' | 'hoa-cau' | 'tri-lieu';
export interface TerrainPalette {
  top: readonly [number, number];
  accent: number;
  shadow: number;
}
export interface FxBudget {
  projectileParticles: number;
  impactParticles: number;
  ambientParticles: number;
  allowCameraShake: boolean;
}

export const TERRAIN_PALETTES: Record<TerrainId, TerrainPalette> = {
  'dong-co': { top: [0x244940, 0x2a5045], accent: 0x91cba0, shadow: 0x112b27 },
  rung: { top: [0x164039, 0x1a483f], accent: 0x4eab77, shadow: 0x0c2623 },
  'doi-da': { top: [0x5d5246, 0x695b4d], accent: 0xd6c2a1, shadow: 0x292722 },
  'nuoc-can': { top: [0x22546b, 0x2a6276], accent: 0x81d3d8, shadow: 0x122d3c },
};

export const FX_BUDGET: Record<VisualQuality, FxBudget> = {
  'day-du': { projectileParticles: 7, impactParticles: 12, ambientParticles: 84, allowCameraShake: true },
  gon: { projectileParticles: 2, impactParticles: 4, ambientParticles: 28, allowCameraShake: false },
};

export const UNIT_PROJECTILE_STYLE: Record<UnitClassId, ProjectileStyle> = {
  linh: 'kiem',
  'cung-thu': 'ten',
  'ky-binh': 'lao',
  'trong-binh': 'khien',
  'phap-su': 'hoa-cau',
  'tri-lieu-su': 'tri-lieu',
};

export function terrainTopColor(terrain: TerrainId, x: number, y: number): number {
  return TERRAIN_PALETTES[terrain].top[(x + y) & 1];
}

/** Deterministic decor, stable for the same map seed (never uses gameplay RNG). */
export function decorNoise(seed: string, x: number, y: number, channel = 0): number {
  let value = (2166136261 ^ Math.imul(x + 17, 374761393) ^ Math.imul(y + 37, 668265263) ^
    Math.imul(channel + 11, 2246822519)) >>> 0;
  for (let i = 0; i < seed.length; i += 1) {
    value = Math.imul(value ^ seed.charCodeAt(i), 16777619) >>> 0;
  }
  value ^= value >>> 15;
  value = Math.imul(value, 2246822519) >>> 0;
  value ^= value >>> 13;
  return (value >>> 0) / 4294967296;
}

export function projectileColor(style: ProjectileStyle, team: 'xanh' | 'do'): number {
  if (style === 'hoa-cau') return 0xfb923c;
  if (style === 'tri-lieu') return 0x5eead4;
  return team === 'xanh' ? 0x7dd3fc : 0xfda4af;
}
