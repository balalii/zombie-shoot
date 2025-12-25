import { Heart, Maximize, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GameUIProps {
  health: number;
  score: number;
  level: number; // Prop baru untuk level
  isGameOver: boolean;
  onRestart: () => void;
}

export default function GameUI({ health, score, level, isGameOver, onRestart }: GameUIProps) {
  const [isScreenVisible, setIsScreenVisible] = useState(false);

  useEffect(() => {
    if (isGameOver) setIsScreenVisible(true);
  }, [isGameOver]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
    }
  };

  const handleRestartClick = () => {
    setIsScreenVisible(false);
    setTimeout(() => onRestart(), 500);
  };

  return (
    <div className="font-pixel pointer-events-none">
      {/* HUD: pointer-events-none agar tidak menghalangi tap game, kecuali tombol */}

      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent z-10">
        {/* KIRI: Health & Level */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              // Max HP 5 untuk mengakomodasi fitur Heart Bonus
              <Heart key={i} className={`${i < health ? 'fill-red-500 text-red-600' : 'fill-gray-900 text-gray-700'} transition-all duration-200`} size={24} />
            ))}
          </div>

          {/* Level Indicator [cite: 27, 47] */}
          <div className="flex items-center gap-2 bg-gray-800/80 px-3 py-1 rounded border border-gray-600 w-fit">
            <ShieldAlert size={16} className="text-yellow-500" />
            <span className="text-yellow-500 font-bold text-sm tracking-widest">DEFCON {level}</span>
          </div>
        </div>

        {/* KANAN: Score & Settings */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-white text-3xl sm:text-4xl tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">{score.toString().padStart(6, '0')}</div>
          <button onClick={toggleFullscreen} className="pointer-events-auto bg-blue-600/80 p-2 rounded hover:bg-blue-500 transition-colors">
            <Maximize size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Game Over Screen */}
      {isGameOver && (
        <div className={`pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/90 z-20 transition-opacity duration-500 ${isScreenVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center w-full max-w-md bg-gray-900 p-6 border-4 border-double border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <h1 className="text-4xl sm:text-6xl text-red-600 mb-2 font-black tracking-tighter">M.I.A</h1>
            <p className="text-gray-400 mb-6 text-sm">MISSION FAILED - BASE OVERRUN</p>

            <div className="bg-black/50 py-4 mb-6 border border-gray-700">
              <p className="text-gray-400 text-xs tracking-widest mb-1">FINAL SCORE</p>
              <p className="text-yellow-400 text-4xl sm:text-5xl font-bold">{score}</p>
            </div>

            <button onClick={handleRestartClick} className="w-full bg-green-600 hover:bg-green-500 text-white text-xl font-bold py-4 border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all">
              REDEPLOY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
