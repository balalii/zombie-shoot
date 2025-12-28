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

  // --- STATE MANAGEMENT ---
  const [gameState, setGameState] = useState<'start' | 'dialogue' | 'playing' | 'gameOver'>('start');
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [username, setUsername] = useState<string | null>(null);

  // State untuk Fitur Pause
  const [isPaused, setIsPaused] = useState(false);

  // State untuk Trigger Refresh Leaderboard
  const [leaderboardTrigger, setLeaderboardTrigger] = useState<number>(0);

  useEffect(() => {
    // 1. Ambil username (jika ada) saat load pertama kali
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
        // Binding Event dari Phaser ke React State
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

  // --- LOGIC AUTO SAVE & SYNC LEADERBOARD ---
  useEffect(() => {
    const handleGameOverProcess = async () => {
      // Simpan hanya jika Game Over, ada Username, dan Score > 0
      if (gameState === 'gameOver' && username && score > 0) {
        // 1. Simpan Score ke Supabase (Async)
        await saveScore(username, score);

        // 2. Trigger Refresh Leaderboard di UI
        setLeaderboardTrigger(Date.now());
      }
    };

    handleGameOverProcess();
  }, [gameState, score, username]);

  // --- HANDLERS ---

  const handleStartPressed = () => {
    // Refresh username memastikan data terbaru
    const currentUser = getStoredUsername();
    setUsername(currentUser);

    // Reset pause state dan masuk ke dialog
    setIsPaused(false);
    setGameState('dialogue');
  };

  const handleDialogComplete = () => {
    setGameState('playing');
    // Mulai game di Phaser
    sceneRef.current?.startGame();
  };

  const handleRestart = () => {
    // Reset State React
    setScore(0);
    setHealth(3);
    setLevel(1);
    setIsPaused(false); // Pastikan tidak pause saat restart
    setGameState('playing');

    // Reset Game Phaser
    sceneRef.current?.restartGame();
  };

  // Logic Toggle Pause
  const handlePauseToggle = () => {
    // Hanya bisa pause saat sedang bermain
    if (gameState !== 'playing') return;

    if (isPaused) {
      // RESUME
      sceneRef.current?.resumeGame();
      setIsPaused(false);
    } else {
      // PAUSE
      sceneRef.current?.pauseGame();
      setIsPaused(true);
    }
  };

  return (
    <div  className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* 1. START SCREEN */}
      {gameState === 'start' && <StartScreenUI onStart={handleStartPressed} />}

      {/* 2. DIALOG SCREEN (Story Mode) */}
      {/* Kirim username ke dialog agar teks dinamis */}
      {gameState === 'dialogue' && <DialogUI onComplete={handleDialogComplete} username={username || 'OPERATOR'} />}

      {/* 3. GAME CONTAINER (Phaser Canvas) */}
      <div id="game-container" className="w-full h-full" />

      {/* 4. GAME UI & GAME OVER MODAL */}
      {(gameState === 'playing' || gameState === 'gameOver') && (
        <GameUI
          health={health}
          score={score}
          level={level}
          isGameOver={gameState === 'gameOver'}
          // Props Pause
          isPaused={isPaused}
          onPauseToggle={handlePauseToggle}
          // Props Restart & Leaderboard
          onRestart={handleRestart}
          leaderboardTrigger={leaderboardTrigger}
        />
      )}
    </div>
  );
}
