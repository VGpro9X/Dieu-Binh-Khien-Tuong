import type {
  GridPosition,
  StrategicPointDefinition,
  StrategicPointType,
} from '../core/types';
import {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  STRATEGIC_TEMPLATES,
  SUMMON_ORDER,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
  UNIT_DEFINITIONS,
  createSummonedUnit,
  getFortressForTeam,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
} from './v05';

export {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  STRATEGIC_TEMPLATES,
  SUMMON_ORDER,
  TERRAIN_DEFINITIONS,
  TERRAIN_LAYOUT,
  UNIT_DEFINITIONS,
  createSummonedUnit,
  getFortressForTeam,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
};

type MapRegion = 'tay' | 'dong' | 'trung-tam';

export interface MapBalanceSummary {
  westCount: number;
  eastCount: number;
  westBalanceValue: number;
  eastBalanceValue: number;
  balanceValueDelta: number;
  westAverageDistance: number;
  eastAverageDistance: number;
  distanceDelta: number;
  contestedCount: number;
}

export interface GeneratedStrategicMap {
  seed: string;
  points: StrategicPointDefinition[];
  balance: MapBalanceSummary;
}

const SIDE_TYPE_POOL: StrategicPointType[] = [
  'thanh-tri',
  'mo-vang',
  'mo-bac',
  'mo-sat',
  'nui',
  'nha',
  'nuoc',
  'rung',
  'nha',
  'rung',
];

const CONTESTED_TYPE_POOL: StrategicPointType[] = [
  'mo-vang',
  'mo-bac',
  'mo-sat',
  'nui',
  'thanh-tri',
  'nuoc',
];

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: string): () => number {
  let state = hashSeed(seed) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(source: readonly T[], random: () => number): T[] {
  const result = [...source];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function manhattan(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function mirror(position: GridPosition): GridPosition {
  return {
    x: BOARD_CONFIG.columns - 1 - position.x,
    y: BOARD_CONFIG.rows - 1 - position.y,
  };
}

function positionKey(position: GridPosition): string {
  return `${position.x}:${position.y}`;
}

function getSideCandidateBases(): GridPosition[] {
  const candidates: GridPosition[] = [];
  for (let x = 3; x <= 5; x += 1) {
    for (let y = 0; y < BOARD_CONFIG.rows; y += 1) {
      const position = { x, y };
      if (isFortressTile(position)) continue;
      if (getTerrainMovementCost(x, y, 'bo-binh') === null) continue;
      candidates.push(position);
    }
  }
  return candidates;
}

function hasSpacing(
  candidate: GridPosition,
  selected: readonly GridPosition[],
  minimumDistance: number,
): boolean {
  return selected.every((position) => manhattan(candidate, position) >= minimumDistance);
}

function choosePairedBases(
  count: number,
  random: () => number,
): GridPosition[] {
  const candidates = shuffle(getSideCandidateBases(), random);

  for (const minimumDistance of [3, 2, 1]) {
    const selected: GridPosition[] = [];
    for (const candidate of candidates) {
      if (!hasSpacing(candidate, selected, minimumDistance)) continue;
      selected.push(candidate);
      if (selected.length === count) return selected;
    }
  }

  return candidates.slice(0, count);
}

function averageDistance(
  positions: readonly GridPosition[],
  origin: GridPosition,
): number {
  if (positions.length === 0) return 0;
  const total = positions.reduce(
    (sum, position) => sum + manhattan(position, origin),
    0,
  );
  return total / positions.length;
}

function chooseExtraPositions(
  region: 'tay' | 'dong',
  count: number,
  existing: readonly GridPosition[],
  random: () => number,
): GridPosition[] {
  if (count <= 0) return [];

  const ownFortress =
    region === 'tay' ? MAIN_FORTRESSES.xanh.position : MAIN_FORTRESSES.do.position;
  const targetAverage = averageDistance(existing, ownFortress);
  const existingKeys = new Set(existing.map(positionKey));
  const candidates = shuffle(getSideCandidateBases(), random)
    .map((position) => (region === 'tay' ? position : mirror(position)))
    .filter((position) => !existingKeys.has(positionKey(position)));

  let best: GridPosition[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  const inspect = (selected: GridPosition[], startIndex: number): void => {
    if (selected.length === count) {
      const all = [...existing, ...selected];
      const score = Math.abs(averageDistance(all, ownFortress) - targetAverage);
      if (score < bestScore) {
        bestScore = score;
        best = selected.map((position) => ({ ...position }));
      }
      return;
    }

    for (let index = startIndex; index < candidates.length; index += 1) {
      const candidate = candidates[index];
      if (!hasSpacing(candidate, existing, 2)) continue;
      if (!hasSpacing(candidate, selected, 2)) continue;
      selected.push(candidate);
      inspect(selected, index + 1);
      selected.pop();
    }
  };

  inspect([], 0);

  if (best) return best;

  const fallback: GridPosition[] = [];
  for (const candidate of candidates) {
    if (!hasSpacing(candidate, existing, 1)) continue;
    if (!hasSpacing(candidate, fallback, 1)) continue;
    fallback.push(candidate);
    if (fallback.length === count) break;
  }
  return fallback;
}

function chooseCentralPair(
  occupied: readonly GridPosition[],
  random: () => number,
): [GridPosition, GridPosition] {
  const rows = shuffle(
    Array.from({ length: BOARD_CONFIG.rows }, (_, index) => index),
    random,
  );

  for (const y of rows) {
    const west = { x: 6, y };
    const east = mirror(west);
    if (manhattan(west, east) < 2) continue;
    if (!hasSpacing(west, occupied, 2)) continue;
    if (!hasSpacing(east, occupied, 2)) continue;
    return [west, east];
  }

  return [
    { x: 6, y: 2 },
    { x: 7, y: 7 },
  ];
}

function typeBalanceValue(type: StrategicPointType): number {
  return STRATEGIC_TEMPLATES[type].balanceValue;
}

function chooseTypePartition(
  westCount: number,
  random: () => number,
): { west: StrategicPointType[]; east: StrategicPointType[] } {
  let bestDifference = Number.POSITIVE_INFINITY;
  const bestSelections: number[][] = [];

  const inspect = (selected: number[], startIndex: number): void => {
    if (selected.length === westCount) {
      const selectedSet = new Set(selected);
      const westValue = selected.reduce(
        (sum, index) => sum + typeBalanceValue(SIDE_TYPE_POOL[index]),
        0,
      );
      const eastValue = SIDE_TYPE_POOL.reduce(
        (sum, type, index) =>
          selectedSet.has(index) ? sum : sum + typeBalanceValue(type),
        0,
      );
      const difference = Math.abs(westValue - eastValue);

      if (difference < bestDifference) {
        bestDifference = difference;
        bestSelections.length = 0;
        bestSelections.push([...selected]);
      } else if (difference === bestDifference) {
        bestSelections.push([...selected]);
      }
      return;
    }

    for (let index = startIndex; index < SIDE_TYPE_POOL.length; index += 1) {
      selected.push(index);
      inspect(selected, index + 1);
      selected.pop();
    }
  };

  inspect([], 0);

  const chosen =
    bestSelections[Math.floor(random() * bestSelections.length)] ??
    bestSelections[0] ??
    [];
  const chosenSet = new Set(chosen);

  return {
    west: chosen.map((index) => SIDE_TYPE_POOL[index]),
    east: SIDE_TYPE_POOL.filter((_, index) => !chosenSet.has(index)),
  };
}

function createPoint(
  region: MapRegion,
  index: number,
  type: StrategicPointType,
  position: GridPosition,
): StrategicPointDefinition {
  return {
    id: `${region}-${index + 1}-${type}`,
    type,
    position: { ...position },
    ...STRATEGIC_TEMPLATES[type],
  };
}

function sumBalanceValue(types: readonly StrategicPointType[]): number {
  return types.reduce((sum, type) => sum + typeBalanceValue(type), 0);
}

export function generateStrategicMap(seed: string): GeneratedStrategicMap {
  const random = createRandom(seed);
  const distributions = [
    [4, 6],
    [5, 5],
    [6, 4],
  ] as const;
  const [westCount, eastCount] =
    distributions[Math.floor(random() * distributions.length)];

  const typePartition = chooseTypePartition(westCount, random);
  const pairedCount = Math.min(westCount, eastCount);
  const pairedBases = choosePairedBases(pairedCount, random);

  const westPositions = pairedBases.map((position) => ({ ...position }));
  const eastPositions = pairedBases.map((position) => mirror(position));

  westPositions.push(
    ...chooseExtraPositions('tay', westCount - pairedCount, westPositions, random),
  );
  eastPositions.push(
    ...chooseExtraPositions('dong', eastCount - pairedCount, eastPositions, random),
  );

  const shuffledWestTypes = shuffle(typePartition.west, random);
  const shuffledEastTypes = shuffle(typePartition.east, random);
  const points: StrategicPointDefinition[] = [
    ...westPositions.map((position, index) =>
      createPoint('tay', index, shuffledWestTypes[index], position),
    ),
    ...eastPositions.map((position, index) =>
      createPoint('dong', index, shuffledEastTypes[index], position),
    ),
  ];

  const occupied = [...westPositions, ...eastPositions];
  const [centralWest, centralEast] = chooseCentralPair(occupied, random);
  const contestedTypes = shuffle(CONTESTED_TYPE_POOL, random).slice(0, 2);
  points.push(
    createPoint('trung-tam', 0, contestedTypes[0], centralWest),
    createPoint('trung-tam', 1, contestedTypes[1], centralEast),
  );

  const westBalanceValue = sumBalanceValue(typePartition.west);
  const eastBalanceValue = sumBalanceValue(typePartition.east);
  const westAverageDistance = averageDistance(
    westPositions,
    MAIN_FORTRESSES.xanh.position,
  );
  const eastAverageDistance = averageDistance(
    eastPositions,
    MAIN_FORTRESSES.do.position,
  );

  return {
    seed,
    points,
    balance: {
      westCount,
      eastCount,
      westBalanceValue,
      eastBalanceValue,
      balanceValueDelta: Math.abs(westBalanceValue - eastBalanceValue),
      westAverageDistance,
      eastAverageDistance,
      distanceDelta: Math.abs(westAverageDistance - eastAverageDistance),
      contestedCount: 2,
    },
  };
}

function normalizeSeed(seed: string): string {
  const normalized = seed.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
  return normalized || 'dbkt-v06';
}

export function createRandomMapSeed(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.floor(Math.random() * 0xffffff)
    .toString(36)
    .padStart(5, '0');
  return `v06-${timestamp}-${randomPart}`;
}

function resolveMapSeed(): string {
  if (typeof window === 'undefined') return 'dbkt-v06';

  const params = new URLSearchParams(window.location.search);
  const existing = params.get('seed');
  if (existing) return normalizeSeed(existing);

  const generated = createRandomMapSeed();
  params.set('seed', generated);
  const query = params.toString();
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}?${query}${window.location.hash}`,
  );
  return generated;
}

export const MAP_SEED = resolveMapSeed();
export const GENERATED_MAP = generateStrategicMap(MAP_SEED);
export const STRATEGIC_POINTS = GENERATED_MAP.points;
export const MAP_BALANCE = GENERATED_MAP.balance;
