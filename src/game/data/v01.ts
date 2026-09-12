import type { BoardConfig, UnitState } from '../core/types';

export const BOARD_CONFIG: BoardConfig = {
  columns: 14,
  rows: 10,
  tileSize: 52,
  originX: 48,
  originY: 126,
};

export const INITIAL_UNITS: UnitState[] = [
  {
    id: 'xanh-linh-01',
    name: 'Lính',
    shortLabel: 'L',
    team: 'xanh',
    position: { x: 1, y: 4 },
    hp: 100,
    maxHp: 100,
  },
  {
    id: 'xanh-cung-01',
    name: 'Cung Thủ',
    shortLabel: 'C',
    team: 'xanh',
    position: { x: 2, y: 5 },
    hp: 80,
    maxHp: 80,
  },
  {
    id: 'do-linh-01',
    name: 'Lính',
    shortLabel: 'L',
    team: 'do',
    position: { x: 12, y: 5 },
    hp: 100,
    maxHp: 100,
  },
  {
    id: 'do-cung-01',
    name: 'Cung Thủ',
    shortLabel: 'C',
    team: 'do',
    position: { x: 11, y: 4 },
    hp: 80,
    maxHp: 80,
  },
];
