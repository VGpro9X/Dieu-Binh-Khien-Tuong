export type TeamId = 'xanh' | 'do';

export type MatchPhase = 'trieu-hoi-mo-dau' | 'chien-dau';

export type TerrainId = 'dong-co' | 'rung' | 'doi-da' | 'nuoc-can';

export type MovementType = 'bo-binh' | 'ky-binh' | 'trong-binh' | 'phep';

export type UnitClassId =
  | 'linh'
  | 'cung-thu'
  | 'ky-binh'
  | 'trong-binh'
  | 'phap-su'
  | 'tri-lieu-su';

export type DamageType = 'vat-ly' | 'phep';

export type StrategicPointType =
  | 'nha'
  | 'nuoc'
  | 'rung'
  | 'nui'
  | 'mo-vang'
  | 'mo-bac'
  | 'mo-sat'
  | 'thanh-tri';

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

export interface UnitDefinition {
  classId: UnitClassId;
  name: string;
  shortLabel: string;
  role: string;
  maxHp: number;
  movement: number;
  movementType: MovementType;
  attack: number;
  magicAttack: number;
  armor: number;
  resistance: number;
  minAttackRange: number;
  maxAttackRange: number;
  damageType: DamageType;
  summonCost: number;
}

export interface CombatUnitState extends UnitState, UnitDefinition {
  hasActed: boolean;
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

export interface FortressDefinition {
  team: TeamId;
  position: GridPosition;
  spawnTiles: GridPosition[];
}

export interface StrategicPointDefinition {
  id: string;
  type: StrategicPointType;
  name: string;
  shortLabel: string;
  position: GridPosition;
  income: number;
  balanceValue: number;
  armorBonus: number;
  resistanceBonus: number;
  healPerTurn: number;
  enablesSummoning: boolean;
  effectText: string;
}

export interface StrategicPointState extends StrategicPointDefinition {
  owner: TeamId | null;
}

export interface TerritorySummary {
  ownedCount: number;
  incomeBonus: number;
  armorBonus: number;
  resistanceBonus: number;
  healPerTurn: number;
  fortressCount: number;
}
