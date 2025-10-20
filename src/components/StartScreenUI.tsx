interface StartScreenUIProps {
  onStart: () => void;
}

export default function StartScreenUI({ onStart }: StartScreenUIProps) {
  return (
    // The background remains dark for high contrast
    <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-30 p-4 font-pixel">
      {/* Main container with a classic pixelated border.
        - Reduced vertical spacing on mobile (space-y-4) to fit on shorter screens.
        - Adjusted padding to be slightly less on mobile (p-6) and more on larger screens (sm:p-8).
      */}
      <div className="text-center space-y-4 sm:space-y-6 max-w-xl w-full bg-gray-800 p-6 sm:p-8 border-4 border-double border-red-500 shadow-pixel-blue">
        {/* Game Title */}
        <div>
          {/*
            - Scaled down the base font sizes for the title to prevent awkward wrapping on narrow screens.
            - It now starts smaller and scales up more aggressively.
          */}
          <h1 className="text-xl sm:text-5xl md:text-6xl text-white [text-shadow:3px_3px_0_#000] tracking-wider">ZOMBIE</h1>
          <h2 className="text-xl sm:text-6xl md:text-7xl text-red-500 [text-shadow:3px_3px_0_#000]">DEFENSE</h2>
        </div>

        {/* Short Instructions */}
        {/*
          - Slightly increased the base text size for better readability on mobile.
        */}
        <p className="text-sm md:text-base text-gray-100 max-w-xs mx-auto leading-relaxed">Tap zombies to survive. Don't hit the civilians!</p>

        {/* Start Button */}
        <button
          onClick={onStart}
          // Removing rounding, adding a hard border and shadow.
          // The hover/active states now shift the button slightly for a physical "press" feel.
          // - Adjusted font size to be slightly smaller on mobile (text-2xl) and scale up.
          // - Tweaked vertical padding for a better button shape on mobile.
          className="w-full bg-green-500 text-white text-sm sm:text-3xl font-bold py-3 sm:py-4 px-6 border-4 border-green-900 shadow-pixel-green hover:bg-green-400 active:bg-green-600 transition-all transform active:translate-y-px active:shadow-none focus:outline-none focus:ring-2 focus:ring-green-300"
        >
          <span className="animate-blink">START GAME</span>
        </button>
      </div>
    </div>
  );
}
