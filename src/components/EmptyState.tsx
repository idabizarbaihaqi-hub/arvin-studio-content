import React, { useRef, useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  BarChart3,
  FileText,
  Flame,
  Film,
  Hash,
  Calendar,
  Layers,
  TrendingUp,
  Image as ImageIcon,
  Video,
  PenTool,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { TechArtBlob } from './TechArtBlob';
import { RobotMascotWelcome } from './RobotMascotWelcome';
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
  const [showMoreTools, setShowMoreTools] = useState(false);

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

  // 6 Primary AI Tools matching the reference image layout exactly
  const primaryAiTools = [
    {
      id: 'ai-content-generator',
      title: 'AI Content Generator',
      desc: 'Generate high-quality content instantly.',
      badge: 'Premium',
      badgeType: 'amber',
      icon: Sparkles,
      action: () => {
        if (onNavigate) {
          onNavigate('chat');
        } else if (onSelectPrompt) {
          onSelectPrompt('Buatkan konsep dan strategi konten kreatif berbobot tinggi untuk: ');
        }
      },
    },
    {
      id: 'ai-thumbnail-generator',
      title: 'AI Thumbnail Generator',
      desc: 'Create engaging video thumbnails.',
      badge: 'Premium',
      badgeType: 'amber',
      icon: Video,
      action: () => fileInputRef.current?.click(),
    },
    {
      id: 'ai-content-analyzer',
      title: 'AI Content Analyzer',
      desc: 'Optimize your content performance.',
      badge: 'Free',
      badgeType: 'gray',
      icon: BarChart3,
      action: () => onNavigate && onNavigate('content-analyzer'),
    },
    {
      id: 'ai-image-tools',
      title: 'AI Image Tools',
      desc: 'Edit and enhance visuals with AI.',
      badge: 'Free',
      badgeType: 'gray',
      icon: ImageIcon,
      action: () => fileInputRef.current?.click(),
    },
    {
      id: 'ai-copywriting',
      title: 'AI Copywriting',
      desc: 'Craft compelling copy.',
      badge: 'Premium',
      badgeType: 'amber',
      icon: FileText,
      action: () => onNavigate && onNavigate('caption-maker'),
    },
    {
      id: 'ai-creator-tools',
      title: 'AI Creator Tools',
      desc: 'Advanced tools for creators.',
      badge: 'Premium',
      badgeType: 'amber',
      icon: PenTool,
      action: () => onNavigate && onNavigate('hook-generator'),
    },
  ];

  // Secondary suite of AI Creator tools preserved for 100% functionality
  const secondaryTools = [
    {
      id: 'edit-video',
      title: 'Edit Video',
      desc: 'Studio pemotong, rasio 9:16, teks, filter, dan ekspor video.',
      badge: '🔒 Premium',
      icon: Film,
      view: 'edit-video' as ActiveView,
    },
    {
      id: 'script-maker',
      title: 'Script Maker',
      desc: 'Naskah video terstruktur untuk TikTok, Reels, dan Shorts.',
      badge: 'Populer',
      icon: Film,
      view: 'script-maker' as ActiveView,
    },
    {
      id: 'hook-generator',
      title: 'Hook Generator',
      desc: 'Kalimat pembuka bervoltase tinggi untuk menahan scroll penonton.',
      badge: 'Viral',
      icon: Flame,
      view: 'hook-generator' as ActiveView,
    },
    {
      id: 'hashtag-generator',
      title: 'Hashtag Generator',
      desc: 'Kurasi tagar bertarget sesuai platform dan topik konten.',
      badge: 'SEO',
      icon: Hash,
      view: 'hashtag-generator' as ActiveView,
    },
    {
      id: 'content-planner',
      title: 'Content Planner',
      desc: 'Jadwal rilis, pilar editorial, dan kalender konten otomatis.',
      badge: 'Workflow',
      icon: Calendar,
      view: 'content-planner' as ActiveView,
    },
    {
      id: 'analytics',
      title: 'Analytics Konten',
      desc: 'Pantau riwayat penggunaan alat AI dan metrik produktivitas.',
      badge: 'Insight',
      icon: TrendingUp,
      view: 'analytics' as ActiveView,
    },
    {
      id: 'history',
      title: 'Riwayat Ekspor',
      desc: 'Akses kembali semua teks, caption, dan naskah yang pernah dibuat.',
      badge: 'Arsip',
      icon: Layers,
      view: 'history' as ActiveView,
    },
  ];

  return (
    <div
      id="arvin-studio-home"
      className="w-full flex-1 flex flex-col px-4 sm:px-6 py-2 sm:py-4 space-y-5 sm:space-y-6 max-w-lg sm:max-w-2xl lg:max-w-3xl mx-auto select-text pb-10"
    >
      {/* Hidden File Input for Vision AI Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. HERO SECTION (Identical to Visual Reference Image) */}
      <section
        id="home-hero-section"
        className="w-full flex items-center justify-between gap-4 pt-1 sm:pt-2"
      >
        <div className="flex-1 min-w-0 pr-1">
          {/* Greeting */}
          <p className="text-[13px] sm:text-sm font-medium text-slate-700 leading-tight">
            Halo{currentUser?.fullName ? `, ${currentUser.fullName}` : ''}, siap berkarya?
          </p>

          {/* Main Headline */}
          <h1 className="text-[21px] sm:text-3xl font-black tracking-tight text-slate-950 leading-[1.18] mt-1 mb-1.5 sm:mb-2">
            Semua Tools Kreator,<br />
            Dalam Satu Studio.
          </h1>

          {/* Subtitle */}
          <p className="text-[11.5px] sm:text-[13px] text-slate-500 leading-snug max-w-[210px] sm:max-w-md">
            Berbagai AI tools untuk membuat, menganalisis, dan mengembangkan konten.
          </p>

          {/* Blue CTA Button */}
          <button
            id="btn-hero-mulai-berkarya"
            type="button"
            onClick={() => {
              if (onNavigate) {
                onNavigate('chat');
              } else if (onSelectPrompt) {
                onSelectPrompt('Halo ARVIN STUDIO, saya ingin membuat ide konten hari ini.');
              }
            }}
            className="mt-3 sm:mt-4 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-98 text-white text-[12.5px] sm:text-sm font-semibold shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <span>Mulai Berkarya</span>
          </button>
        </div>

        {/* Right: Robot AI Mascot ARVIN STUDIO yang Melompat-lompat Menyambut Pengguna */}
        <div className="shrink-0 flex items-center justify-center pl-1">
          <RobotMascotWelcome />
        </div>
      </section>

      {/* 2. SECTION: AI TOOLS (2-Column Rounded Cards with Badges) */}
      <section id="home-ai-tools-section" className="w-full">
        <h2 className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight mb-2.5">
          AI Tools
        </h2>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {primaryAiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                id={`card-${tool.id}`}
                onClick={tool.action}
                className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100/95 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
              >
                <div>
                  {/* Top Row: Icon + Badge */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-800 group-hover:text-blue-600 transition-colors">
                      <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2} />
                    </div>

                    <span
                      className={`text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        tool.badgeType === 'amber'
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tool.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-slate-900 text-[12.5px] sm:text-[13.5px] leading-tight group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 leading-snug mt-1 line-clamp-2">
                    {tool.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. SECTION: TOOLS POPULER (Bento Cards with Miniature Tech Graphic) */}
      <section id="home-popular-tools-section" className="w-full">
        <h2 className="text-[15px] sm:text-base font-bold text-slate-900 tracking-tight mb-2.5">
          Tools Populer
        </h2>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* Bento Card 1: AI Content Generator */}
          <div
            id="popular-card-content-gen"
            onClick={() => {
              if (onNavigate) {
                onNavigate('chat');
              } else if (onSelectPrompt) {
                onSelectPrompt('Buatkan naskah video pendek viral untuk media sosial.');
              }
            }}
            className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100/95 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-2">
              <AppLogo type="header" size={19} variant="dark" />
              <span className="text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
                Popular
              </span>
            </div>

            <div className="flex items-end justify-between mt-1">
              <h3 className="font-bold text-slate-900 text-[12.5px] sm:text-[13.5px] leading-tight group-hover:text-blue-600 transition-colors">
                AI Content<br />Generator
              </h3>
              <TechArtBlob size={58} mini className="-mr-1 -mb-1 opacity-95 group-hover:scale-105 transition-transform" />
            </div>
          </div>

          {/* Bento Card 2: AI Thumbnail Generator */}
          <div
            id="popular-card-thumb-gen"
            onClick={() => fileInputRef.current?.click()}
            className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100/95 shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.99]"
          >
            <div className="flex items-center justify-between mb-2">
              <AppLogo type="header" size={19} variant="dark" />
              <span className="text-[9.5px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309]">
                Popular
              </span>
            </div>

            <div className="flex items-end justify-between mt-1">
              <h3 className="font-bold text-slate-900 text-[12.5px] sm:text-[13.5px] leading-tight group-hover:text-blue-600 transition-colors">
                AI Thumbnail<br />Generator
              </h3>
              <TechArtBlob size={58} mini className="-mr-1 -mb-1 opacity-95 group-hover:scale-105 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECTION: UNLOCK ARVIN STUDIO PRO */}
      <section
        id="home-unlock-pro-card"
        className="w-full bg-white rounded-2xl p-4 sm:p-5 border border-slate-100/95 shadow-[0_2px_8px_rgba(0,0,0,0.03)] relative overflow-hidden"
      >
        {/* Subtle Watermark Glow */}
        <div
          aria-hidden="true"
          className="absolute -right-6 -bottom-6 opacity-[0.08] pointer-events-none"
        >
          <TechArtBlob size={180} />
        </div>

        <div className="relative z-10">
          <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-2">
            Unlock ARVIN STUDIO PRO
          </h3>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11.5px] sm:text-xs text-slate-700">
            <span className="flex items-center gap-1.5">• Akses semua tools</span>
            <span className="flex items-center gap-1.5">• Prioritas support</span>
            <span className="flex items-center gap-1.5">• Fitur eksklusif</span>
            <span className="flex items-center gap-1.5">• Tanpa batasan penggunaan</span>
          </div>

          <button
            id="btn-home-upgrade-pro"
            type="button"
            onClick={() => onNavigate && onNavigate('premium')}
            className="mt-3.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-98 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer inline-block"
          >
            Upgrade Premium
          </button>
        </div>
      </section>

      {/* 5. STATS CARD (Footer Summary Bar - Real Data) */}
      <section
        id="home-stats-bar"
        className="w-full bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-100/95 shadow-[0_1px_3px_rgba(0,0,0,0.02)] grid grid-cols-3 gap-2"
      >
        {/* Col 1: AI Uses Today */}
        <div className="flex flex-col">
          <span className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
            AI Uses Today:
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
            {chatQuota ? `${chatQuota.count} / ${chatQuota.isPremium ? '∞' : chatQuota.limit}` : '0 / 3'}
          </span>
        </div>

        {/* Col 2: Tools Used */}
        <div className="flex flex-col">
          <span className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
            Tools Used:
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5">
            {primaryAiTools.length + secondaryTools.length} Tools
          </span>
        </div>

        {/* Col 3: Premium Status */}
        <div className="flex flex-col">
          <span className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
            Premium Status:
          </span>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('premium')}
            className="text-xs sm:text-sm font-bold text-left cursor-pointer mt-0.5 hover:underline text-slate-900"
          >
            {chatQuota?.isPremium ? (
              <span className="text-blue-600 font-extrabold">PRO (Active)</span>
            ) : (
              <span>Starter</span>
            )}
          </button>
        </div>
      </section>

      {/* 6. EXPANDABLE ALL CREATOR TOOLS (Preserving 100% Functionality) */}
      <div className="w-full pt-1">
        <button
          type="button"
          onClick={() => setShowMoreTools(!showMoreTools)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100/70 hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>Semua AI Creator Tools Lengkap ({secondaryTools.length})</span>
          {showMoreTools ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showMoreTools && (
          <div className="grid grid-cols-2 gap-2 mt-2.5 animate-fadeIn">
            {secondaryTools.map((tool) => {
              const Icon = tool.icon;
              return (
                <div
                  key={tool.id}
                  onClick={() => onNavigate && onNavigate(tool.view)}
                  className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {tool.badge}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                    {tool.desc}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
