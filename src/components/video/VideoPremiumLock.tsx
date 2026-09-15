import React from 'react';
import {
  Lock,
  Crown,
  Sparkles,
  Scissors,
  Layers,
  Type,
  Volume2,
  Gauge,
  Palette,
  Download,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Film,
  Maximize2,
} from 'lucide-react';
import { AppLogo } from '../AppLogo';

interface VideoPremiumLockProps {
  onUpgrade: () => void;
  onBack: () => void;
  userEmail?: string | null;
}

export const VideoPremiumLock: React.FC<VideoPremiumLockProps> = ({
  onUpgrade,
  onBack,
  userEmail,
}) => {
  const benefits = [
    {
      icon: Scissors,
      title: 'Video editing tools',
      desc: 'Alat potong, rapikan, dan satukan klip video secara presisi.',
    },
    {
      icon: Film,
      title: 'Trim & Split',
      desc: 'Potong durasi awal-akhir dan pecah klip menjadi beberapa bagian.',
    },
    {
      icon: Maximize2,
      title: 'Crop & Resize',
      desc: 'Format aspect ratio 9:16 (TikTok/Reels/Shorts), 16:9, dan 1:1.',
    },
    {
      icon: Type,
      title: 'Text & Image',
      desc: 'Tambahkan judul, takarir estetik, watermark, dan overlay logo.',
    },
    {
      icon: Layers,
      title: 'Subtitle',
      desc: 'Dukungan timeline takarir dan teks pengiring pesan video.',
    },
    {
      icon: Volume2,
      title: 'Audio',
      desc: 'Kontrol volume, mute suara asli, dan kelola lapisan audio.',
    },
    {
      icon: Gauge,
      title: 'Speed Control',
      desc: 'Pengaturan kecepatan dinamis 0.5x, 0.75x, 1x, 1.25x, hingga 2x.',
    },
    {
      icon: Palette,
      title: 'Filter',
      desc: 'Grading filter visual estetik (Vibrant, Warm, Cinematic, B&W).',
    },
    {
      icon: Download,
      title: 'Export Video',
      desc: 'Ekspor video hasil edit dengan resolusi tinggi siap posting.',
    },
  ];

  return (
    <main
      id="video-premium-lock-view"
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] py-6 sm:py-10 px-4 sm:px-6 select-text"
    >
      <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            id="btn-lock-back-to-home"
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Kembali ke Studio</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Premium Only</span>
            </span>
          </div>
        </div>

        {/* Hero Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 text-center relative overflow-hidden">
          {/* Subtle accent backdrop */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-b from-blue-50/80 via-blue-50/20 to-transparent rounded-full pointer-events-none blur-2xl" />

          <div className="relative z-10 flex flex-col items-center">
            {/* Studio Icon with Lock Badge */}
            <div className="relative mb-4">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <span className="text-3xl sm:text-4xl select-none">🎬</span>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md border-2 border-white">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 mb-2">
              Edit Video
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed mb-4">
              Studio editing video profesional untuk kebutuhan kreator.
            </p>

            {/* Lock Notice Banner */}
            <div className="w-full max-w-md bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xs sm:text-sm font-bold text-amber-950 mb-0.5">
                  Fitur Premium Eksklusif
                </h2>
                <p className="text-[12px] sm:text-xs text-amber-800/90 leading-normal">
                  Edit Video hanya tersedia untuk pengguna Premium ARVIN STUDIO.
                  Tingkatkan akun Anda untuk membuka akses penuh ke seluruh alat editing video.
                </p>
              </div>
            </div>

            {/* Primary Upgrade CTA Button */}
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
              <button
                id="btn-upgrade-premium-from-lock"
                type="button"
                onClick={onUpgrade}
                className="flex-1 inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all cursor-pointer active:scale-[0.98]"
              >
                <Crown className="w-4.5 h-4.5 text-amber-300" />
                <span>Upgrade Premium</span>
              </button>

              <button
                id="btn-lock-secondary-back"
                type="button"
                onClick={onBack}
                className="inline-flex items-center justify-center text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 py-3.5 px-5 rounded-2xl transition-colors cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>

            {/* Strict Access Policy Note */}
            <p className="text-[11px] text-slate-400 mt-3 font-medium">
              Tidak ada trial gratis • Tidak memotong kuota AI • Akses tanpa batas untuk Premium
            </p>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Fitur Studio Video yang Akan Anda Dapatkan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua instrumen esensial untuk memproduksi video viral
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {benefits.map((b, idx) => {
              const IconComponent = b.icon;
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-blue-200 transition-colors flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        {b.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      {b.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Super Admin Notice (Discreet and Professional) */}
        <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="text-[11.5px] text-slate-600 leading-relaxed">
            <strong className="text-slate-800">Testing & Administrasi:</strong> Akun Super Admin berwenang (termasuk{' '}
            <span className="font-mono text-blue-700">id.agnesyakartika@gmail.com</span>) mendapatkan hak akses penuh secara langsung.
          </div>
        </div>
      </div>
    </main>
  );
};
