import { supabase } from '../lib/supabase';

// Tipe data disesuaikan dengan Supabase
export interface ScoreEntry {
  id?: number;
  username: string;
  score: number;
  created_at?: string; // Supabase mengembalikan string ISO date
}

const KEY_USERNAME = 'zombie_defense_username';

// --- USERNAME (Tetap LocalStorage agar browser ingat) ---
export const getStoredUsername = (): string | null => {
  return localStorage.getItem(KEY_USERNAME);
};

export const setStoredUsername = (username: string) => {
  localStorage.setItem(KEY_USERNAME, username);
};

// --- LEADERBOARD (Sekarang Async ke Supabase) ---

export const getLeaderboard = async (): Promise<ScoreEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('username, score, created_at')
      .order('score', { ascending: false }) // Urutkan score tertinggi
      .limit(10); // Ambil top 10

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Gagal mengambil leaderboard:', err);
    return [];
  }
};

export const saveScore = async (username: string, score: number) => {
  if (score <= 0) return; // Jangan spam database dengan skor 0

  try {
    const { error } = await supabase.from('leaderboard').insert([{ username, score }]);

    if (error) throw error;
    console.log('Score saved to cloud!');
  } catch (err) {
    console.error('Gagal menyimpan score:', err);
  }
};
