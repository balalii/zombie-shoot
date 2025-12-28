import { useState, useEffect, useRef } from 'react';

interface DialogUIProps {
  onComplete: () => void;
}

const DIALOG_SCRIPT = [
  { speaker: 'Jendral (via radio)', text: 'Letnan Masha, ini Jendral, Lapor status, kamu sudah di posisi?', color: 'text-yellow-500' },
  { speaker: 'Letnan Masha (via radio)', text: 'Jendral, posisi aman, saya sudah di posisi dan siap menjalankan misi.', color: 'text-green-400' },
  { speaker: 'Jendral (via radio)', text: 'Bagus. Dengar baik-baik, parameter misinya sederhana. Di bawah sana adalah zona pembantaian.', color: 'text-yellow-500' },
  { speaker: 'Jendral (via radio)', text: 'Tugas utamamu adalah melenyapkan setiap zombi yang mendekati Gedung pertahanan. Semakin banyak yang kau jatuhkan, semakin tinggi skor operasimu.', color: 'text-yellow-500' },
  { speaker: 'Letnan Masha (via radio)', text: 'Dimengerti. Semua yang bergerak adalah target.', color: 'text-green-400' },
  { speaker: 'Jendral (via radio)', text: 'Koreksi, Letnan Masha. Tidak semua. Ada sipil yang bergerak menuju lokasimu. Mereka adalah prioritas sekunder.', color: 'text-yellow-500' },
  { speaker: 'Jendral (via radio)', text: 'Setiap sipil yang berhasil mencapai zona aman akan memberikan bonus skor yang signifikan.', color: 'text-yellow-500' },
  { speaker: 'Letnan Masha (via radio)', text: 'Bagaimana cara membedakannya?', color: 'text-green-400' },
  { speaker: 'Jendral (via radio)', text: 'Itulah tugasmu, Deadeye. Mereka berlari, tidak menyeret kaki. Mereka panik, tidak tanpa pikiran. Gunakan matamu.', color: 'text-yellow-500' },
  { speaker: 'Jendral (via radio)', text: 'Akurasi adalah segalanya dalam operasi ini. Satu kesalahan pada aset sipil akan mengakibatkan penalti skor yang berat. Friendly fire akan merusak reputasimu.', color: 'text-yellow-500' },
  { speaker: 'Letnan Masha (via radio)', text: 'Siap laksanakan, Saya tidak pernah meleset, Jendral.', color: 'text-green-400' },
  { speaker: 'Jendral (via radio)', text: 'Buktikan!!!', color: 'text-red-600 font-bold' },
  { speaker: 'Letnan Masha (via radio)', text: 'Roger that!!!', color: 'text-green-400 font-bold' },
  { speaker: 'Jendral (via radio)', text: 'Gelombang pertama terdeteksi. Lima ratus meter dan terus mendekat. Buka mata, stabilkan bidikan. Buat zombie-zombie itu menyesal telah datang ke sini.', color: 'text-yellow-500' },
];

export default function DialogUI({ onComplete }: DialogUIProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Ref untuk menyimpan interval ID agar pembersihan lebih aman
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentLine = DIALOG_SCRIPT[currentIndex];

  useEffect(() => {
    // 1. Reset state awal setiap ganti dialog
    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const fullText = currentLine.text; // Ambil text saat ini agar konsisten dalam closure

    // Bersihkan interval sebelumnya jika ada (safety check)
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      charIndex++;

      // PERBAIKAN UTAMA DI SINI:
      // Menggunakan .slice() menjamin kita mengambil string yang valid dari index 0 sampai charIndex.
      // Ini mencegah index 'undefined' dan memastikan huruf pertama selalu terambil.
      setDisplayedText(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        setIsTyping(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 30); // Kecepatan mengetik

    // Cleanup function saat component unmount atau currentIndex berubah
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex]); // Dependency hanya currentIndex

  const handleNext = () => {
    if (isTyping) {
      // Jika user klik saat sedang mengetik, hentikan interval dan tampilkan full text
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      // Lanjut ke dialog berikutnya
      if (currentIndex < DIALOG_SCRIPT.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete();
      }
    }
  };

  return (
    <div className="absolute inset-0 flex items-end sm:items-center justify-center bg-black/80 z-50 p-4 font-pixel cursor-pointer" onClick={handleNext}>
      <div className="relative w-full max-w-2xl bg-gray-900 border-2 border-green-800 p-6 shadow-[0_0_20px_rgba(0,255,0,0.2)] mb-10 sm:mb-0">
        {/* Dekorasi Garis Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>

        {/* Header Transmisi */}
        <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${currentLine.speaker.includes('Jendral') ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-gray-400 text-xs tracking-widest uppercase">ENCRYPTED CHANNEL 104.5</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="text-gray-500 hover:text-white text-xs underline z-20"
          >
            SKIP INTRO &gt;&gt;
          </button>
        </div>

        {/* Konten Dialog */}
        <div className="relative z-10 min-h-[120px]">
          <p className={`text-sm font-bold tracking-wider mb-2 uppercase ${currentLine.color.includes('green') ? 'text-green-600' : 'text-yellow-600'}`}>{currentLine.speaker}</p>
          <p className={`text-lg sm:text-xl leading-relaxed ${currentLine.color} drop-shadow-md`}>
            {displayedText}
            <span className="animate-pulse">_</span>
          </p>
        </div>

        {/* Footer Hint */}
        <div className="mt-4 text-right">
          <span className="text-gray-500 text-xs animate-bounce">{isTyping ? 'TRANSMITTING...' : 'TAP TO CONTINUE >'}</span>
        </div>
      </div>
    </div>
  );
}
