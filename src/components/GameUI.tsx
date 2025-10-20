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
  // State to control the visibility and animation of the game over screen
  const [isScreenVisible, setIsScreenVisible] = useState(false);

  useEffect(() => {
    // When the game ends, trigger the screen to become visible
    if (isGameOver) {
      setIsScreenVisible(true);
    }
  }, [isGameOver]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error attempting to enable full-screen mode:', err);
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleRestartClick = () => {
    // Start the fade-out animation
    setIsScreenVisible(false);
    // Wait for the animation to finish before calling the restart function
    setTimeout(() => {
      onRestart();
    }, 500); // This duration should match the transition duration
  };

  return (
    <div className="font-pixel">
      {/* HUD (Heads-Up Display) */}
      <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 flex justify-between items-center bg-gray-900/20 border-b-4 border-gray-600 z-10">
        {/* Health Hearts */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Use responsive icon sizes */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`${i < health ? 'fill-red-500 text-red-700' : 'fill-gray-800 text-gray-600'} transition-all duration-200`}
              // Set a base size for mobile and a larger size for sm screens and up
              size={24}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Score: Increased base font size for better mobile readability */}
          <div className="text-white text-2xl sm:text-3xl tracking-wider">{score}</div>
          {/* Fullscreen Button: Increased padding for a larger tap target on mobile */}
          <button onClick={toggleFullscreen} className="bg-blue-600 p-2 border-2 border-blue-800 hover:bg-blue-500 transition-colors active:bg-blue-700" aria-label="Toggle fullscreen">
            {/* Use responsive icon sizes here too */}
            <Maximize size={20} className="text-white" />
          </button>
        </div>
      </div>

      {/* Game Over Screen */}
      {isGameOver && (
        <div
          className={`
            absolute inset-0 flex items-center justify-center bg-black/80 z-20 p-4
            transition-opacity duration-500 ease-in-out
            ${isScreenVisible ? 'opacity-100' : 'opacity-0'}
          `}
        >
          {/* Main Panel */}
          <div className="text-center space-y-4 sm:space-y-6 w-full max-w-md bg-gray-800 p-6 sm:p-8 border-4 border-double border-red-500 shadow-pixel-blue">
            {/* Game Over Title: Responsive font size */}
            <h1 className="text-2xl sm:text-5xl text-red-500 [text-shadow:3px_3px_0_#000]">GAME OVER</h1>

            {/* Score Box */}
            <div className="bg-gray-900 py-3 sm:py-4 border-y-4 border-gray-600 space-y-1 sm:space-y-2">
              <p className="text-white text-lg sm:text-xl">FINAL SCORE</p>
              {/* Responsive font size for the score */}
              <p className="text-yellow-400 text-2xl sm:text-6xl">{score}</p>
            </div>

            {/* Restart Button: Responsive font size and padding */}
            <button
              onClick={handleRestartClick}
              className="w-full bg-green-500 text-white text-xl sm:text-3xl font-bold py-3 sm:py-4 px-6 border-4 border-green-900 shadow-pixel-green hover:bg-green-400 active:bg-green-600 transition-colors transform active:translate-y-px active:shadow-none"
            >
              <span className="animate-blink">PLAY AGAIN</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
