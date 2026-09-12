import type {
  GridPosition,
  StrategicPointDefinition,
  StrategicPointState,
  TeamId,
  TerritorySummary,
} from './types';

export class TerritoryManager {
  private readonly points: StrategicPointState[];

  constructor(definitions: StrategicPointDefinition[]) {
    this.points = definitions.map((point) => ({
      ...point,
      position: { ...point.position },
      owner: null,
    }));
  }

  getAllPoints(): readonly StrategicPointState[] {
    return this.points;
  }

  getPoint(id: string): StrategicPointState | null {
    return this.points.find((point) => point.id === id) ?? null;
  }

  getPointAt(position: GridPosition): StrategicPointState | null {
    return (
      this.points.find(
        (point) => point.position.x === position.x && point.position.y === position.y,
      ) ?? null
    );
  }

  capture(pointId: string, team: TeamId): TeamId | null {
    const point = this.getPoint(pointId);
    if (!point) return null;
    const previousOwner = point.owner;
    point.owner = team;
    return previousOwner;
  }

  getOwnedPoints(team: TeamId): StrategicPointState[] {
    return this.points.filter((point) => point.owner === team);
  }

  getSummary(team: TeamId): TerritorySummary {
    const summary: TerritorySummary = {
      ownedCount: 0,
      incomeBonus: 0,
      armorBonus: 0,
      resistanceBonus: 0,
      healPerTurn: 0,
      fortressCount: 0,
    };

    for (const point of this.points) {
      if (point.owner !== team) continue;
      summary.ownedCount += 1;
      summary.incomeBonus += point.income;
      summary.armorBonus += point.armorBonus;
      summary.resistanceBonus += point.resistanceBonus;
      summary.healPerTurn += point.healPerTurn;
      if (point.enablesSummoning) summary.fortressCount += 1;
    }

    return summary;
  }
}
