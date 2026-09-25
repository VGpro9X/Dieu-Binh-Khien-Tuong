import * as Phaser from 'phaser';
import { BattleScene as BattleSceneV07 } from './BattleSceneV07';
import { chooseAISummon, planUnitAction, type AIPlanningContext } from '../ai/AIPlanner';
import type { CombatUnitState, GridPosition, UnitClassId } from '../core/types';
import { MAIN_FORTRESSES } from '../data/v04';
import { MAP_BALANCE, MAP_SEED } from '../data/v06';
import { SKILL_DEFINITIONS } from '../data/v07';

/** V0.8: AI uses the existing movement, combat, skill, capture and summon rules. */
export class BattleScene extends BattleSceneV07 {
  private aiEnabledV08 = new URLSearchParams(window.location.search).get('mode') !== '2p';
  private aiActingV08 = false;
  private aiTimerV08: Phaser.Time.TimerEvent | null = null;
  private aiTurnKeyV08 = '';
  private aiStepsV08 = 0;
  private aiSummonsV08 = 0;
  private readonly skippedUnitsV08 = new Set<string>();
  private aiButtonV08!: Phaser.GameObjects.Rectangle;
  private aiLabelV08!: Phaser.GameObjects.Text;

  create(): void {
    super.create();
    this.patchForAIV08();
    this.drawAIControlsV08();
    (this as any).refreshAll();
    this.scheduleAIIfNeededV08();
  }

  private sceneV08(): any {
    return this as any;
  }

  private isAITurnV08(): boolean {
    return this.aiEnabledV08 && this.sceneV08().turnManager.getActiveTeam() === 'do';
  }

  private patchForAIV08(): void {
    const scene = this.sceneV08();
    const originalHandleTileClick = scene.handleTileClick.bind(this) as (pos: GridPosition) => void;
    const originalSummonButton = scene.handleSummonButton.bind(this) as (classId: UnitClassId) => void;
    const originalSummonUnit = scene.summonUnitAt.bind(this) as (pos: GridPosition) => void;
    const originalEndTurn = scene.endTurn.bind(this) as () => void;
    const originalCapture = scene.captureSelectedPointV05.bind(this) as () => void;
    const originalSkillButton = scene.toggleSkillModeV07.bind(this) as () => void;
    const originalRefresh = scene.refreshAll.bind(this) as () => void;

    scene.handleTileClick = (position: GridPosition) => {
      if (this.isAITurnV08() && !this.aiActingV08) return;
      originalHandleTileClick(position);
    };
    scene.handleSummonButton = (classId: UnitClassId) => {
      if (this.isAITurnV08() && !this.aiActingV08) return;
      originalSummonButton(classId);
    };
    scene.summonUnitAt = (position: GridPosition) => {
      if (this.isAITurnV08() && !this.aiActingV08) return;
      originalSummonUnit(position);
      if (!this.aiActingV08) this.scheduleAIIfNeededV08();
    };
    scene.endTurn = () => {
      if (this.isAITurnV08() && !this.aiActingV08) return;
      originalEndTurn();
      if (!this.aiActingV08) this.scheduleAIIfNeededV08();
    };
    scene.captureSelectedPointV05 = () => {
      if (this.isAITurnV08() && !this.aiActingV08) return;
      originalCapture();
    };
    scene.toggleSkillModeV07 = () => {
      if (this.isAITurnV08() && !this.aiActingV08) return;
      originalSkillButton();
    };
    scene.refreshAll = () => {
      originalRefresh();
      this.refreshAIControlsV08();
    };
  }

  private drawAIControlsV08(): void {
    this.add.rectangle(415, 78, 740, 30, 0x0b1220, 1).setDepth(110);
    this.add.text(49, 70, 'V0.8 • AI chiến thuật • Seed: ' + MAP_SEED.slice(0, 23), {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#94a3b8',
    }).setDepth(111);
    this.add.text(842, 70,
      'Map: Tây ' + MAP_BALANCE.westCount + ' / Đông ' + MAP_BALANCE.eastCount +
      ' • ΔBV ' + MAP_BALANCE.balanceValueDelta,
      {fontFamily:'system-ui, sans-serif',fontSize:'9px',color:'#a5b4fc'},
    ).setDepth(111);

    this.aiButtonV08 = this.add.rectangle(285, 108, 218, 30, 0x1e3a8a, 1)
      .setStrokeStyle(1, 0x93c5fd, 0.9)
      .setInteractive({ useHandCursor: true }).setDepth(110);
    this.aiLabelV08 = this.add.text(285, 108, '', {
      fontFamily:'system-ui, sans-serif',fontSize:'10px',fontStyle:'bold',color:'#ffffff',
    }).setOrigin(0.5).setDepth(111).setInteractive({ useHandCursor:true });
    this.aiButtonV08.on('pointerdown', () => this.toggleAIV08());
    this.aiLabelV08.on('pointerdown', () => this.toggleAIV08());
    this.refreshAIControlsV08();
  }

  private refreshAIControlsV08(): void {
    if (!this.aiButtonV08 || !this.aiLabelV08) return;
    const thinking = this.isAITurnV08();
    this.aiButtonV08.setFillStyle(this.aiEnabledV08 ? 0x1d4ed8 : 0x374151, 1)
      .setStrokeStyle(1, thinking ? 0xfbbf24 : 0x93c5fd, 1);
    this.aiLabelV08.setText(
      thinking ? 'PHE ĐỎ: MÁY ĐANG ĐI' : this.aiEnabledV08 ? 'PHE ĐỎ: MÁY • ĐỔI CHẾ ĐỘ' : 'PHE ĐỎ: 2 NGƯỜI • ĐỔI',
    );
  }

  private toggleAIV08(): void {
    const scene = this.sceneV08();
    if (scene.turnManager.getActiveTeam() === 'do') {
      scene.statusMessage = 'Có thể đổi chế độ khi đến lượt Phe Xanh.';
      scene.refreshAll();
      return;
    }
    this.aiEnabledV08 = !this.aiEnabledV08;
    const params = new URLSearchParams(window.location.search);
    if (this.aiEnabledV08) params.delete('mode');
    else params.set('mode', '2p');
    window.history.replaceState(null, '',
      window.location.pathname + (params.size ? '?' + params.toString() : '') + window.location.hash);
    scene.statusMessage = this.aiEnabledV08
      ? 'Phe Đỏ sẽ do máy điều khiển, bắt đầu từ lần triệu hồi/lượt tiếp theo.'
      : 'Đã chuyển sang chế độ 2 người trên cùng thiết bị.';
    scene.refreshAll();
  }

  private scheduleAIIfNeededV08(delay = 340): void {
    if (!this.isAITurnV08() || this.aiTimerV08) return;
    this.aiTimerV08 = this.time.delayedCall(delay, () => {
      this.aiTimerV08 = null;
      this.advanceAIV08();
    });
  }

  private advanceAIV08(): void {
    if (!this.isAITurnV08()) return;
    const scene = this.sceneV08();
    if (scene.isAnimating) {
      this.scheduleAIIfNeededV08(130);
      return;
    }
    if (scene.turnManager.getPhase() === 'trieu-hoi-mo-dau') {
      this.handleOpeningSummonV08();
      return;
    }
    if (scene.turnManager.getPhase() !== 'chien-dau') return;

    const turnKey = 'do:' + scene.turnManager.getRound();
    if (turnKey !== this.aiTurnKeyV08) {
      this.aiTurnKeyV08 = turnKey;
      this.aiStepsV08 = 0;
      this.aiSummonsV08 = 0;
      this.skippedUnitsV08.clear();
    }

    // A hard cap prevents accidental endless turns.
    if (this.aiStepsV08++ >= 72) {
      this.finishAITurnV08();
      return;
    }

    const ownUnits: CombatUnitState[] = scene.units.filter((unit: CombatUnitState) => unit.team === 'do');
    const enemies: CombatUnitState[] = scene.units.filter((unit: CombatUnitState) => unit.team === 'xanh');
    const emergency = enemies.some((enemy) =>
      Math.abs(enemy.position.x - MAIN_FORTRESSES.do.position.x) +
      Math.abs(enemy.position.y - MAIN_FORTRESSES.do.position.y) <= 4,
    );
    const summonLimit = emergency ? 3 : 2;
    if (this.aiSummonsV08 < summonLimit) {
      const decision = chooseAISummon({
        team:'do',round:scene.turnManager.getRound(),
        points:scene.economyManager.getPoints('do'),units:scene.units,
        strategicPoints:scene.territoryManagerV05.getAllPoints(),
        ownFortress:MAIN_FORTRESSES.do.position,
        getValidSpawnTiles:(classId:UnitClassId)=>scene.getValidSpawnTiles(classId),
      });
      if (decision) {
        const before = scene.units.length;
        this.aiActingV08 = true;
        try {
          scene.pendingSummonClass = decision.classId;
          scene.summonUnitAt(decision.position);
        } finally {
          this.aiActingV08 = false;
        }
        if (scene.units.length > before) {
          this.aiSummonsV08++;
          this.skippedUnitsV08.clear();
          this.scheduleAIIfNeededV08(280);
          return;
        }
      }
      this.aiSummonsV08 = summonLimit;
    }

    const context: AIPlanningContext = {
      team:'do',units:scene.units,points:scene.territoryManagerV05.getAllPoints(),
      ownFortress:MAIN_FORTRESSES.do.position,
      enemyFortress:MAIN_FORTRESSES.xanh.position,
      getMana:(id:string)=>scene.manaV07.get(id)?.current ?? 0,
      getReachable:(unit:CombatUnitState)=>[...scene.calculateMovementFor(unit).values()],
    };

    for (const unit of ownUnits) {
      if ((unit.hasMoved && unit.hasActed) || this.skippedUnitsV08.has(unit.id)) continue;
      const order = planUnitAction(context, unit);
      if (order.type === 'wait') {
        this.skippedUnitsV08.add(unit.id);
        continue;
      }
      const target = 'targetId' in order
        ? scene.units.find((candidate:CombatUnitState)=>candidate.id===order.targetId) as CombatUnitState | undefined
        : undefined;
      if ((order.type === 'attack' || order.type === 'skill') && !target) {
        this.skippedUnitsV08.add(unit.id);
        continue;
      }

      this.aiActingV08 = true;
      try {
        scene.selectUnit(unit);
        switch (order.type) {
          case 'capture':
            scene.captureSelectedPointV05();
            break;
          case 'attack':
            scene.attackUnit(unit, target);
            break;
          case 'skill':
            if (unit.classId === 'phap-su') scene.castFireballV07(unit, target, SKILL_DEFINITIONS['hoa-cau']);
            else if (unit.classId === 'tri-lieu-su') scene.castHealingV07(unit, target, SKILL_DEFINITIONS['tri-lieu']);
            break;
          case 'move':
            scene.moveSelectedUnit(order.position);
            break;
        }
      } finally {
        this.aiActingV08 = false;
      }
      this.scheduleAIIfNeededV08(280);
      return;
    }

    this.finishAITurnV08();
  }

  private handleOpeningSummonV08(): void {
    const scene = this.sceneV08();
    const choice = chooseAISummon({
      team:'do',round:0,points:scene.economyManager.getPoints('do'),units:scene.units,
      strategicPoints:scene.territoryManagerV05.getAllPoints(),
      ownFortress:MAIN_FORTRESSES.do.position,
      getValidSpawnTiles:(classId:UnitClassId)=>scene.getValidSpawnTiles(classId),
    });
    if (!choice) {
      scene.statusMessage = 'Máy không tìm thấy ô triệu hồi mở đầu hợp lệ.';
      scene.refreshAll();
      return;
    }
    this.aiActingV08 = true;
    try {
      scene.pendingSummonClass = choice.classId;
      scene.summonUnitAt(choice.position);
    } finally {
      this.aiActingV08 = false;
    }
  }

  private finishAITurnV08(): void {
    const scene = this.sceneV08();
    this.skippedUnitsV08.clear();
    this.aiActingV08 = true;
    try {
      scene.endTurn();
    } finally {
      this.aiActingV08 = false;
    }
    if (scene.turnManager.getActiveTeam() === 'xanh') {
      scene.statusMessage += '\nMáy đã hoàn tất lượt. Đến lượt Phe Xanh.';
      scene.refreshAll();
    }
  }
}
