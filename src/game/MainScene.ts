import Phaser from 'phaser';

// Definisi tipe musuh dan teman sesuai PDF
type NPCType = 'zombie_normal' | 'zombie_runner' | 'zombie_brute' | 'civilian' | 'heart';

interface NPC {
  container: Phaser.GameObjects.Container;
  type: NPCType;
  speed: number;
  hp: number; // Khusus untuk Big Brute (butuh 2 tembakan)
  walkSound?: Phaser.Sound.BaseSound;
}

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private npcs: NPC[] = [];
  private gameActive = false;
  private spawnTimer!: Phaser.Time.TimerEvent;

  // Callback ke React
  public onScoreUpdate?: (score: number) => void;
  public onHealthUpdate?: (health: number) => void;
  public onLevelUpdate?: (level: number) => void; // Baru: Update Level ke UI
  public onGameOver?: () => void;

  private score = 0;
  private health = 3;
  private level = 1;

  // Parameter Gameplay
  private spawnRate = 2000;
  private maxHealth = 5;

  private backsound!: Phaser.Sound.BaseSound;

  private readonly NPC_SIZE = { width: 40, height: 40 };
  private readonly PLAYER_COLLISION_SIDES = { width: 153, height: 120 };

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('background', 'bg.png');
    this.load.image('zombie', 'zombie.png');
    this.load.image('civilian', 'giphy.gif');
    this.load.image('shooter', 'shooter.png');
    // Pastikan Anda menambahkan icon hati (bisa cari heart.png atau gunakan shape sementara)
    this.load.image('heart', 'heart.png');

    this.load.audio('shot', 'sounds/shotgun.mp3');
    this.load.audio('zombie_death', 'sounds/zombie_death.mp3');
    this.load.audio('scream', 'sounds/scream.mp3');
    this.load.audio('backsound', 'sounds/backsound.mp3');
    this.load.audio('zombie_walk', 'sounds/zombie_walk.mp3');
    // Audio tambahan untuk Brute/Heart jika ada (opsional)
    // this.load.audio('glass_break', 'sounds/glass_break.mp3');
  }

  create() {
    this.createBackground();
    const { width, height } = this.cameras.main;
    this.createPlayer(width / 2, height / 2);
    this.input.on('pointerdown', this.handleTap, this);

    // Decode audio
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

  public startGame() {
    if (this.gameActive) return;
    this.restartGame();
  }

  private startSpawning() {
    // Loop spawn yang dinamis berdasarkan spawnRate
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnRate,
      callback: () => {
        this.spawnNPC();
        // Reset timer dengan delay baru (jika spawnRate berubah karena level naik)
        this.spawnTimer.delay = this.spawnRate;
      },
      callbackScope: this,
      loop: true,
    });
  }

  // Logika Leveling Sesuai PDF [cite: 133-142]
  private updateLevel() {
    const previousLevel = this.level;

    if (this.score < 500) {
      this.level = 1; // Level 1: Intro
      this.spawnRate = 2000;
    } else if (this.score < 1500) {
      this.level = 2; // Level 2: Runner muncul
      this.spawnRate = 1500;
    } else if (this.score < 3000) {
      this.level = 3; // Level 3: Big Brute muncul
      this.spawnRate = 1200;
    } else {
      this.level = 4; // Level 4: Klimaks
      this.spawnRate = 800;
    }

    if (this.level !== previousLevel) {
      this.onLevelUpdate?.(this.level);
      // Visual feedback level up (opsional)
      this.cameras.main.flash(500, 255, 255, 0);
    }
  }

  private spawnNPC() {
    if (!this.gameActive) return;

    const { width, height } = this.cameras.main;
    // Tentukan posisi spawn (Top/Bottom/Left/Right)
    const side = Phaser.Math.Between(0, 3);
    const offset = 50;
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

    // Tentukan Tipe NPC berdasarkan Level [cite: 136, 138, 140, 142]
    const rand = Math.random() * 100;
    let type: NPCType = 'zombie_normal';

    // Logika Probabilitas Spawn
    if (Math.random() < 0.05) {
      type = 'heart'; // 5% chance muncul nyawa
    } else {
      // Logic Musuh & Sipil
      if (this.level === 1) {
        // Lvl 1: 80% Normal, 20% Sipil
        type = rand < 80 ? 'zombie_normal' : 'civilian';
      } else if (this.level === 2) {
        // Lvl 2: 50% Normal, 30% Runner, 20% Sipil
        if (rand < 50) type = 'zombie_normal';
        else if (rand < 80) type = 'zombie_runner';
        else type = 'civilian';
      } else if (this.level === 3) {
        // Lvl 3: 30% Normal, 20% Runner, 30% Brute, 20% Sipil
        if (rand < 30) type = 'zombie_normal';
        else if (rand < 50) type = 'zombie_runner';
        else if (rand < 80) type = 'zombie_brute';
        else type = 'civilian';
      } else {
        // Lvl 4: Campur Aduk (Hard)
        if (rand < 25) type = 'zombie_normal';
        else if (rand < 50) type = 'zombie_runner';
        else if (rand < 75) type = 'zombie_brute';
        else type = 'civilian';
      }
    }

    // Setup Visual & Properties berdasarkan Tipe
    let spriteKey = 'zombie';
    let hp = 1;
    let speedMult = 1;
    let tint = 0xffffff;
    let scale = 1;

    switch (type) {
      case 'zombie_runner':
        spriteKey = 'zombie';
        speedMult = 1.8; // Cepat
        tint = 0x88ff88; // Agak hijau
        scale = 0.8;
        break;
      case 'zombie_brute':
        spriteKey = 'zombie';
        hp = 2; // Butuh 2 tembakan [cite: 55]
        speedMult = 0.6; // Lambat tapi keras
        tint = 0xff4444; // Merah besar
        scale = 1.4;
        break;
      case 'civilian':
        spriteKey = 'civilian';
        speedMult = 1.2;
        break;
      case 'heart':
        spriteKey = 'heart'; // Pastikan ada aset heart.png atau gunakan fallback rectangle
        speedMult = 1.5;
        break;
      default: // Normal
        spriteKey = 'zombie';
        speedMult = 1.0;
        break;
    }

    // Buat Sprite
    const sprite = this.add.image(0, 0, spriteKey);
    // Jika aset heart tidak ada, sprite akan blank, error handling sederhana:
    if (type === 'heart' && sprite.width === 0) {
      sprite.setTexture('zombie'); // Fallback jika lupa tambah gambar
      sprite.setTint(0xff69b4); // Pink
    }

    sprite.setDisplaySize(this.NPC_SIZE.width * scale, this.NPC_SIZE.height * scale);
    sprite.setTint(tint);

    const container = this.add.container(x, y, [sprite]);
    container.setSize(this.NPC_SIZE.width * scale, this.NPC_SIZE.height * scale).setInteractive();

    // Audio Spawn
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
    const finalSpeed = baseSpeed * speedMult;

    this.npcs.push({ container, type, speed: finalSpeed, hp, walkSound });
  }

  private handleTap(pointer: Phaser.Input.Pointer) {
    if (!this.gameActive) return;

    this.createShotEffect();
    this.cameras.main.shake(100, 0.002);
    try {
      this.sound.play('shot', { volume: 0.5 });
    } catch {}

    const hitNPC = this.npcs.find((npc) => npc.container.getBounds().contains(pointer.x, pointer.y));

    if (hitNPC) {
      // Logika Hit Berdasarkan Tipe

      if (hitNPC.type === 'heart') {
        //  Jika nyawa ditembak, hancur & tidak dapat bonus
        this.createStartleEffect(hitNPC.container.x, hitNPC.container.y, 0xff69b4);
        this.killNPC(hitNPC);
      } else if (hitNPC.type === 'civilian') {
        //  Penalti skor berat jika tembak sipil
        this.score = Math.max(0, this.score - 50);
        this.onScoreUpdate?.(this.score);
        this.cameras.main.flash(200, 255, 0, 0); // Flash Merah tanda salah
        this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0x0000ff); // Darah biru/beda
        this.killNPC(hitNPC);
      } else {
        // ZOMBIES
        hitNPC.hp -= 1;

        if (hitNPC.hp > 0) {
          // Brute kena hit pertama [cite: 55]
          const sprite = hitNPC.container.list[0] as Phaser.GameObjects.Image;
          sprite.setTint(0x555555); // Gelap tanda damaged
          this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0x880000);
          try {
            this.sound.play('zombie_death', { volume: 0.3, rate: 1.5 });
          } catch {}
        } else {
          // Mati
          let points = 10;
          if (hitNPC.type === 'zombie_runner') points = 20; // [cite: 45] Skor tinggi runner
          if (hitNPC.type === 'zombie_brute') points = 50; // [cite: 65] Skor tinggi brute

          this.score += points;
          this.updateLevel(); // Cek level up
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

  // Effect Visuals (Sama seperti sebelumnya, disederhanakan)
  private createShotEffect() {
    /* ... Gunakan kode lama ... */
  }
  private createGroundSplash(x: number, y: number) {
    /* ... Gunakan kode lama ... */
  }
  private createBloodSplatter(x: number, y: number, color: number) {
    for (let i = 0; i < 15; i++) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 5), color);
      this.tweens.add({
        targets: p,
        x: x + Math.random() * 100 - 50,
        y: y + Math.random() * 100 - 50,
        alpha: 0,
        duration: 500,
        onComplete: () => p.destroy(),
      });
    }
  }
  private createStartleEffect(x: number, y: number, color: number) {
    // Efek hancur untuk Heart/Salah tembak
    const circle = this.add.circle(x, y, 30, color, 0.5);
    this.tweens.add({ targets: circle, scale: 2, alpha: 0, duration: 300, onComplete: () => circle.destroy() });
  }

  private createPlayer(x: number, y: number) {
    this.player = this.add.image(x, y, 'shooter');
    this.player.setDisplaySize(60, 60);
    // Tambahkan efek glow player
    const glow = this.add.circle(x, y, 60, 0xffff00, 0.2);
    this.tweens.add({ targets: glow, alpha: 0, scale: 1.2, duration: 1000, yoyo: true, repeat: -1 });
  }

  private takeDamage() {
    this.health -= 1;
    this.onHealthUpdate?.(this.health);
    this.cameras.main.shake(300, 0.01);
    if (this.health <= 0) {
      this.endGame();
    }
  }

  private heal() {
    if (this.health < this.maxHealth) {
      this.health += 1;
      this.onHealthUpdate?.(this.health);
      // Efek visual heal
      const text = this.add.text(this.player.x, this.player.y - 50, '+1 HP', { color: '#00ff00', fontSize: '24px', fontStyle: 'bold' }).setOrigin(0.5);
      this.tweens.add({ targets: text, y: text.y - 50, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
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

    // Rotasi Player
    const pointer = this.input.activePointer;
    this.player.rotation = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);

    // Loop NPC Movement & Collision
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      const container = npc.container;

      // Cek Tabrakan dengan Base/Player
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, container.x, container.y);
      if (dist < 60) {
        // Radius tabrakan

        if (npc.type === 'heart') {
          //  Nyawa bertambah jika sampai player
          this.heal();
        } else if (npc.type === 'civilian') {
          //  Bonus skor signifikan jika sipil selamat
          this.score += 100;
          this.updateLevel();
          this.onScoreUpdate?.(this.score);
          // Efek teks +100
          const t = this.add.text(container.x, container.y, '+100', { fontSize: '24px', color: '#00ff00' }).setOrigin(0.5);
          this.tweens.add({ targets: t, y: t.y - 50, alpha: 0, duration: 800, onComplete: () => t.destroy() });
        } else {
          // ZOMBIE (Normal/Runner/Brute) MASUK BASE
          // [cite: 184] Zombi masuk gedung = nyawa berkurang
          this.takeDamage();
        }

        this.killNPC(npc);
        continue;
      }

      // Pergerakan
      const dx = this.player.x - container.x;
      const dy = this.player.y - container.y;
      const angle = Math.atan2(dy, dx);

      container.x += Math.cos(angle) * npc.speed;
      container.y += Math.sin(angle) * npc.speed;

      // Scaling efek kedalaman
      const { height } = this.cameras.main;
      const scaleBase = 0.8 + (container.y / height) * 0.4;
      // Pertahankan scale relative brute/runner
      let typeScale = 1;
      if (npc.type === 'zombie_brute') typeScale = 1.4;
      if (npc.type === 'zombie_runner') typeScale = 0.8;

      container.setScale(scaleBase * typeScale);

      // Rotasi Sprite
      const sprite = container.list[0] as Phaser.GameObjects.Image;
      sprite.rotation = angle + Math.PI / 15; // Koreksi orientasi sprite

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
