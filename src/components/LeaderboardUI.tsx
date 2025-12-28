import { useEffect, useState } from 'react';
import { getLeaderboard, ScoreEntry } from '../utils/gameStorage';
import { Loader2, X } from 'lucide-react';

interface LeaderboardUIProps {
  currentScore?: number;
  refreshTrigger?: number;
  onClose?: () => void;
}

export default function LeaderboardUI({ currentScore, refreshTrigger, onClose }: LeaderboardUIProps) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    setLoading(true);
    const data = await getLeaderboard();
    setScores(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchScores();
  }, [refreshTrigger]);

  // --- UPDATE 1: Format Waktu Lebih Detail (Tanggal + Jam) ---
  const formatDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      // Hasil contoh: "29 Des, 14:30"
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false, // Format 24 jam
      });
    } catch {
      return '-';
    }
  };

  return (
    <div className="w-full relative bg-black/80 border-2 border-yellow-600 p-4 rounded shadow-[0_0_20px_rgba(234,179,8,0.2)]">
      {/* Header */}
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
                {/* KIRI: Rank & Username */}
                <div className="flex gap-2 sm:gap-3 items-center overflow-hidden">
                  <span className={`font-mono font-bold w-5 sm:w-6 text-center ${index < 3 ? 'text-yellow-500' : 'text-gray-600'}`}>#{index + 1}</span>
                  <span className="tracking-wider uppercase font-bold truncate max-w-[80px] sm:max-w-[140px]">{entry.username}</span>
                </div>

                {/* KANAN: Waktu & Score */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-0 sm:gap-4 text-right">
                  {/* UPDATE 2: Tampilkan waktu di Mobile (kecil) dan Desktop */}
                  <span className="text-[8px] sm:text-[10px] text-gray-500 font-mono">{formatDate(entry.created_at)}</span>

                  <span className="font-bold text-white font-mono min-w-[50px] sm:min-w-[60px]">{entry.score.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
