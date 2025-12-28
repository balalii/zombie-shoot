import { useState, useEffect, useRef, useMemo } from 'react';

interface DialogUIProps {
  onComplete: () => void;
  username: string; // Tambahkan prop ini
}

export default function DialogUI({ onComplete, username }: DialogUIProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Gunakan useMemo agar script dibuat ulang hanya jika username berubah
  // Kita ganti "Masha" dengan variable username
  const DIALOG_SCRIPT = useMemo(
    () => [
      { speaker: 'Jendral (via radio)', text: `Letnan ${username}, ini Jendral. Lapor status, kamu sudah di posisi?`, color: 'text-yellow-500' },
      { speaker: `Letnan ${username} (via radio)`, text: 'Jendral, posisi aman. Saya sudah di titik pantau dan siap menjalankan misi.', color: 'text-green-400' },
      { speaker: 'Jendral (via radio)', text: 'Bagus. Dengar baik-baik. Di bawah sana adalah zona merah.', color: 'text-yellow-500' },
      { speaker: 'Jendral (via radio)', text: 'Tugasmu sederhana: Lenyapkan setiap zombi yang mendekati Gedung pertahanan.', color: 'text-yellow-500' },
      { speaker: `Letnan ${username} (via radio)`, text: 'Dimengerti. Tembak di tempat.', color: 'text-green-400' },
      { speaker: 'Jendral (via radio)', text: `Tahan dulu, ${username}. Ada sipil yang berlari menuju lokasimu. Jangan sampai salah sasaran!`, color: 'text-yellow-500' },
      { speaker: 'Jendral (via radio)', text: 'Sipil yang selamat akan menaikkan reputasi dan skormu. Salah tembak sipil, misi bisa gagal.', color: 'text-yellow-500' },
      { speaker: `Letnan ${username} (via radio)`, text: 'Bagaimana cara membedakannya di tengah kekacauan ini?', color: 'text-green-400' },
      { speaker: 'Jendral (via radio)', text: 'Gunakan instingmu. Sipil berlari panik dan berteriak. Zombi... mereka cuma lapar.', color: 'text-yellow-500' },
      { speaker: `Letnan ${username} (via radio)`, text: 'Siap laksanakan. Tidak akan ada peluru yang terbuang.', color: 'text-green-400' },
      { speaker: 'Jendral (via radio)', text: 'Buktikan kemampuanmu, Soldier!', color: 'text-red-600 font-bold' },
      { speaker: `Letnan ${username} (via radio)`, text: 'Roger that!', color: 'text-green-400 font-bold' },
      { speaker: 'Jendral (via radio)', text: 'Musuh terdeteksi! 500 meter! Buka mata, stabilkan bidikan!', color: 'text-yellow-500' },
    ],
    [username]
  );

  const currentLine = DIALOG_SCRIPT[currentIndex];

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);

    let charIndex = 0;
    const fullText = currentLine.text;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      charIndex++;
      setDisplayedText(fullText.slice(0, charIndex));

      if (charIndex >= fullText.length) {
        setIsTyping(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 30);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [currentIndex, currentLine]); // Tambahkan currentLine sebagai dependency

  const handleNext = () => {
    if (isTyping) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayedText(currentLine.text);
      setIsTyping(false);
    } else {
      if (currentIndex < DIALOG_SCRIPT.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onComplete();
      }
    }
  };

  return (
    <div className="absolute inset-0 flex items-end sm:items-center justify-center bg-black/80 z-50 p-4 font-pixel cursor-pointer" onClick={handleNext}>
      <div className="relative w-full max-w-2xl bg-gray-900 border-2 border-green-800 p-4 sm:p-6 shadow-[0_0_20px_rgba(0,255,0,0.2)] mb-10 sm:mb-0">
        {/* Dekorasi Scanlines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none bg-[length:100%_2px,3px_100%]"></div>

        {/* Header Transmisi */}
        <div className="flex justify-between items-center mb-2 sm:mb-4 border-b border-gray-700 pb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full animate-pulse ${currentLine.speaker.includes('Jendral') ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-gray-400 text-[10px] sm:text-xs tracking-widest uppercase">ENCRYPTED CHANNEL 104.5</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="text-gray-500 hover:text-white text-[10px] sm:text-xs underline z-20"
          >
            SKIP &gt;&gt;
          </button>
        </div>

        {/* Konten Dialog - FONT LEBIH KECIL DI MOBILE */}
        <div className="relative z-10 min-h-[80px] sm:min-h-[120px]">
          {/* Nama Speaker: text-[10px] di HP, text-sm di Desktop */}
          <p className={`text-[10px] sm:text-sm font-bold tracking-wider mb-1 uppercase ${currentLine.color.includes('green') ? 'text-green-600' : 'text-yellow-600'}`}>{currentLine.speaker}</p>

          {/* Isi Dialog: text-xs (sangat kecil tapi jelas pixel fontnya) di HP, text-xl di Desktop */}
          <p className={`text-xs sm:text-xl leading-relaxed ${currentLine.color} drop-shadow-md font-mono`}>
            {displayedText}
            <span className="animate-pulse">_</span>
          </p>
        </div>

        {/* Footer Hint */}
        <div className="mt-2 sm:mt-4 text-right">
          <span className="text-gray-500 text-[8px] sm:text-xs animate-bounce">{isTyping ? 'TRANSMITTING...' : 'TAP TO CONTINUE >'}</span>
        </div>
      </div>
    </div>
  );
}
