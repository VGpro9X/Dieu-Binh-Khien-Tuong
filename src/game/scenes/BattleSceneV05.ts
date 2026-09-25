import * as Phaser from 'phaser';
import { BattleScene as BattleSceneV04 } from './BattleScene';
import { TerritoryManager } from '../core/TerritoryManager';
import type {
  CombatUnitState,
  GridPosition,
  StrategicPointDefinition,
  StrategicPointType,
  TeamId,
  UnitClassId,
} from '../core/types';
import {
  BOARD_CONFIG,
  STRATEGIC_POINTS,
  UNIT_DEFINITIONS,
  getSpawnTilesForTeam,
  getTerrainMovementCost,
  isFortressTile,
} from '../data/v05';
import { positionKey } from '../rules/Pathfinder';

interface StrategicView {
  base: Phaser.GameObjects.Rectangle;
  ownerDot: Phaser.GameObjects.Arc;
}

const TEAM_COLORS: Record<TeamId, number> = {
  xanh: 0x38bdf8,
  do: 0xfb7185,
};

const TEAM_NAMES: Record<TeamId, string> = {
  xanh: 'Phe Xanh',
  do: 'Phe Đỏ',
};

const STRATEGIC_COLORS: Record<StrategicPointType, number> = {
  nha: 0xd6a85f,
  nuoc: 0x38bdf8,
  rung: 0x4ade80,
  nui: 0xa8a29e,
  'mo-vang': 0xfacc15,
  'mo-bac': 0xcbd5e1,
  'mo-sat': 0xf97316,
  'thanh-tri': 0xa78bfa,
};

export class BattleScene extends BattleSceneV04 {
  private readonly territoryManagerV05: TerritoryManager;
  private readonly strategicViewsV05 = new Map<string, StrategicView>();

  constructor(strategicPoints: StrategicPointDefinition[] = STRATEGIC_POINTS) {
    super();
    this.territoryManagerV05 = new TerritoryManager(strategicPoints);
  }

  private territoryInfoTextV05!: Phaser.GameObjects.Text;
  private captureButtonV05!: Phaser.GameObjects.Rectangle;
  private captureLabelV05!: Phaser.GameObjects.Text;

  private originalRefreshAllV05!: () => void;
  private originalRefreshBoardV05!: () => void;
  private originalEndTurnV05!: () => void;
  private originalSummonUnitAtV05!: (position: GridPosition) => void;

  create(): void {
    super.create();
    this.patchV04ForTerritory();
    this.drawV05Header();
    this.drawStrategicPointsV05();
    this.drawTerritoryControlsV05();
    this.applyTerritoryCombatBuffsV05();
    (this as any).refreshAll();
  }

  private patchV04ForTerritory(): void {
    const scene = this as any;

    this.originalRefreshAllV05 = scene.refreshAll.bind(this);
    this.originalRefreshBoardV05 = scene.refreshBoardSelection.bind(this);
    this.originalEndTurnV05 = scene.endTurn.bind(this);
    this.originalSummonUnitAtV05 = scene.summonUnitAt.bind(this);

    scene.refreshBoardSelection = () => {
      this.originalRefreshBoardV05();
      this.refreshCapturedFortressSpawnHighlightsV05();
    };

    scene.refreshAll = () => {
      this.originalRefreshAllV05();
      this.refreshTerritoryUiV05();
    };

    scene.getValidSpawnTiles = (classId: UnitClassId) => this.getValidSpawnTilesV05(classId);

    scene.summonUnitAt = (position: GridPosition) => {
      const before = this.unitsV05().length;
      this.originalSummonUnitAtV05(position);
      if (this.unitsV05().length > before) {
        this.applyTerritoryCombatBuffsV05();
        this.refreshTerritoryUiV05();
      }
    };

    scene.endTurn = () => this.endTurnWithTerritoryV05();
  }

  private drawV05Header(): void {
    this.add.rectangle(300, 78, 510, 28, 0x0b1220, 1).setDepth(50);
    this.add
      .text(49, 70, 'V0.5 • Chiếm đóng & tài nguyên lãnh thổ', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#94a3b8',
      })
      .setDepth(51);
  }

  private drawStrategicPointsV05(): void {
    for (const point of this.territoryManagerV05.getAllPoints()) {
      const center = this.gridToScreenV05(point.position);
      const color = STRATEGIC_COLORS[point.type];
      const base = this.add
        .rectangle(0, 0, 42, 42, color, 0.22)
        .setStrokeStyle(2, 0x94a3b8, 0.8);
      const label = this.add
        .text(0, 15, point.shortLabel, {
          fontFamily: 'ui-monospace, monospace',
          fontSize: point.shortLabel.length > 1 ? '9px' : '11px',
          fontStyle: 'bold',
          color: '#ffffff',
          stroke: '#0f172a',
          strokeThickness: 3,
        })
        .setOrigin(0.5);
      const ownerDot = this.add.circle(14, -14, 4, 0x94a3b8, 1).setVisible(false);
      const container = this.add
        .container(center.x, center.y, [base, label, ownerDot])
        .setDepth(3)
        .setSize(44, 44)
        .setInteractive({ useHandCursor: true });

      container.on('pointerdown', () => (this as any).handleTileClick(point.position));
      container.on('pointerover', () => (this as any).handleTileHover(point.position));
      container.on('pointerout', () => (this as any).handleTileOut(point.position));
      this.strategicViewsV05.set(point.id, { base, ownerDot });
    }
  }

  private drawTerritoryControlsV05(): void {
    this.territoryInfoTextV05 = this.add.text(48, 658, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '11px',
      color: '#cbd5e1',
      lineSpacing: 2,
      wordWrap: { width: 430 },
    });

    this.captureButtonV05 = this.add
      .rectangle(636, 680, 280, 34, 0x1f2937, 1)
      .setStrokeStyle(1, 0x475569, 0.8)
      .setInteractive({ useHandCursor: true });
    this.captureLabelV05 = this.add
      .text(636, 680, 'CHIẾM ĐÓNG • ĐỨNG TRÊN ĐIỂM', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setDepth(this.captureButtonV05.depth + 1);

    this.captureButtonV05.on('pointerdown', () => this.captureSelectedPointV05());
  }

  private captureSelectedPointV05(): void {
    const turnManager = (this as any).turnManager;
    const selected = this.getSelectedUnitV05();

    if (turnManager.getPhase() !== 'chien-dau') return;
    if (!selected || selected.team !== turnManager.getActiveTeam()) {
      (this as any).statusMessage = 'Hãy chọn quân của phe đang hành động và đứng trên một điểm chiến lược.';
      (this as any).refreshAll();
      return;
    }
    if (selected.hasActed) {
      (this as any).statusMessage = `${selected.name} đã dùng hành động trong lượt này.`;
      (this as any).refreshAll();
      return;
    }

    const point = this.territoryManagerV05.getPointAt(selected.position);
    if (!point) {
      (this as any).statusMessage = 'Đơn vị phải đứng trực tiếp trên một điểm chiến lược để chiếm đóng.';
      (this as any).refreshAll();
      return;
    }
    if (point.owner === selected.team) {
      (this as any).statusMessage = `${point.name} đã thuộc ${TEAM_NAMES[selected.team]}.`;
      (this as any).refreshAll();
      return;
    }

    const previousOwner = point.owner;
    this.territoryManagerV05.capture(point.id, selected.team);
    selected.hasActed = true;
    this.applyTerritoryCombatBuffsV05();

    if (!selected.hasMoved) {
      (this as any).reachableTiles = (this as any).calculateMovementFor(selected);
    }

    (this as any).statusMessage = previousOwner
      ? `${selected.name} chiếm ${point.name} từ ${TEAM_NAMES[previousOwner]}. Buff và thu nhập đổi chủ ngay.`
      : `${selected.name} chiếm ${point.name}. ${point.effectText}.`;
    (this as any).refreshAll();
  }

  private endTurnWithTerritoryV05(): void {
    const turnManager = (this as any).turnManager;
    const phaseBefore = turnManager.getPhase();
    const teamBefore = turnManager.getActiveTeam();

    this.originalEndTurnV05();

    if (phaseBefore !== 'chien-dau') return;
    const nextTeam: TeamId = turnManager.getActiveTeam();
    if (nextTeam === teamBefore) return;

    const summary = this.territoryManagerV05.getSummary(nextTeam);
    const economy = (this as any).economyManager;
    const bonusIncome = economy.grantBonusIncome(nextTeam, summary.incomeBonus);
    const healed = this.healTeamFromTerritoryV05(nextTeam, summary.healPerTurn);
    const totalIncome = economy.getBaseIncome() + bonusIncome;
    const healText = healed > 0 ? ` • hồi tổng ${healed} HP` : '';

    (this as any).statusMessage = `Đến lượt ${TEAM_NAMES[nextTeam]}. Nhận +${totalIncome} Điểm Điều Binh${healText}.`;
    (this as any).refreshAll();
  }

  private healTeamFromTerritoryV05(team: TeamId, healPerTurn: number): number {
    if (healPerTurn <= 0) return 0;
    let healed = 0;
    const unitViews: Map<string, any> = (this as any).unitViews;

    for (const unit of this.unitsV05()) {
      if (unit.team !== team || unit.hp >= unit.maxHp) continue;
      const before = unit.hp;
      unit.hp = Math.min(unit.maxHp, unit.hp + healPerTurn);
      healed += unit.hp - before;
      const view = unitViews.get(unit.id);
      if (view) (this as any).updateHealthBar(unit);
    }
    return healed;
  }

  private applyTerritoryCombatBuffsV05(): void {
    for (const unit of this.unitsV05()) {
      const base = UNIT_DEFINITIONS[unit.classId];
      const summary = this.territoryManagerV05.getSummary(unit.team);
      unit.armor = base.armor + summary.armorBonus;
      unit.resistance = base.resistance + summary.resistanceBonus;
    }
  }

  private getValidSpawnTilesV05(classId: UnitClassId): GridPosition[] {
    const activeTeam: TeamId = (this as any).turnManager.getActiveTeam();
    const definition = UNIT_DEFINITIONS[classId];

    return this.getAllSpawnTilesForTeamV05(activeTeam).filter((position) => {
      if (this.findUnitAtV05(position)) return false;
      if (isFortressTile(position)) return false;
      return getTerrainMovementCost(position.x, position.y, definition.movementType) !== null;
    });
  }

  private getAllSpawnTilesForTeamV05(team: TeamId): GridPosition[] {
    const unique = new Map<string, GridPosition>();
    for (const position of getSpawnTilesForTeam(team)) {
      unique.set(positionKey(position), { ...position });
    }

    for (const point of this.territoryManagerV05.getOwnedPoints(team)) {
      if (!point.enablesSummoning) continue;
      for (const position of this.getAdjacentTilesV05(point.position)) {
        if (!isFortressTile(position)) unique.set(positionKey(position), position);
      }
    }
    return [...unique.values()];
  }

  private getAdjacentTilesV05(center: GridPosition): GridPosition[] {
    const result: GridPosition[] = [];
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const position = { x: center.x + dx, y: center.y + dy };
        if (
          position.x >= 0 &&
          position.y >= 0 &&
          position.x < BOARD_CONFIG.columns &&
          position.y < BOARD_CONFIG.rows
        ) {
          result.push(position);
        }
      }
    }
    return result;
  }

  private refreshCapturedFortressSpawnHighlightsV05(): void {
    const pending: UnitClassId | null = (this as any).pendingSummonClass;
    if (!pending) return;

    const mainKeys = new Set(
      getSpawnTilesForTeam((this as any).turnManager.getActiveTeam()).map(positionKey),
    );
    const tileViews: Map<string, Phaser.GameObjects.Rectangle> = (this as any).tileViews;

    for (const position of this.getValidSpawnTilesV05(pending)) {
      if (mainKeys.has(positionKey(position))) continue;
      tileViews
        .get(positionKey(position))
        ?.setFillStyle(0x4c1d95, 1)
        .setStrokeStyle(3, 0xc4b5fd, 1);
    }
  }

  private refreshTerritoryUiV05(): void {
    if (!this.captureButtonV05 || !this.territoryInfoTextV05) return;

    this.refreshStrategicViewsV05();
    this.refreshCaptureButtonV05();
    this.refreshTerritoryInfoV05();
    this.refreshEconomyTextV05();
  }

  private refreshStrategicViewsV05(): void {
    for (const point of this.territoryManagerV05.getAllPoints()) {
      const view = this.strategicViewsV05.get(point.id);
      if (!view) continue;
      const ownerColor = point.owner ? TEAM_COLORS[point.owner] : 0x94a3b8;
      view.base.setStrokeStyle(point.owner ? 3 : 2, ownerColor, point.owner ? 1 : 0.8);
      view.base.setFillStyle(STRATEGIC_COLORS[point.type], point.owner ? 0.35 : 0.22);
      if (point.owner) view.ownerDot.setFillStyle(ownerColor, 1).setVisible(true);
      else view.ownerDot.setVisible(false);
    }
  }

  private refreshCaptureButtonV05(): void {
    const selected = this.getSelectedUnitV05();
    const activeTeam: TeamId = (this as any).turnManager.getActiveTeam();
    const point = selected ? this.territoryManagerV05.getPointAt(selected.position) : null;
    const canCapture = Boolean(
      (this as any).turnManager.getPhase() === 'chien-dau' &&
      selected &&
      selected.team === activeTeam &&
      !selected.hasActed &&
      point &&
      point.owner !== selected.team,
    );

    if (canCapture && point) {
      this.captureButtonV05.setFillStyle(0x0f766e, 1).setStrokeStyle(2, 0x5eead4, 1);
      this.captureLabelV05.setText(`CHIẾM ĐÓNG • ${point.name}`).setColor('#ffffff');
    } else if (selected && point?.owner === selected.team) {
      this.captureButtonV05.setFillStyle(0x1f2937, 1).setStrokeStyle(1, 0x475569, 0.8);
      this.captureLabelV05.setText(`ĐÃ KIỂM SOÁT • ${point.name}`).setColor('#94a3b8');
    } else {
      this.captureButtonV05.setFillStyle(0x1f2937, 1).setStrokeStyle(1, 0x475569, 0.7);
      this.captureLabelV05.setText('CHIẾM ĐÓNG • ĐỨNG TRÊN ĐIỂM').setColor('#64748b');
    }
  }

  private refreshTerritoryInfoV05(): void {
    const selected = this.getSelectedUnitV05();
    const selectedTile: GridPosition | null = (this as any).selectedTile;
    const point = selected
      ? this.territoryManagerV05.getPointAt(selected.position)
      : selectedTile
        ? this.territoryManagerV05.getPointAt(selectedTile)
        : null;

    if (point) {
      const owner = point.owner ? TEAM_NAMES[point.owner] : 'Trung lập';
      this.territoryInfoTextV05.setText(
        `${point.name} • ${owner} • +${point.income} Điểm/lượt\n${point.effectText}`,
      );
      return;
    }

    const activeTeam: TeamId = (this as any).turnManager.getActiveTeam();
    const summary = this.territoryManagerV05.getSummary(activeTeam);
    this.territoryInfoTextV05.setText(
      `Lãnh thổ ${TEAM_NAMES[activeTeam]}: ${summary.ownedCount} điểm • +${summary.incomeBonus} thu nhập • +${summary.armorBonus} Giáp • +${summary.resistanceBonus} Kháng • hồi ${summary.healPerTurn} HP/lượt`,
    );
  }

  private refreshEconomyTextV05(): void {
    const scene = this as any;
    const activeTeam: TeamId = scene.turnManager.getActiveTeam();
    const summary = this.territoryManagerV05.getSummary(activeTeam);
    const projected = scene.economyManager.getBaseIncome() + summary.incomeBonus;
    scene.economyText?.setText(
      `Điểm Điều Binh: ${scene.economyManager.getPoints(activeTeam)}\nThu nhập lượt: +${projected}\nLãnh thổ: ${summary.ownedCount}\nBuff: +${summary.armorBonus} Giáp / +${summary.resistanceBonus} Kháng`,
    );
  }

  private getSelectedUnitV05(): CombatUnitState | null {
    const id: string | null = (this as any).selectedUnitId;
    if (!id) return null;
    return this.unitsV05().find((unit) => unit.id === id) ?? null;
  }

  private findUnitAtV05(position: GridPosition): CombatUnitState | null {
    return (
      this.unitsV05().find(
        (unit) => unit.position.x === position.x && unit.position.y === position.y,
      ) ?? null
    );
  }

  private unitsV05(): CombatUnitState[] {
    return (this as any).units as CombatUnitState[];
  }

  private gridToScreenV05(position: GridPosition): Phaser.Math.Vector2 {
    const { tileSize, originX, originY } = BOARD_CONFIG;
    return new Phaser.Math.Vector2(
      originX + position.x * tileSize + tileSize / 2,
      originY + position.y * tileSize + tileSize / 2,
    );
  }
}
