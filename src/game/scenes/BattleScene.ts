import * as Phaser from 'phaser';
import { TurnManager } from '../core/TurnManager';
import type { GridPosition, TeamId, UnitState } from '../core/types';
import { BOARD_CONFIG, INITIAL_UNITS } from '../data/v01';

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

    this.add.text(49, 70, 'V0.1 • Prototype bàn cờ chiến thuật', {
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
        const center = this.gridToScreen({ x, y });
        const tile = this.add
          .rectangle(
            center.x,
            center.y,
            tileSize - 2,
            tileSize - 2,
            this.getBaseTileColor(x, y),
            1,
          )
          .setStrokeStyle(1, 0x0f172a, 0.9)
          .setInteractive({ useHandCursor: true });

        tile.on('pointerdown', () => this.selectTile({ x, y }));
        this.tileViews.set(this.tileKey(x, y), tile);

        this.add
          .text(center.x - tileSize / 2 + 5, center.y - tileSize / 2 + 3, `${x},${y}`, {
            fontFamily: 'ui-monospace, monospace',
            fontSize: '9px',
            color: '#ffffff',
          })
          .setAlpha(0.22);
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
        .setInteractive({ useHandCursor: true });

      const label = this.add
        .text(center.x, center.y, unit.shortLabel, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          color: '#07111f',
        })
        .setOrigin(0.5);

      circle.on('pointerdown', () => this.selectTile(unit.position));
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
      fontSize: '17px',
      color: '#e2e8f0',
      lineSpacing: 7,
      wordWrap: { width: 350 },
    });

    this.hintText = this.add.text(842, 438, '', {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      color: '#94a3b8',
      lineSpacing: 5,
      wordWrap: { width: 350 },
    });

    this.add.text(842, 520, 'DEBUG V0.1', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '12px',
      color: '#64748b',
    });

    this.add.text(842, 544, '• Grid: 14 × 10\n• Hiện tọa độ ô\n• Chưa mở di chuyển/chiến đấu', {
      fontFamily: 'ui-monospace, monospace',
      fontSize: '12px',
      color: '#64748b',
      lineSpacing: 4,
    });

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

  private selectTile(position: GridPosition): void {
    this.selectedTile = { ...position };
    const unit = this.findUnitAt(position);
    this.selectedUnitId = unit?.id ?? null;
    this.refreshAll();
  }

  private endTurn(): void {
    this.turnManager.endTurn();
    this.selectedTile = null;
    this.selectedUnitId = null;
    this.refreshAll();
  }

  private refreshAll(): void {
    this.refreshBoardSelection();
    this.refreshUnitSelection();
    this.refreshHud();
  }

  private refreshBoardSelection(): void {
    const { columns, rows } = BOARD_CONFIG;

    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const tile = this.tileViews.get(this.tileKey(x, y));
        if (!tile) continue;

        const isSelected = this.selectedTile?.x === x && this.selectedTile?.y === y;
        tile.setFillStyle(isSelected ? 0x9a7b2f : this.getBaseTileColor(x, y), 1);
        tile.setStrokeStyle(isSelected ? 3 : 1, isSelected ? 0xfbbf24 : 0x0f172a, 0.95);
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
      view.circle.setStrokeStyle(
        isSelected ? 4 : isActive ? 3 : 2,
        isSelected ? 0xfbbf24 : 0xf8fafc,
        isActive ? 0.95 : 0.35,
      );
      view.circle.setAlpha(isActive ? 1 : 0.72);
      view.label.setAlpha(isActive ? 1 : 0.72);
    }
  }

  private refreshHud(): void {
    const activeTeam = this.turnManager.getActiveTeam();
    const activeColor = activeTeam === 'xanh' ? '#7dd3fc' : '#fda4af';

    this.turnText.setText(`Vòng ${this.turnManager.getRound()}\n${TEAM_NAMES[activeTeam]}`);
    this.turnText.setColor(activeColor);

    if (!this.selectedTile) {
      this.selectionText.setText('Chưa chọn ô nào.');
      this.hintText.setText('Bấm vào một ô hoặc quân trên bản đồ để xem thông tin. Sau đó thử nút “Kết thúc lượt”.');
      return;
    }

    const unit = this.selectedUnitId
      ? this.units.find((candidate) => candidate.id === this.selectedUnitId) ?? null
      : null;

    if (!unit) {
      this.selectionText.setText(`Ô (${this.selectedTile.x}, ${this.selectedTile.y})\nĐịa hình: Đồng cỏ\nTrạng thái: Trống`);
      this.hintText.setText('V0.2 sẽ dùng ô đang chọn để kiểm tra vùng di chuyển và đường đi.');
      return;
    }

    const canCommand = unit.team === activeTeam;
    this.selectionText.setText(
      `${unit.name}\n${TEAM_NAMES[unit.team]}\nHP: ${unit.hp} / ${unit.maxHp}\nVị trí: (${unit.position.x}, ${unit.position.y})`,
    );
    this.hintText.setText(
      canCommand
        ? 'Đơn vị thuộc phe đang hành động. V0.2 sẽ mở lệnh di chuyển và highlight tầm đi.'
        : 'Có thể xem quân đối phương, nhưng chỉ phe đang đến lượt mới được ra lệnh.',
    );
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

  private getBaseTileColor(x: number, y: number): number {
    const checker = (x + y) % 2 === 0;

    if (x <= 2) return checker ? 0x1e4b52 : 0x245860;
    if (x >= BOARD_CONFIG.columns - 3) return checker ? 0x563842 : 0x62404a;
    return checker ? 0x355441 : 0x3d604a;
  }

  private tileKey(x: number, y: number): string {
    return `${x}:${y}`;
  }
}
