import * as Phaser from 'phaser';
import { EconomyManager } from '../core/EconomyManager';
import { TurnManager } from '../core/TurnManager';
import type {
  CombatUnitState,
  FortressDefinition,
  GridPosition,
  TeamId,
  TerrainId,
  UnitClassId,
} from '../core/types';
import {
  BOARD_CONFIG,
  ECONOMY_CONFIG,
  INITIAL_UNITS,
  MAIN_FORTRESSES,
  SUMMON_ORDER,
  UNIT_DEFINITIONS,
  createSummonedUnit,
  getSpawnTilesForTeam,
  getTerrainAt,
  getTerrainMovementCost,
  isFortressTile,
} from '../data/v04';
import {
  buildPath,
  calculateReachable,
  positionKey,
  type MovementNode,
} from '../rules/Pathfinder';
import {
  getDamagePreview,
  isInAttackRange,
  rollDamage,
} from '../rules/Combat';

interface UnitView {
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  healthFill: Phaser.GameObjects.Rectangle;
}

interface SummonButtonView {
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

const TEAM_COLORS: Record<TeamId, number> = {
  xanh: 0x38bdf8,
  do: 0xfb7185,
};

const TEAM_DARK_COLORS: Record<TeamId, number> = {
  xanh: 0x164e63,
  do: 0x881337,
};

const TEAM_NAMES: Record<TeamId, string> = {
  xanh: 'Phe Xanh',
  do: 'Phe Đỏ',
};

const TERRAIN_COLORS: Record<TerrainId, [number, number]> = {
  'dong-co': [0x355441, 0x3d604a],
  rung: [0x173f35, 0x1d4a3d],
  'doi-da': [0x5b5144, 0x685b4b],
  'nuoc-can': [0x285979, 0x31698b],
};

export class BattleScene extends Phaser.Scene {
  private readonly turnManager = new TurnManager();
  private readonly economyManager = new EconomyManager(
    ECONOMY_CONFIG.startingPoints,
    ECONOMY_CONFIG.baseIncome,
  );
  private readonly units: CombatUnitState[] = INITIAL_UNITS.map((unit) => ({
    ...unit,
    position: { ...unit.position },
  }));

  private readonly tileViews = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly unitViews = new Map<string, UnitView>();
  private readonly summonButtons = new Map<UnitClassId, SummonButtonView>();

  private selectedTile: GridPosition | null = null;
  private selectedUnitId: string | null = null;
  private hoveredTile: GridPosition | null = null;
  private hoveredTargetId: string | null = null;
  private pendingSummonClass: UnitClassId | null = null;
  private reachableTiles = new Map<string, MovementNode>();
  private statusMessage = '';
  private isAnimating = false;
  private nextUnitSerial = 1;

  private turnText!: Phaser.GameObjects.Text;
  private economyText!: Phaser.GameObjects.Text;
  private selectionText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private summonInstructionText!: Phaser.GameObjects.Text;
  private endTurnButton!: Phaser.GameObjects.Rectangle;
  private endTurnLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1220');
    this.drawHeader();
    this.drawBoard();
    this.drawFortresses();
    this.drawUnits();
    this.drawSidePanel();
    this.refreshAll();
  }

  private drawHeader(): void {
    this.add.text(48, 30, 'ĐIỀU BINH KHIỂN TƯỚNG', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#f8fafc',
    });

    this.add.text(49, 70, 'V0.4 • Điểm Điều Binh & Triệu Hồi', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#94a3b8',
    });
  }

  private drawBoard(): void {
    const { columns, rows, tileSize, originX, originY } = BOARD_CONFIG;
    const boardWidth = columns * tileSize;
    const boardHeight = rows * tileSize;

    this.add
      .rectangle(
        originX + boardWidth / 2,
        originY + boardHeight / 2,
        boardWidth + 18,
        boardHeight + 18,
        0x111827,
        1,
      )
      .setStrokeStyle(2, 0x475569, 1);

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const position = { x, y };
        const center = this.gridToScreen(position);
        const terrain = getTerrainAt(x, y);
        const tile = this.add
          .rectangle(
            center.x,
            center.y,
            tileSize - 2,
            tileSize - 2,
            this.getBaseTileColor(position),
            1,
          )
          .setStrokeStyle(1, 0x0f172a, 0.9)
          .setInteractive({ useHandCursor: true });

        tile.on('pointerdown', () => this.handleTileClick(position));
        tile.on('pointerover', () => this.handleTileHover(position));
        tile.on('pointerout', () => this.handleTileOut(position));
        this.tileViews.set(this.tileKey(x, y), tile);

        this.add
          .text(center.x - tileSize / 2 + 5, center.y - tileSize / 2 + 3, `${x},${y}`, {
            fontFamily: 'ui-monospace, monospace',
            fontSize: '9px',
            color: '#ffffff',
          })
          .setAlpha(0.16);

        if (terrain.shortLabel) {
          this.add
            .text(center.x + tileSize / 2 - 7, center.y + tileSize / 2 - 5, terrain.shortLabel, {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              fontStyle: 'bold',
              color: '#ffffff',
            })
            .setOrigin(1, 1)
            .setAlpha(0.38);
        }

        const spawnOwner = this.getSpawnOwner(position);
        if (spawnOwner) {
          this.add
            .circle(
              center.x - tileSize / 2 + 8,
              center.y + tileSize / 2 - 8,
              3,
              TEAM_COLORS[spawnOwner],
              0.7,
            )
            .setDepth(2);
        }
      }
    }

    const middleX = originX + boardWidth / 2;
    this.add.rectangle(middleX, originY + boardHeight / 2, 3, boardHeight, 0xffffff, 0.08);

    this.add.text(originX + 8, originY - 28, 'Phe Xanh', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#7dd3fc',
    });

    this.add
      .text(originX + boardWidth - 8, originY - 28, 'Phe Đỏ', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fda4af',
      })
      .setOrigin(1, 0);
  }

  private drawFortresses(): void {
    for (const fortress of Object.values(MAIN_FORTRESSES)) {
      const center = this.gridToScreen(fortress.position);
      const base = this.add
        .rectangle(0, 0, 40, 40, TEAM_DARK_COLORS[fortress.team], 1)
        .setStrokeStyle(3, TEAM_COLORS[fortress.team], 0.95);
      const roof = this.add.rectangle(0, -13, 30, 7, TEAM_COLORS[fortress.team], 0.85);
      const label = this.add
        .text(0, 4, 'THÀNH', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#ffffff',
        })
        .setOrigin(0.5);

      this.add.container(center.x, center.y, [base, roof, label]).setDepth(4);
    }
  }

  private drawUnits(): void {
    for (const unit of this.units) {
      this.createUnitView(unit);
    }
  }

  private createUnitView(unit: CombatUnitState): void {
    const center = this.gridToScreen(unit.position);
    const circle = this.add
      .circle(0, 0, 18, TEAM_COLORS[unit.team], 1)
      .setStrokeStyle(3, 0xf8fafc, 0.55);

    const label = this.add
      .text(0, 0, unit.shortLabel, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#07111f',
      })
      .setOrigin(0.5);

    const healthBack = this.add.rectangle(0, 24, 40, 6, 0x020617, 0.95);
    const healthFill = this.add
      .rectangle(-19, 24, 38, 4, 0x22c55e, 1)
      .setOrigin(0, 0.5);

    const container = this.add
      .container(center.x, center.y, [circle, label, healthBack, healthFill])
      .setDepth(5)
      .setSize(44, 48)
      .setInteractive({ useHandCursor: true });

    container.on('pointerdown', () => this.handleTileClick(unit.position));
    container.on('pointerover', () => this.handleTileHover(unit.position));
    container.on('pointerout', () => this.handleTileOut(unit.position));

    this.unitViews.set(unit.id, { container, circle, label, healthFill });
    this.updateHealthBar(unit);
  }

  private drawSidePanel(): void {
    this.add
      .rectangle(1031, 382, 418, 604, 0x111827, 0.98)
      .setStrokeStyle(2, 0x334155, 1);

    this.add.text(842, 96, 'CHIẾN TRƯỜNG', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });

    this.turnText = this.add.text(842, 120, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#f8fafc',
      lineSpacing: 4,
    });

    this.economyText = this.add.text(1040, 122, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#fbbf24',
      lineSpacing: 5,
      wordWrap: { width: 180 },
    });

    this.add.rectangle(1030, 205, 360, 1, 0x334155, 1);

    this.add.text(842, 220, 'THÔNG TIN ĐANG CHỌN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });

    this.selectionText = this.add.text(842, 243, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#e2e8f0',
      lineSpacing: 2,
      wordWrap: { width: 350 },
    });

    this.hintText = this.add.text(842, 394, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      color: '#94a3b8',
      lineSpacing: 3,
      wordWrap: { width: 350 },
    });

    this.add.rectangle(1030, 472, 360, 1, 0x334155, 1);

    this.add.text(842, 482, 'TRIỆU HỒI QUÂN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#c4b5fd',
    });

    this.summonInstructionText = this.add.text(965, 482, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '10px',
      color: '#94a3b8',
      wordWrap: { width: 225 },
    });

    this.createSummonButtons();

    this.endTurnButton = this.add
      .rectangle(1030, 650, 340, 42, 0x2563eb, 1)
      .setStrokeStyle(2, 0x60a5fa, 0.8)
      .setInteractive({ useHandCursor: true });

    this.endTurnLabel = this.add
      .text(1030, 650, 'KẾT THÚC LƯỢT', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.endTurnButton.on('pointerdown', () => this.endTurn());
    this.endTurnLabel.setDepth(this.endTurnButton.depth + 1);
  }

  private createSummonButtons(): void {
    const xPositions = [930, 1120];
    const yPositions = [520, 557, 594];

    SUMMON_ORDER.forEach((classId, index) => {
      const definition = UNIT_DEFINITIONS[classId];
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = xPositions[column];
      const y = yPositions[row];

      const button = this.add
        .rectangle(x, y, 170, 30, 0x1e293b, 1)
        .setStrokeStyle(1, 0x475569, 1)
        .setInteractive({ useHandCursor: true });
      const label = this.add
        .text(x, y, `${definition.name} • ${definition.summonCost}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          color: '#e2e8f0',
        })
        .setOrigin(0.5);

      button.on('pointerdown', () => this.handleSummonButton(classId));
      this.summonButtons.set(classId, { button, label });
    });
  }

  private handleSummonButton(classId: UnitClassId): void {
    if (this.isAnimating) return;

    if (this.pendingSummonClass === classId) {
      this.pendingSummonClass = null;
      this.statusMessage = 'Đã hủy chế độ triệu hồi.';
      this.refreshAll();
      return;
    }

    const activeTeam = this.turnManager.getActiveTeam();
    const definition = UNIT_DEFINITIONS[classId];

    if (!this.economyManager.canAfford(activeTeam, definition.summonCost)) {
      this.statusMessage = `Không đủ Điểm Điều Binh để triệu hồi ${definition.name}.`;
      this.refreshAll();
      return;
    }

    if (this.getValidSpawnTiles(classId).length === 0) {
      this.statusMessage = `Không còn ô triệu hồi hợp lệ cho ${definition.name}.`;
      this.refreshAll();
      return;
    }

    this.pendingSummonClass = classId;
    this.selectedTile = null;
    this.selectedUnitId = null;
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.reachableTiles.clear();
    this.statusMessage = `Đã chọn ${definition.name}. Bấm một ô triệu hồi đang sáng quanh Thành Chính.`;
    this.refreshAll();
  }

  private handleTileClick(position: GridPosition): void {
    if (this.isAnimating) return;

    const clickedUnit = this.findUnitAt(position);

    if (this.pendingSummonClass) {
      if (clickedUnit) {
        this.pendingSummonClass = null;
        this.selectUnit(clickedUnit);
        return;
      }

      if (this.canSummonAt(this.pendingSummonClass, position)) {
        this.summonUnitAt(position);
        return;
      }

      this.statusMessage = 'Ô này không phải ô triệu hồi hợp lệ hoặc đang bị chiếm.';
      this.refreshAll();
      return;
    }

    if (this.turnManager.getPhase() !== 'chien-dau') {
      if (clickedUnit) {
        this.selectUnit(clickedUnit);
      } else {
        this.selectTile(position);
      }
      this.statusMessage = 'Giai đoạn mở đầu: hãy chọn một loại quân và triệu hồi đúng 1 đơn vị.';
      this.refreshAll();
      return;
    }

    const selectedUnit = this.getSelectedUnit();
    const activeTeam = this.turnManager.getActiveTeam();

    if (
      clickedUnit &&
      selectedUnit &&
      selectedUnit.team === activeTeam &&
      clickedUnit.team !== activeTeam &&
      this.canAttackTarget(selectedUnit, clickedUnit)
    ) {
      this.attackUnit(selectedUnit, clickedUnit);
      return;
    }

    if (clickedUnit) {
      this.selectUnit(clickedUnit);
      return;
    }

    if (selectedUnit && selectedUnit.team === activeTeam && !selectedUnit.hasMoved) {
      const destinationKey = positionKey(position);
      const startKey = positionKey(selectedUnit.position);

      if (destinationKey !== startKey && this.reachableTiles.has(destinationKey)) {
        this.moveSelectedUnit(position);
        return;
      }
    }

    this.selectTile(position);
  }

  private handleTileHover(position: GridPosition): void {
    if (this.isAnimating || this.pendingSummonClass) return;
    if (this.turnManager.getPhase() !== 'chien-dau') return;

    const selectedUnit = this.getSelectedUnit();
    if (!selectedUnit || selectedUnit.team !== this.turnManager.getActiveTeam()) return;

    const target = this.findUnitAt(position);
    if (target && target.team !== selectedUnit.team && this.canAttackTarget(selectedUnit, target)) {
      this.hoveredTargetId = target.id;
      this.hoveredTile = null;
      this.refreshAll();
      return;
    }

    this.hoveredTargetId = null;

    if (selectedUnit.hasMoved) {
      this.refreshAll();
      return;
    }

    const key = positionKey(position);
    if (!this.reachableTiles.has(key) || key === positionKey(selectedUnit.position)) {
      this.refreshAll();
      return;
    }

    this.hoveredTile = { ...position };
    this.refreshAll();
  }

  private handleTileOut(position: GridPosition): void {
    if (this.pendingSummonClass) return;

    const target = this.findUnitAt(position);
    if (target?.id === this.hoveredTargetId) {
      this.hoveredTargetId = null;
    }

    if (this.hoveredTile?.x === position.x && this.hoveredTile?.y === position.y) {
      this.hoveredTile = null;
    }

    this.refreshAll();
  }

  private summonUnitAt(position: GridPosition): void {
    const classId = this.pendingSummonClass;
    if (!classId || !this.canSummonAt(classId, position)) return;

    const activeTeam = this.turnManager.getActiveTeam();
    const definition = UNIT_DEFINITIONS[classId];
    if (!this.economyManager.spend(activeTeam, definition.summonCost)) {
      this.statusMessage = 'Điểm Điều Binh đã thay đổi, không thể hoàn tất triệu hồi.';
      this.refreshAll();
      return;
    }

    const id = `${activeTeam}-${classId}-${this.nextUnitSerial}`;
    this.nextUnitSerial += 1;
    const unit = createSummonedUnit(id, classId, activeTeam, position);
    this.units.push(unit);
    this.createUnitView(unit);

    if (this.turnManager.getPhase() === 'trieu-hoi-mo-dau') {
      const summonedTeam = activeTeam;
      const battleStarted = this.turnManager.completeOpeningSummon();
      this.pendingSummonClass = null;
      this.clearSelection();

      if (battleStarted) {
        const income = this.economyManager.grantTurnIncome('xanh');
        this.statusMessage = `${TEAM_NAMES[summonedTeam]} đã triệu hồi ${definition.name}. Giai đoạn chiến đấu bắt đầu — Phe Xanh nhận +${income} Điểm Điều Binh.`;
      } else {
        this.statusMessage = `${TEAM_NAMES[summonedTeam]} đã triệu hồi ${definition.name}. Đến lượt Phe Đỏ triệu hồi 1 đơn vị mở đầu.`;
      }

      this.refreshAll();
      return;
    }

    this.statusMessage = `${TEAM_NAMES[activeTeam]} triệu hồi ${definition.name} (-${definition.summonCost}). Quân mới có thể hành động ngay.`;
    this.clearSelection();

    if (
      !this.economyManager.canAfford(activeTeam, definition.summonCost) ||
      this.getValidSpawnTiles(classId).length === 0
    ) {
      this.pendingSummonClass = null;
    }

    this.refreshAll();
  }

  private selectUnit(unit: CombatUnitState): void {
    this.selectedTile = { ...unit.position };
    this.selectedUnitId = unit.id;
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.pendingSummonClass = null;
    this.statusMessage = '';

    if (
      this.turnManager.getPhase() === 'chien-dau' &&
      unit.team === this.turnManager.getActiveTeam() &&
      !unit.hasMoved
    ) {
      this.reachableTiles = this.calculateMovementFor(unit);
    } else {
      this.reachableTiles.clear();
    }

    this.refreshAll();
  }

  private selectTile(position: GridPosition): void {
    this.selectedTile = { ...position };
    this.selectedUnitId = null;
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.reachableTiles.clear();
    this.statusMessage = '';
    this.refreshAll();
  }

  private clearSelection(): void {
    this.selectedTile = null;
    this.selectedUnitId = null;
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.reachableTiles.clear();
  }

  private calculateMovementFor(unit: CombatUnitState): Map<string, MovementNode> {
    return calculateReachable({
      start: unit.position,
      movementPoints: unit.movement,
      board: BOARD_CONFIG,
      getMovementCost: (position) =>
        getTerrainMovementCost(position.x, position.y, unit.movementType),
      isBlocked: (position) =>
        isFortressTile(position) ||
        this.units.some(
          (candidate) =>
            candidate.id !== unit.id &&
            candidate.position.x === position.x &&
            candidate.position.y === position.y,
        ),
    });
  }

  private moveSelectedUnit(destination: GridPosition): void {
    const unit = this.getSelectedUnit();
    if (!unit) return;

    const path = buildPath(this.reachableTiles, destination);
    if (path.length === 0) return;

    const view = this.unitViews.get(unit.id);
    if (!view) return;

    const movementCost = this.reachableTiles.get(positionKey(destination))?.cost ?? 0;

    unit.position = { ...destination };
    unit.hasMoved = true;
    this.selectedTile = { ...destination };
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.reachableTiles.clear();
    this.statusMessage = `Đang di chuyển • Chi phí ${movementCost}/${unit.movement} điểm.`;
    this.isAnimating = true;
    this.refreshAll();

    this.animatePath(view, path, 0, () => {
      this.isAnimating = false;
      this.statusMessage = unit.hasActed
        ? `${unit.name} đã di chuyển và đã dùng hành động.`
        : `${unit.name} đã di chuyển. Vẫn có thể tấn công nếu mục tiêu nằm trong tầm.`;
      this.refreshAll();
    });
  }

  private animatePath(
    view: UnitView,
    path: GridPosition[],
    pathIndex: number,
    onComplete: () => void,
  ): void {
    const nextPosition = path[pathIndex];
    if (!nextPosition) {
      onComplete();
      return;
    }

    const center = this.gridToScreen(nextPosition);
    this.tweens.add({
      targets: view.container,
      x: center.x,
      y: center.y,
      duration: 135,
      ease: 'Sine.easeInOut',
      onComplete: () => this.animatePath(view, path, pathIndex + 1, onComplete),
    });
  }

  private canAttackTarget(attacker: CombatUnitState, target: CombatUnitState): boolean {
    return (
      this.turnManager.getPhase() === 'chien-dau' &&
      attacker.team !== target.team &&
      !attacker.hasActed &&
      isInAttackRange(attacker, target.position)
    );
  }

  private attackUnit(attacker: CombatUnitState, target: CombatUnitState): void {
    if (!this.canAttackTarget(attacker, target)) return;

    const attackerView = this.unitViews.get(attacker.id);
    const targetView = this.unitViews.get(target.id);
    if (!attackerView || !targetView) return;

    const preview = getDamagePreview(attacker, target);
    const damage = rollDamage(preview);
    target.hp = Math.max(0, target.hp - damage);
    attacker.hasActed = true;
    this.hoveredTargetId = null;
    this.isAnimating = true;

    const damageTypeText = attacker.damageType === 'vat-ly' ? 'vật lý' : 'phép';
    this.statusMessage = `${attacker.name} gây ${damage} sát thương ${damageTypeText} lên ${target.name}.`;
    this.spawnDamageText(target.position, damage);

    this.tweens.add({
      targets: attackerView.container,
      scaleX: 1.16,
      scaleY: 1.16,
      duration: 90,
      yoyo: true,
      ease: 'Sine.easeOut',
    });

    targetView.circle.setFillStyle(0xffffff, 1);
    this.tweens.add({
      targets: targetView.container,
      alpha: 0.35,
      duration: 80,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        targetView.container.setAlpha(1);
        targetView.circle.setFillStyle(TEAM_COLORS[target.team], 1);
        this.updateHealthBar(target);

        if (target.hp <= 0) {
          this.statusMessage += ` ${target.name} đã bị tiêu diệt.`;
          this.removeUnit(target);
        }

        if (!attacker.hasMoved && this.units.some((unit) => unit.id === attacker.id)) {
          this.reachableTiles = this.calculateMovementFor(attacker);
        }

        this.isAnimating = false;
        this.refreshAll();
      },
    });
  }

  private spawnDamageText(position: GridPosition, damage: number): void {
    const center = this.gridToScreen(position);
    const text = this.add
      .text(center.x, center.y - 24, `-${damage}`, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#fecaca',
        stroke: '#7f1d1d',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);

    this.tweens.add({
      targets: text,
      y: center.y - 52,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private removeUnit(target: CombatUnitState): void {
    const index = this.units.findIndex((unit) => unit.id === target.id);
    if (index >= 0) this.units.splice(index, 1);

    const view = this.unitViews.get(target.id);
    view?.container.destroy(true);
    this.unitViews.delete(target.id);

    if (this.selectedUnitId === target.id) {
      this.clearSelection();
    }
  }

  private updateHealthBar(unit: CombatUnitState): void {
    const view = this.unitViews.get(unit.id);
    if (!view) return;

    const ratio = Phaser.Math.Clamp(unit.hp / unit.maxHp, 0, 1);
    view.healthFill.setDisplaySize(Math.max(1, 38 * ratio), 4);

    if (ratio > 0.6) {
      view.healthFill.setFillStyle(0x22c55e, 1);
    } else if (ratio > 0.3) {
      view.healthFill.setFillStyle(0xf59e0b, 1);
    } else {
      view.healthFill.setFillStyle(0xef4444, 1);
    }
  }

  private endTurn(): void {
    if (this.isAnimating) return;

    if (this.turnManager.getPhase() !== 'chien-dau') {
      this.statusMessage = 'Chưa thể kết thúc lượt: mỗi phe phải triệu hồi 1 đơn vị mở đầu trước.';
      this.refreshAll();
      return;
    }

    this.pendingSummonClass = null;
    this.turnManager.endTurn();
    const nextTeam = this.turnManager.getActiveTeam();

    for (const unit of this.units) {
      if (unit.team === nextTeam) {
        unit.hasMoved = false;
        unit.hasActed = false;
      }
    }

    const income = this.economyManager.grantTurnIncome(nextTeam);
    this.clearSelection();
    this.statusMessage = `Đến lượt ${TEAM_NAMES[nextTeam]}. Nhận +${income} Điểm Điều Binh.`;
    this.refreshAll();
  }

  private refreshAll(): void {
    this.refreshBoardSelection();
    this.refreshUnitSelection();
    this.refreshSummonButtons();
    this.refreshHud();
  }

  private refreshBoardSelection(): void {
    const { columns, rows } = BOARD_CONFIG;
    const isSummonMode = this.pendingSummonClass !== null;
    const previewPath = !isSummonMode && this.hoveredTile
      ? buildPath(this.reachableTiles, this.hoveredTile)
      : [];
    const previewKeys = new Set(previewPath.map((position) => positionKey(position)));
    const selectedUnit = this.getSelectedUnit();
    const selectedUnitKey = selectedUnit ? positionKey(selectedUnit.position) : null;
    const activeSelected =
      this.turnManager.getPhase() === 'chien-dau' &&
      selectedUnit?.team === this.turnManager.getActiveTeam()
        ? selectedUnit
        : null;
    const activeSpawnKeys = new Set(
      getSpawnTilesForTeam(this.turnManager.getActiveTeam()).map((position) => positionKey(position)),
    );
    const validSpawnKeys = new Set(
      this.pendingSummonClass
        ? this.getValidSpawnTiles(this.pendingSummonClass).map((position) => positionKey(position))
        : [],
    );

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const position = { x, y };
        const key = positionKey(position);
        const tile = this.tileViews.get(key);
        if (!tile) continue;

        const isSelected = this.selectedTile?.x === x && this.selectedTile?.y === y;
        const isReachable = !isSummonMode && this.reachableTiles.has(key) && key !== selectedUnitKey;
        const isPreviewPath = !isSummonMode && previewKeys.has(key);
        const isAttackRange = Boolean(
          !isSummonMode &&
            activeSelected &&
            !activeSelected.hasActed &&
            isInAttackRange(activeSelected, position),
        );
        const isHoveredTarget = !isSummonMode && this.hoveredTargetId
          ? this.findUnitAt(position)?.id === this.hoveredTargetId
          : false;
        const isActiveSpawn = activeSpawnKeys.has(key);
        const isValidSpawn = validSpawnKeys.has(key);

        let fillColor = this.getBaseTileColor(position);
        let strokeWidth = 1;
        let strokeColor = 0x0f172a;

        if (isSummonMode && isActiveSpawn) {
          fillColor = isValidSpawn ? 0x4c1d95 : 0x3f3f46;
          strokeWidth = isValidSpawn ? 3 : 2;
          strokeColor = isValidSpawn ? 0xc4b5fd : 0x71717a;
        } else {
          if (isAttackRange) {
            strokeWidth = 2;
            strokeColor = 0xfb7185;
          }

          if (isReachable) {
            fillColor = 0x155e75;
            if (!isAttackRange) {
              strokeWidth = 2;
              strokeColor = 0x38bdf8;
            }
          }

          if (isPreviewPath) {
            fillColor = 0x9a5b20;
            strokeWidth = 3;
            strokeColor = 0xfbbf24;
          }

          if (isHoveredTarget) {
            fillColor = 0x7f1d1d;
            strokeWidth = 4;
            strokeColor = 0xfca5a5;
          }
        }

        if (isSelected) {
          fillColor = 0x7c6427;
          strokeWidth = 3;
          strokeColor = 0xfde047;
        }

        tile.setFillStyle(fillColor, 1);
        tile.setStrokeStyle(strokeWidth, strokeColor, 0.95);
      }
    }
  }

  private refreshUnitSelection(): void {
    const activeTeam = this.turnManager.getActiveTeam();
    const selectedUnit = this.getSelectedUnit();
    const battlePhase = this.turnManager.getPhase() === 'chien-dau';

    for (const unit of this.units) {
      const view = this.unitViews.get(unit.id);
      if (!view) continue;

      const isSelected = unit.id === this.selectedUnitId;
      const isActive = unit.team === activeTeam;
      const isFullySpent = unit.hasMoved && unit.hasActed;
      const isAttackable = Boolean(
        battlePhase &&
          selectedUnit &&
          selectedUnit.team === activeTeam &&
          this.canAttackTarget(selectedUnit, unit),
      );
      const isHoveredTarget = unit.id === this.hoveredTargetId;

      let strokeWidth = isActive ? 3 : 2;
      let strokeColor = 0xf8fafc;
      let strokeAlpha = isActive ? 0.95 : 0.35;

      if (isAttackable) {
        strokeWidth = 4;
        strokeColor = 0xfb7185;
        strokeAlpha = 1;
      }

      if (isHoveredTarget) {
        strokeWidth = 5;
        strokeColor = 0xfca5a5;
        strokeAlpha = 1;
      }

      if (isSelected) {
        strokeWidth = 4;
        strokeColor = 0xfbbf24;
        strokeAlpha = 1;
      }

      view.circle.setStrokeStyle(strokeWidth, strokeColor, strokeAlpha);
      view.container.setAlpha(
        isActive && battlePhase ? (isFullySpent ? 0.58 : 1) : isActive ? 0.9 : 0.72,
      );
    }
  }

  private refreshSummonButtons(): void {
    const activeTeam = this.turnManager.getActiveTeam();
    const points = this.economyManager.getPoints(activeTeam);

    for (const classId of SUMMON_ORDER) {
      const definition = UNIT_DEFINITIONS[classId];
      const view = this.summonButtons.get(classId);
      if (!view) continue;

      const affordable = points >= definition.summonCost;
      const hasSpace = this.getValidSpawnTiles(classId).length > 0;
      const enabled = affordable && hasSpace && !this.isAnimating;
      const selected = this.pendingSummonClass === classId;

      if (selected) {
        view.button.setFillStyle(0x6d28d9, 1).setStrokeStyle(2, 0xfbbf24, 1);
        view.label.setColor('#ffffff').setAlpha(1);
      } else if (enabled) {
        view.button.setFillStyle(0x263449, 1).setStrokeStyle(1, 0x64748b, 1);
        view.label.setColor('#e2e8f0').setAlpha(1);
      } else {
        view.button.setFillStyle(0x111827, 1).setStrokeStyle(1, 0x334155, 0.7);
        view.label.setColor('#64748b').setAlpha(0.7);
      }
    }
  }

  private refreshHud(): void {
    const activeTeam = this.turnManager.getActiveTeam();
    const activeColor = activeTeam === 'xanh' ? '#7dd3fc' : '#fda4af';
    const phase = this.turnManager.getPhase();
    const points = this.economyManager.getPoints(activeTeam);

    if (phase === 'trieu-hoi-mo-dau') {
      this.turnText.setText(`TRIỆU HỒI MỞ ĐẦU\n${TEAM_NAMES[activeTeam]}`);
    } else {
      this.turnText.setText(`Vòng ${this.turnManager.getRound()}\n${TEAM_NAMES[activeTeam]}`);
    }
    this.turnText.setColor(activeColor);

    this.economyText.setText(
      `Điểm Điều Binh: ${points}\nThu nhập: +${this.economyManager.getBaseIncome()}/lượt`,
    );

    if (phase === 'trieu-hoi-mo-dau') {
      this.summonInstructionText.setText('Mỗi phe gọi đúng 1 quân mở đầu.');
      this.endTurnButton.setFillStyle(0x374151, 1).setStrokeStyle(1, 0x64748b, 0.6);
      this.endTurnLabel.setText('CHƯA THỂ KẾT THÚC LƯỢT').setColor('#94a3b8');
    } else {
      this.summonInstructionText.setText('Có thể gọi nhiều quân nếu còn điểm + ô trống.');
      this.endTurnButton.setFillStyle(0x2563eb, 1).setStrokeStyle(2, 0x60a5fa, 0.8);
      this.endTurnLabel.setText('KẾT THÚC LƯỢT').setColor('#ffffff');
    }

    if (this.pendingSummonClass) {
      const definition = UNIT_DEFINITIONS[this.pendingSummonClass];
      this.selectionText.setText(
        `Đang triệu hồi: ${definition.name}\nGiá: ${definition.summonCost} Điểm Điều Binh\nHP: ${definition.maxHp} • Di chuyển: ${definition.movement}\nVai trò: ${definition.role}`,
      );
      this.hintText.setText(
        this.withStatus('Bấm một ô màu tím quanh Thành Chính. Bấm lại nút quân để hủy, hoặc bấm một quân đang có để chuyển sang điều khiển.'),
      );
      return;
    }

    const selectedUnit = this.getSelectedUnit();
    if (selectedUnit) {
      const terrain = getTerrainAt(selectedUnit.position.x, selectedUnit.position.y);
      const canCommand = phase === 'chien-dau' && selectedUnit.team === activeTeam;
      const moveStatus = selectedUnit.hasMoved ? 'Đã dùng' : 'Sẵn sàng';
      const actionStatus = selectedUnit.hasActed ? 'Đã dùng' : 'Sẵn sàng';
      const attackLabel = selectedUnit.damageType === 'vat-ly'
        ? `${selectedUnit.attack} Vật lý`
        : `${selectedUnit.magicAttack} Phép`;
      const rangeLabel = selectedUnit.minAttackRange === selectedUnit.maxAttackRange
        ? `${selectedUnit.maxAttackRange}`
        : `${selectedUnit.minAttackRange}–${selectedUnit.maxAttackRange}`;

      this.selectionText.setText(
        `${selectedUnit.name} • ${TEAM_NAMES[selectedUnit.team]}\nVai trò: ${selectedUnit.role}\nHP: ${selectedUnit.hp} / ${selectedUnit.maxHp}\nCông: ${attackLabel}\nGiáp: ${selectedUnit.armor} • Kháng: ${selectedUnit.resistance}\nDi chuyển: ${selectedUnit.movement} • Tầm: ${rangeLabel}\nĐịa hình: ${terrain.name}\nDi chuyển: ${moveStatus} • Hành động: ${actionStatus}`,
      );

      const hoveredTarget = this.getHoveredTarget();
      if (hoveredTarget && canCommand && this.canAttackTarget(selectedUnit, hoveredTarget)) {
        const preview = getDamagePreview(selectedUnit, hoveredTarget);
        const remainingHigh = Math.max(0, hoveredTarget.hp - preview.min);
        const remainingLow = Math.max(0, hoveredTarget.hp - preview.max);
        const damageType = selectedUnit.damageType === 'vat-ly' ? 'vật lý' : 'phép';
        this.hintText.setText(
          this.withStatus(
            `Mục tiêu: ${hoveredTarget.name}\nSát thương dự kiến: ${preview.min}–${preview.max} (${damageType})\nHP sau đòn: ${remainingLow}–${remainingHigh}. Bấm mục tiêu để đánh.`,
          ),
        );
        return;
      }

      let hint = '';
      if (phase !== 'chien-dau') {
        hint = 'Giai đoạn mở đầu chưa cho phép điều quân. Hãy hoàn tất triệu hồi của cả hai phe.';
      } else if (!canCommand) {
        hint = 'Đây là quân đối phương. Có thể xem chỉ số nhưng không thể ra lệnh.';
      } else if (!selectedUnit.hasMoved && !selectedUnit.hasActed) {
        hint = 'Có thể di chuyển hoặc tấn công trước. Sau đó vẫn còn quyền còn lại nếu chưa dùng.';
      } else if (selectedUnit.hasMoved && !selectedUnit.hasActed) {
        hint = 'Đã di chuyển. Các mục tiêu có viền đỏ vẫn có thể bị tấn công.';
      } else if (!selectedUnit.hasMoved && selectedUnit.hasActed) {
        hint = 'Đã dùng hành động nhưng vẫn có thể di chuyển.';
      } else {
        hint = 'Đơn vị này đã dùng cả di chuyển và hành động trong lượt hiện tại.';
      }

      this.hintText.setText(this.withStatus(hint));
      return;
    }

    if (!this.selectedTile) {
      this.selectionText.setText(
        phase === 'trieu-hoi-mo-dau'
          ? 'Chưa có lệnh. Chọn một loại quân ở bảng Triệu Hồi.'
          : 'Chưa chọn ô hoặc đơn vị nào.',
      );
      this.hintText.setText(
        this.withStatus(
          phase === 'trieu-hoi-mo-dau'
            ? 'Mỗi phe có 8 Điểm Điều Binh ban đầu và chỉ gọi 1 quân trong giai đoạn mở đầu.'
            : 'Có thể tích Điểm Điều Binh hoặc tiêu hết trong cùng lượt để gọi nhiều quân phòng thủ/phản công.',
        ),
      );
      return;
    }

    const fortress = this.findFortressAt(this.selectedTile);
    if (fortress) {
      this.selectionText.setText(
        `Thành Chính • ${TEAM_NAMES[fortress.team]}\nVị trí: (${fortress.position.x}, ${fortress.position.y})\nVai trò V0.4: Trung tâm triệu hồi\nÔ triệu hồi xung quanh: ${fortress.spawnTiles.length}`,
      );
      this.hintText.setText(
        this.withStatus('Thành Chính hiện chặn di chuyển. HP Thành và điều kiện phá Thành sẽ được nối vào các mốc sau.'),
      );
      return;
    }

    const terrain = getTerrainAt(this.selectedTile.x, this.selectedTile.y);
    const infantryCost = terrain.movementCost['bo-binh'];
    const spawnOwner = this.getSpawnOwner(this.selectedTile);
    this.selectionText.setText(
      `Ô (${this.selectedTile.x}, ${this.selectedTile.y})\nĐịa hình: ${terrain.name}\nChi phí Bộ binh: ${infantryCost ?? 'Không thể đi'}\n${spawnOwner ? `Ô triệu hồi: ${TEAM_NAMES[spawnOwner]}` : 'Ô triệu hồi: Không'}`,
    );
    this.hintText.setText(this.withStatus('Chọn một đơn vị hoặc chọn quân trong bảng Triệu Hồi để tiếp tục.'));
  }

  private getValidSpawnTiles(classId: UnitClassId): GridPosition[] {
    const activeTeam = this.turnManager.getActiveTeam();
    const definition = UNIT_DEFINITIONS[classId];

    return getSpawnTilesForTeam(activeTeam).filter((position) => {
      if (this.findUnitAt(position)) return false;
      if (isFortressTile(position)) return false;
      return getTerrainMovementCost(position.x, position.y, definition.movementType) !== null;
    });
  }

  private canSummonAt(classId: UnitClassId, position: GridPosition): boolean {
    return this.getValidSpawnTiles(classId).some(
      (candidate) => candidate.x === position.x && candidate.y === position.y,
    );
  }

  private getSpawnOwner(position: GridPosition): TeamId | null {
    for (const fortress of Object.values(MAIN_FORTRESSES)) {
      const isSpawn = fortress.spawnTiles.some(
        (candidate) => candidate.x === position.x && candidate.y === position.y,
      );
      if (isSpawn) return fortress.team;
    }
    return null;
  }

  private findFortressAt(position: GridPosition): FortressDefinition | null {
    return (
      Object.values(MAIN_FORTRESSES).find(
        (fortress) =>
          fortress.position.x === position.x && fortress.position.y === position.y,
      ) ?? null
    );
  }

  private withStatus(hint: string): string {
    return this.statusMessage ? `${this.statusMessage}\n\n${hint}` : hint;
  }

  private getSelectedUnit(): CombatUnitState | null {
    if (!this.selectedUnitId) return null;
    return this.units.find((unit) => unit.id === this.selectedUnitId) ?? null;
  }

  private getHoveredTarget(): CombatUnitState | null {
    if (!this.hoveredTargetId) return null;
    return this.units.find((unit) => unit.id === this.hoveredTargetId) ?? null;
  }

  private findUnitAt(position: GridPosition): CombatUnitState | null {
    return (
      this.units.find(
        (unit) => unit.position.x === position.x && unit.position.y === position.y,
      ) ?? null
    );
  }

  private gridToScreen(position: GridPosition): Phaser.Math.Vector2 {
    const { tileSize, originX, originY } = BOARD_CONFIG;
    return new Phaser.Math.Vector2(
      originX + position.x * tileSize + tileSize / 2,
      originY + position.y * tileSize + tileSize / 2,
    );
  }

  private getBaseTileColor(position: GridPosition): number {
    const terrain = getTerrainAt(position.x, position.y);
    const checker = (position.x + position.y) % 2 === 0 ? 0 : 1;
    return TERRAIN_COLORS[terrain.id][checker];
  }

  private tileKey(x: number, y: number): string {
    return `${x}:${y}`;
  }
}
