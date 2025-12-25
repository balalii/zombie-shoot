import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './game/config';
import MainScene from './game/MainScene';
import GameUI from './components/GameUI';
import StartScreenUI from './components/StartScreenUI';
import { Smartphone, RefreshCcw } from 'lucide-react'; // Pastikan install lucide-react

export default function App() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<MainScene | null>(null);

  // State Game Flow
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver'>('start');
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  // State Deteksi Orientasi
  const [isPortrait, setIsPortrait] = useState(false);

  // 1. LOGIKA DETEKSI LAYAR (HP/TABLET)
  useEffect(() => {
    const checkOrientation = () => {
      // Jika Tinggi > Lebar, berarti Portrait.
      // Kita anggap "Mobile" jika lebarnya di bawah batas tertentu (misal 768px) atau sekadar rasio layar.
      // Untuk game landscape, validasi rasio (Height > Width) adalah cara paling aman.
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isPortraitMode);
    };

    // Cek saat pertama kali load
    checkOrientation();

    // Pasang listener jika user memutar HP saat main
    window.addEventListener('resize', checkOrientation);

    // Cleanup listener saat unmount
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // 2. INISIALISASI GAME PHASER
  useEffect(() => {
    // Hancurkan game lama jika ada (untuk hot-reload development)
    if (gameRef.current) {
      gameRef.current.destroy(true);
    }

    const config = createGameConfig('game-container');
    gameRef.current = new Phaser.Game(config);

    // Tunggu scene siap untuk hook event callback
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
      {/* ================================================================
        OVERLAY PERINGATAN ROTASI (HANYA MUNCUL JIKA PORTRAIT) 
        ================================================================
      */}
      {isPortrait && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-white px-6 text-center !font-pixel -mt-20">
          {/* Animasi Ikon */}
          <div className="relative mb-8">
            {/* Ikon HP */}
            <Smartphone size={80} className="text-gray-400 animate-pulse" />

            {/* Ikon Panah Putar (Animasi Spin) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <RefreshCcw size={15} className="text-white-500 animate-spin-slow mb-4" />
            </div>
          </div>

          {/* Teks Peringatan */}
          <h2 className="text-xl font-black  text-red-600 mb-3 tracking-widest border-b-2 border-red-600 pb-2">WRONG ORIENTATION</h2>
          <p className="text-gray-300 text-sm">
            Please rotate your device to <br />
            <span className="text-yellow-400 font-bold text-md">LANDSCAPE MODE</span>
          </p>
          <p className="text-gray-600 text-xs mt-4 italic">(Game optimized for horizontal view)</p>
        </div>
      )}

      {/* ================================================================
        GAME CONTENT (TETAP DI-RENDER DI BELAKANG)
        ================================================================
      */}

      {/* Start Screen */}
      {gameState === 'start' && !isPortrait && <StartScreenUI onStart={handleStartGame} />}

      {/* Phaser Container */}
      <div id="game-container" className="w-full h-full" />

      {/* In-Game UI (HUD / Game Over) */}
      {(gameState === 'playing' || gameState === 'gameOver') && !isPortrait && <GameUI health={health} score={score} level={level} isGameOver={gameState === 'gameOver'} onRestart={handleRestart} />}
    </div>
  );
}
