// src/App.tsx

import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import MainScene from './game/MainScene';
import GameUI from './components/GameUI';
import StartScreenUI from './components/StartScreenUI'; // 1. Import komponen baru

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);

  // 2. State baru untuk mengontrol alur: 'start', 'playing', 'gameOver'
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');

  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const config = createGameConfig('game-container');
    gameRef.current = new Phaser.Game(config);

    const timer = setTimeout(() => {
      const scene = gameRef.current?.scene.getScene('MainScene') as MainScene;
      if (scene) {
        sceneRef.current = scene;

        // Setup callbacks ke React
        scene.onScoreUpdate = (newScore: number) => setScore(newScore);
        scene.onHealthUpdate = (newHealth: number) => setHealth(newHealth);
        // Saat game over, ubah state utama
        scene.onGameOver = () => setGameState('gameOver');
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      gameRef.current?.destroy(true);
    };
  }, []);

  // 3. Fungsi untuk memulai permainan dari layar awal
  const handleStartGame = () => {
    setGameState('playing');
    sceneRef.current?.startGame(); // Panggil fungsi baru di MainScene
  };

  // 4. Fungsi untuk memulai ulang setelah game over
  const handleRestart = () => {
    setScore(0);
    setHealth(3);
    setGameState('playing');
    sceneRef.current?.restartGame();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* 5. Tampilkan UI berdasarkan gameState */}

      {/* Tampilkan Layar Awal */}
      {gameState === 'start' && <StartScreenUI onStart={handleStartGame} />}

      {/* Kontainer game selalu ada, tapi game di dalamnya dijeda */}
      <div id="game-container" className="w-full h-full" />

      {/* Tampilkan HUD dan Layar Game Over */}
      {(gameState === 'playing' || gameState === 'gameOver') && <GameUI health={health} score={score} isGameOver={gameState === 'gameOver'} onRestart={handleRestart} />}
    </div>
  );
}
