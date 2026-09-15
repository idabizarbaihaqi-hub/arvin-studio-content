import React, { useRef, useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  MessageSquare,
  BarChart3,
  Lightbulb,
  FileText,
  Flame,
  Film,
  Hash,
  Calendar,
  ArrowRight,
  Crown,
  CheckCircle2,
  TrendingUp,
  Layers,
  Zap,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ChatImageAttachment, ActiveView, UserProfile } from '../types';

interface EmptyStateProps {
  onSelectImage?: (attachment: ChatImageAttachment) => void;
  onSelectPrompt?: (promptText: string) => void;
  onNavigate?: (view: ActiveView) => void;
  currentUser?: UserProfile | null;
  chatQuota?: {
    count: number;
    limit: number;
    remaining: number;
    isPremium: boolean;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectImage,
  onSelectPrompt,
  onNavigate,
  currentUser,
  chatQuota,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar (PNG, JPG, WEBP) yang dapat dianalisis.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && onSelectImage) {
        onSelectImage({
          data: dataUrl,
          mimeType: file.type || 'image/jpeg',
          name: file.name,
          sizeBytes: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const popularTools = [
    {
      id: 'chat-tool',
      title: 'Chat AI & Vision',
      desc: 'Tanya jawab ide, strategi, serta analisis tangkapan layar postingan',
      icon: MessageSquare,
      badge: 'Free / Pro',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => {
        const textarea = document.getElementById('chat-textarea');
        textarea?.focus();
      },
    },
    {
      id: 'script-maker',
      title: 'Script Maker',
      desc: 'Naskah video terstruktur untuk TikTok, Reels, dan YouTube Shorts',
      icon: Film,
      badge: 'Populer',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      action: () => onNavigate && onNavigate('script-maker'),
    },
    {
      id: 'caption-maker',
      title: 'Caption Maker',
      desc: 'Generator 3 variasi caption berkonversi tinggi lengkap dengan hashtag',
      icon: FileText,
      badge: 'Viral',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => onNavigate && onNavigate('caption-maker'),
    },
    {
      id: 'hook-generator',
      title: 'Hook Generator',
      desc: 'Kalimat pembuka bervoltase tinggi untuk menahan scroll penonton',
      icon: Flame,
      badge: 'Retensi Tinggi',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => onNavigate && onNavigate('hook-generator'),
    },
    {
      id: 'content-analyzer',
      title: 'Content Analyzer',
      desc: 'Audit skor metriks, engagement, dan saran perbaikan copy konten',
      icon: BarChart3,
      badge: 'Insight',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => onNavigate && onNavigate('content-analyzer'),
    },
    {
      id: 'content-ideas',
      title: 'Content Ideas',
      desc: 'Eksplorasi topik tren, sudut pandang unik, dan pilar konten spesifik',
      icon: Lightbulb,
      badge: 'Kreatif',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      action: () => onNavigate && onNavigate('content-ideas'),
    },
  ];

  const allAiTools = [
    {
      id: 'hashtag-generator',
      title: 'Hashtag Generator',
      desc: 'Kurasi tagar terarah sesuai niche dan platform target',
      icon: Hash,
      badge: 'Free',
      view: 'hashtag-generator' as ActiveView,
    },
    {
      id: 'content-planner',
      title: 'Content Planner',
      desc: 'Atur jadwal rilis, pilar editorial, dan kalender konten',
      icon: Calendar,
      badge: 'Pro',
      view: 'content-planner' as ActiveView,
    },
    {
      id: 'analytics',
      title: 'Analytics Konten',
      desc: 'Pantau riwayat penggunaan alat AI dan metrik produktivitas',
      icon: TrendingUp,
      badge: 'Pro',
      view: 'analytics' as ActiveView,
    },
    {
      id: 'history',
      title: 'Riwayat Ekspor',
      desc: 'Akses kembali semua teks, caption, dan naskah yang pernah dibuat',
      icon: Layers,
      badge: 'Tersimpan',
      view: 'history' as ActiveView,
    },
  ];

  const quickPrompts = [
    {
      label: 'Analisis Screenshot Postingan',
      prompt:
        'Tolong analisis tangkapan layar postingan ini, berikan evaluasi performa visual, hook pembuka, dan saran perbaikan agar interaksinya lebih tinggi.',
    },
    {
      label: 'Buat 3 Variasi Caption Menarik',
      prompt:
        'Tolong buatkan 3 opsi caption kreatif untuk produk/konten ini lengkap dengan hook pembuka, storytelling, dan call-to-action yang relevan.',
    },
    {
      label: 'Riset 5 Sudut Pandang Konten Viral',
      prompt:
        'Berikan 5 ide konten yang tidak umum tapi sangat relevan dengan niche kreator edukasi & bisnis digital di tahun ini.',
    },
  ];

  return (
    <div
      id="arvin-studio-home"
      className="w-full flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-7 sm:space-y-9 max-w-5xl mx-auto select-text"
    >
      {/* Hidden File Input for Vision AI */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. HERO SECTION (Clean White + Electric Blue Accents + Geometric Abstract Tech Art) */}
      <section
        id="home-hero-section"
        className="w-full relative overflow-hidden bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgba(37,99,235,0.05)] p-6 sm:p-10 lg:p-12 text-center flex flex-col items-center"
      >
        {/* Subtle Futuristic Abstract Graphic (Pure CSS & SVG lines - strictly no AI robots) */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none overflow-hidden opacity-60"
        >
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-blue-100/70 via-indigo-50/40 to-transparent blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-sky-100/60 to-transparent blur-2xl" />
          <svg
            className="absolute top-0 right-0 w-96 h-96 text-blue-100/40 stroke-current"
            viewBox="0 0 200 200"
            fill="none"
          >
            <circle cx="150" cy="50" r="80" strokeWidth="0.75" strokeDasharray="3 3" />
            <circle cx="150" cy="50" r="50" strokeWidth="0.75" />
            <path d="M 50 150 Q 120 80 180 120" strokeWidth="1" />
          </svg>
        </div>

        {/* Studio Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50/90 border border-blue-200/80 mb-4 sm:mb-5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-blue-700">
            SaaS AI Kreator Konten Modern
          </span>
        </div>

        {/* Greeting */}
        <p className="relative z-10 text-xs sm:text-sm font-semibold text-slate-500 mb-1.5 sm:mb-2">
          Halo{currentUser?.fullName ? `, ${currentUser.fullName}` : ''}, siap berkarya?
        </p>

        {/* Primary Headline */}
        <h1 className="relative z-10 text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 max-w-2xl leading-tight sm:leading-tight mb-3 sm:mb-4">
          Semua Tools Kreator, Dalam Satu Studio.
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed mb-6 sm:mb-8 font-normal">
          ARVIN STUDIO adalah workspace AI cerdas untuk membuat, menganalisis, dan mengembangkan
          konten berkualitas tinggi dalam hitungan detik.
        </p>

        {/* Primary Actions */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            id="btn-hero-cta"
            type="button"
            onClick={() => {
              const textarea = document.getElementById('chat-textarea');
              if (textarea) {
                textarea.focus();
                textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mulai Berkarya</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>

          <button
            id="btn-hero-upload-cta"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-slate-600" />
            <span>Unggah Gambar (Vision AI)</span>
          </button>
        </div>
      </section>

      {/* 2. USER STATISTICS (Minimal, clean, Real Data, No Dummy) */}
      <section
        id="home-user-stats"
        aria-label="Statistik Penggunaan Akun"
        className="w-full grid grid-cols-3 gap-2.5 sm:gap-4"
      >
        {/* Stat 1: AI Uses Today */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:border-slate-300">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            AI Uses Today
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-slate-900">
              {chatQuota ? chatQuota.count : '-'}
            </span>
            <span className="text-xs sm:text-sm text-slate-400 font-medium">
              /{chatQuota ? (chatQuota.isPremium ? '∞' : chatQuota.limit) : '3'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 hidden sm:inline">
            {chatQuota?.isPremium ? 'Akses Unlimited' : 'Reset harian 00:00 WIB'}
          </span>
        </div>

        {/* Stat 2: Tools Available */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:border-slate-300">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Tools Digunakan
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-lg sm:text-2xl font-black text-slate-900">
              {popularTools.length + allAiTools.length}
            </span>
            <span className="text-xs sm:text-sm text-blue-600 font-bold">Tools</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 hidden sm:inline">
            Siap digunakan kapan saja
          </span>
        </div>

        {/* Stat 3: Premium Status */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3 sm:p-5 shadow-xs flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:border-slate-300">
          <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Premium Status
          </span>
          <div className="flex items-center gap-1.5">
            {chatQuota?.isPremium ? (
              <span className="text-xs sm:text-base font-extrabold text-amber-600 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>PRO</span>
              </span>
            ) : (
              <span className="text-xs sm:text-base font-extrabold text-slate-700">
                STARTER
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('premium')}
            className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold mt-1 hidden sm:inline text-left cursor-pointer"
          >
            {chatQuota?.isPremium ? 'Lihat Manfaat →' : 'Upgrade ke PRO →'}
          </button>
        </div>
      </section>

      {/* 3. MULTIMODAL VISION AI DROPZONE CARD */}
      <section
        id="home-vision-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full p-4 sm:p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer group ${
          isDragging
            ? 'border-blue-600 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Analisis Visual & Screenshot Postingan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  VISION AI
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Tarik gambar ke sini atau klik untuk mengunggah screenshot (PNG, JPG, WEBP maks 10 MB)
              </p>
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-100 group-hover:bg-blue-50 text-slate-700 group-hover:text-blue-700 text-xs font-semibold transition-colors shrink-0">
            Pilih Gambar
          </div>
        </div>
      </section>

      {/* 4. TOOLS POPULER SECTION */}
      <section id="home-popular-tools" className="w-full space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Tools Populer
            </h2>
            <p className="text-xs text-slate-500">
              Fitur favorit kreator untuk memproduksi konten berefek viral
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-600">Terbanyak Digunakan</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {popularTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                id={`popular-tool-card-${tool.id}`}
                onClick={tool.action}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tool.badgeColor}`}
                    >
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1 line-clamp-2">
                    {tool.desc}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                  <span>Gunakan Sekarang</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. ALL AI TOOLS GRID */}
      <section id="home-all-tools" className="w-full space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              AI Tools Tambahan
            </h2>
            <p className="text-xs text-slate-500">
              Manajemen editorial, kurasi hashtag, dan arsip riwayat karya Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {allAiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                id={`ai-tool-card-${tool.id}`}
                onClick={() => onNavigate && onNavigate(tool.view)}
                className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {tool.desc}
                  </p>
                </div>
                <div className="pt-3 mt-2 flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                  <span>Buka tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. QUICK PROMPTS CHIPS */}
      <section id="home-quick-prompts" className="w-full space-y-2.5">
        <div className="px-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Inspirasi Diskusi Cepat
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt && onSelectPrompt(item.prompt)}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 text-left text-xs font-medium text-slate-700 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-2 group"
            >
              <span>{item.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* 7. PREMIUM BANNER (Clean, Non-Pushy, High-End SaaS) */}
      <section
        id="home-premium-banner"
        className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6"
      >
        {/* Subtle glow art */}
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="space-y-2 text-center sm:text-left relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold tracking-wide border border-white/10">
            <Crown className="w-3.5 h-3.5" />
            <span>ARVIN STUDIO PRO</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            Unlock ARVIN STUDIO PRO
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Akses tak terbatas untuk Chat AI, Script Maker, Content Analyzer, dan semua AI Creator
            Tools tanpa limit harian.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-slate-300 justify-center sm:justify-start">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Tanpa Batas Harian
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Prioritas Pemrosesan
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              Badge Kreator Eksklusif
            </span>
          </div>
        </div>

        <button
          id="btn-home-upgrade-premium"
          type="button"
          onClick={() => onNavigate && onNavigate('premium')}
          className="relative z-10 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all shrink-0 cursor-pointer active:scale-98"
        >
          Upgrade Premium
        </button>
      </section>
    </div>
  );
};
