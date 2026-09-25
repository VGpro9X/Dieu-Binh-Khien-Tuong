import * as Phaser from 'phaser';
import { BattleScene as BattleSceneV05 } from './BattleSceneV05';
import {
  MAP_BALANCE,
  MAP_SEED,
  STRATEGIC_POINTS,
  createRandomMapSeed,
} from '../data/v06';

export class BattleScene extends BattleSceneV05 {
  constructor() {
    super(STRATEGIC_POINTS);
  }

  create(): void {
    super.create();
    this.drawV06MapControls();
  }

  private drawV06MapControls(): void {
    this.add
      .rectangle(410, 78, 730, 30, 0x0b1220, 1)
      .setDepth(70);

    this.add
      .text(49, 70, `V0.6 • Random Map Generator • Seed: ${MAP_SEED.slice(0, 24)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#94a3b8',
      })
      .setDepth(71);

    const balanceText =
      `Tây ${MAP_BALANCE.westCount} điểm / ${MAP_BALANCE.westBalanceValue} BV • ` +
      `Đông ${MAP_BALANCE.eastCount} điểm / ${MAP_BALANCE.eastBalanceValue} BV • ` +
      `ΔBV ${MAP_BALANCE.balanceValueDelta} • ΔKC ${MAP_BALANCE.distanceDelta.toFixed(1)}`;

    this.add
      .text(842, 70, balanceText, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        color: '#a5b4fc',
        wordWrap: { width: 250 },
      })
      .setDepth(71);

    const button = this.add
      .rectangle(1180, 78, 108, 30, 0x4338ca, 1)
      .setStrokeStyle(1, 0xa5b4fc, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(72);

    const label = this.add
      .text(1180, 78, 'MAP MỚI', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setDepth(73);

    button.on('pointerdown', () => this.openNewSeed());
    label.setInteractive({ useHandCursor: true });
    label.on('pointerdown', () => this.openNewSeed());
  }

  private openNewSeed(): void {
    const params = new URLSearchParams(window.location.search);
    params.set('seed', createRandomMapSeed());
    window.location.search = params.toString();
  }
}
