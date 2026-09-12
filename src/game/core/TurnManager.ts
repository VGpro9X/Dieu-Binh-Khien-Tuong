import type { TeamId } from './types';

export class TurnManager {
  private activeTeam: TeamId = 'xanh';
  private round = 1;

  getActiveTeam(): TeamId {
    return this.activeTeam;
  }

  getRound(): number {
    return this.round;
  }

  endTurn(): void {
    if (this.activeTeam === 'xanh') {
      this.activeTeam = 'do';
      return;
    }

    this.activeTeam = 'xanh';
    this.round += 1;
  }
}
