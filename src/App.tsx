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

  // State Management Game
  const [gameState, setGameState] = useState<'start' | 'dialogue' | 'playing' | 'gameOver'>('start');
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [username, setUsername] = useState<string | null>(null);

  // STATE TRIGGER: Sinyal untuk memberitahu LeaderboardUI agar refresh data
  const [leaderboardTrigger, setLeaderboardTrigger] = useState<number>(0);

  useEffect(() => {
    // 1. Ambil username (jika ada) saat load pertama kali
    const savedUser = getStoredUsername();
    if (savedUser) setUsername(savedUser);

    // 2. Setup Phaser Game Instance
    // Hancurkan instance lama jika ada (untuk mencegah duplikasi saat hot-reload dev)
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const config = createGameConfig('game-container');
    gameRef.current = new Phaser.Game(config);

    // 3. Bind React State ke Phaser Events
    // Kita butuh delay sedikit agar Scene benar-benar siap sebelum kita attach listener
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

  // --- LOGIC AUTO SAVE & UPDATE UI (Supabase Sync) ---
  useEffect(() => {
    const handleGameOverProcess = async () => {
      // Cek apakah kondisi valid untuk save: Game Over, Ada Username, Skor > 0
      if (gameState === 'gameOver' && username && score > 0) {
        // 1. Simpan Score ke Supabase (ASYNC - Tunggu sampai selesai)
        await saveScore(username, score);

        // 2. SETELAH SELESAI, Update trigger
        // Ini akan menyebabkan prop 'leaderboardTrigger' di GameUI berubah
        // dan LeaderboardUI akan melakukan fetch ulang secara otomatis.
        setLeaderboardTrigger(Date.now());
      }
    };

    handleGameOverProcess();
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
    // Setelah dialog selesai, mulai game phaser
    setGameState('playing');
    sceneRef.current?.startGame();
  };

  const handleRestart = () => {
    // Reset state React
    setScore(0);
    setHealth(3);
    setLevel(1);
    setGameState('playing');

    // Reset state Phaser
    sceneRef.current?.restartGame();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* 1. START SCREEN */}
      {gameState === 'start' && <StartScreenUI onStart={handleStartPressed} />}

      {/* 2. DIALOG SCREEN (Story Mode) */}
      {/* Menerima prop username agar nama di dialog dinamis */}
      {gameState === 'dialogue' && <DialogUI onComplete={handleDialogComplete} username={username || 'OPERATOR'} />}

      {/* 3. PHASER CANVAS CONTAINER */}
      <div id="game-container" className="w-full h-full" />

      {/* 4. GAME HUD & GAME OVER MODAL */}
      {(gameState === 'playing' || gameState === 'gameOver') && (
        <GameUI
          health={health}
          score={score}
          level={level}
          isGameOver={gameState === 'gameOver'}
          onRestart={handleRestart}
          // Pass Trigger ke UI untuk refresh leaderboard otomatis
          leaderboardTrigger={leaderboardTrigger}
        />
      )}
    </div>
  );
}
