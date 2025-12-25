import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import MainScene from './game/MainScene';
import GameUI from './components/GameUI';
import StartScreenUI from './components/StartScreenUI';

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);

  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1); // State Level Baru

  useEffect(() => {
    // Clean up game lama jika ada (development hot-reload fix)
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const config = createGameConfig('game-container');
    gameRef.current = new Phaser.Game(config);

    const timer = setTimeout(() => {
      const scene = gameRef.current?.scene.getScene('MainScene') as MainScene;
      if (scene) {
        sceneRef.current = scene;
        scene.onScoreUpdate = (s) => setScore(s);
        scene.onHealthUpdate = (h) => setHealth(h);
        scene.onLevelUpdate = (l) => setLevel(l); // Sambungkan Level Update
        scene.onGameOver = () => setGameState('gameOver');
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      gameRef.current?.destroy(true);
    };
  }, []);

  const handleStartGame = () => {
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
      {gameState === 'start' && <StartScreenUI onStart={handleStartGame} />}

      <div id="game-container" className="w-full h-full" />

      {(gameState === 'playing' || gameState === 'gameOver') && <GameUI health={health} score={score} level={level} isGameOver={gameState === 'gameOver'} onRestart={handleRestart} />}
    </div>
  );
}
