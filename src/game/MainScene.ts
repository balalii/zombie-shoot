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

  // Callback ke React
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

  // Hitbox standar (disesuaikan dengan ukuran visual baru)
  private readonly NPC_SIZE = { width: 60, height: 60 };

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('background', 'bg.png');

    // =========================================================
    // 1. PERBAIKAN UKURAN SPRITESHEET (Agar tidak kotak hitam)
    // =========================================================
    // Berdasarkan info sebelumnya: Gambar 1460x227 dengan 20 frame
    // 1460 / 20 = 73 pixel lebar per frame.
    const frameConfig = { frameWidth: 768, frameHeight: 448 };

    // A. Zombie Normal
    this.load.spritesheet('zombie_anim', 'zombie_walk.png', frameConfig);

    // B. Zombie Runner (Jika file belum ada, gunakan walk sementara)
    this.load.spritesheet('runner_anim', 'zombie_runner.png', frameConfig);

    // C. Zombie Brute (Jika file belum ada, gunakan walk sementara)
    this.load.spritesheet('brute_anim', 'zombie_brute.png', frameConfig);

    this.load.image('civilian', 'giphy.gif');
    this.load.image('shooter', 'shooter.png');
    this.load.image('heart', 'heart.png');

    // Audio
    this.load.audio('shot', 'sounds/shotgun.mp3');
    this.load.audio('zombie_death', 'sounds/zombie_death.mp3');
    this.load.audio('scream', 'sounds/scream.mp3');
    this.load.audio('backsound', 'sounds/backsound.mp3');
    this.load.audio('zombie_walk', 'sounds/zombie_walk.mp3');
  }

  create() {
    this.createBackground();
    const { width, height } = this.cameras.main;

    // =========================================================
    // 2. DEFINISI ANIMASI
    // =========================================================

    // Normal: Speed standar
    if (!this.anims.exists('walk_normal')) {
      this.anims.create({
        key: 'walk_normal',
        frames: this.anims.generateFrameNumbers('zombie_anim', { start: 0, end: 31 }),
        frameRate: 24,
        repeat: -1,
      });
    }

    // Runner: Speed tinggi (kaki gerak cepat)
    if (!this.anims.exists('walk_runner')) {
      this.anims.create({
        key: 'walk_runner',
        frames: this.anims.generateFrameNumbers('runner_anim', { start: 0, end: 31 }),
        frameRate: 30,
        repeat: -1,
      });
    }

    // Brute: Speed rendah (langkah berat)
    if (!this.anims.exists('walk_brute')) {
      this.anims.create({
        key: 'walk_brute',
        frames: this.anims.generateFrameNumbers('brute_anim', { start: 0, end: 31 }),
        frameRate: 20,
        repeat: -1,
      });
    }

    // Setup Player
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

    // [UPDATED] Efek kedip lingkaran DIHAPUS sesuai permintaan
    // const glow = this.add.circle(x, y, 65, 0xffff00, 0.15);
    // this.tweens.add(...) -> Dihapus
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

  // =========================================================
  // 3. LEVEL DESIGN (MENANTANG)
  // =========================================================
  private updateLevel() {
    const previousLevel = this.level;

    // Progress Level lebih agresif
    if (this.score < 500) {
      this.level = 1;
      this.spawnRate = 1500; // Intro
    } else if (this.score < 1500) {
      this.level = 2;
      this.spawnRate = 1100; // Mulai cepat
    } else if (this.score < 3000) {
      this.level = 3;
      this.spawnRate = 700; // Sangat cepat (Hard)
    } else {
      this.level = 4; // MODE NERAKA
      this.spawnRate = 450; // < 0.5 detik per zombie!
    }

    if (this.level !== previousLevel) {
      this.onLevelUpdate?.(this.level);
      this.cameras.main.flash(500, 255, 255, 0);
    }
  }

  private spawnNPC() {
    if (!this.gameActive) return;

    const { width, height } = this.cameras.main;
    const side = Phaser.Math.Between(0, 3);
    const offset = 80;
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

    // Probabilitas Muncul (Tingkat Kesulitan Tinggi)
    if (Math.random() < 0.04) {
      // Heart lebih jarang (4%)
      type = 'heart';
    } else {
      if (this.level === 1) {
        // Lvl 1: 90% Normal, 10% Sipil
        type = rand < 90 ? 'zombie_normal' : 'civilian';
      } else if (this.level === 2) {
        // Lvl 2: Mulai banyak Runner (35%)
        if (rand < 55) type = 'zombie_normal';
        else if (rand < 90) type = 'zombie_runner';
        else type = 'civilian';
      } else if (this.level === 3) {
        // Lvl 3: Brute mulai sering (25%), Runner (35%)
        if (rand < 35) type = 'zombie_normal';
        else if (rand < 70) type = 'zombie_runner';
        else if (rand < 95) type = 'zombie_brute';
        else type = 'civilian';
      } else {
        // Lvl 4: Chaos (Sedikit Normal, Banyak Elite)
        if (rand < 20) type = 'zombie_normal';
        else if (rand < 60) type = 'zombie_runner'; // Runner mendominasi
        else if (rand < 90) type = 'zombie_brute';
        else type = 'civilian';
      }
    }

    // =========================================================
    // 4. PENYESUAIAN UKURAN (SCALE) & STATS
    // =========================================================
    // Aset tinggi asli = 227px.
    // Kita gunakan baseScale 0.35 (~80px tinggi) agar pas di layar.
    let baseScale = 0.20;

    let hp = 1;
    let speedMult = 1;
    let tint = 0xffffff;
    let scale = baseScale;

    switch (type) {
      case 'zombie_runner':
        speedMult = 2.0; // Sangat Cepat
        // Runner sedikit lebih kecil dari normal agar terlihat kurus/lincah
        scale = baseScale * 1;
        break;
      case 'zombie_brute':
        hp = this.level >= 4 ? 3 : 2; // Makin keras di level tinggi
        speedMult = 0.6; // Lambat
        tint = 0xff5555; // Merah gelap
        // Brute jauh lebih besar
        scale = baseScale * 1.5;
        break;
      case 'civilian':
        speedMult = 1.2;
        scale = 0.9; // Sipil ukuran standar
        break;
      case 'heart':
        speedMult = 1.5;
        // Heart ukuran ikon, jangan terlalu besar
        scale = 0.5;
        break;
      default: // Normal
        speedMult = 1.0;
        scale = baseScale;
        break;
    }

    // Setup Sprite
    let sprite: Phaser.GameObjects.Sprite;

    if (type === 'zombie_runner') {
      sprite = this.add.sprite(0, 0, 'runner_anim');
      sprite.play('walk_runner');
    } else if (type === 'zombie_brute') {
      sprite = this.add.sprite(0, 0, 'brute_anim');
      sprite.play('walk_brute');
    } else if (type === 'zombie_normal') {
      sprite = this.add.sprite(0, 0, 'zombie_anim');
      sprite.play('walk_normal');
    } else if (type === 'civilian') {
      sprite = this.add.sprite(0, 0, 'civilian');
    } else {
      sprite = this.add.sprite(0, 0, 'heart');
      if (sprite.width <= 1) {
        // Fallback
        sprite.setTexture('zombie_anim');
        sprite.setTint(0xff69b4);
      }
    }

    // Terapkan Scale
    if (type.includes('zombie')) {
      sprite.setScale(scale);
    } else if (type === 'heart') {
      sprite.setScale(scale); // Heart menggunakan scale
    } else {
      // Civilian (GIF) kadang ukurannya aneh, pakai DisplaySize agar aman
      sprite.setDisplaySize(this.NPC_SIZE.width, this.NPC_SIZE.height);
    }

    sprite.setTint(tint);

    const container = this.add.container(x, y, [sprite]);
    // Hitbox sedikit lebih besar untuk kompensasi jempol di HP
    container.setSize(75, 75).setInteractive();

    let walkSound: Phaser.Sound.BaseSound | undefined;
    if (type.includes('zombie')) {
      try {
        const vol = type === 'zombie_brute' ? 0.3 : 0.1;
        walkSound = this.sound.add('zombie_walk', { loop: true, volume: vol });
        walkSound.play();
      } catch {}
    } else if (type === 'civilian') {
      try {
        this.sound.play('scream', { volume: 0.2 });
      } catch {}
    }

    // Speed Logic: Base speed naik 20% tiap level (Makin Menantang)
    const globalSpeedBoost = 1 + this.level * 0.2;
    const finalSpeed = globalSpeedBoost * speedMult;

    this.npcs.push({ container, type, speed: finalSpeed, hp, walkSound });
  }

  private handleTap(pointer: Phaser.Input.Pointer) {
    if (!this.gameActive) return;

    try {
      this.sound.play('shot', { volume: 0.5, detune: Math.random() * 200 - 100 });
    } catch {}
    this.cameras.main.shake(80, 0.003);

    // Animasi Recoil Player
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
        // Hit Zombie
        hitNPC.hp -= 1;

        // Efek Flash Putih saat kena hit
        const sprite = hitNPC.container.list[0] as Phaser.GameObjects.Sprite;
        this.tweens.add({ targets: sprite, alpha: 0.5, duration: 50, yoyo: true });

        if (hitNPC.hp > 0) {
          // Brute masih hidup
          sprite.setTint(0x550000);
          this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0x880000);
          try {
            this.sound.play('zombie_death', { volume: 0.3, rate: 1.5 });
          } catch {}
        } else {
          // Mati
          let points = 10;
          if (hitNPC.type === 'zombie_runner') points = 30; // Skor runner naik
          if (hitNPC.type === 'zombie_brute') points = 60; // Skor brute naik

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

      const sprite = container.list[0] as Phaser.GameObjects.Sprite;

      // Rotasi & Orientasi
      if (npc.type === 'heart') {
        sprite.rotation += 0.05;
      } else if (npc.type.includes('zombie')) {
        // Koreksi Rotasi: Angle - 90 derajat
        sprite.rotation = angle - Math.PI / 2;
      } else {
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
    this.spawnRate = 1500; // Reset ke difficulty awal

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
