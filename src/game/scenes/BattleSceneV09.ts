import * as Phaser from 'phaser';
import { BattleScene as BattleSceneV08 } from './BattleSceneV08';
import { BattlefieldVisuals } from '../visual/BattlefieldVisuals';
import { terrainTopColor } from '../visual/visual-config';
import { getTerrainAt } from '../data/v04';
import { MAP_BALANCE, MAP_SEED } from '../data/v06';
import { buildPath, type MovementNode } from '../rules/Pathfinder';
import type { CombatUnitState, GridPosition, TeamId } from '../core/types';
import type { SkillDefinition } from '../data/v07';

/**
 * V0.9 2.5D rendering layer. No combat, economy, map or AI rule is replaced.
 * Visual hooks wrap the already composed V0.4→V0.8 methods and only render
 * successful actions, including AI actions.
 */
export class BattleScene extends BattleSceneV08 {
  private visualsV09!: BattlefieldVisuals;
  private fxButtonV09!: Phaser.GameObjects.Rectangle;
  private fxLabelV09!: Phaser.GameObjects.Text;

  create(): void {
    const scene = this as any;
    this.visualsV09 = new BattlefieldVisuals(this, MAP_SEED);

    // Hook BEFORE base.create: keeps board hitboxes, pathfinding and terrain rules intact.
    const originalDrawBoard = scene.drawBoard.bind(this) as () => void;
    scene.drawBoard = () => {
      this.visualsV09.drawBackdrop();
      originalDrawBoard();
      this.visualsV09.drawTerrain();
    };
    scene.getBaseTileColor = (position: GridPosition) =>
      terrainTopColor(getTerrainAt(position.x, position.y).id, position.x, position.y);

    super.create();

    this.visualsV09.decorateFortresses();
    this.visualsV09.decorateStrategicPoints(scene.territoryManagerV05.getAllPoints());
    for (const unit of scene.units as CombatUnitState[]) {
      const view = scene.unitViews.get(unit.id);
      if (view) this.visualsV09.decorateUnit(unit, view);
    }

    this.patchVisualActionHooksV09();
    this.drawV09Controls();
    scene.refreshAll();
  }

  private patchVisualActionHooksV09(): void {
    const scene = this as any;

    // Both a player's and the AI's newly summoned units get the same geometry
    // and the same summon VFX. The original summon chain still spends resources.
    const originalCreateUnitView = scene.createUnitView.bind(this) as
      (unit: CombatUnitState) => void;
    scene.createUnitView = (unit: CombatUnitState) => {
      originalCreateUnitView(unit);
      const view = scene.unitViews.get(unit.id);
      if (view) this.visualsV09.decorateUnit(unit, view);
    };

    const originalSummon = scene.summonUnitAt.bind(this) as
      (position: GridPosition) => void;
    scene.summonUnitAt = (position: GridPosition) => {
      const before = new Set((scene.units as CombatUnitState[]).map(unit => unit.id));
      originalSummon(position);
      const summoned = (scene.units as CombatUnitState[]).find(unit => !before.has(unit.id));
      if (summoned) this.visualsV09.summon(summoned.position, summoned.team);
    };

    const originalMove = scene.moveSelectedUnit.bind(this) as
      (position: GridPosition) => void;
    scene.moveSelectedUnit = (destination: GridPosition) => {
      const selected = (scene.units as CombatUnitState[]).find(
        unit => unit.id === scene.selectedUnitId,
      );
      const wasReady = Boolean(selected && !selected.hasMoved);
      const previous: GridPosition | null = selected ? { ...selected.position } : null;
      const path: GridPosition[] = previous
        ? buildPath(scene.reachableTiles as Map<string, MovementNode>, destination)
        : [];
      originalMove(destination);
      if (selected && previous && wasReady && selected.hasMoved &&
          (selected.position.x !== previous.x || selected.position.y !== previous.y)) {
        this.visualsV09.moveTrail(path);
      }
    };

    const originalAttack = scene.attackUnit.bind(this) as
      (attacker: CombatUnitState, target: CombatUnitState) => void;
    scene.attackUnit = (attacker: CombatUnitState, target: CombatUnitState) => {
      const source = { ...attacker.position };
      const destination = { ...target.position };
      const actionAvailable = !attacker.hasActed;
      originalAttack(attacker, target);
      if (actionAvailable && attacker.hasActed) {
        const style = attacker.classId === 'cung-thu' ? 'ten'
          : attacker.classId === 'ky-binh' ? 'lao'
          : attacker.classId === 'trong-binh' ? 'khien'
          : attacker.classId === 'phap-su' ? 'hoa-cau'
          : attacker.classId === 'tri-lieu-su' ? 'tri-lieu'
          : 'kiem';
        this.visualsV09.projectile(source, destination, style, attacker.team);
      }
    };

    const originalFireball = scene.castFireballV07.bind(this) as
      (caster: CombatUnitState, target: CombatUnitState, skill: SkillDefinition) => void;
    scene.castFireballV07 = (caster: CombatUnitState, target: CombatUnitState, skill: SkillDefinition) => {
      const before = scene.manaV07.get(caster.id)?.current ?? 0;
      const source = { ...caster.position }, destination = { ...target.position };
      originalFireball(caster, target, skill);
      const after = scene.manaV07.get(caster.id)?.current ?? 0;
      if (before - after === skill.manaCost) {
        this.visualsV09.projectile(source, destination, 'hoa-cau', caster.team);
      }
    };

    const originalHealing = scene.castHealingV07.bind(this) as
      (caster: CombatUnitState, target: CombatUnitState, skill: SkillDefinition) => void;
    scene.castHealingV07 = (caster: CombatUnitState, target: CombatUnitState, skill: SkillDefinition) => {
      const beforeMana = scene.manaV07.get(caster.id)?.current ?? 0;
      const beforeHP = target.hp;
      const source = { ...caster.position }, destination = { ...target.position };
      originalHealing(caster, target, skill);
      const afterMana = scene.manaV07.get(caster.id)?.current ?? 0;
      if (beforeMana - afterMana === skill.manaCost) {
        this.visualsV09.projectile(source, destination, 'tri-lieu', caster.team);
        this.time.delayedCall(170, () => this.visualsV09.heal(destination, target.hp - beforeHP));
      }
    };

    const originalCapture = scene.captureSelectedPointV05.bind(this) as () => void;
    scene.captureSelectedPointV05 = () => {
      const selected = (scene.units as CombatUnitState[]).find(
        unit => unit.id === scene.selectedUnitId,
      );
      const point = selected ? scene.territoryManagerV05.getPointAt(selected.position) : null;
      const beforeOwner = point?.owner ?? null;
      originalCapture();
      if (selected && point && point.owner === selected.team && beforeOwner !== point.owner) {
        this.visualsV09.capture(point.position, selected.team);
      }
    };

    const originalRemoveUnit = scene.removeUnit.bind(this) as
      (target: CombatUnitState) => void;
    scene.removeUnit = (unit: CombatUnitState) => {
      const lastPosition = { ...unit.position }, team = unit.team, id = unit.id;
      originalRemoveUnit(unit);
      this.visualsV09.forgetUnit(id);
      this.visualsV09.death(lastPosition, team);
    };

    const originalTick = scene.processStartOfTurnV07.bind(this) as
      (team: TeamId) => void;
    scene.processStartOfTurnV07 = (team: TeamId) => {
      const before = new Map<string, { position: GridPosition; hp: number }>(
        (scene.units as CombatUnitState[])
          .filter(unit => unit.team === team)
          .map(unit => [unit.id, { position: { ...unit.position }, hp: unit.hp }]),
      );
      originalTick(team);
      const after = new Map<string, number>(
        (scene.units as CombatUnitState[]).map(unit => [unit.id, unit.hp]),
      );
      for (const [id, old] of before) {
        const newHP = after.get(id) ?? 0;
        if (newHP < old.hp) this.visualsV09.burnTick(old.position, old.hp - newHP);
        else if (newHP > old.hp) this.visualsV09.heal(old.position, newHP - old.hp);
      }
    };

    const originalEndTurn = scene.endTurn.bind(this) as () => void;
    scene.endTurn = () => {
      const before: TeamId = scene.turnManager.getActiveTeam();
      originalEndTurn();
      const after: TeamId = scene.turnManager.getActiveTeam();
      if (before !== after) this.visualsV09.turnBanner(after);
    };

    const originalRefresh = scene.refreshAll.bind(this) as () => void;
    scene.refreshAll = () => {
      originalRefresh();
      const points = scene.territoryManagerV05.getAllPoints();
      this.visualsV09.updateOwnership(points);
      this.visualsV09.updateSelection(scene.selectedTile as GridPosition | null);
    };
  }

  private drawV09Controls(): void {
    // High-depth strips replace only old version labels, not the existing
    // MAP MỚI, AI toggle, skill/passive, HUD or terrain controls.
    this.add.rectangle(415, 78, 740, 30, 0x0b1220, 1).setDepth(130);
    this.add.text(49, 70,
      'V0.9 • Chiến trường 2.5D • Seed: ' + MAP_SEED.slice(0, 19), {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px', color: '#cbd5e1',
      }).setDepth(131);
    this.add.rectangle(968, 78, 268, 30, 0x0b1220, 1).setDepth(130);
    this.add.text(842, 70,
      'Tây ' + MAP_BALANCE.westCount + ' / Đông ' + MAP_BALANCE.eastCount +
      ' • ΔBV ' + MAP_BALANCE.balanceValueDelta + ' • VFX', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '10px', color: '#67e8f9',
      }).setDepth(131);

    this.fxButtonV09 = this.add.rectangle(122, 108, 140, 29, 0x155e75, 1)
      .setStrokeStyle(1, 0x67e8f9, 0.88)
      .setInteractive({ useHandCursor: true }).setDepth(132);
    this.fxLabelV09 = this.add.text(122, 108, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px', fontStyle: 'bold', color: '#ecfeff',
    }).setOrigin(0.5).setDepth(133).setInteractive({ useHandCursor: true });

    const toggle = () => {
      this.visualsV09.toggleQuality();
      this.refreshFxLabelV09();
      (this as any).statusMessage = this.visualsV09.getQuality() === 'gon'
        ? 'Hiệu ứng gọn: giảm số hạt và tắt rung màn hình.'
        : 'Hiệu ứng đầy đủ: hạt phép, ánh sáng và rung màn hình.';
      (this as any).refreshAll();
    };
    this.fxButtonV09.on('pointerdown', toggle);
    this.fxLabelV09.on('pointerdown', toggle);
    this.refreshFxLabelV09();
  }

  private refreshFxLabelV09(): void {
    const full = this.visualsV09.getQuality() === 'day-du';
    this.fxButtonV09.setFillStyle(full ? 0x155e75 : 0x334155, 1)
      .setStrokeStyle(1, full ? 0x67e8f9 : 0x94a3b8, 0.9);
    this.fxLabelV09.setText(full ? 'FX: ĐẦY ĐỦ' : 'FX: GỌN');
  }
}
