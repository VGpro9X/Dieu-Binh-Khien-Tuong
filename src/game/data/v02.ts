import type {
  BoardConfig,
  MovementType,
  TerrainDefinition,
  TerrainId,
  UnitState,
} from '../core/types';

export const BOARD_CONFIG: BoardConfig = {
  columns: 14,
  rows: 10,
  tileSize: 52,
  originX: 48,
  originY: 126,
};

export const TERRAIN_DEFINITIONS: Record<TerrainId, TerrainDefinition> = {
  'dong-co': {
    id: 'dong-co',
    name: 'Đồng cỏ',
    shortLabel: '',
    movementCost: {
      'bo-binh': 1,
      'ky-binh': 1,
      'trong-binh': 1,
      phep: 1,
    },
  },
  rung: {
    id: 'rung',
    name: 'Rừng',
    shortLabel: 'R',
    movementCost: {
      'bo-binh': 2,
      'ky-binh': 3,
      'trong-binh': 2,
      phep: 2,
    },
  },
  'doi-da': {
    id: 'doi-da',
    name: 'Đồi đá',
    shortLabel: 'Đ',
    movementCost: {
      'bo-binh': 2,
      'ky-binh': 3,
      'trong-binh': 3,
      phep: 2,
    },
  },
  'nuoc-can': {
    id: 'nuoc-can',
    name: 'Nước cạn',
    shortLabel: '~',
    movementCost: {
      'bo-binh': 2,
      'ky-binh': null,
      'trong-binh': 3,
      phep: 2,
    },
  },
};

const G = 'dong-co';
const F = 'rung';
const H = 'doi-da';
const W = 'nuoc-can';

export const TERRAIN_LAYOUT: TerrainId[][] = [
  [G, G, F, F, G, G, H, H, G, G, F, G, G, G],
  [G, G, F, G, G, H, H, G, G, F, F, G, G, G],
  [G, F, F, G, G, G, H, G, G, G, F, F, G, G],
  [G, G, G, G, W, W, G, G, W, W, G, G, G, G],
  [G, G, F, G, W, G, G, G, G, W, G, F, G, G],
  [G, G, F, G, W, G, G, G, G, W, G, F, G, G],
  [G, G, G, G, W, W, G, G, W, W, G, G, G, G],
  [G, F, F, G, G, G, H, G, G, G, F, F, G, G],
  [G, G, F, G, G, H, H, G, G, F, F, G, G, G],
  [G, G, F, F, G, G, H, H, G, G, F, G, G, G],
];

export const INITIAL_UNITS: UnitState[] = [
  {
    id: 'xanh-linh-01',
    name: 'Lính',
    shortLabel: 'L',
    team: 'xanh',
    position: { x: 1, y: 4 },
    hp: 100,
    maxHp: 100,
    movement: 4,
    movementType: 'bo-binh',
    hasMoved: false,
  },
  {
    id: 'xanh-cung-01',
    name: 'Cung Thủ',
    shortLabel: 'C',
    team: 'xanh',
    position: { x: 2, y: 5 },
    hp: 80,
    maxHp: 80,
    movement: 3,
    movementType: 'bo-binh',
    hasMoved: false,
  },
  {
    id: 'do-linh-01',
    name: 'Lính',
    shortLabel: 'L',
    team: 'do',
    position: { x: 12, y: 5 },
    hp: 100,
    maxHp: 100,
    movement: 4,
    movementType: 'bo-binh',
    hasMoved: false,
  },
  {
    id: 'do-cung-01',
    name: 'Cung Thủ',
    shortLabel: 'C',
    team: 'do',
    position: { x: 11, y: 4 },
    hp: 80,
    maxHp: 80,
    movement: 3,
    movementType: 'bo-binh',
    hasMoved: false,
  },
];

export function getTerrainAt(x: number, y: number): TerrainDefinition {
  const terrainId = TERRAIN_LAYOUT[y]?.[x] ?? 'dong-co';
  return TERRAIN_DEFINITIONS[terrainId];
}

export function getTerrainMovementCost(
  x: number,
  y: number,
  movementType: MovementType,
): number | null {
  return getTerrainAt(x, y).movementCost[movementType];
}
