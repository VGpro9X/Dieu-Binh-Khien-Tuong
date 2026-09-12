import * as Phaser from 'phaser';
import { TurnManager } from '../core/TurnManager';
import type {
  CombatUnitState,
  GridPosition,
  TeamId,
  TerrainId,
} from '../core/types';
import {
  BOARD_CONFIG,
  INITIAL_UNITS,
  getTerrainAt,
  getTerrainMovementCost,
} from '../data/v03';
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

const TEAM_COLORS: Record<TeamId, number> = {
  xanh: 0x38bdf8,
  do: 0xfb7185,
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
  private readonly units: CombatUnitState[] = INITIAL_UNITS.map((unit) => ({
    ...unit,
    position: { ...unit.position },
  }));

  private readonly tileViews = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly unitViews = new Map<string, UnitView>();

  private selectedTile: GridPosition | null = null;
  private selectedUnitId: string | null = null;
  private hoveredTile: GridPosition | null = null;
  private hoveredTargetId: string | null = null;
  private reachableTiles = new Map<string, MovementNode>();
  private statusMessage = '';
  private isAnimating = false;

  private turnText!: Phaser.GameObjects.Text;
  private selectionText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private endTurnButton!: Phaser.GameObjects.Rectangle;
  private endTurnLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('BattleScene');
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0b1220');
    this.drawHeader();
    this.drawBoard();
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

    this.add.text(49, 70, 'V0.3 • Combat core & 6 lớp quân', {
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
          .setAlpha(0.18);

        if (terrain.shortLabel) {
          this.add
            .text(center.x + tileSize / 2 - 7, center.y + tileSize / 2 - 5, terrain.shortLabel, {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              fontStyle: 'bold',
              color: '#ffffff',
            })
            .setOrigin(1, 1)
            .setAlpha(0.4);
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

    this.add.text(842, 100, 'CHIẾN TRƯỜNG', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });

    this.turnText = this.add.text(842, 130, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#f8fafc',
      lineSpacing: 8,
    });

    this.add.rectangle(1030, 220, 360, 1, 0x334155, 1);

    this.add.text(842, 241, 'THÔNG TIN ĐANG CHỌN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });

    this.selectionText = this.add.text(842, 267, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#e2e8f0',
      lineSpacing: 3,
      wordWrap: { width: 350 },
    });

    this.hintText = this.add.text(842, 455, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
      lineSpacing: 4,
      wordWrap: { width: 350 },
    });

    this.add.text(842, 535, 'V0.3 • CHỈ DẪN', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '12px',
      color: '#64748b',
    });

    this.add.text(
      842,
      557,
      '• Ô xanh: vùng di chuyển\n• Viền đỏ: tầm đánh / mục tiêu hợp lệ\n• Rê lên địch để xem sát thương dự kiến',
      {
        fontFamily: 'ui-monospace, monospace',
        fontSize: '12px',
        color: '#64748b',
        lineSpacing: 4,
      },
    );

    this.endTurnButton = this.add
      .rectangle(1030, 642, 340, 58, 0x2563eb, 1)
      .setStrokeStyle(2, 0x60a5fa, 0.8)
      .setInteractive({ useHandCursor: true });

    this.endTurnLabel = this.add
      .text(1030, 642, 'KẾT THÚC LƯỢT', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.endTurnButton.on('pointerover', () => this.endTurnButton.setFillStyle(0x1d4ed8, 1));
    this.endTurnButton.on('pointerout', () => this.endTurnButton.setFillStyle(0x2563eb, 1));
    this.endTurnButton.on('pointerdown', () => this.endTurn());
    this.endTurnLabel.setDepth(this.endTurnButton.depth + 1);
  }

  private handleTileClick(position: GridPosition): void {
    if (this.isAnimating) return;

    const clickedUnit = this.findUnitAt(position);
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
    if (this.isAnimating) return;

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
    const target = this.findUnitAt(position);
    if (target?.id === this.hoveredTargetId) {
      this.hoveredTargetId = null;
    }

    if (this.hoveredTile?.x === position.x && this.hoveredTile?.y === position.y) {
      this.hoveredTile = null;
    }

    this.refreshAll();
  }

  private selectUnit(unit: CombatUnitState): void {
    this.selectedTile = { ...unit.position };
    this.selectedUnitId = unit.id;
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.statusMessage = '';

    if (unit.team === this.turnManager.getActiveTeam() && !unit.hasMoved) {
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

  private calculateMovementFor(unit: CombatUnitState): Map<string, MovementNode> {
    return calculateReachable({
      start: unit.position,
      movementPoints: unit.movement,
      board: BOARD_CONFIG,
      getMovementCost: (position) =>
        getTerrainMovementCost(position.x, position.y, unit.movementType),
      isBlocked: (position) =>
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
      this.selectedUnitId = null;
      this.selectedTile = null;
      this.reachableTiles.clear();
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

    this.turnManager.endTurn();
    const nextTeam = this.turnManager.getActiveTeam();

    for (const unit of this.units) {
      if (unit.team === nextTeam) {
        unit.hasMoved = false;
        unit.hasActed = false;
      }
    }

    this.selectedTile = null;
    this.selectedUnitId = null;
    this.hoveredTile = null;
    this.hoveredTargetId = null;
    this.reachableTiles.clear();
    this.statusMessage = `Đến lượt ${TEAM_NAMES[nextTeam]}.`;
    this.refreshAll();
  }

  private refreshAll(): void {
    this.refreshBoardSelection();
    this.refreshUnitSelection();
    this.refreshHud();
  }

  private refreshBoardSelection(): void {
    const { columns, rows } = BOARD_CONFIG;
    const previewPath = this.hoveredTile
      ? buildPath(this.reachableTiles, this.hoveredTile)
      : [];
    const previewKeys = new Set(previewPath.map((position) => positionKey(position)));
    const selectedUnit = this.getSelectedUnit();
    const selectedUnitKey = selectedUnit ? positionKey(selectedUnit.position) : null;
    const activeSelected =
      selectedUnit?.team === this.turnManager.getActiveTeam() ? selectedUnit : null;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const position = { x, y };
        const key = positionKey(position);
        const tile = this.tileViews.get(key);
        if (!tile) continue;

        const isSelected = this.selectedTile?.x === x && this.selectedTile?.y === y;
        const isReachable = this.reachableTiles.has(key) && key !== selectedUnitKey;
        const isPreviewPath = previewKeys.has(key);
        const isAttackRange = Boolean(
          activeSelected &&
            !activeSelected.hasActed &&
            isInAttackRange(activeSelected, position),
        );
        const isHoveredTarget = this.hoveredTargetId
          ? this.findUnitAt(position)?.id === this.hoveredTargetId
          : false;

        let fillColor = this.getBaseTileColor(position);
        let strokeWidth = 1;
        let strokeColor = 0x0f172a;

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

    for (const unit of this.units) {
      const view = this.unitViews.get(unit.id);
      if (!view) continue;

      const isSelected = unit.id === this.selectedUnitId;
      const isActive = unit.team === activeTeam;
      const isFullySpent = unit.hasMoved && unit.hasActed;
      const isAttackable = Boolean(
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
      view.container.setAlpha(isActive ? (isFullySpent ? 0.58 : 1) : 0.72);
    }
  }

  private refreshHud(): void {
    const activeTeam = this.turnManager.getActiveTeam();
    const activeColor = activeTeam === 'xanh' ? '#7dd3fc' : '#fda4af';

    this.turnText.setText(`Vòng ${this.turnManager.getRound()}\n${TEAM_NAMES[activeTeam]}`);
    this.turnText.setColor(activeColor);

    const selectedUnit = this.getSelectedUnit();
    if (selectedUnit) {
      const terrain = getTerrainAt(selectedUnit.position.x, selectedUnit.position.y);
      const canCommand = selectedUnit.team === activeTeam;
      const moveStatus = selectedUnit.hasMoved ? 'Đã dùng' : 'Sẵn sàng';
      const actionStatus = selectedUnit.hasActed ? 'Đã dùng' : 'Sẵn sàng';
      const attackLabel = selectedUnit.damageType === 'vat-ly'
        ? `${selectedUnit.attack} Vật lý`
        : `${selectedUnit.magicAttack} Phép`;
      const rangeLabel = selectedUnit.minAttackRange === selectedUnit.maxAttackRange
        ? `${selectedUnit.maxAttackRange}`
        : `${selectedUnit.minAttackRange}–${selectedUnit.maxAttackRange}`;

      this.selectionText.setText(
        `${selectedUnit.name} • ${TEAM_NAMES[selectedUnit.team]}\nVai trò: ${selectedUnit.role}\nHP: ${selectedUnit.hp} / ${selectedUnit.maxHp}\nCông: ${attackLabel}\nGiáp: ${selectedUnit.armor} • Kháng: ${selectedUnit.resistance}\nDi chuyển: ${selectedUnit.movement} • Tầm đánh: ${rangeLabel}\nĐịa hình: ${terrain.name}\nDi chuyển: ${moveStatus} • Hành động: ${actionStatus}`,
      );

      const hoveredTarget = this.getHoveredTarget();
      if (hoveredTarget && canCommand && this.canAttackTarget(selectedUnit, hoveredTarget)) {
        const preview = getDamagePreview(selectedUnit, hoveredTarget);
        const remainingHigh = Math.max(0, hoveredTarget.hp - preview.min);
        const remainingLow = Math.max(0, hoveredTarget.hp - preview.max);
        const damageType = selectedUnit.damageType === 'vat-ly' ? 'vật lý' : 'phép';
        this.hintText.setText(
          this.withStatus(
            `Mục tiêu: ${hoveredTarget.name}\nSát thương dự kiến: ${preview.min}–${preview.max} (${damageType})\nHP mục tiêu sau đòn: ${remainingLow}–${remainingHigh}\nBấm mục tiêu để tấn công.`,
          ),
        );
        return;
      }

      let hint = '';
      if (!canCommand) {
        hint = 'Đây là quân đối phương. Có thể xem chỉ số nhưng không thể ra lệnh.';
      } else if (!selectedUnit.hasMoved && !selectedUnit.hasActed) {
        hint = 'Có thể di chuyển hoặc tấn công trước. Sau đó vẫn còn quyền còn lại nếu chưa dùng.';
      } else if (selectedUnit.hasMoved && !selectedUnit.hasActed) {
        hint = 'Đã di chuyển. Các mục tiêu có viền đỏ vẫn có thể bị tấn công.';
      } else if (!selectedUnit.hasMoved && selectedUnit.hasActed) {
        hint = 'Đã dùng hành động tấn công nhưng vẫn có thể di chuyển.';
      } else {
        hint = 'Đơn vị này đã dùng cả di chuyển và hành động trong lượt hiện tại.';
      }

      this.hintText.setText(this.withStatus(hint));
      return;
    }

    if (!this.selectedTile) {
      this.selectionText.setText('Chưa chọn ô nào.');
      this.hintText.setText(
        this.withStatus('Chọn quân của phe đang hành động để xem vùng di chuyển và tầm đánh.'),
      );
      return;
    }

    const terrain = getTerrainAt(this.selectedTile.x, this.selectedTile.y);
    const infantryCost = terrain.movementCost['bo-binh'];
    this.selectionText.setText(
      `Ô (${this.selectedTile.x}, ${this.selectedTile.y})\nĐịa hình: ${terrain.name}\nChi phí Bộ binh: ${infantryCost ?? 'Không thể đi'}\nTrạng thái: Trống`,
    );
    this.hintText.setText(
      this.withStatus('Chọn một đơn vị để tiếp tục ra lệnh.'),
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
