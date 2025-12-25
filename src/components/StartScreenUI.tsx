interface StartScreenUIProps {
  onStart: () => void;
}

export default function StartScreenUI({ onStart }: StartScreenUIProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-30 p-4 font-pixel h-full overflow-y-auto">
      <div className="text-center max-w-xl w-full bg-gray-800 p-6 sm:p-8 border-4 border-double border-red-600 shadow-2xl relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 animate-pulse"></div>

        <h1 className="text-3xl sm:text-5xl font-black text-white mb-1 tracking-tighter">
          ZOMBIE <span className="text-red-600">DEFENSE</span>
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm tracking-[0.2em] mb-6">PROJECT: DEADEYE</p>

        {/* Narrative / Instructions Box [cite: 172, 174, 55] */}
        <div className="bg-black/40 p-4 text-left space-y-3 mb-8 border-l-4 border-yellow-500">
          <p className="text-yellow-400 text-xs font-bold mb-1">BRIEFING DARI JENDRAL:</p>
          <ul className="text-gray-300 text-xs sm:text-sm space-y-2 list-disc list-inside">
            <li>
              <strong className="text-white">SHOOT TO KILL:</strong> Hentikan zombie sebelum mereka memasuki gedung.
            </li>
            <li>
              <strong className="text-red-400">BIG BRUTE (Zombie Raksasa):</strong> Butuh <span className="underline">2 tembakan</span> untuk dijatuhkan.
            </li>
            <li>
              <strong className="text-green-400">RUNNER (Zombie Cepat):</strong> Bergerak sangat cepat. <span className="underline">Jangan lengah.</span>
            </li>
            <li>
              <strong className="text-blue-400">CIVILIANS:</strong> JANGAN DITEMBAK! Biarkan masuk untuk bonus skor. Salah tembak = penalti.
            </li>
            <li>
              <strong className="text-pink-400">HEARTS:</strong> Tembak = hancur. Biarkan masuk = <strong>+1 Nyawa</strong>.
            </li>
          </ul>
        </div>

        <button onClick={onStart} className="w-full group relative bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">
          <span className="text-xl sm:text-2xl tracking-widest group-hover:animate-pulse">START MISSION</span>
        </button>

        <p className="mt-4 text-[10px] text-gray-600">"Buktikan kamu tidak pernah meleset, Letnan!"</p>
      </div>
    </div>
  );
}
