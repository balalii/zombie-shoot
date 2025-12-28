import { useEffect, useState } from 'react';
import { getLeaderboard, ScoreEntry } from '../utils/gameStorage';
import { Loader2 } from 'lucide-react'; // Pastikan install lucide-react atau gunakan text loading biasa

export default function LeaderboardUI({ currentScore }: { currentScore: number }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      // Beri sedikit delay agar user sadar sedang refresh data (optional UX)
      const data = await getLeaderboard();
      setScores(data);
      setLoading(false);
    };

    fetchScores();
  }, [currentScore]);

  // Format tanggal agar lebih mudah dibaca
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="w-full mt-4 bg-black/60 border border-gray-700 p-2 sm:p-4 min-h-[150px]">
      <h3 className="text-yellow-500 text-xs sm:text-sm tracking-[0.3em] text-center mb-3 border-b border-gray-700 pb-2 uppercase flex items-center justify-center gap-2">Global Top Operators</h3>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 space-y-2 text-gray-500">
          <Loader2 className="animate-spin w-6 h-6" />
          <span className="text-[10px] tracking-widest">CONNECTING TO HQ...</span>
        </div>
      ) : scores.length === 0 ? (
        <p className="text-gray-500 text-center text-xs py-4">NO DATA FOUND</p>
      ) : (
        <div className="space-y-1 sm:space-y-2 max-h-[120px] sm:max-h-[150px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-black">
          {scores.map((entry, index) => (
            <div
              key={index}
              className={`flex justify-between items-center text-[10px] sm:text-xs p-1.5 
                ${index === 0 ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-800' : 'bg-gray-800/50 text-gray-300'}
                hover:bg-gray-700/50 transition-colors
              `}
            >
              <div className="flex gap-2 sm:gap-3 items-center">
                <span className={`font-bold w-5 text-center ${index < 3 ? 'text-yellow-500' : 'text-gray-500'}`}>{index + 1}.</span>
                <span className="tracking-wider uppercase font-medium truncate max-w-[80px] sm:max-w-[120px]">{entry.username}</span>
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-gray-600 hidden sm:block text-[9px]">{formatDate(entry.created_at)}</span>
                <span className="font-bold text-white bg-black/30 px-2 py-0.5 rounded text-right min-w-[50px]">{entry.score}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
