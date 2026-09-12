import type {
  CombatUnitState,
  FortressDefinition,
  GridPosition,
  TeamId,
  UnitClassId,
} from '../core/types';
import {
  BOARD_CONFIG,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
  UNIT_DEFINITIONS,
  getTerrainAt,
  getTerrainMovementCost,
} from './v03';

export {
  BOARD_CONFIG,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
  UNIT_DEFINITIONS,
  getTerrainAt,
  getTerrainMovementCost,
};

export const ECONOMY_CONFIG = {
  startingPoints: 8,
  baseIncome: 3,
} as const;

export const SUMMON_ORDER: UnitClassId[] = [
  'linh',
  'cung-thu',
  'ky-binh',
  'trong-binh',
  'phap-su',
  'tri-lieu-su',
];

export const MAIN_FORTRESSES: Record<TeamId, FortressDefinition> = {
  xanh: {
    team: 'xanh',
    position: { x: 1, y: 4 },
    spawnTiles: [
      { x: 0, y: 3 },
      { x: 1, y: 3 },
      { x: 2, y: 3 },
      { x: 0, y: 4 },
      { x: 2, y: 4 },
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 2, y: 5 },
    ],
  },
  do: {
    team: 'do',
    position: { x: 12, y: 5 },
    spawnTiles: [
      { x: 11, y: 4 },
      { x: 12, y: 4 },
      { x: 13, y: 4 },
      { x: 11, y: 5 },
      { x: 13, y: 5 },
      { x: 11, y: 6 },
      { x: 12, y: 6 },
      { x: 13, y: 6 },
    ],
  },
};

export const INITIAL_UNITS: CombatUnitState[] = [];

export function createSummonedUnit(
  id: string,
  classId: UnitClassId,
  team: TeamId,
  position: GridPosition,
): CombatUnitState {
  const definition = UNIT_DEFINITIONS[classId];
  return {
    ...definition,
    id,
    team,
    position: { ...position },
    hp: definition.maxHp,
    hasMoved: false,
    hasActed: false,
  };
}

export function getFortressForTeam(team: TeamId): FortressDefinition {
  return MAIN_FORTRESSES[team];
}

export function getSpawnTilesForTeam(team: TeamId): GridPosition[] {
  return MAIN_FORTRESSES[team].spawnTiles;
}

export function isFortressTile(position: GridPosition): boolean {
  return Object.values(MAIN_FORTRESSES).some(
    (fortress) =>
      fortress.position.x === position.x && fortress.position.y === position.y,
  );
}
