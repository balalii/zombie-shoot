import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import MainScene from './game/MainScene';
import GameUI from './components/GameUI';
import StartScreenUI from './components/StartScreenUI';
import DialogUI from './components/DialogUI';
import { getStoredUsername, saveScore } from './utils/gameStorage';

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);

  // State Management
  const [gameState, setGameState] = useState<'start' | 'dialogue' | 'playing' | 'gameOver'>('start');
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // 1. Cek apakah ada username tersimpan saat load pertama
    const savedUser = getStoredUsername();
    if (savedUser) setUsername(savedUser);

    // 2. Setup Phaser Game Instance
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const config = createGameConfig('game-container');
    gameRef.current = new Phaser.Game(config);

    // 3. Bind React State ke Phaser Events
    const timer = setTimeout(() => {
      const scene = gameRef.current?.scene.getScene('MainScene') as MainScene;
      if (scene) {
        sceneRef.current = scene;
        scene.onScoreUpdate = (s) => setScore(s);
        scene.onHealthUpdate = (h) => setHealth(h);
        scene.onLevelUpdate = (l) => setLevel(l);
        scene.onGameOver = () => setGameState('gameOver');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      gameRef.current?.destroy(true);
    };
  }, []);

  // --- LOGIC SAVE SCORE (SUPABASE) ---
  useEffect(() => {
    const saveToCloud = async () => {
      // Hanya simpan jika Game Over, punya Username, dan Skor > 0
      if (gameState === 'gameOver' && username && score > 0) {
        console.log(`Attempting to save score for ${username}: ${score}`);
        await saveScore(username, score);
      }
    };

    saveToCloud();
  }, [gameState, score, username]);

  // --- HANDLERS ---

  const handleStartPressed = () => {
    // Refresh username dari storage (penting jika user baru saja input nama di StartScreen)
    const currentUser = getStoredUsername();
    setUsername(currentUser);

    // Masuk ke mode dialog cerita
    setGameState('dialogue');
  };

  const handleDialogComplete = () => {
    // Setelah dialog selesai, mulai game
    setGameState('playing');
    sceneRef.current?.startGame();
  };

  const handleRestart = () => {
    setScore(0);
    setHealth(3);
    setLevel(1);
    setGameState('playing');
    sceneRef.current?.restartGame();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* 1. START SCREEN: Input Nama & Tombol Start */}
      {gameState === 'start' && <StartScreenUI onStart={handleStartPressed} />}

      {/* 2. DIALOG SCREEN: Story Mode */}
      {gameState === 'dialogue' && <DialogUI onComplete={handleDialogComplete} />}

      {/* 3. PHASER CANVAS */}
      <div id="game-container" className="w-full h-full" />

      {/* 4. GAME HUD & GAME OVER (Termasuk Leaderboard) */}
      {(gameState === 'playing' || gameState === 'gameOver') && <GameUI health={health} score={score} level={level} isGameOver={gameState === 'gameOver'} onRestart={handleRestart} />}
    </div>
  );
}
