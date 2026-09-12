import type { TeamId } from './types';

export class EconomyManager {
  private readonly points: Record<TeamId, number>;

  constructor(
    startingPoints: number,
    private readonly baseIncome: number,
  ) {
    this.points = {
      xanh: startingPoints,
      do: startingPoints,
    };
  }

  getPoints(team: TeamId): number {
    return this.points[team];
  }

  getBaseIncome(): number {
    return this.baseIncome;
  }

  canAfford(team: TeamId, cost: number): boolean {
    return this.points[team] >= cost;
  }

  spend(team: TeamId, cost: number): boolean {
    if (!this.canAfford(team, cost)) return false;
    this.points[team] -= cost;
    return true;
  }

  grantTurnIncome(team: TeamId, bonusIncome = 0): number {
    const total = this.baseIncome + Math.max(0, bonusIncome);
    this.points[team] += total;
    return total;
  }

  grantBonusIncome(team: TeamId, bonusIncome: number): number {
    const bonus = Math.max(0, bonusIncome);
    this.points[team] += bonus;
    return bonus;
  }
}
