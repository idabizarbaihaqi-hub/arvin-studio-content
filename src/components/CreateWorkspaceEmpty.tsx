import React, { useRef } from 'react';
import {
  Sparkles,
  Film,
  Flame,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { ChatImageAttachment } from '../types';

interface CreateWorkspaceEmptyProps {
  onSelectPrompt: (promptText: string) => void;
  onSelectImage: (attachment: ChatImageAttachment) => void;
}

export const CreateWorkspaceEmpty: React.FC<CreateWorkspaceEmptyProps> = ({
  onSelectPrompt,
  onSelectImage,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar (PNG, JPG, WEBP) yang dapat dianalisis.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        onSelectImage({
          data: dataUrl,
          mimeType: file.type || 'image/jpeg',
          name: file.name,
          sizeBytes: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const quickPrompts = [
    {
      id: 'script',
      title: 'Naskah Video Pendek',
      prompt: 'Buatkan naskah video vertikal 30-45 detik yang padat dan engaging untuk TikTok/Reels tentang: ',
      icon: Film,
      color: 'from-blue-500 to-indigo-600',
      badge: 'Naskah',
    },
    {
      id: 'hook',
      title: 'Hook Pembuka Viral',
      prompt: 'Buatkan 5 hook bervoltase tinggi (3 detik pertama) untuk menghentikan scroll penonton tentang topik: ',
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
      badge: 'Retensi',
    },
    {
      id: 'caption',
      title: 'Caption & Copywriting',
      prompt: 'Tuliskan caption Instagram yang memikat dengan formula Hook-Story-Offer dan Call to Action untuk: ',
      icon: FileText,
      color: 'from-emerald-500 to-teal-600',
      badge: 'Copy',
    },
    {
      id: 'vision',
      title: 'Analisis Gambar/Thumbnail',
      prompt: '',
      isUpload: true,
      icon: ImageIcon,
      color: 'from-purple-500 to-violet-600',
      badge: 'Vision AI',
    },
  ];

  return (
    <div
      id="create-workspace-empty"
      className="w-full flex-1 flex flex-col justify-center max-w-xl mx-auto px-4 py-6 text-center select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Badge & Title */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
          <Sparkles className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-semibold mb-2">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          <span>Studio Pembuat Konten AI</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Apa yang ingin Anda buat hari ini?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
          Pilih salah satu template cepat di bawah atau ketik topik konten Anda di bar pesan di bawah.
        </p>
      </div>

      {/* Quick Starter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
        {quickPrompts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              id={`quick-prompt-${item.id}`}
              type="button"
              onClick={() => {
                if (item.isUpload) {
                  fileInputRef.current?.click();
                } else {
                  onSelectPrompt(item.prompt);
                }
              }}
              className="group p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 hover:shadow-xs active:scale-[0.99] transition-all flex items-start gap-3 cursor-pointer"
            >
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
              >
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-[13px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {item.title}
                  </h3>
                  <span className="text-[9px] font-semibold text-slate-400 group-hover:text-blue-500">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {item.isUpload
                    ? 'Review thumbnail & gambar'
                    : 'Mulai dengan format terbukti'}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
