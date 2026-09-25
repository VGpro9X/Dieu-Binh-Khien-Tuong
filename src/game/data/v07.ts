import type { UnitClassId } from '../core/types';
import {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  GENERATED_MAP,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  MAP_BALANCE,
  MAP_SEED,
  STRATEGIC_POINTS,
  STRATEGIC_TEMPLATES,
  SUMMON_ORDER,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
  UNIT_DEFINITIONS,
  createRandomMapSeed,
  createSummonedUnit,
  generateStrategicMap,
  getFortressForTeam,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
} from './v06';

export {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  GENERATED_MAP,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  MAP_BALANCE,
  MAP_SEED,
  STRATEGIC_POINTS,
  STRATEGIC_TEMPLATES,
  SUMMON_ORDER,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
  UNIT_DEFINITIONS,
  createRandomMapSeed,
  createSummonedUnit,
  generateStrategicMap,
  getFortressForTeam,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
};

export type SkillId = 'hoa-cau' | 'tri-lieu';
export type StatusEffectId = 'thieu-dot' | 'hoi-phuc';
export type SkillTarget = 'ke-dich' | 'dong-minh';

export interface SkillDefinition {
  id: SkillId;
  classId: UnitClassId;
  name: string;
  shortDescription: string;
  manaCost: number;
  minRange: number;
  maxRange: number;
  target: SkillTarget;
  power: number;
  statusEffect: StatusEffectId | null;
}

export interface PassiveDefinition {
  classId: UnitClassId;
  name: string;
  description: string;
}

export interface ManaProfile {
  maxMana: number;
  startingMana: number;
  turnRegen: number;
}

export interface StatusEffectDefinition {
  id: StatusEffectId;
  name: string;
  durationTurns: number;
  tickPower: number;
  description: string;
}

export const WATER_MANA_REGEN_PER_POINT = 10;

export const MANA_PROFILES: Partial<Record<UnitClassId, ManaProfile>> = {
  'phap-su': {
    maxMana: 100,
    startingMana: 60,
    turnRegen: 20,
  },
  'tri-lieu-su': {
    maxMana: 100,
    startingMana: 60,
    turnRegen: 15,
  },
};

export const SKILL_DEFINITIONS: Record<SkillId, SkillDefinition> = {
  'hoa-cau': {
    id: 'hoa-cau',
    classId: 'phap-su',
    name: 'Hỏa Cầu',
    shortDescription: 'Sát thương phép tầm xa và gây Thiêu Đốt.',
    manaCost: 35,
    minRange: 2,
    maxRange: 4,
    target: 'ke-dich',
    power: 44,
    statusEffect: 'thieu-dot',
  },
  'tri-lieu': {
    id: 'tri-lieu',
    classId: 'tri-lieu-su',
    name: 'Trị Liệu',
    shortDescription: 'Hồi HP cho đồng minh và ban Hồi Phục.',
    manaCost: 30,
    minRange: 0,
    maxRange: 3,
    target: 'dong-minh',
    power: 38,
    statusEffect: 'hoi-phuc',
  },
};

export const PASSIVE_DEFINITIONS: Partial<Record<UnitClassId, PassiveDefinition>> = {
  'phap-su': {
    classId: 'phap-su',
    name: 'Dẫn Ma',
    description: 'Phục hồi 20 Mana đầu lượt thay vì 15.',
  },
  'tri-lieu-su': {
    classId: 'tri-lieu-su',
    name: 'Từ Tâm',
    description: 'Trị Liệu luôn ban Hồi Phục trong 2 lượt.',
  },
};

export const STATUS_EFFECT_DEFINITIONS: Record<StatusEffectId, StatusEffectDefinition> = {
  'thieu-dot': {
    id: 'thieu-dot',
    name: 'Thiêu Đốt',
    durationTurns: 2,
    tickPower: 7,
    description: 'Mất 7 HP đầu lượt trong 2 lượt.',
  },
  'hoi-phuc': {
    id: 'hoi-phuc',
    name: 'Hồi Phục',
    durationTurns: 2,
    tickPower: 6,
    description: 'Hồi 6 HP đầu lượt trong 2 lượt.',
  },
};

export function getActiveSkillForClass(classId: UnitClassId): SkillDefinition | null {
  return (
    Object.values(SKILL_DEFINITIONS).find((skill) => skill.classId === classId) ?? null
  );
}

export function getManaProfile(classId: UnitClassId): ManaProfile | null {
  return MANA_PROFILES[classId] ?? null;
}
