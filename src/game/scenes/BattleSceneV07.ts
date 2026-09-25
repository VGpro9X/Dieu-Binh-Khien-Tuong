import * as Phaser from 'phaser';
import { BattleScene as BattleSceneV06 } from './BattleSceneV06';
import type {
  CombatUnitState,
  GridPosition,
  TeamId,
  UnitClassId,
} from '../core/types';
import {
  MAP_BALANCE,
  MAP_SEED,
  PASSIVE_DEFINITIONS,
  SKILL_DEFINITIONS,
  STATUS_EFFECT_DEFINITIONS,
  WATER_MANA_REGEN_PER_POINT,
  getActiveSkillForClass,
  getManaProfile,
  type SkillDefinition,
  type SkillId,
  type StatusEffectId,
} from '../data/v07';

interface ManaState {
  current: number;
  max: number;
}

interface StatusEffectState {
  id: StatusEffectId;
  remainingTurns: number;
}

interface SkillButtonView {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

const TEAM_NAMES: Record<TeamId, string> = {
  xanh: 'Phe Xanh',
  do: 'Phe Đỏ',
};

export class BattleScene extends BattleSceneV06 {
  private readonly manaV07 = new Map<string, ManaState>();
  private readonly statusesV07 = new Map<string, StatusEffectState[]>();

  private activeSkillV07: SkillId | null = null;
  private skillButtonV07!: SkillButtonView;
  private passiveBoxV07!: Phaser.GameObjects.Rectangle;
  private passiveTextV07!: Phaser.GameObjects.Text;

  private originalHandleTileClickV07!: (position: GridPosition) => void;
  private originalRefreshAllV07!: () => void;
  private originalSummonUnitAtV07!: (position: GridPosition) => void;
  private originalEndTurnV07!: () => void;

  create(): void {
    super.create();
    this.initializeExistingManaV07();
    this.upgradeWaterDescriptionV07();
    this.patchForSkillsV07();
    this.drawV07Header();
    this.drawSkillControlsV07();
    (this as any).refreshAll();
  }

  private patchForSkillsV07(): void {
    const scene = this as any;

    this.originalHandleTileClickV07 = scene.handleTileClick.bind(this);
    this.originalRefreshAllV07 = scene.refreshAll.bind(this);
    this.originalSummonUnitAtV07 = scene.summonUnitAt.bind(this);
    this.originalEndTurnV07 = scene.endTurn.bind(this);

    scene.handleTileClick = (position: GridPosition) => {
      if (this.activeSkillV07) {
        this.tryUseActiveSkillV07(position);
        return;
      }
      this.originalHandleTileClickV07(position);
    };

    scene.refreshAll = () => {
      this.originalRefreshAllV07();
      this.refreshSkillUiV07();
    };

    scene.summonUnitAt = (position: GridPosition) => {
      const beforeIds = new Set(this.unitsV07().map((unit) => unit.id));
      const phaseBefore = scene.turnManager.getPhase();
      this.originalSummonUnitAtV07(position);

      for (const unit of this.unitsV07()) {
        if (!beforeIds.has(unit.id)) this.initializeUnitManaV07(unit);
      }

      const phaseAfter = scene.turnManager.getPhase();
      if (phaseBefore === 'trieu-hoi-mo-dau' && phaseAfter === 'chien-dau') {
        this.processStartOfTurnV07('xanh');
      }

      this.refreshSkillUiV07();
    };

    scene.endTurn = () => {
      const phaseBefore = scene.turnManager.getPhase();
      const teamBefore: TeamId = scene.turnManager.getActiveTeam();
      this.activeSkillV07 = null;
      this.originalEndTurnV07();

      if (phaseBefore !== 'chien-dau') return;
      const nextTeam: TeamId = scene.turnManager.getActiveTeam();
      if (nextTeam === teamBefore) return;

      this.processStartOfTurnV07(nextTeam);
      scene.refreshAll();
    };
  }

  private drawV07Header(): void {
    this.add.rectangle(410, 78, 730, 30, 0x0b1220, 1).setDepth(90);
    this.add
      .text(49, 70, `V0.7 • Mana & Skills • Seed: ${MAP_SEED.slice(0, 22)}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        color: '#94a3b8',
      })
      .setDepth(91);

    this.add
      .text(
        842,
        70,
        `Map: Tây ${MAP_BALANCE.westCount} / Đông ${MAP_BALANCE.eastCount} • ΔBV ${MAP_BALANCE.balanceValueDelta}`,
        {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          color: '#a5b4fc',
        },
      )
      .setDepth(91);
  }

  private drawSkillControlsV07(): void {
    const button = this.add
      .rectangle(520, 108, 224, 28, 0x1f2937, 1)
      .setStrokeStyle(1, 0x475569, 0.8)
      .setInteractive({ useHandCursor: true })
      .setDepth(90);
    const label = this.add
      .text(520, 108, 'KỸ NĂNG • CHỌN PHÁP SƯ / TRỊ LIỆU SƯ', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setDepth(91);

    this.skillButtonV07 = { button, label };
    button.on('pointerdown', () => this.toggleSkillModeV07());
    label.setInteractive({ useHandCursor: true });
    label.on('pointerdown', () => this.toggleSkillModeV07());

    this.passiveBoxV07 = this.add
      .rectangle(704, 108, 136, 28, 0x111827, 1)
      .setStrokeStyle(1, 0x334155, 0.8)
      .setDepth(90);
    this.passiveTextV07 = this.add
      .text(704, 108, 'NỘI TẠI: —', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '8px',
        color: '#64748b',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(91);
  }

  private toggleSkillModeV07(): void {
    const selected = this.getSelectedUnitV07();
    const skill = selected ? getActiveSkillForClass(selected.classId) : null;

    if (!selected || !skill) {
      (this as any).statusMessage = 'Chọn Pháp Sư hoặc Trị Liệu Sư của phe đang hành động để dùng kỹ năng.';
      (this as any).refreshAll();
      return;
    }

    if (this.activeSkillV07 === skill.id) {
      this.activeSkillV07 = null;
      (this as any).statusMessage = 'Đã hủy chọn kỹ năng.';
      (this as any).refreshAll();
      return;
    }

    const reason = this.getSkillUnavailableReasonV07(selected, skill);
    if (reason) {
      (this as any).statusMessage = reason;
      (this as any).refreshAll();
      return;
    }

    this.activeSkillV07 = skill.id;
    (this as any).pendingSummonClass = null;
    (this as any).statusMessage =
      skill.target === 'ke-dich'
        ? `Đang chọn ${skill.name}: bấm một quân địch trong tầm ${skill.minRange}–${skill.maxRange}.`
        : `Đang chọn ${skill.name}: bấm một đồng minh trong tầm 0–${skill.maxRange}.`;
    (this as any).refreshAll();
  }

  private tryUseActiveSkillV07(position: GridPosition): void {
    const scene = this as any;
    const caster = this.getSelectedUnitV07();
    const skill = this.activeSkillV07 ? SKILL_DEFINITIONS[this.activeSkillV07] : null;
    const target = this.findUnitAtV07(position);

    if (!caster || !skill || caster.classId !== skill.classId) {
      this.activeSkillV07 = null;
      scene.statusMessage = 'Người thi triển không còn hợp lệ. Kỹ năng đã được hủy.';
      scene.refreshAll();
      return;
    }

    const unavailable = this.getSkillUnavailableReasonV07(caster, skill);
    if (unavailable) {
      this.activeSkillV07 = null;
      scene.statusMessage = unavailable;
      scene.refreshAll();
      return;
    }

    if (!target) {
      scene.statusMessage = 'Kỹ năng cần chọn một đơn vị làm mục tiêu.';
      scene.refreshAll();
      return;
    }

    const distance = this.distanceV07(caster.position, target.position);
    const targetTeamValid =
      skill.target === 'ke-dich' ? target.team !== caster.team : target.team === caster.team;
    const rangeValid = distance >= skill.minRange && distance <= skill.maxRange;

    if (!targetTeamValid || !rangeValid) {
      scene.statusMessage =
        skill.target === 'ke-dich'
          ? `${skill.name} chỉ nhắm quân địch trong tầm ${skill.minRange}–${skill.maxRange}.`
          : `${skill.name} chỉ nhắm đồng minh trong tầm 0–${skill.maxRange}.`;
      scene.refreshAll();
      return;
    }

    if (skill.id === 'hoa-cau') {
      this.castFireballV07(caster, target, skill);
    } else {
      this.castHealingV07(caster, target, skill);
    }
  }

  private castFireballV07(
    caster: CombatUnitState,
    target: CombatUnitState,
    skill: SkillDefinition,
  ): void {
    const scene = this as any;
    const mana = this.manaV07.get(caster.id);
    if (!mana) return;

    mana.current -= skill.manaCost;
    const variance = Phaser.Math.Between(-3, 3);
    const damage = Math.max(
      12,
      skill.power + variance - Math.floor(target.resistance * 0.65),
    );
    target.hp = Math.max(0, target.hp - damage);
    caster.hasActed = true;
    this.activeSkillV07 = null;

    scene.spawnDamageText(target.position, damage);
    scene.updateHealthBar(target);

    if (target.hp <= 0) {
      scene.statusMessage = `${caster.name} dùng ${skill.name}, gây ${damage} sát thương phép và hạ ${target.name}.`;
      scene.removeUnit(target);
    } else {
      this.applyStatusV07(target, 'thieu-dot');
      scene.statusMessage = `${caster.name} dùng ${skill.name}, gây ${damage} sát thương phép. ${target.name} bị Thiêu Đốt 2 lượt.`;
    }

    if (!caster.hasMoved) {
      scene.reachableTiles = scene.calculateMovementFor(caster);
    }
    scene.refreshAll();
  }

  private castHealingV07(
    caster: CombatUnitState,
    target: CombatUnitState,
    skill: SkillDefinition,
  ): void {
    const scene = this as any;
    const mana = this.manaV07.get(caster.id);
    if (!mana) return;

    mana.current -= skill.manaCost;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + skill.power);
    const healed = target.hp - before;
    caster.hasActed = true;
    this.activeSkillV07 = null;
    this.applyStatusV07(target, 'hoi-phuc');
    scene.updateHealthBar(target);

    scene.statusMessage =
      `${caster.name} dùng ${skill.name}: hồi ${healed} HP cho ${target.name} và ban Hồi Phục 2 lượt.`;

    if (!caster.hasMoved) {
      scene.reachableTiles = scene.calculateMovementFor(caster);
    }
    scene.refreshAll();
  }

  private getSkillUnavailableReasonV07(
    caster: CombatUnitState,
    skill: SkillDefinition,
  ): string | null {
    const scene = this as any;
    if (scene.turnManager.getPhase() !== 'chien-dau') {
      return 'Kỹ năng chỉ dùng được sau giai đoạn triệu hồi mở đầu.';
    }
    if (caster.team !== scene.turnManager.getActiveTeam()) {
      return 'Chỉ quân của phe đang hành động mới có thể dùng kỹ năng.';
    }
    if (caster.hasActed) {
      return `${caster.name} đã dùng hành động trong lượt này.`;
    }

    const mana = this.manaV07.get(caster.id);
    if (!mana || mana.current < skill.manaCost) {
      return `Không đủ Mana để dùng ${skill.name} (cần ${skill.manaCost}).`;
    }
    return null;
  }

  private processStartOfTurnV07(team: TeamId): void {
    const scene = this as any;
    const waterCount = this.getOwnedWaterCountV07(team);
    const extraFromWater = waterCount * WATER_MANA_REGEN_PER_POINT;
    let manaRecovered = 0;
    let statusDamage = 0;
    let statusHealing = 0;

    for (const unit of [...this.unitsV07()]) {
      if (unit.team !== team) continue;

      const mana = this.manaV07.get(unit.id);
      const profile = getManaProfile(unit.classId);
      if (mana && profile) {
        const before = mana.current;
        mana.current = Math.min(mana.max, mana.current + profile.turnRegen + extraFromWater);
        manaRecovered += mana.current - before;
      }

      const statuses = this.statusesV07.get(unit.id);
      if (!statuses || statuses.length === 0) continue;

      const nextStatuses: StatusEffectState[] = [];
      for (const status of statuses) {
        const definition = STATUS_EFFECT_DEFINITIONS[status.id];

        if (status.id === 'thieu-dot') {
          const before = unit.hp;
          unit.hp = Math.max(0, unit.hp - definition.tickPower);
          statusDamage += before - unit.hp;
        } else {
          const before = unit.hp;
          unit.hp = Math.min(unit.maxHp, unit.hp + definition.tickPower);
          statusHealing += unit.hp - before;
        }

        status.remainingTurns -= 1;
        if (status.remainingTurns > 0) nextStatuses.push(status);
      }

      scene.updateHealthBar(unit);

      if (unit.hp <= 0) {
        this.statusesV07.delete(unit.id);
        this.manaV07.delete(unit.id);
        scene.removeUnit(unit);
      } else if (nextStatuses.length > 0) {
        this.statusesV07.set(unit.id, nextStatuses);
      } else {
        this.statusesV07.delete(unit.id);
      }
    }

    const manaText = manaRecovered > 0 ? ` • +${manaRecovered} Mana toàn phe` : '';
    const waterText = waterCount > 0 ? ` (Nguồn Nước +${extraFromWater}/quân)` : '';
    const burnText = statusDamage > 0 ? ` • Thiêu Đốt -${statusDamage} HP` : '';
    const healText = statusHealing > 0 ? ` • Hồi Phục +${statusHealing} HP` : '';

    if (manaText || burnText || healText) {
      scene.statusMessage =
        `${scene.statusMessage}\nKỹ năng ${TEAM_NAMES[team]}:${manaText}${waterText}${burnText}${healText}`;
    }
  }

  private applyStatusV07(unit: CombatUnitState, statusId: StatusEffectId): void {
    const definition = STATUS_EFFECT_DEFINITIONS[statusId];
    const statuses = this.statusesV07.get(unit.id) ?? [];
    const existing = statuses.find((status) => status.id === statusId);

    if (existing) {
      existing.remainingTurns = definition.durationTurns;
    } else {
      statuses.push({
        id: statusId,
        remainingTurns: definition.durationTurns,
      });
    }
    this.statusesV07.set(unit.id, statuses);
  }

  private refreshSkillUiV07(): void {
    if (!this.skillButtonV07 || !this.passiveTextV07) return;

    for (const unit of this.unitsV07()) this.initializeUnitManaV07(unit);

    const selected = this.getSelectedUnitV07();
    const skill = selected ? getActiveSkillForClass(selected.classId) : null;
    const passive = selected ? PASSIVE_DEFINITIONS[selected.classId] ?? null : null;
    const scene = this as any;

    if (selected && skill) {
      const mana = this.manaV07.get(selected.id);
      const unavailable = this.getSkillUnavailableReasonV07(selected, skill);
      const active = this.activeSkillV07 === skill.id;

      if (active) {
        this.skillButtonV07.button
          .setFillStyle(0x7c2d12, 1)
          .setStrokeStyle(2, 0xfbbf24, 1);
        this.skillButtonV07.label
          .setText(`HỦY • ${skill.name.toUpperCase()}`)
          .setColor('#ffffff');
      } else if (!unavailable) {
        this.skillButtonV07.button
          .setFillStyle(0x4c1d95, 1)
          .setStrokeStyle(2, 0xc4b5fd, 1);
        this.skillButtonV07.label
          .setText(`${skill.name.toUpperCase()} • ${skill.manaCost} MANA`)
          .setColor('#ffffff');
      } else {
        this.skillButtonV07.button
          .setFillStyle(0x1f2937, 1)
          .setStrokeStyle(1, 0x475569, 0.8);
        this.skillButtonV07.label
          .setText(`${skill.name.toUpperCase()} • ${skill.manaCost} MANA`)
          .setColor('#64748b');
      }

      this.passiveTextV07
        .setText(passive ? `NỘI TẠI\n${passive.name}` : 'NỘI TẠI: —')
        .setColor(passive ? '#c4b5fd' : '#64748b');

      const selectionText: Phaser.GameObjects.Text | undefined = scene.selectionText;
      if (selectionText && mana) {
        const statuses = this.getStatusLabelV07(selected.id);
        selectionText.setText(
          `${selectionText.text}\nMana: ${mana.current} / ${mana.max}\nKỹ năng: ${skill.name} • ${skill.manaCost} Mana${statuses ? `\nHiệu ứng: ${statuses}` : ''}`,
        );
      }
    } else {
      this.activeSkillV07 = null;
      this.skillButtonV07.button
        .setFillStyle(0x1f2937, 1)
        .setStrokeStyle(1, 0x475569, 0.8);
      this.skillButtonV07.label
        .setText('KỸ NĂNG • CHỌN PHÁP SƯ / TRỊ LIỆU SƯ')
        .setColor('#64748b');
      this.passiveTextV07.setText('NỘI TẠI: —').setColor('#64748b');
    }

    this.refreshSkillTargetHighlightsV07(selected, skill);
  }

  private refreshSkillTargetHighlightsV07(
    caster: CombatUnitState | null,
    skill: SkillDefinition | null,
  ): void {
    if (!caster || !skill || this.activeSkillV07 !== skill.id) return;

    const unitViews: Map<string, any> = (this as any).unitViews;
    for (const target of this.unitsV07()) {
      const distance = this.distanceV07(caster.position, target.position);
      const teamValid =
        skill.target === 'ke-dich' ? target.team !== caster.team : target.team === caster.team;
      const rangeValid = distance >= skill.minRange && distance <= skill.maxRange;
      if (!teamValid || !rangeValid) continue;

      unitViews
        .get(target.id)
        ?.circle.setStrokeStyle(5, skill.target === 'ke-dich' ? 0xf97316 : 0x22d3ee, 1);
    }
  }

  private initializeExistingManaV07(): void {
    for (const unit of this.unitsV07()) this.initializeUnitManaV07(unit);
  }

  private initializeUnitManaV07(unit: CombatUnitState): void {
    if (this.manaV07.has(unit.id)) return;
    const profile = getManaProfile(unit.classId);
    if (!profile) return;

    this.manaV07.set(unit.id, {
      current: profile.startingMana,
      max: profile.maxMana,
    });
  }

  private upgradeWaterDescriptionV07(): void {
    const territoryManager = (this as any).territoryManagerV05;
    const points = territoryManager?.getAllPoints?.() ?? [];
    for (const point of points) {
      if (point.type !== 'nuoc') continue;
      point.effectText =
        `+1 Điểm Điều Binh/lượt • Hồi 4 HP đầu lượt • +${WATER_MANA_REGEN_PER_POINT} Mana cho mỗi Pháp Sư/Trị Liệu Sư đầu lượt`;
    }
  }

  private getOwnedWaterCountV07(team: TeamId): number {
    const territoryManager = (this as any).territoryManagerV05;
    const points = territoryManager?.getOwnedPoints?.(team) ?? [];
    return points.filter((point: { type: string }) => point.type === 'nuoc').length;
  }

  private getStatusLabelV07(unitId: string): string {
    const statuses = this.statusesV07.get(unitId) ?? [];
    return statuses
      .map((status) => {
        const definition = STATUS_EFFECT_DEFINITIONS[status.id];
        return `${definition.name}(${status.remainingTurns})`;
      })
      .join(', ');
  }

  private getSelectedUnitV07(): CombatUnitState | null {
    const id: string | null = (this as any).selectedUnitId;
    if (!id) return null;
    return this.unitsV07().find((unit) => unit.id === id) ?? null;
  }

  private findUnitAtV07(position: GridPosition): CombatUnitState | null {
    return (
      this.unitsV07().find(
        (unit) => unit.position.x === position.x && unit.position.y === position.y,
      ) ?? null
    );
  }

  private unitsV07(): CombatUnitState[] {
    return (this as any).units as CombatUnitState[];
  }

  private distanceV07(a: GridPosition, b: GridPosition): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
}
