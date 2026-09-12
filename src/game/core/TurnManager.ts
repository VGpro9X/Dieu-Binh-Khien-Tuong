import type { MatchPhase, TeamId } from './types';

export class TurnManager {
  private activeTeam: TeamId = 'xanh';
  private round = 0;
  private phase: MatchPhase = 'trieu-hoi-mo-dau';

  getActiveTeam(): TeamId {
    return this.activeTeam;
  }

  getRound(): number {
    return this.round;
  }

  getPhase(): MatchPhase {
    return this.phase;
  }

  completeOpeningSummon(): boolean {
    if (this.phase !== 'trieu-hoi-mo-dau') return false;

    if (this.activeTeam === 'xanh') {
      this.activeTeam = 'do';
      return false;
    }

    this.phase = 'chien-dau';
    this.activeTeam = 'xanh';
    this.round = 1;
    return true;
  }

  endTurn(): boolean {
    if (this.phase !== 'chien-dau') return false;

    if (this.activeTeam === 'xanh') {
      this.activeTeam = 'do';
      return true;
    }

    this.activeTeam = 'xanh';
    this.round += 1;
    return true;
  }
}
