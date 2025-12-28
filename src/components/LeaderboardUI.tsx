import { useEffect, useState } from 'react';
import { getLeaderboard, ScoreEntry } from '../utils/gameStorage';
import { Loader2, X } from 'lucide-react';

interface LeaderboardUIProps {
  currentScore?: number; // Opsional: Untuk highlight skor pemain saat ini
  refreshTrigger?: number; // Opsional: Sinyal untuk memicu reload data
  onClose?: () => void; // Opsional: Jika ditampilkan sebagai modal popup
}

export default function LeaderboardUI({ currentScore, refreshTrigger, onClose }: LeaderboardUIProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fungsi untuk mengambil data dari Supabase
  const fetchScores = async () => {
    setLoading(true);
    // Kita panggil fungsi dari gameStorage.ts
    const data = await getLeaderboard();
    setScores(data);
    setLoading(false);
  };

  // Effect: Jalan saat pertama kali mount ATAU saat refreshTrigger berubah
  useEffect(() => {
    fetchScores();
  }, [refreshTrigger]);

  // Helper untuk format tanggal
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div className="w-full relative bg-black/80 border-2 border-yellow-600 p-4 rounded shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      {/* Header dengan Tombol Close (jika onClose ada) */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 className="text-yellow-500 font-bold tracking-[0.2em] text-sm sm:text-lg uppercase drop-shadow-md">GLOBAL RECORDS</h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-2 text-gray-500">
          <Loader2 className="animate-spin w-6 h-6 text-yellow-500" />
          <span className="text-[10px] tracking-widest animate-pulse">DOWNLOADING DATA...</span>
        </div>
      ) : scores.length === 0 ? (
        <p className="text-gray-500 text-center text-xs py-8">DATABASE EMPTY</p>
      ) : (
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-900 scrollbar-track-black">
          {scores.map((entry, index) => {
            // Cek apakah ini skor user saat ini (untuk highlight)
            // Logikanya: Jika currentScore ada DAN skor sama DAN username sama (opsional, disini cek skor saja untuk simpel)
            const isHighlight = currentScore && entry.score === currentScore;

            return (
              <div
                key={index}
                className={`flex justify-between items-center text-xs sm:text-sm p-2 rounded border transition-all
                  ${
                    isHighlight
                      ? 'bg-yellow-900/40 text-yellow-200 border-yellow-500 animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                      : index === 0
                      ? 'bg-gradient-to-r from-yellow-900/20 to-transparent border-yellow-800 text-yellow-100'
                      : 'bg-gray-900/50 border-gray-800 text-gray-400'
                  }
                `}
              >
                <div className="flex gap-3 items-center">
                  <span className={`font-mono font-bold w-6 text-center ${index < 3 ? 'text-yellow-500' : 'text-gray-600'}`}>#{index + 1}</span>
                  <span className="tracking-wider uppercase font-bold truncate max-w-[100px] sm:max-w-[140px]">{entry.username}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="text-[10px] text-gray-600 hidden sm:block font-mono">{formatDate(entry.created_at)}</span>
                  <span className="font-bold text-white font-mono text-right min-w-[60px]">{entry.score.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
