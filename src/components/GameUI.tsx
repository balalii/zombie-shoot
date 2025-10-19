import { Heart, Maximize } from 'lucide-react';
import { useEffect, useState } from 'react';

interface GameUIProps {
  health: number;
  score: number;
  isGameOver: boolean;
  onRestart: () => void;
}

export default function GameUI({ health, score, isGameOver, onRestart }: GameUIProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  // PERUBAHAN 1: State baru untuk mengontrol visibilitas dan animasi
  const [isScreenVisible, setIsScreenVisible] = useState(false);

  // PERUBAHAN 2: Gunakan useEffect untuk menampilkan layar saat game over
  useEffect(() => {
    if (isGameOver) {
      // Tampilkan layar "Game Over" dengan efek fade-in
      setIsScreenVisible(true);
    }
  }, [isGameOver]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // PERUBAHAN 3: Fungsi baru untuk menangani klik tombol restart
  const handleRestartClick = () => {
    // Mulai animasi fade-out
    setIsScreenVisible(false);

    // Tunggu animasi selesai (500ms), baru panggil fungsi onRestart
    setTimeout(() => {
      onRestart();
    }, 500);
  };

  return (
    <>
      {/* HUD di atas (tidak ada perubahan) */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex items-center gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart key={i} size={28} className={`${i < health ? 'fill-red-500 text-red-500' : 'fill-gray-700 text-gray-700'} transition-all duration-200`} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <div className="text-white text-2xl font-bold bg-black/50 px-4 py-2 rounded-lg">{score}</div>
          <button onClick={toggleFullscreen} className="bg-black/50 p-2 rounded-lg hover:bg-black/70 transition-all active:scale-95" aria-label="Toggle fullscreen">
            <Maximize size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* Game Over Screen */}
      {/* PERUBAHAN 4: Logika render diubah untuk menangani animasi */}
      {isGameOver && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center bg-black/80 z-20
            transition-opacity duration-500 ease-in-out
            ${isScreenVisible ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div className="text-center space-y-6 px-6">
            <h1 className="text-5xl font-bold text-red-500 mb-4">GAME OVER</h1>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
              <p className="text-white text-xl">Skor Akhir</p>
              <p className="text-yellow-400 text-6xl font-bold">{score}</p>
            </div>
            <button
              // Panggil fungsi handleRestartClick yang baru
              onClick={handleRestartClick}
              className="w-full bg-green-600 hover:bg-green-700 text-white text-2xl font-bold py-4 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95"
            >
              MAIN LAGI
            </button>
          </div>
        </div>
      )}
    </>
  );
}
