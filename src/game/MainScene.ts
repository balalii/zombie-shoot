import Phaser from 'phaser';

interface NPC {
  container: Phaser.GameObjects.Container;
  type: 'zombie' | 'civilian';
  speed: number;
  walkSound?: Phaser.Sound.BaseSound; // <-- Ditambahkan untuk melacak suara jalan zombie
}

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Image;
  private npcs: NPC[] = [];
  private gameActive = false;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private difficultyTimer!: Phaser.Time.TimerEvent;

  public onScoreUpdate?: (score: number) => void;
  public onHealthUpdate?: (health: number) => void;
  public onGameOver?: () => void;

  private score = 0;
  private health = 3;
  private spawnRate = 1500;
  private difficulty = 1;

  // Referensi untuk backsound
  private backsound!: Phaser.Sound.BaseSound;

  private readonly NPC_SIZE = { width: 40, height: 40 };
  private readonly PLAYER_COLLISION_SIDES = { width: 153, height: 120 };

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    this.load.image('background', 'bg.png');
    this.load.image('zombie', 'zombie.png');
    this.load.image('civilian', 'civilian.png');
    this.load.image('shooter', 'shooter.png');

    // Load audio files
    this.load.audio('shot', 'sounds/shotgun.mp3');
    this.load.audio('zombie_sound', 'sounds/zombie_groan.mp3');
    this.load.audio('scream', 'sounds/scream.mp3');

    // --- AUDIO BARU DITAMBAHKAN ---
    this.load.audio('backsound', 'sounds/backsound.mp3');
    this.load.audio('zombie_walk', 'sounds/zombie_walk.mp3');
    // --- AKHIR PENAMBAHAN ---

    this.load.on('loaderror', (file: unknown) => {
      const f = file as { key?: string; src?: string } | undefined;
      console.warn('Gagal memuat:', f?.key, f?.src);
    });
  }

  create() {
    this.createBackground();
    const { width, height } = this.cameras.main;
    this.createPlayer(width / 2, height / 2);
    this.input.on('pointerdown', this.handleTap, this);

    // Pastikan semua suara didecode agar bisa dimainkan tanpa delay
    try {
      const s = this.sound as unknown as { decodeAudio?: (key: string) => void };
      s.decodeAudio?.('shot');
      s.decodeAudio?.('zombie_sound');
      s.decodeAudio?.('scream');
      // --- DECODE AUDIO BARU ---
      s.decodeAudio?.('backsound');
      s.decodeAudio?.('zombie_walk');
      // --- AKHIR DECODE ---
    } catch {
      // decodeAudio may not exist in all sound managers or environments
      // ignore if unavailable
    }
  }

  private createBackground() {
    const { width: screenWidth, height: screenHeight } = this.cameras.main;
    const bg = this.add.image(screenWidth / 2, screenHeight / 2, 'background');
    const imageWidth = bg.width;
    const imageHeight = bg.height;
    const screenRatio = screenWidth / screenHeight;
    const imageRatio = imageWidth / imageHeight;

    if (screenRatio > imageRatio) {
      bg.displayWidth = screenWidth;
      bg.scaleY = bg.scaleX;
    } else {
      bg.displayHeight = screenHeight;
      bg.scaleX = bg.scaleY;
    }
  }

  public startGame() {
    if (this.gameActive) return;
    this.restartGame();
  }

  private startGameSystems() {
    this.startSpawning();
    this.startDifficultyTimer();
  }

  private startSpawning() {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnRate,
      callback: this.spawnNPC,
      callbackScope: this,
      loop: true,
    });
  }

  private startDifficultyTimer() {
    this.difficultyTimer = this.time.addEvent({
      delay: 10000,
      callback: this.increaseDifficulty,
      callbackScope: this,
      loop: true,
    });
  }

  private createPlayer(x: number, y: number) {
    this.player = this.add.image(x, y, 'shooter');
    this.player.setDisplaySize(60, 60);

    const glow1 = this.add.circle(x, y, 60, 0xffff00, 0.15);
    const glow2 = this.add.circle(x, y, 45, 0xffffff, 0.2);

    this.tweens.add({
      targets: [glow1, glow2],
      scale: { from: 1, to: 1.2 },
      alpha: { from: 0.15, to: 0.05 },
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private spawnNPC() {
    if (!this.gameActive) return;

    const { width, height } = this.cameras.main;
    let startX = 0,
      startY = 0;
    const offset = 30;
    const side = Phaser.Math.Between(0, 3);

    switch (side) {
      case 0:
        startX = Phaser.Math.Between(-offset, width + offset);
        startY = -offset;
        break;
      case 1:
        startX = width + offset;
        startY = Phaser.Math.Between(-offset, height + offset);
        break;
      case 2:
        startX = Phaser.Math.Between(-offset, width + offset);
        startY = height + offset;
        break;
      case 3:
        startX = -offset;
        startY = Phaser.Math.Between(-offset, height + offset);
        break;
    }

    const isZombie = Math.random() < 0.7;
    const type: 'zombie' | 'civilian' = isZombie ? 'zombie' : 'civilian';

    // --- PERUBAHAN LOGIKA SUARA SPAWN ---
    let walkSound: Phaser.Sound.BaseSound | undefined;
    if (type === 'zombie') {
      try {
        // Buat suara, loop, dan mainkan
        walkSound = this.sound.add('zombie_walk', { loop: true, volume: 0.3 });
        walkSound.play();
      } catch {
        console.warn('Suara zombie_walk tidak tersedia saat spawn');
      }
    } else {
      // Civilian tetap scream saat muncul
      try {
        this.sound.play('scream', { volume: 0. });
      } catch {
        console.warn('Suara scream tidak tersedia saat spawn');
      }
    }
    // --- AKHIR PERUBAHAN ---

    const spriteKey = type === 'zombie' ? 'zombie' : 'civilian';
    const sprite = this.add.image(0, 0, spriteKey);
    sprite.setDisplaySize(this.NPC_SIZE.width, this.NPC_SIZE.height);

    const container = this.add.container(startX, startY, [sprite]);
    container.setSize(this.NPC_SIZE.width, this.NPC_SIZE.height).setInteractive();

    const baseSpeed = 1 + this.difficulty * 0.1;
    const speed = type === 'zombie' ? baseSpeed : baseSpeed * 1.3;

    // Masukkan walkSound ke objek NPC
    this.npcs.push({ container, type, speed, walkSound });
  }

  private handleTap(pointer: Phaser.Input.Pointer) {
    if (!this.gameActive) return;

    this.createShotEffect();
    this.cameras.main.shake(100, 0.002);

    try {
      this.sound.play('shot', { volume: 0.5 });
    } catch {
      console.warn('Gagal memainkan suara tembakan');
    }

    const hitNPC = this.npcs.find((npc) => npc.container.getBounds().contains(pointer.x, pointer.y));

    if (hitNPC) {
      if (hitNPC.type === 'zombie') {
        this.score += 10;
        this.onScoreUpdate?.(this.score);
        this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0xff0000);
        try {
          this.sound.play('zombie_sound', { volume: 0.6 });
        } catch {
          console.warn('Suara zombie tidak tersedia');
        }

        // --- HENTIKAN SUARA JALAN ZOMBIE ---
        hitNPC.walkSound?.stop();
        // --- AKHIR PERUBAHAN ---

        hitNPC.container.destroy();
        this.npcs = this.npcs.filter((npc) => npc !== hitNPC);
      } else {
        this.takeDamage();
        this.createBloodSplatter(hitNPC.container.x, hitNPC.container.y, 0x0099ff);
        this.cameras.main.flash(200, 255, 0, 0, false);
        hitNPC.container.destroy();
        this.npcs = this.npcs.filter((npc) => npc !== hitNPC);
      }
    } else {
      this.createGroundSplash(pointer.x, pointer.y);
    }
  }

  private createShotEffect() {
    const angle = this.player.rotation;
    const tipX = this.player.x + Math.cos(angle) * 25;
    const tipY = this.player.y + Math.sin(angle) * 25;

    for (let i = 0; i < 5; i++) {
      const particle = this.add.circle(tipX, tipY, Phaser.Math.Between(2, 5), 0xffcc00);
      const randomAngle = angle + Phaser.Math.FloatBetween(-0.5, 0.5);
      const speed = Phaser.Math.Between(50, 100);

      this.tweens.add({
        targets: particle,
        x: tipX + Math.cos(randomAngle) * speed,
        y: tipY + Math.sin(randomAngle) * speed,
        alpha: 0,
        scale: 0,
        duration: 200,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createGroundSplash(x: number, y: number) {
    const particleCount = Phaser.Math.Between(5, 8);
    const dirtColors = [0x8b4513, 0xa0522d, 0x5c4033];

    for (let i = 0; i < particleCount; i++) {
      const size = Phaser.Math.Between(2, 6);
      const color = Phaser.Math.RND.pick(dirtColors);
      const particle = this.add.rectangle(x, y, size, size, color);
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(30, 100);
      const rad = Phaser.Math.DegToRad(angle);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(rad) * speed * 0.5,
        y: y + Math.sin(rad) * speed * 0.5,
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(200, 400),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createBloodSplatter(x: number, y: number, color: number) {
    for (let i = 0; i < 20; i++) {
      const size = Phaser.Math.Between(3, 8);
      const particle = this.add.circle(x, y, size, color);
      const angle = Phaser.Math.Between(0, 360);
      const speed = Phaser.Math.Between(60, 180);
      const rad = Phaser.Math.DegToRad(angle);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(rad) * speed,
        y: y + Math.sin(rad) * speed,
        alpha: 0,
        duration: Phaser.Math.Between(300, 700),
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  private createSuccessEffect(x: number, y: number) {
    const particleCount = 8;
    for (let i = 0; i < particleCount; i++) {
      const size = Phaser.Math.Between(3, 6);
      const particle = this.add.circle(x, y, size, 0x00ff00);
      const angle = (360 / particleCount) * i;
      const speed = 60;
      const rad = Phaser.Math.DegToRad(angle);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(rad) * speed,
        y: y + Math.sin(rad) * speed,
        alpha: 0,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    const text = this.add
      .text(x, y, '+5', {
        fontSize: '24px',
        color: '#00ff00',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => text.destroy(),
    });
  }

  private takeDamage() {
    this.health -= 1;
    this.onHealthUpdate?.(this.health);
    this.cameras.main.shake(200, 0.005);
    if (this.health <= 0) {
      this.endGame();
    }
  }

  private endGame() {
    this.gameActive = false;
    this.spawnTimer.destroy();
    this.difficultyTimer.destroy();

    // --- HENTIKAN SEMUA SUARA SAAT GAME OVER ---
    if (this.backsound) {
      this.backsound.stop();
    }
    this.npcs.forEach((npc) => npc.walkSound?.stop());
    // --- AKHIR PERUBAHAN ---

    this.onGameOver?.();
  }

  private increaseDifficulty() {
    if (!this.gameActive) return;
    this.difficulty += 1;
    this.spawnRate = Math.max(500, this.spawnRate - 100);
    if (this.spawnTimer) {
      this.spawnTimer.destroy();
    }
    this.startSpawning();
  }

  update() {
    if (!this.gameActive) return;

    const pointer = this.input.activePointer;
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, pointer.x, pointer.y);
    this.player.rotation = angle;

    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      const container = npc.container;

      const playerBounds = new Phaser.Geom.Rectangle(this.player.x - this.PLAYER_COLLISION_SIDES.width / 2, this.player.y - this.PLAYER_COLLISION_SIDES.height / 2, this.PLAYER_COLLISION_SIDES.width, this.PLAYER_COLLISION_SIDES.height);
      const npcBounds = new Phaser.Geom.Rectangle(container.x - this.NPC_SIZE.width / 2, container.y - this.NPC_SIZE.height / 2, this.NPC_SIZE.width, this.NPC_SIZE.height);

      if (Phaser.Geom.Rectangle.Overlaps(playerBounds, npcBounds)) {
        if (npc.type === 'zombie') {
          this.takeDamage();
          try {
            this.sound.play('zombie_sound', { volume: 0.6 });
          } catch {
            console.warn('Suara zombie tidak tersedia saat bertabrakan');
          }
        } else {
          this.score += 5;
          this.onScoreUpdate?.(this.score);
          this.createSuccessEffect(container.x, container.y);
        }

        // --- HENTIKAN SUARA JALAN SAAT NPC MENCAPAI PEMAIN ---
        npc.walkSound?.stop();
        // --- AKHIR PERUBAHAN ---

        container.destroy();
        this.npcs.splice(i, 1);
        continue;
      }

      const dx = this.player.x - container.x;
      const dy = this.player.y - container.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const moveX = (dx / distance) * npc.speed;
      const moveY = (dy / distance) * npc.speed;
      container.x += moveX;
      container.y += moveY;

      const { height } = this.cameras.main;
      const scale = 0.8 + (container.y / height) * 0.4;
      container.setScale(scale);

      const sprite = container.list[0] as Phaser.GameObjects.Image;
      const rotationAngle = Phaser.Math.Angle.Between(container.x, container.y, this.player.x, this.player.y);
      sprite.rotation = rotationAngle + Math.PI / 15;
      this.children.bringToTop(container);
    }
  }

  public restartGame() {
    this.gameActive = true;
    this.score = 0;
    this.health = 3;
    this.difficulty = 1;
    this.spawnRate = 1500;

    this.onScoreUpdate?.(this.score);
    this.onHealthUpdate?.(this.health);

    // Hentikan semua suara zombie sebelumnya dan hancurkan
    this.npcs.forEach((npc) => {
      npc.walkSound?.stop();
      npc.container.destroy();
    });
    this.npcs = [];

    if (this.spawnTimer) this.spawnTimer.destroy();
    if (this.difficultyTimer) this.difficultyTimer.destroy();

    this.startGameSystems();

    // --- MULAI BACKSOUND SAAT RESTART ---
    // Buat jika belum ada
    if (!this.backsound) {
      this.backsound = this.sound.add('backsound', { loop: true, volume: 0.4 });
    }
    // Mainkan jika tidak sedang dimainkan
    if (!this.backsound.isPlaying) {
      this.backsound.play();
    }
    // --- AKHIR PERUBAHAN ---
  }
}
