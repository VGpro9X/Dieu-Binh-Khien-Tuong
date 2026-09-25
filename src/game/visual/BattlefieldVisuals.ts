import * as Phaser from 'phaser';
import type { CombatUnitState, GridPosition, StrategicPointState, TerrainId } from '../core/types';
import { BOARD_CONFIG, MAIN_FORTRESSES, getTerrainAt } from '../data/v04';
import { FX_BUDGET, TERRAIN_PALETTES, UNIT_PROJECTILE_STYLE, decorNoise, projectileColor, type ProjectileStyle, type VisualQuality } from './visual-config';

interface UnitVisual {
  container: Phaser.GameObjects.Container;
  circle: Phaser.GameObjects.Arc;
}
interface StrategicGlow {
  halo: Phaser.GameObjects.Arc;
  lastOwner: string | null;
}

/** Rendering-only layer: never changes HP, movement, ownership, Mana or turn order. */
export class BattlefieldVisuals {
  private quality: VisualQuality;
  private readonly strategicGlows = new Map<string, StrategicGlow>();
  private selectionRing: Phaser.GameObjects.Arc | null = null;
  private readonly decoratedUnitIds = new Set<string>();

  constructor(private readonly scene: Phaser.Scene, private readonly seed: string) {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    this.quality = reduceMotion || window.innerWidth < 650 ? 'gon' : 'day-du';
  }

  getQuality(): VisualQuality { return this.quality; }
  toggleQuality(): VisualQuality {
    this.quality = this.quality === 'day-du' ? 'gon' : 'day-du';
    return this.quality;
  }
  private center(position: GridPosition): { x: number; y: number } {
    return {
      x: BOARD_CONFIG.originX + (position.x + 0.5) * BOARD_CONFIG.tileSize,
      y: BOARD_CONFIG.originY + (position.y + 0.5) * BOARD_CONFIG.tileSize,
    };
  }
  private budget() { return FX_BUDGET[this.quality]; }

  drawBackdrop(): void {
    const s = this.scene;
    const field = s.add.graphics().setDepth(-10);
    field.fillStyle(0x0a1921, 1).fillRect(24, 105, 780, 554);
    field.lineStyle(2, 0x72b4af, 0.35).strokeRoundedRect(37, 115, 750, 537, 12);
    field.lineStyle(5, 0x030b13, 0.85).strokeRoundedRect(30, 108, 766, 552, 15);
    field.lineStyle(1, 0x345865, 0.45).strokeRoundedRect(22, 100, 781, 570, 17);

    // Static night-sky speckles stay outside the tiles and never obstruct board interactions.
    const stars = s.add.graphics().setDepth(-9);
    for (let i = 0; i < 90; i += 1) {
      const rx = decorNoise(this.seed, i, 0, 1);
      const ry = decorNoise(this.seed, i, 1, 2);
      const x = 30 + rx * 776;
      const y = i % 3 === 0 ? 100 + ry * 14 : 656 + ry * 52;
      stars.fillStyle(i % 4 === 0 ? 0x7dd3fc : 0xcbd5e1, 0.22 + rx * 0.34)
        .fillCircle(x, y, i % 7 === 0 ? 1.5 : 0.8);
    }
  }

  drawTerrain(): void {
    const g = this.scene.add.graphics().setDepth(1);
    const { columns, rows, tileSize, originX, originY } = BOARD_CONFIG;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < columns; x += 1) {
        const terrain: TerrainId = getTerrainAt(x, y).id;
        const palette = TERRAIN_PALETTES[terrain];
        const left = originX + x * tileSize;
        const top = originY + y * tileSize;
        const centerX = left + tileSize / 2;
        const centerY = top + tileSize / 2;
        const n = decorNoise(this.seed, x, y, 1);
        const m = decorNoise(this.seed, x, y, 2);

        // Beveled edges give every cell a raised, pseudo-3D board-game footprint.
        g.fillStyle(0xffffff, 0.038).fillRect(left + 4, top + 3, tileSize - 9, 2);
        g.fillStyle(palette.shadow, 0.3).fillRect(left + 4, top + tileSize - 8, tileSize - 8, 5);
        g.fillStyle(palette.shadow, 0.22).fillRect(left + tileSize - 8, top + 5, 4, tileSize - 10);
        g.lineStyle(1, palette.accent, 0.11).lineBetween(left + 5, top + 5, left + tileSize - 8, top + 5);

        if (terrain === 'dong-co') {
          for (let blade = 0; blade < 3; blade += 1) {
            const px = left + 9 + ((n * 19 + blade * 13) % 31);
            const py = top + 8 + ((m * 27 + blade * 11) % 29);
            g.lineStyle(1, palette.accent, 0.18)
              .lineBetween(px, py + 4, px - 2, py)
              .lineBetween(px, py + 4, px + 2, py + 1);
          }
        } else if (terrain === 'rung') {
          const offset = (n - 0.5) * 7;
          g.fillStyle(0x071f1c, 0.4).fillEllipse(centerX + offset, centerY + 12, 32, 10);
          g.fillStyle(0x1c654a, 0.34).fillTriangle(
            centerX + offset, top + 8, centerX - 15 + offset, centerY + 8,
            centerX + 15 + offset, centerY + 8,
          );
          g.lineStyle(1, 0x81d4a4, 0.25)
            .lineBetween(centerX + offset, top + 10, centerX - 8 + offset, centerY + 5)
            .lineBetween(centerX + offset, top + 10, centerX + 9 + offset, centerY + 5);
        } else if (terrain === 'doi-da') {
          const shift = (m - 0.5) * 8;
          g.fillStyle(0x211f20, 0.32).fillEllipse(centerX, centerY + 13, 32, 9);
          g.fillStyle(0xc3ae91, 0.21).fillTriangle(
            centerX + shift, top + 10, left + 9, centerY + 11, left + 36, centerY + 11,
          );
          g.lineStyle(1, 0xe6d3b4, 0.34).lineBetween(centerX + shift, top + 10, left + 35, centerY + 10);
        } else {
          g.fillStyle(0x70c8db, 0.075).fillEllipse(centerX, centerY, 39, 29);
          for (let wave = 0; wave < 3; wave += 1) {
            const py = top + 12 + wave * 13 + (m - 0.5) * 3;
            g.lineStyle(1, 0xb4e9ed, 0.28)
              .lineBetween(left + 10, py, left + 22, py - 2)
              .lineBetween(left + 22, py - 2, left + 38, py);
          }
        }
      }
    }
  }

  decorateFortresses(): void {
    for (const fortress of Object.values(MAIN_FORTRESSES)) {
      const p = this.center(fortress.position);
      const color = fortress.team === 'xanh' ? 0x67e8f9 : 0xfda4af;
      const dark = fortress.team === 'xanh' ? 0x0e4c60 : 0x792e48;
      const shadow = this.scene.add.ellipse(p.x + 2, p.y + 18, 52, 17, 0x000000, 0.42).setDepth(3.5);
      shadow.setBlendMode(Phaser.BlendModes.NORMAL);
      const gfx = this.scene.add.graphics().setDepth(4.4);
      gfx.fillStyle(dark, 1);
      gfx.fillRoundedRect(p.x - 23, p.y - 27, 12, 24, 3);
      gfx.fillRoundedRect(p.x + 11, p.y - 27, 12, 24, 3);
      gfx.fillStyle(color, 0.83);
      gfx.fillRect(p.x - 25, p.y - 28, 15, 4);
      gfx.fillRect(p.x + 10, p.y - 28, 15, 4);
      gfx.lineStyle(2, color, 0.75);
      gfx.lineBetween(p.x - 17, p.y - 26, p.x - 17, p.y - 14);
      gfx.lineBetween(p.x + 17, p.y - 26, p.x + 17, p.y - 14);
    }
  }

  decorateStrategicPoints(points: readonly StrategicPointState[]): void {
    for (const point of points) {
      const p = this.center(point.position);
      const platform = this.scene.add.graphics().setDepth(2.5);
      platform.fillStyle(0x000000, 0.28).fillEllipse(p.x + 1, p.y + 16, 47, 14);
      platform.lineStyle(1, 0xe2e8f0, 0.23).strokeRoundedRect(p.x - 24, p.y - 24, 48, 48, 7);
      const halo = this.scene.add.circle(p.x, p.y, 24, 0xffffff, 0)
        .setStrokeStyle(2, 0x94a3b8, 0.26).setDepth(2.6);
      this.strategicGlows.set(point.id, { halo, lastOwner: null });
      if (this.quality === 'day-du') {
        this.scene.tweens.add({
          targets: halo, scale: 1.09, alpha: 0.48, duration: 1180 + decorNoise(this.seed, p.x, p.y) * 470,
          yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
    }
  }

  updateOwnership(points: readonly StrategicPointState[]): void {
    for (const point of points) {
      const glow = this.strategicGlows.get(point.id);
      if (!glow || glow.lastOwner === point.owner) continue;
      glow.lastOwner = point.owner;
      const color = point.owner === 'xanh' ? 0x38bdf8 : point.owner === 'do' ? 0xfb7185 : 0xb6c4d6;
      glow.halo.setStrokeStyle(point.owner ? 3 : 2, color, point.owner ? 0.72 : 0.25);
    }
  }

  decorateUnit(unit: CombatUnitState, view: UnitVisual): void {
    if (this.decoratedUnitIds.has(unit.id)) return;
    this.decoratedUnitIds.add(unit.id);
    const teamColor = unit.team === 'xanh' ? 0x67e8f9 : 0xfda4af;
    const dark = unit.team === 'xanh' ? 0x0a3c56 : 0x6f263d;
    const shadow = this.scene.add.ellipse(2, 13, 37, 13, 0x000000, 0.5);
    const pedestal = this.scene.add.ellipse(0, 7, 38, 23, dark, 0.8).setStrokeStyle(1, teamColor, 0.65);
    const backlight = this.scene.add.circle(-5, -6, 17, 0xffffff, 0.08);
    view.container.addAt(shadow, 0);
    view.container.addAt(pedestal, 1);
    view.container.addAt(backlight, 2);
    const icon = this.scene.add.graphics();
    icon.lineStyle(2, teamColor, 0.92);
    switch (unit.classId) {
      case 'linh':
        icon.lineBetween(-5, -26, 5, -16).lineBetween(5, -26, -5, -16);
        icon.fillStyle(teamColor, 1).fillTriangle(5, -27, 8, -32, 0, -29);
        break;
      case 'cung-thu':
        icon.strokeCircle(0, -23, 8);
        icon.lineBetween(0, -31, 0, -15).lineBetween(-6, -23, 7, -23);
        break;
      case 'ky-binh':
        icon.lineBetween(-8, -29, 7, -15);
        icon.fillStyle(teamColor, 1).fillTriangle(-8, -29, -11, -35, -2, -31);
        break;
      case 'trong-binh':
        icon.strokeRoundedRect(-8, -31, 16, 16, 3);
        icon.lineBetween(0, -30, 0, -16).lineBetween(-7, -25, 7, -25);
        break;
      case 'phap-su':
        icon.strokeCircle(0, -24, 7);
        icon.lineBetween(0, -35, 0, -13).lineBetween(-11, -24, 11, -24);
        break;
      case 'tri-lieu-su':
        icon.lineStyle(4, teamColor, 1).lineBetween(0, -32, 0, -16).lineBetween(-8, -24, 8, -24);
        break;
    }
    view.container.add(icon);
    // The shortLabel, selection ring and health bar from gameplay remain readable and untouched.
  }

  forgetUnit(id: string): void { this.decoratedUnitIds.delete(id); }

  updateSelection(position: GridPosition | null): void {
    if (!position) {
      this.selectionRing?.setVisible(false);
      return;
    }
    const p = this.center(position);
    if (!this.selectionRing) {
      this.selectionRing = this.scene.add.circle(p.x, p.y, 24, 0xffffff, 0)
        .setStrokeStyle(2, 0xfbbf24, 0.85).setDepth(4.7);
      this.scene.tweens.add({
        targets: this.selectionRing, scale: 1.1, alpha: 0.6,
        duration: 600, yoyo: true, repeat: -1,
      });
    }
    this.selectionRing.setPosition(p.x, p.y).setVisible(true);
  }

  private ring(x: number, y: number, color: number, maxScale = 2, delay = 0): void {
    const g = this.scene.add.circle(x, y, 10, color, 0)
      .setStrokeStyle(2, color, 0.9).setDepth(43).setScale(0.55);
    this.scene.tweens.add({
      targets: g, scale: maxScale, alpha: 0, duration: 370, delay,
      ease: 'Cubic.easeOut', onComplete: () => g.destroy(),
    });
  }

  private sparks(x: number, y: number, color: number, count: number, radius = 30): void {
    const s = this.scene;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.PI * 0.13;
      const dist = radius * (0.58 + (i % 3) * 0.2);
      const p = s.add.circle(x, y, i % 4 === 0 ? 3 : 2, color, 0.85).setDepth(45);
      s.tweens.add({
        targets: p, x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist,
        scale: 0.1, alpha: 0, duration: 280 + i * 14,
        ease: 'Quad.easeOut', onComplete: () => p.destroy(),
      });
    }
  }

  private floatLabel(pos: GridPosition, value: string, color: string): void {
    const p = this.center(pos);
    const text = this.scene.add.text(p.x, p.y - 31, value, {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', fontStyle: 'bold',
      color, stroke: '#08111b', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(60);
    this.scene.tweens.add({
      targets: text, y: p.y - 55, alpha: 0, duration: 850,
      ease: 'Cubic.easeOut', onComplete: () => text.destroy(),
    });
  }

  impact(position: GridPosition, color: number, strong = false): void {
    const p = this.center(position);
    this.ring(p.x, p.y, color, strong ? 2.75 : 1.9);
    if (this.quality === 'day-du' || strong) {
      this.sparks(p.x, p.y, color, strong ? this.budget().impactParticles : Math.ceil(this.budget().impactParticles * 0.65));
    }
    if (strong && this.budget().allowCameraShake) this.scene.cameras.main.shake(85, 0.0016);
  }

  projectile(from: GridPosition, to: GridPosition, style: ProjectileStyle, team: 'xanh' | 'do'): void {
    const s = this.scene;
    const a = this.center(from), b = this.center(to);
    const color = projectileColor(style, team);
    const glowColor = style === 'hoa-cau' ? 0xf97316 : color;
    const isMagical = style === 'hoa-cau' || style === 'tri-lieu';
    const radius = style === 'hoa-cau' ? 8 : isMagical ? 6 : 4;
    const trail = s.add.circle(0, 0, radius + 5, glowColor, 0.17);
    const core = s.add.circle(0, 0, radius, color, 0.95)
      .setStrokeStyle(isMagical ? 2 : 1, 0xffffff, 0.9);
    const projectile = s.add.container(a.x, a.y, [trail, core]).setDepth(46);
    if (!isMagical) {
      const line = s.add.graphics();
      line.lineStyle(3, 0xffffff, 0.85).lineBetween(-11, 0, 7, 0);
      projectile.add(line);
      projectile.setRotation(Math.atan2(b.y - a.y, b.x - a.x));
    }
    const duration = Math.min(280, 120 + Math.hypot(a.x - b.x, a.y - b.y) * 0.2);
    const particles = this.budget().projectileParticles;
    for (let i = 1; i <= particles; i += 1) {
      const ratio = i / (particles + 1);
      s.time.delayedCall(duration * ratio, () => {
        const speck = s.add.circle(
          a.x + (b.x - a.x) * ratio, a.y + (b.y - a.y) * ratio,
          i % 2 ? 2 : 3, color, 0.7,
        ).setDepth(42);
        s.tweens.add({
          targets: speck, y: speck.y + (i % 2 ? 8 : -8),
          alpha: 0, scale: 0.25, duration: 230,
          onComplete: () => speck.destroy(),
        });
      });
    }
    s.tweens.add({
      targets: projectile, x: b.x, y: b.y, duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        projectile.destroy(true);
        this.impact(to, color, style === 'hoa-cau' || style === 'khien');
      },
    });
  }

  heal(position: GridPosition, amount: number): void {
    const p = this.center(position);
    this.ring(p.x, p.y, 0x5eead4, 2.3);
    this.ring(p.x, p.y, 0x99f6e4, 1.8, 100);
    this.sparks(p.x, p.y, 0x5eead4, this.budget().impactParticles, 34);
    if (amount > 0) this.floatLabel(position, '+' + amount + ' HP', '#99f6e4');
  }

  burnTick(position: GridPosition, amount: number): void {
    this.impact(position, 0xfb923c);
    if (amount > 0) this.floatLabel(position, '-' + amount + ' CHÁY', '#fdba74');
  }

  summon(position: GridPosition, team: 'xanh' | 'do'): void {
    const p = this.center(position);
    const color = team === 'xanh' ? 0x7dd3fc : 0xfda4af;
    this.ring(p.x, p.y, color, 3);
    this.ring(p.x, p.y, 0xffffff, 2.2, 85);
    this.sparks(p.x, p.y, color, this.budget().impactParticles, 36);
    this.floatLabel(position, 'TRIỆU HỒI', team === 'xanh' ? '#bae6fd' : '#fecdd3');
  }

  capture(position: GridPosition, team: 'xanh' | 'do'): void {
    const p = this.center(position);
    const color = team === 'xanh' ? 0x38bdf8 : 0xfb7185;
    this.ring(p.x, p.y, color, 2.9);
    this.sparks(p.x, p.y, color, this.budget().impactParticles, 28);
    this.floatLabel(position, 'CHIẾM ĐÓNG', team === 'xanh' ? '#7dd3fc' : '#fda4af');
  }

  moveTrail(path: readonly GridPosition[]): void {
    const nodes = path.slice(0, 9);
    nodes.forEach((position, i) => {
      this.scene.time.delayedCall(125 * (i + 1), () => {
        const p = this.center(position);
        const dust = this.scene.add.ellipse(p.x, p.y + 10, 21, 8, 0xe2e8f0, 0.32)
          .setDepth(4.6);
        this.scene.tweens.add({
          targets: dust, scaleX: 1.6, scaleY: 0.65, alpha: 0,
          duration: 320, onComplete: () => dust.destroy(),
        });
      });
    });
  }

  death(position: GridPosition, team: 'xanh' | 'do'): void {
    const p = this.center(position);
    const color = team === 'xanh' ? 0x67e8f9 : 0xfda4af;
    this.sparks(p.x, p.y, color, this.budget().impactParticles, 41);
    this.ring(p.x, p.y, color, 2.4);
  }

  turnBanner(team: 'xanh' | 'do'): void {
    const s = this.scene;
    const color = team === 'xanh' ? 0x0c4a6e : 0x881337;
    const accent = team === 'xanh' ? 0x7dd3fc : 0xfda4af;
    const panel = s.add.rectangle(412, 370, 316, 72, color, 0.88)
      .setStrokeStyle(2, accent, 0.9).setDepth(100).setAlpha(0);
    const text = s.add.text(412, 370, 'LƯỢT PHE ' + (team === 'xanh' ? 'XANH' : 'ĐỎ'), {
      fontFamily: 'system-ui, sans-serif',
      fontSize: '25px', fontStyle: 'bold', color: '#ffffff',
    }).setOrigin(0.5).setDepth(101).setAlpha(0);
    s.tweens.add({
      targets: [panel, text], alpha: 1, duration: 115,
      onComplete: () => {
        s.tweens.add({
          targets: [panel, text], alpha: 0, delay: 430, duration: 230,
          onComplete: () => { panel.destroy(); text.destroy(); },
        });
      },
    });
  }
}
