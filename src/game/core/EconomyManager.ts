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

  grantTurnIncome(team: TeamId): number {
    this.points[team] += this.baseIncome;
    return this.baseIncome;
  }
}
