export type TeamId = 'xanh' | 'do';

export interface GridPosition {
  x: number;
  y: number;
}

export interface UnitState {
  id: string;
  name: string;
  shortLabel: string;
  team: TeamId;
  position: GridPosition;
  hp: number;
  maxHp: number;
}

export interface BoardConfig {
  columns: number;
  rows: number;
  tileSize: number;
  originX: number;
  originY: number;
}
