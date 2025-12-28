import { Heart, Maximize, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import LeaderboardUI from './LeaderboardUI';

interface GameUIProps {
  health: number;
  score: number;
  level: number;
  isGameOver: boolean;
  onRestart: () => void;
  leaderboardTrigger?: number; // Prop baru diterima dari App
}

export default function GameUI({ health, score, level, isGameOver, onRestart, leaderboardTrigger }: GameUIProps) {
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
    <div className="absolute inset-0 font-pixel pointer-events-none select-none z-20 flex flex-col justify-between">
      {/* --- HUD BAR ATAS --- */}
      <div className="w-full">
        <div className="bg-black w-full h-10 md:hidden"></div>
        <div className="w-full p-3 sm:p-5 lg:p-6 flex justify-between items-start bg-gradient-to-b from-black to-transparent -mt-3 md:mt-0 ">
          {/* KIRI: Health & Level */}
          <div className="flex flex-col gap-1 sm:gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Heart key={i} className={`${i < health ? 'fill-red-500 text-red-600' : 'fill-gray-900/50 text-gray-700/50'} w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 transition-all duration-200 drop-shadow-md`} />
              ))}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 bg-gray-900/80 px-2 py-1 sm:px-3 sm:py-1.5 rounded border border-gray-600 w-fit shadow-lg backdrop-blur-sm">
              <ShieldAlert className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-yellow-500" />
              <span className="text-yellow-500 font-bold text-[10px] sm:text-xs lg:text-sm tracking-widest">LEVEL {level}</span>
            </div>
          </div>

          {/* KANAN: Score & Fullscreen */}
          <div className="flex items-start gap-1 sm:gap-2">
            <div className="text-white font-bold tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] leading-none text-xl sm:text-4xl lg:text-5xl">{score.toString().padStart(6, '0')}</div>
            <button onClick={toggleFullscreen} className="pointer-events-auto bg-blue-600/80 hover:bg-blue-500 text-white rounded transition-colors shadow-lg p-1.5 sm:p-2 lg:p-2.5">
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* --- GAME OVER MODAL --- */}
      {isGameOver && (
        <div className={`pointer-events-auto fixed inset-0 flex items-center justify-center bg-black/90 z-50 transition-opacity duration-500 px-4 ${isScreenVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-center w-full max-w-[90%] sm:max-w-md bg-gray-900 border-4 border-double border-red-600 shadow-[0_0_30px_rgba(220,38,38,0.5)] p-4 sm:p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

            {/* Title */}
            <h1 className="text-red-600 font-black tracking-tighter leading-none text-4xl sm:text-5xl drop-shadow-md">FAILED</h1>
            <p className="text-gray-400 tracking-[0.2em] font-medium mt-1 mb-2 text-[10px] sm:text-xs">MISSION FAILED</p>

            {/* Score Box */}
            <div className="bg-black/40 border-y-2 border-gray-700 py-2 mb-4">
              <p className="text-gray-500 tracking-widest mb-1 text-[10px] uppercase">Final Score</p>
              <p className="text-yellow-400 font-bold leading-none text-3xl">{score}</p>
            </div>

            {/* --- LEADERBOARD COMPONENT --- */}
            {/* Menerima currentScore untuk highlight dan refreshTrigger untuk update otomatis */}
            <LeaderboardUI currentScore={score} refreshTrigger={leaderboardTrigger} />

            {/* Restart Button */}
            <div className="mt-4 sm:mt-6">
              <button
                onClick={handleRestartClick}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all rounded-sm py-3 text-sm sm:text-lg tracking-wider shadow-lg"
              >
                TRY AGAIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
