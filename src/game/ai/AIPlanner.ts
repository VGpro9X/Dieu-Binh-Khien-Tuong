import type {
  CombatUnitState,
  GridPosition,
  StrategicPointState,
  TeamId,
  UnitClassId,
} from '../core/types';

export type AIOrder =
  | { type: 'capture'; unitId: string }
  | { type: 'attack'; unitId: string; targetId: string }
  | { type: 'skill'; unitId: string; targetId: string }
  | { type: 'move'; unitId: string; position: GridPosition }
  | { type: 'wait'; unitId: string };

export interface ReachableTile {
  position: GridPosition;
  cost: number;
}

export interface AIPlanningContext {
  team: TeamId;
  units: readonly CombatUnitState[];
  points: readonly StrategicPointState[];
  ownFortress: GridPosition;
  enemyFortress: GridPosition;
  getReachable(unit: CombatUnitState): readonly ReachableTile[];
  getMana(unitId: string): number;
}

export interface AISummonContext {
  team: TeamId;
  round: number;
  points: number;
  units: readonly CombatUnitState[];
  strategicPoints: readonly StrategicPointState[];
  ownFortress: GridPosition;
  getValidSpawnTiles(classId: UnitClassId): readonly GridPosition[];
}

export interface AISummonChoice {
  classId: UnitClassId;
  position: GridPosition;
}

const SUMMON_COST: Record<UnitClassId, number> = {
  linh: 3,
  'cung-thu': 4,
  'ky-binh': 5,
  'trong-binh': 5,
  'phap-su': 6,
  'tri-lieu-su': 5,
};

export function distance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isWithinRange(
  source: GridPosition,
  target: GridPosition,
  minRange: number,
  maxRange: number,
): boolean {
  const range = distance(source, target);
  return range >= minRange && range <= maxRange;
}

function unitThreatScore(attacker: CombatUnitState, target: CombatUnitState): number {
  const damage = attacker.damageType === 'phep'
    ? attacker.magicAttack - target.resistance * 0.7
    : attacker.attack - target.armor * 0.7;
  const possibleDamage = Math.max(5, damage);
  const killBonus = possibleDamage >= target.hp ? 42 : 0;
  const woundedBonus = (1 - target.hp / target.maxHp) * 13;
  const casterBonus = target.classId === 'phap-su' || target.classId === 'tri-lieu-su' ? 5 : 0;
  return possibleDamage + killBonus + woundedBonus + casterBonus;
}

function findAttackTarget(
  attacker: CombatUnitState,
  enemies: readonly CombatUnitState[],
): CombatUnitState | null {
  const inRange = enemies.filter((target) =>
    isWithinRange(attacker.position, target.position, attacker.minAttackRange, attacker.maxAttackRange),
  );
  inRange.sort((a, b) => unitThreatScore(attacker, b) - unitThreatScore(attacker, a) || a.id.localeCompare(b.id));
  return inRange[0] ?? null;
}

function findSkillTarget(
  unit: CombatUnitState,
  allies: readonly CombatUnitState[],
  enemies: readonly CombatUnitState[],
  mana: number,
): CombatUnitState | null {
  if (unit.classId === 'phap-su' && mana >= 35) {
    const fireballTargets = enemies.filter((enemy) => isWithinRange(unit.position, enemy.position, 2, 4));
    fireballTargets.sort((a, b) => {
      const score = (target: CombatUnitState): number => {
        const expectedDamage = Math.max(12, 44 - Math.floor(target.resistance * 0.65));
        return (expectedDamage >= target.hp ? 100 : 0) + (1 - target.hp / target.maxHp) * 18 + expectedDamage;
      };
      return score(b) - score(a) || a.id.localeCompare(b.id);
    });
    return fireballTargets[0] ?? null;
  }
  if (unit.classId === 'tri-lieu-su' && mana >= 30) {
    const targets = allies.filter((ally) =>
      isWithinRange(unit.position, ally.position, 0, 3) && ally.maxHp - ally.hp >= 18,
    );
    targets.sort((a, b) => {
      const score = (ally: CombatUnitState): number =>
        Math.min(38, ally.maxHp - ally.hp) * 1.8 + (1 - ally.hp / ally.maxHp) * 25;
      return score(b) - score(a) || a.id.localeCompare(b.id);
    });
    return targets[0] ?? null;
  }
  return null;
}

function chooseMove(
  context: AIPlanningContext,
  unit: CombatUnitState,
  allies: readonly CombatUnitState[],
  enemies: readonly CombatUnitState[],
): GridPosition | null {
  const positions = context.getReachable(unit).filter((tile) =>
    distance(tile.position, unit.position) > 0 &&
    !context.units.some((other) => other.id !== unit.id && distance(other.position, tile.position) === 0),
  );
  if (positions.length === 0) return null;

  const uncaptured = context.points.filter((point) => point.owner !== context.team);
  const intruders = enemies.filter((enemy) => distance(enemy.position, context.ownFortress) <= 4);
  const mana = context.getMana(unit.id);
  const canHeal = unit.classId === 'tri-lieu-su' && mana >= 30 && !unit.hasActed;
  const canFireball = unit.classId === 'phap-su' && mana >= 35 && !unit.hasActed;

  const objectiveValue = (position: GridPosition): number => {
    let score = Number.NEGATIVE_INFINITY;
    for (const point of uncaptured) {
      const remaining = distance(position, point.position);
      const current = distance(unit.position, point.position);
      const bonus = point.balanceValue * 0.35 + (point.enablesSummoning ? 4 : 0) +
        (point.owner !== null ? 3 : 0);
      const value = bonus - remaining * 1.3 + (current - remaining) * 5 +
        (remaining === 0 && !unit.hasActed ? 27 : 0);
      score = Math.max(score, value);
    }
    return score;
  };

  const currentObjective = objectiveValue(unit.position);
  let best: { position: GridPosition; score: number; cost: number } | null = null;

  for (const tile of positions) {
    const position = tile.position;
    let score = uncaptured.length > 0 ? objectiveValue(position) - currentObjective : -8;

    if (!unit.hasActed) {
      const attackable = enemies.filter((enemy) => isWithinRange(
        position,
        enemy.position,
        unit.minAttackRange,
        unit.maxAttackRange,
      ));
      if (attackable.length > 0) {
        const threat = Math.max(...attackable.map((enemy) => unitThreatScore(unit, enemy)));
        score += 21 + Math.min(20, threat * 0.3);
      }
      if (canFireball && enemies.some((enemy) => isWithinRange(position, enemy.position, 2, 4))) {
        score += 25;
      }
      if (canHeal && allies.some((ally) =>
        ally.maxHp - ally.hp >= 18 && isWithinRange(position, ally.position, 0, 3))) {
        score += 25;
      }
    }

    if (intruders.length > 0) {
      const threatDistance = Math.min(...intruders.map((enemy) => distance(position, enemy.position)));
      const initialDistance = Math.min(...intruders.map((enemy) => distance(unit.position, enemy.position)));
      score += (initialDistance - threatDistance) * 6;
      if (!unit.hasActed && intruders.some((enemy) => isWithinRange(
        position, enemy.position, unit.minAttackRange, unit.maxAttackRange,
      ))) score += 32;
    } else if (uncaptured.length === 0 && enemies.length > 0) {
      const nearestEnemyDistance = Math.min(...enemies.map((enemy) => distance(position, enemy.position)));
      const initialEnemyDistance = Math.min(...enemies.map((enemy) => distance(unit.position, enemy.position)));
      score += (initialEnemyDistance - nearestEnemyDistance) * 6;
    }

    if (unit.classId === 'phap-su' || unit.classId === 'tri-lieu-su') {
      const adjacentEnemies = enemies.filter((enemy) => distance(enemy.position, position) <= 1).length;
      score -= adjacentEnemies * 8;
    }

    score -= tile.cost * 0.28;
    if (!best || score > best.score + 0.001 ||
      (Math.abs(score - best.score) <= 0.001 && (tile.cost < best.cost ||
        (tile.cost === best.cost && (position.y + ':' + position.x) < (best.position.y + ':' + best.position.x))))) {
      best = { position, score, cost: tile.cost };
    }
  }

  return best && best.score >= 1.5 ? best.position : null;
}

export function planUnitAction(context: AIPlanningContext, unit: CombatUnitState): AIOrder {
  if (unit.team !== context.team || (unit.hasMoved && unit.hasActed)) {
    return { type: 'wait', unitId: unit.id };
  }

  const allies = context.units.filter((candidate) => candidate.team === unit.team);
  const enemies = context.units.filter((candidate) => candidate.team !== unit.team);
  const standingPoint = context.points.find((point) => distance(point.position, unit.position) === 0);

  if (!unit.hasActed && standingPoint && standingPoint.owner !== unit.team) {
    return { type: 'capture', unitId: unit.id };
  }

  if (!unit.hasActed) {
    const skillTarget = findSkillTarget(unit, allies, enemies, context.getMana(unit.id));
    if (skillTarget) return { type: 'skill', unitId: unit.id, targetId: skillTarget.id };

    const attackTarget = findAttackTarget(unit, enemies);
    if (attackTarget) return { type: 'attack', unitId: unit.id, targetId: attackTarget.id };
  }

  if (!unit.hasMoved) {
    const destination = chooseMove(context, unit, allies, enemies);
    if (destination) return { type: 'move', unitId: unit.id, position: destination };
  }

  return { type: 'wait', unitId: unit.id };
}

export function chooseAISummon(context: AISummonContext): AISummonChoice | null {
  const allies = context.units.filter((unit) => unit.team === context.team);
  const enemies = context.units.filter((unit) => unit.team !== context.team);
  const danger = enemies.some((enemy) => distance(enemy.position, context.ownFortress) <= 4);
  const opening = context.round === 0;
  if (allies.length >= 10 || context.points < 3) return null;

  if (!opening && !danger && allies.length >= Math.max(4, enemies.length + 1) && context.points < 10) {
    return null;
  }

  const classCount = (classId: UnitClassId): number => allies.filter((unit) => unit.classId === classId).length;
  const candidates: UnitClassId[] = opening
    ? ['linh', 'ky-binh', 'cung-thu']
    : danger
      ? ['trong-binh', 'cung-thu', 'linh', 'tri-lieu-su', 'phap-su', 'ky-binh']
      : allies.length >= 3 && classCount('tri-lieu-su') === 0
        ? ['tri-lieu-su', 'ky-binh', 'cung-thu', 'linh', 'phap-su', 'trong-binh']
        : classCount('ky-binh') === 0 && allies.length < 4
          ? ['ky-binh', 'linh', 'cung-thu', 'phap-su', 'tri-lieu-su', 'trong-binh']
          : ['linh', 'cung-thu', 'phap-su', 'ky-binh', 'tri-lieu-su', 'trong-binh'];

  const objectives = context.strategicPoints.filter((point) => point.owner !== context.team);
  const mainObjective = objectives
    .map((point) => ({ point, score: point.balanceValue * 0.2 - distance(point.position, context.ownFortress) }))
    .sort((a, b) => b.score - a.score || a.point.id.localeCompare(b.point.id))[0]?.point;
  const intruders = enemies
    .filter((enemy) => distance(enemy.position, context.ownFortress) <= 4)
    .sort((a, b) => distance(a.position, context.ownFortress) - distance(b.position, context.ownFortress));
  const targetPosition = danger ? intruders[0]?.position : mainObjective?.position;

  for (const classId of candidates) {
    if (SUMMON_COST[classId] > context.points) continue;
    if (!opening && !danger && classId === 'tri-lieu-su' && classCount('tri-lieu-su') >= 1) continue;
    const tiles = [...context.getValidSpawnTiles(classId)];
    if (tiles.length === 0) continue;
    tiles.sort((a, b) => {
      const da = targetPosition ? distance(a, targetPosition) : distance(a, context.ownFortress);
      const db = targetPosition ? distance(b, targetPosition) : distance(b, context.ownFortress);
      return da - db || a.y - b.y || a.x - b.x;
    });
    return { classId, position: tiles[0] };
  }
  return null;
}
