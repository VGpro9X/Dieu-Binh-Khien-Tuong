import type {
  StrategicPointDefinition,
  StrategicPointType,
} from '../core/types';
import {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  SUMMON_ORDER,
  UNIT_DEFINITIONS,
  createSummonedUnit,
  getFortressForTeam,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
} from './v04';

export {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  SUMMON_ORDER,
  UNIT_DEFINITIONS,
  createSummonedUnit,
  getFortressForTeam,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
};

interface StrategicTemplate {
  name: string;
  shortLabel: string;
  income: number;
  balanceValue: number;
  armorBonus: number;
  resistanceBonus: number;
  healPerTurn: number;
  enablesSummoning: boolean;
  effectText: string;
}

export const STRATEGIC_TEMPLATES: Record<StrategicPointType, StrategicTemplate> = {
  nha: {
    name: 'Nhà',
    shortLabel: 'NH',
    income: 1,
    balanceValue: 10,
    armorBonus: 0,
    resistanceBonus: 0,
    healPerTurn: 6,
    enablesSummoning: false,
    effectText: '+1 Điểm Điều Binh/lượt • Toàn quân hồi 6 HP đầu lượt',
  },
  nuoc: {
    name: 'Nguồn Nước',
    shortLabel: 'NC',
    income: 1,
    balanceValue: 10,
    armorBonus: 0,
    resistanceBonus: 0,
    healPerTurn: 4,
    enablesSummoning: false,
    effectText: '+1 Điểm Điều Binh/lượt • V0.5: toàn quân hồi 4 HP đầu lượt; Mana sẽ nối ở V0.7',
  },
  rung: {
    name: 'Rừng',
    shortLabel: 'R',
    income: 1,
    balanceValue: 10,
    armorBonus: 1,
    resistanceBonus: 1,
    healPerTurn: 0,
    enablesSummoning: false,
    effectText: '+1 Điểm Điều Binh/lượt • +1 Giáp và +1 Kháng cho toàn quân',
  },
  nui: {
    name: 'Núi',
    shortLabel: 'N',
    income: 1,
    balanceValue: 12,
    armorBonus: 2,
    resistanceBonus: 0,
    healPerTurn: 0,
    enablesSummoning: false,
    effectText: '+1 Điểm Điều Binh/lượt • +2 Giáp cho toàn quân',
  },
  'mo-vang': {
    name: 'Mỏ Vàng',
    shortLabel: 'V',
    income: 2,
    balanceValue: 18,
    armorBonus: 0,
    resistanceBonus: 0,
    healPerTurn: 0,
    enablesSummoning: false,
    effectText: '+2 Điểm Điều Binh/lượt',
  },
  'mo-bac': {
    name: 'Mỏ Bạc',
    shortLabel: 'B',
    income: 1,
    balanceValue: 14,
    armorBonus: 0,
    resistanceBonus: 2,
    healPerTurn: 0,
    enablesSummoning: false,
    effectText: '+1 Điểm Điều Binh/lượt • +2 Kháng cho toàn quân',
  },
  'mo-sat': {
    name: 'Mỏ Sắt',
    shortLabel: 'S',
    income: 1,
    balanceValue: 14,
    armorBonus: 2,
    resistanceBonus: 0,
    healPerTurn: 0,
    enablesSummoning: false,
    effectText: '+1 Điểm Điều Binh/lượt • +2 Giáp cho toàn quân',
  },
  'thanh-tri': {
    name: 'Thành Trì',
    shortLabel: 'TT',
    income: 2,
    balanceValue: 22,
    armorBonus: 0,
    resistanceBonus: 0,
    healPerTurn: 0,
    enablesSummoning: true,
    effectText: '+2 Điểm Điều Binh/lượt • Mở điểm triển khai quân quanh Thành Trì',
  },
};

function point(
  id: string,
  type: StrategicPointType,
  x: number,
  y: number,
): StrategicPointDefinition {
  return {
    id,
    type,
    position: { x, y },
    ...STRATEGIC_TEMPLATES[type],
  };
}

// V0.5 dùng bố cục cố định để test luật chiếm đóng/buff. V0.6 sẽ thay bằng generator có seed.
export const STRATEGIC_POINTS: StrategicPointDefinition[] = [
  point('nha-tay', 'nha', 3, 1),
  point('nuoc-tay', 'nuoc', 4, 3),
  point('rung-tay', 'rung', 2, 7),
  point('sat-tay', 'mo-sat', 5, 8),

  point('nha-dong', 'nha', 10, 8),
  point('nuoc-dong', 'nuoc', 9, 6),
  point('rung-dong', 'rung', 10, 2),
  point('sat-dong', 'mo-sat', 8, 1),

  point('nui-trung-tam', 'nui', 6, 2),
  point('bac-trung-tam', 'mo-bac', 6, 7),
  point('vang-trung-tam', 'mo-vang', 7, 4),
  point('thanh-tri-trung-tam', 'thanh-tri', 7, 6),
];
