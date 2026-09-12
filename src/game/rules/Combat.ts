import type { CombatUnitState, GridPosition } from '../core/types';

export interface DamagePreview {
  min: number;
  max: number;
  base: number;
  offense: number;
  defense: number;
}

export function getGridDistance(a: GridPosition, b: GridPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

export function isInAttackRange(
  attacker: CombatUnitState,
  targetPosition: GridPosition,
): boolean {
  const distance = getGridDistance(attacker.position, targetPosition);
  return distance >= attacker.minAttackRange && distance <= attacker.maxAttackRange;
}

export function getDamagePreview(
  attacker: CombatUnitState,
  defender: CombatUnitState,
): DamagePreview {
  const offense = attacker.damageType === 'vat-ly' ? attacker.attack : attacker.magicAttack;
  const defense = attacker.damageType === 'vat-ly' ? defender.armor : defender.resistance;
  const mitigation = 100 / (100 + defense * 2.5);
  const base = Math.max(1, Math.round(offense * mitigation));
  const min = Math.max(1, Math.floor(base * 0.95));
  const max = Math.max(min, Math.ceil(base * 1.05));

  return { min, max, base, offense, defense };
}

export function rollDamage(preview: DamagePreview): number {
  if (preview.max <= preview.min) return preview.min;
  return PhaserMathBetween(preview.min, preview.max);
}

function PhaserMathBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
