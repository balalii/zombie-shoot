import Phaser from 'phaser';

type NPCType = 'zombie_normal' | 'zombie_runner' | 'zombie_brute' | 'civilian' | 'heart';

interface NPC {
  container: Phaser.GameObjects.Container;
  type: NPCType;
  speed: number;
  hp: number;
  walkSound?: Phaser.Sound.BaseSound;
}

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private playerBasePos = { x: 0, y: 0 };

  private npcs: NPC[] = [];
  private gameActive = false;
  private spawnTimer!: Phaser.Time.TimerEvent;

  public onScoreUpdate?: (score: number) => void;
  public onHealthUpdate?: (health: number) => void;
  public onLevelUpdate?: (level: number) => void;
  public onGameOver?: () => void;

  private score = 0;
  private health = 3;
  private level = 1;
  private spawnRate = 2000;
  private maxHealth = 5;

  private backsound!: Phaser.Sound.BaseSound;
  private readonly NPC_SIZE = { width: 40, height: 40 };

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('background', 'bg.png');
    this.load.image('zombie', 'zombie.png');
    this.load.image('civilian', 'giphy.gif');
    this.load.image('shooter', 'shooter.png');
    this.load.image('heart', 'heart.png');

    this.load.audio('shot', 'sounds/shotgun.mp3');
    this.load.audio('zombie_death', 'sounds/zombie_death.mp3');
    this.load.audio('scream', 'sounds/scream.mp3');
    this.load.audio('backsound', 'sounds/backsound.mp3');
    this.load.audio('zombie_walk', 'sounds/zombie_walk.mp3');
  }

  create() {
    this.createBackground();
    const { width, height } = this.cameras.main;

    this.playerBasePos = { x: width / 2, y: height / 2 };
    this.createPlayer(this.playerBasePos.x, this.playerBasePos.y);

    this.input.on('pointerdown', this.handleTap, this);

    try {
      const s = this.sound as unknown as { decodeAudio?: (key: string) => void };
      ['shot', 'zombie_death', 'scream', 'backsound', 'zombie_walk'].forEach((key) => s.decodeAudio?.(key));
    } catch {}
  }

  private createBackground() {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, 'background');
    const scale = Math.max(width / bg.width, height / bg.height);
    bg.setScale(scale).setScrollFactor(0);
  }

  private createPlayer(x: number, y: number) {
    this.player = this.add.image(x, y, 'shooter');
    this.player.setDisplaySize(60, 60);

    const glow = this.add.circle(x, y, 65, 0xffff00, 0.15);
    this.tweens.add({ targets: glow, scale: 1.1, alpha: 0.1, duration: 1500, yoyo: true, repeat: -1 });
  }

  public startGame() {
    if (this.gameActive) return;
    this.restartGame();
  }

  private startSpawning() {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnRate,
      callback: () => {
        this.spawnNPC();
        this.spawnTimer.delay = this.spawnRate;
      },
      callbackScope: this,
      loop: true,
    });
  }

  private updateLevel() {
    const previousLevel = this.level;
    if (this.score < 500) {
      this.level = 1;
      this.spawnRate = 2000;
    } else if (this.score < 1500) {
      this.level = 2;
      this.spawnRate = 1500;
    } else if (this.score < 3000) {
      this.level = 3;
      this.spawnRate = 1200;
    } else {
      this.level = 4;
      this.spawnRate = 800;
    }

    if (this.level !== previousLevel) {
      this.onLevelUpdate?.(this.level);
    }
  }

  private spawnNPC() {
    if (!this.gameActive) return;

    const { width, height } = this.cameras.main;
    const side = Phaser.Math.Between(0, 3);
    const offset = 60;
    let x = 0,
      y = 0;

    if (side === 0) {
      x = Phaser.Math.Between(0, width);
      y = -offset;
    } else if (side === 1) {
      x = width + offset;
      y = Phaser.Math.Between(0, height);
    } else if (side === 2) {
      x = Phaser.Math.Between(0, width);
      y = height + offset;
    } else {
      x = -offset;
      y = Phaser.Math.Between(0, height);
    }

    const rand = Math.random() * 100;
    let type: NPCType = 'zombie_normal';

    if (Math.random() < 0.05) {
      type = 'heart';
    } else {
      if (this.level === 1) {
        type = rand < 80 ? 'zombie_normal' : 'civilian';
      } else if (this.level === 2) {
        if (rand < 50) type = 'zombie_normal';
        else if (rand < 80) type = 'zombie_runner';
        else type = 'civilian';
      } else if (this.level === 3) {
        if (rand < 30) type = 'zombie_normal';
        else if (rand < 50) type = 'zombie_runner';
        else if (rand < 80) type = 'zombie_brute';
        else type = 'civilian';
      } else {
        if (rand < 25) type = 'zombie_normal';
        else if (rand < 50) type = 'zombie_runner';
        else if (rand < 75) type = 'zombie_brute';
        else type = 'civilian';
      }
    }

    let spriteKey = 'zombie';
    let hp = 1;
    let speedMult = 1;
    let tint = 0xffffff;
    let scale = 1;

    switch (type) {
      case 'zombie_runner':
        speedMult = 1.8;
        tint = 0x88ff88;
        scale = 0.8;
        break;
      case 'zombie_brute':
        hp = 2;
        speedMult = 0.6;
        tint = 0xff4444;
        scale = 1.4;
        break;
      case 'civilian':
        spriteKey = 'civilian';
        speedMult = 1.2;
        break;
      case 'heart':
        spriteKey = 'heart';
        speedMult = 1.5;
        break;
      default:
        speedMult = 1.0;
        break;
    }

    const sprite = this.add.image(0, 0, spriteKey);
    if (sprite.width <= 1) {
      sprite.setTexture('zombie');
      if (type === 'heart') tint = 0xff69b4;
    }

    sprite.setDisplaySize(this.NPC_SIZE.width * scale, this.NPC_SIZE.height * scale);
    sprite.setTint(tint);

    const container = this.add.container(x, y, [sprite]);
    container.setSize(this.NPC_SIZE.width * scale, this.NPC_SIZE.height * scale).setInteractive();

    let walkSound: Phaser.Sound.BaseSound | undefined;
    if (type.includes('zombie')) {
      try {
        walkSound = this.sound.add('zombie_walk', { loop: true, volume: 0.1 });
        walkSound.play();
      } catch {}
    } else if (type === 'civilian') {
      try {
        this.sound.play('scream', { volume: 0.2 });
      } catch {}
    }

    const baseSpeed = 1 + this.level * 0.1;
    this.npcs.push({ container, type, speed: baseSpeed * speedMult, hp, walkSound });
  }

  private handleTap(pointer: Phaser.Input.Pointer) {
    if (!this.gameActive) return;

    try {
      this.sound.play('shot', { volume: 0.5, detune: Math.random() * 200 - 100 });
    } catch {}
    this.cameras.main.shake(80, 0.003);

    // Animasi Recoil
    this.tweens.killTweensOf(this.player);
    const recoilDistance = 15;
    const angle = this.player.rotation;
    const recoilX = this.playerBasePos.x - Math.cos(angle) * recoilDistance;
    const recoilY = this.playerBasePos.y - Math.sin(angle) * recoilDistance;

    this.tweens.add({
      targets: this.player,
      x: recoilX,
      y: recoilY,
      duration: 40,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: this.player, x: this.playerBasePos.x, y: this.playerBasePos.y, duration: 150, ease: 'Linear' });
      },
    });

    const hitNPC = this.npcs.find((npc) => npc.container.getBounds().contains(pointer.x, pointer.y));

    if (hitNPC) {
      if (hitNPC.type === 'heart') {
        this.createStartleEffect(hitNPC.container.x, hitNPC.container.y, 0xff69b4);
        this.killNPC(hitNPC);
      } else if (hitNPC.type === 'civilian') {
        this.score = Math.max(0, this.score - 50);
        this.onScoreUpdate?.(this.score);
        this.cameras.main.flash(200, 255, 0, 0);
        this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0x0000ff);
        this.killNPC(hitNPC);
      } else {
        hitNPC.hp -= 1;
        if (hitNPC.hp > 0) {
          const sprite = hitNPC.container.list[0] as Phaser.GameObjects.Image;
          sprite.setTint(0x555555);
          this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0x880000);
          try {
            this.sound.play('zombie_death', { volume: 0.3, rate: 1.5 });
          } catch {}
        } else {
          let points = 10;
          if (hitNPC.type === 'zombie_runner') points = 20;
          if (hitNPC.type === 'zombie_brute') points = 50;

          this.score += points;
          this.updateLevel();
          this.onScoreUpdate?.(this.score);

          this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0xff0000);
          try {
            this.sound.play('zombie_death', { volume: 0.6 });
          } catch {}
          this.killNPC(hitNPC);
        }
      }
    } else {
      this.createGroundSplash(pointer.x, pointer.y);
    }
  }

  private killNPC(npc: NPC) {
    npc.walkSound?.stop();
    npc.container.destroy();
    this.npcs = this.npcs.filter((n) => n !== npc);
  }

  private createGroundSplash(x: number, y: number) {
    const splash = this.add.circle(x, y, 10, 0xaaaaaa, 0.5);
    this.tweens.add({ targets: splash, scale: 3, alpha: 0, duration: 300, onComplete: () => splash.destroy() });
  }

  private createBloodSplatter(x: number, y: number, color: number) {
    for (let i = 0; i < 15; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(3, 7), color);
      this.tweens.add({
        targets: p,
        x: x + Math.random() * 120 - 60,
        y: y + Math.random() * 120 - 60,
        alpha: 0,
        scale: { from: 1, to: 0.2 },
        duration: Phaser.Math.Between(400, 700),
        onComplete: () => p.destroy(),
      });
    }
  }

  private createStartleEffect(x: number, y: number, color: number) {
    const circle = this.add.circle(x, y, 30, color, 0.6);
    this.tweens.add({ targets: circle, scale: 2.5, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
  }

  private takeDamage() {
    this.health -= 1;
    this.onHealthUpdate?.(this.health);
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.flash(300, 255, 0, 0, 0.3);
    if (this.health <= 0) {
      this.endGame();
    }
  }

  private heal() {
    if (this.health < this.maxHealth) {
      this.health += 1;
      this.onHealthUpdate?.(this.health);
      const text = this.add.text(this.player.x, this.player.y - 60, '+1 HP', { color: '#00ff00', fontSize: '28px', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
      this.tweens.add({ targets: text, y: text.y - 80, alpha: 0, duration: 1200, onComplete: () => text.destroy() });

      const healRing = this.add.circle(this.player.x, this.player.y, 60, 0x00ff00, 0.4);
      this.tweens.add({ targets: healRing, scale: 3, alpha: 0, duration: 500, onComplete: () => healRing.destroy() });
    }
  }

  private endGame() {
    this.gameActive = false;
    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.backsound) this.backsound.stop();
    this.npcs.forEach((npc) => npc.walkSound?.stop());
    this.onGameOver?.();
  }

  // ==========================================
  // PERUBAHAN UTAMA: UPDATE LOOP ROTASI
  // ==========================================
  update() {
    if (!this.gameActive) return;

    if (!this.tweens.isTweening(this.player)) {
      const pointer = this.input.activePointer;
      this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
    }

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      const container = npc.container;

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, container.x, container.y);
      if (dist < 60) {
        if (npc.type === 'heart') {
          this.heal();
        } else if (npc.type === 'civilian') {
          this.score += 100;
          this.updateLevel();
          this.onScoreUpdate?.(this.score);
          const t = this.add.text(container.x, container.y, '+100 Safe!', { fontSize: '20px', color: '#00ff00', stroke: '#000', strokeThickness: 3 }).setOrigin(0.5);
          this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
        } else {
          this.takeDamage();
        }
        this.killNPC(npc);
        continue;
      }

      const dx = this.player.x - container.x;
      const dy = this.player.y - container.y;
      const angle = Math.atan2(dy, dx);

      container.x += Math.cos(angle) * npc.speed;
      container.y += Math.sin(angle) * npc.speed;

      const { height } = this.cameras.main;
      const scaleBase = 0.8 + (container.y / height) * 0.4;
      let typeScale = 1;
      if (npc.type === 'zombie_brute') typeScale = 1.4;
      if (npc.type === 'zombie_runner') typeScale = 0.8;
      container.setScale(scaleBase * typeScale);

      const sprite = container.list[0] as Phaser.GameObjects.Image;

      // --- LOGIKA ROTASI BARU ---
      if (npc.type === 'heart') {
        // Jika Heart: Putar pelan (spin) & jangan menghadap pemain
        sprite.rotation += 0.05;
      } else {
        // Jika Zombie/Civilian: Menghadap pemain
        sprite.rotation = angle + Math.PI / 15;
      }

      this.children.bringToTop(container);
    }
  }

  public restartGame() {
    this.gameActive = true;
    this.score = 0;
    this.health = 3;
    this.level = 1;
    this.spawnRate = 2000;

    this.onScoreUpdate?.(this.score);
    this.onHealthUpdate?.(this.health);
    this.onLevelUpdate?.(this.level);

    this.npcs.forEach((npc) => {
      npc.walkSound?.stop();
      npc.container.destroy();
    });
    this.npcs = [];

    if (this.spawnTimer) this.spawnTimer.destroy();

    this.startSpawning();

    if (!this.backsound) this.backsound = this.sound.add('backsound', { loop: true, volume: 0.3 });
    if (!this.backsound.isPlaying) this.backsound.play();
  }
}
