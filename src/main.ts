import * as Phaser from 'phaser';
import './styles.css';
import { BattleScene } from './game/scenes/BattleSceneV05';

const bootStatus = document.getElementById('boot-status');

function showBootError(message: string): void {
  if (!bootStatus) return;
  bootStatus.dataset.error = 'true';
  bootStatus.textContent = `Không thể khởi tạo game. ${message}`;
}

try {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#0b1220',
    scene: [BattleScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
      roundPixels: false,
    },
  });

  requestAnimationFrame(() => {
    const canvas = document.querySelector('#game-container canvas');
    if (canvas) {
      bootStatus?.remove();
    } else {
      showBootError('Canvas chưa được tạo. Hãy tải lại trang hoặc báo lỗi để kiểm tra tiếp.');
    }
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      game.destroy(true);
    });
  }
} catch (error) {
  const message = error instanceof Error ? error.message : 'Lỗi không xác định.';
  showBootError(message);
  throw error;
}
