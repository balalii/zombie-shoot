import Phaser from 'phaser';
import MainScene from './MainScene';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    // 1. KITA GUNAKAN RESOLUSI TETAP (LOGICAL RESOLUTION)
    // 1280x720 adalah standar HD Landscape (16:9).
    // Phaser akan otomatis mengecilkan/membesarkan ini agar muat di layar HP (Scale.FIT).
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a1a',
    scene: [MainScene],
    physics: {
      default: 'arcade',
      arcade: {
        debug: false,
      },
    },
    scale: {
      // 2. SCALE.FIT: Memastikan game selalu terlihat utuh (ada black bars jika rasio layar beda)
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      // 3. FORCE ORIENTATION: Memberi tahu browser bahwa ini game Landscape
      orientation: Phaser.Scale.Orientation.LANDSCAPE,
    },
  };
}
