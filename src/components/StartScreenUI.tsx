interface StartScreenUIProps {
  onStart: () => void;
}

export default function StartScreenUI({ onStart }: StartScreenUIProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-30 text-white p-4">
      <div className="text-center space-y-6 sm:space-y-8 px-4 w-full max-w-md animate-fade-in">
        {/* Judul Game */}
        <div>
          {/* Ukuran font lebih kecil di mobile, lebih besar di layar sm (small) ke atas */}
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-1 sm:mb-2 tracking-wider">ZOMBIE</h1>
          <h2 className="text-6xl sm:text-7xl font-bold text-red-500">CROSSROAD</h2>
        </div>

        {/* Instruksi Singkat */}
        {/* Ukuran teks disesuaikan untuk mobile dan desktop */}
        <p className="text-base sm:text-lg text-gray-300 max-w-sm mx-auto">Tap para zombie untuk bertahan hidup. Jangan sampai salah tembak warga sipil!</p>

        {/* Tombol Mulai */}
        <button
          onClick={onStart}
          // Ukuran font dan padding tombol disesuaikan
          className="w-full bg-green-600 hover:bg-green-700 text-white text-2xl sm:text-3xl font-bold py-4 sm:py-5 px-8 sm:px-10 rounded-xl transition-all transform hover:scale-105 active:scale-95 animate-pulse-slow"
        >
          MULAI GAME
        </button>
      </div>
    </div>
  );
}
