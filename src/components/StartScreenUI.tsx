import { useState, useEffect } from 'react';
import { getStoredUsername, setStoredUsername } from '../utils/gameStorage';
import { Trophy } from 'lucide-react';
import LeaderboardUI from './LeaderboardUI';

interface StartScreenUIProps {
  onStart: () => void;
}

export default function StartScreenUI({ onStart }: StartScreenUIProps) {
  const [username, setUsername] = useState<string>('');
  const [inputName, setInputName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  // State untuk Modal Leaderboard
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    const existingUser = getStoredUsername();
    if (existingUser) {
      setUsername(existingUser);
      setIsRegistered(true);
    }
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputName.trim().length > 0) {
      const finalName = inputName.trim().toUpperCase().substring(0, 10);
      setStoredUsername(finalName);
      setUsername(finalName);
      setIsRegistered(true);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/95 z-30 p-4 font-pixel h-full overflow-y-auto">
      <div className="text-center max-w-xl w-full bg-gray-800 p-6 sm:p-8 border-4 border-double border-red-600 shadow-2xl relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50 animate-pulse"></div>

        <h1 className="text-xl sm:text-5xl font-black text-white mb-1 tracking-tighter">
          ZOMBIE <span className="text-red-600">DEFENSE</span>
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm tracking-[0.2em] mb-6">Shooter, Survival</p>

        {!isRegistered ? (
          // --- FORM REGISTRASI ---
          <div className="animate-fade-in bg-black/40 p-6 border border-gray-600">
            <p className="text-yellow-400 text-sm mb-4">IDENTIFICATION REQUIRED</p>
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="ENTER CODENAME..."
                maxLength={10}
                className="w-full bg-gray-900 placeholder:text-xs sm:placeholder:text-2xl text-white text-center text-xl p-3 border-2 border-green-700 focus:border-green-400 focus:outline-none uppercase tracking-widest placeholder-gray-700"
                autoFocus
              />
              <button
                type="submit"
                disabled={!inputName.trim()}
                className="w-full text-xs sm:text-2xl bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 transition-colors tracking-wider"
              >
                CONFIRM IDENTITY
              </button>
            </form>
          </div>
        ) : (
          // --- MENU UTAMA ---
          <>
            <div className="mb-6 flex flex-col justify-between gap-y-5 items-baseline border-b border-gray-700 pb-2">
              {/* TOMBOL BUKA LEADERBOARD */}
              <button
                onClick={() => setShowLeaderboard(true)}
                className="flex self-center items-center animate-pulse gap-2 bg-yellow-900/20 hover:bg-yellow-900/40 text-yellow-500 px-3 py-1.5 rounded border border-yellow-700/50 text-xs transition-all group"
              >
                <Trophy className="w-3 h-3 group-hover:scale-110 transition-transform" />
                LEADERBOARD
              </button>
              <div className="text-left">
                <p className="text-gray-500 text-[10px]">OPERATOR NAME</p>
                <p className="text-xl text-green-400 font-bold tracking-widest animate-pulse">{username}</p>
              </div>
            </div>

            {/* Instruction Box */}
            <div className="bg-black/40 p-4 text-left space-y-3 mb-8 border-l-4 border-yellow-500 text-xs sm:text-sm">
              <p className="text-yellow-400 text-xs font-bold mb-1">TIPS:</p>
              <ul className="text-gray-300 text-xs sm:text-sm space-y-2 list-disc list-inside">
                <li>
                  <strong className="text-white">
                    SHOOT TO KILL:
                    <br />
                  </strong>{' '}
                  Hentikan zombie sebelum masuk.
                </li>
                <li>
                  <strong className="text-red-400">
                    BIG BRUTE:
                    <br />
                  </strong>{' '}
                  2x Tembakan.
                </li>
                <li>
                  <strong className="text-blue-400">
                    CIVILIANS:
                    <br />
                  </strong>{' '}
                  JANGAN DITEMBAK!
                </li>
              </ul>
            </div>

            <button onClick={onStart} className="w-full group relative bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-6 border-b-4 border-red-800 active:border-b-0 active:translate-y-1 transition-all">
              <span className="text-md sm:text-2xl tracking-widest group-hover:animate-pulse">START MISSION</span>
            </button>

            <p className="mt-4 text-[10px] text-gray-600">"Good luck, {username}."</p>
          </>
        )}
      </div>

      {/* --- MODAL LEADERBOARD (POPUP) --- */}
      {showLeaderboard && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in backdrop-blur-sm">
          <div className="w-full max-w-lg animate-[fadeIn_0.3s_ease-out]">
            {/* Kita kirim refreshTrigger Date.now() agar selalu ambil data baru saat dibuka */}
            <LeaderboardUI refreshTrigger={Date.now()} onClose={() => setShowLeaderboard(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
