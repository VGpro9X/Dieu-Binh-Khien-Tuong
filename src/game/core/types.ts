export type TeamId = 'xanh' | 'do';

export type TerrainId = 'dong-co' | 'rung' | 'doi-da' | 'nuoc-can';

export type MovementType = 'bo-binh' | 'ky-binh' | 'trong-binh' | 'phep';

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
  movement: number;
  movementType: MovementType;
  hasMoved: boolean;
}

export interface BoardConfig {
  columns: number;
  rows: number;
  tileSize: number;
  originX: number;
  originY: number;
}

export interface TerrainDefinition {
  id: TerrainId;
  name: string;
  shortLabel: string;
  movementCost: Record<MovementType, number | null>;
}
