import * as Phaser from 'phaser';
import { TurnManager } from '../core/TurnManager';
import type { GridPosition, TeamId, TerrainId, UnitState } from '../core/types';
import {
  BOARD_CONFIG,
  INITIAL_UNITS,
  getTerrainAt,
  getTerrainMovementCost,
} from '../data/v02';
import {
  buildPath,
  calculateReachable,
  positionKey,
  type MovementNode,
} from '../rules/Pathfinder';

interface UnitView {
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
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
  private readonly units: UnitState[] = INITIAL_UNITS.map((unit) => ({
    ...unit,
    position: { ...unit.position },
  }));

  private readonly tileViews = new Map<string, Phaser.GameObjects.Rectangle>();
  private readonly unitViews = new Map<string, UnitView>();

  private selectedTile: GridPosition | null = null;
  private selectedUnitId: string | null = null;
  private hoveredTile: GridPosition | null = null;
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

    this.add.text(49, 70, 'V0.2 • Di chuyển chiến thuật & địa hình', {
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
          .setAlpha(0.2);

        if (terrain.shortLabel) {
          this.add
            .text(center.x + tileSize / 2 - 7, center.y + tileSize / 2 - 5, terrain.shortLabel, {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '12px',
              fontStyle: 'bold',
              color: '#ffffff',
            })
            .setOrigin(1, 1)
            .setAlpha(0.42);
        }
      }
    }

    const middleX = originX + boardWidth / 2;
    this.add.rectangle(middleX, originY + boardHeight / 2, 3, boardHeight, 0xffffff, 0.08);

    this.add.text(originX + 8, originY - 28, 'Lãnh địa Phe Xanh', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#7dd3fc',
    });

    this.add
      .text(originX + boardWidth - 8, originY - 28, 'Lãnh địa Phe Đỏ', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#fda4af',
      })
      .setOrigin(1, 0);
  }

  private drawUnits(): void {
    for (const unit of this.units) {
      const center = this.gridToScreen(unit.position);
      const color = TEAM_COLORS[unit.team];

      const circle = this.add
        .circle(center.x, center.y, 18, color, 1)
        .setStrokeStyle(3, 0xf8fafc, 0.55)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      const label = this.add
        .text(center.x, center.y, unit.shortLabel, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#07111f',
        })
        .setOrigin(0.5)
        .setDepth(6);

      circle.on('pointerdown', () => this.handleTileClick(unit.position));
      circle.on('pointerover', () => this.handleTileHover(unit.position));
      circle.on('pointerout', () => this.handleTileOut(unit.position));
      this.unitViews.set(unit.id, { circle, label });
    }
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

    this.add.text(842, 245, 'THÔNG TIN ĐANG CHỌN', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#94a3b8',
    });

    this.selectionText = this.add.text(842, 275, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      color: '#e2e8f0',
      lineSpacing: 6,
      wordWrap: { width: 350 },
    });

    this.hintText = this.add.text(842, 430, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '13px',
      color: '#94a3b8',
      lineSpacing: 4,
      wordWrap: { width: 350 },
    });

    this.add.text(842, 528, 'V0.2 • CHỈ DẪN', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '12px',
      color: '#64748b',
    });

    this.add.text(
      842,
      551,
      '• Ô xanh: có thể di chuyển tới\n• Ô cam: đường đi đang xem\n• R = Rừng, Đ = Đồi đá, ~ = Nước cạn',
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
    if (clickedUnit) {
      this.selectUnit(clickedUnit);
      return;
    }

    const selectedUnit = this.getSelectedUnit();
    const activeTeam = this.turnManager.getActiveTeam();

    if (selectedUnit && selectedUnit.team === activeTeam && !selectedUnit.hasMoved) {
      const destinationKey = positionKey(position);
      const startKey = positionKey(selectedUnit.position);

      if (destinationKey !== startKey && this.reachableTiles.has(destinationKey)) {
        this.moveSelectedUnit(position);
        return;
      }

      this.statusMessage = 'Ô này nằm ngoài tầm di chuyển hoặc đường đi đang bị chặn.';
      this.refreshHud();
      return;
    }

    this.selectTile(position);
  }

  private handleTileHover(position: GridPosition): void {
    if (this.isAnimating) return;

    const selectedUnit = this.getSelectedUnit();
    if (!selectedUnit || selectedUnit.hasMoved) return;
    if (selectedUnit.team !== this.turnManager.getActiveTeam()) return;

    const key = positionKey(position);
    if (!this.reachableTiles.has(key) || key === positionKey(selectedUnit.position)) return;

    this.hoveredTile = { ...position };
    this.refreshBoardSelection();
  }

  private handleTileOut(position: GridPosition): void {
    if (!this.hoveredTile) return;
    if (this.hoveredTile.x !== position.x || this.hoveredTile.y !== position.y) return;

    this.hoveredTile = null;
    this.refreshBoardSelection();
  }

  private selectUnit(unit: UnitState): void {
    this.selectedTile = { ...unit.position };
    this.selectedUnitId = unit.id;
    this.hoveredTile = null;
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
    this.reachableTiles.clear();
    this.statusMessage = '';
    this.refreshAll();
  }

  private calculateMovementFor(unit: UnitState): Map<string, MovementNode> {
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
    this.reachableTiles.clear();
    this.statusMessage = `Đang di chuyển • Chi phí ${movementCost}/${unit.movement} điểm.`;
    this.isAnimating = true;
    this.refreshAll();

    this.animatePath(view, path, 0, () => {
      this.isAnimating = false;
      this.statusMessage = `Đã di chuyển ${unit.name}. Đơn vị này đã dùng lượt di chuyển.`;
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
      targets: [view.circle, view.label],
      x: center.x,
      y: center.y,
      duration: 135,
      ease: 'Sine.easeInOut',
      onComplete: () => this.animatePath(view, path, pathIndex + 1, onComplete),
    });
  }

  private endTurn(): void {
    if (this.isAnimating) return;

    this.turnManager.endTurn();
    const nextTeam = this.turnManager.getActiveTeam();

    for (const unit of this.units) {
      if (unit.team === nextTeam) unit.hasMoved = false;
    }

    this.selectedTile = null;
    this.selectedUnitId = null;
    this.hoveredTile = null;
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

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const position = { x, y };
        const key = positionKey(position);
        const tile = this.tileViews.get(key);
        if (!tile) continue;

        const isSelected = this.selectedTile?.x === x && this.selectedTile?.y === y;
        const isReachable = this.reachableTiles.has(key) && key !== selectedUnitKey;
        const isPreviewPath = previewKeys.has(key);

        let fillColor = this.getBaseTileColor(position);
        let strokeWidth = 1;
        let strokeColor = 0x0f172a;

        if (isReachable) {
          fillColor = 0x155e75;
          strokeWidth = 2;
          strokeColor = 0x38bdf8;
        }

        if (isPreviewPath) {
          fillColor = 0x9a5b20;
          strokeWidth = 3;
          strokeColor = 0xfbbf24;
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

    for (const unit of this.units) {
      const view = this.unitViews.get(unit.id);
      if (!view) continue;

      const isSelected = unit.id === this.selectedUnitId;
      const isActive = unit.team === activeTeam;
      const isSpent = unit.hasMoved;

      view.circle.setStrokeStyle(
        isSelected ? 4 : isActive ? 3 : 2,
        isSelected ? 0xfbbf24 : isSpent ? 0x64748b : 0xf8fafc,
        isActive ? 0.95 : 0.35,
      );
      view.circle.setAlpha(isActive ? (isSpent ? 0.62 : 1) : 0.7);
      view.label.setAlpha(isActive ? (isSpent ? 0.62 : 1) : 0.7);
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
      const movementStatus = selectedUnit.hasMoved ? 'Đã di chuyển' : 'Sẵn sàng';
      const canCommand = selectedUnit.team === activeTeam;

      this.selectionText.setText(
        `${selectedUnit.name}\n${TEAM_NAMES[selectedUnit.team]}\nHP: ${selectedUnit.hp} / ${selectedUnit.maxHp}\nDi chuyển: ${selectedUnit.movement}\nĐịa hình: ${terrain.name}\nTrạng thái: ${movementStatus}`,
      );

      let hint = '';
      if (!canCommand) {
        hint = 'Đây là quân đối phương. Có thể xem thông tin nhưng không thể ra lệnh.';
      } else if (selectedUnit.hasMoved) {
        hint = 'Đơn vị này đã di chuyển trong lượt hiện tại. Kết thúc lượt để hồi lượt di chuyển.';
      } else {
        hint = 'Các ô màu xanh là vùng có thể tới. Rê chuột lên một ô xanh để xem đường đi, sau đó bấm để di chuyển.';
      }

      this.hintText.setText(this.withStatus(hint));
      return;
    }

    if (!this.selectedTile) {
      this.selectionText.setText('Chưa chọn ô nào.');
      this.hintText.setText(
        this.withStatus('Bấm vào quân thuộc phe đang hành động để xem tầm di chuyển.'),
      );
      return;
    }

    const terrain = getTerrainAt(this.selectedTile.x, this.selectedTile.y);
    const infantryCost = terrain.movementCost['bo-binh'];
    this.selectionText.setText(
      `Ô (${this.selectedTile.x}, ${this.selectedTile.y})\nĐịa hình: ${terrain.name}\nChi phí Bộ binh: ${infantryCost ?? 'Không thể đi'}\nTrạng thái: Trống`,
    );
    this.hintText.setText(
      this.withStatus('Chi phí địa hình được tính vào tổng tầm di chuyển. Đường đi sẽ tự chọn tuyến có chi phí thấp nhất.'),
    );
  }

  private withStatus(hint: string): string {
    return this.statusMessage ? `${this.statusMessage}\n\n${hint}` : hint;
  }

  private getSelectedUnit(): UnitState | null {
    if (!this.selectedUnitId) return null;
    return this.units.find((unit) => unit.id === this.selectedUnitId) ?? null;
  }

  private findUnitAt(position: GridPosition): UnitState | null {
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
