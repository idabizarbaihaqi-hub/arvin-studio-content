import React, { useRef, useState } from 'react';
import { ImagePlus, Sparkles, UploadCloud, Eye } from 'lucide-react';
import { AsLogo } from './AsLogo';
import { AppLogo } from './AppLogo';
import { ChatImageAttachment } from '../types';

interface EmptyStateProps {
  onSelectImage?: (attachment: ChatImageAttachment) => void;
  onSelectPrompt?: (promptText: string) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onSelectImage,
  onSelectPrompt,
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

  const samplePrompts = [
    {
      label: 'Analisis Screenshot Postingan',
      prompt: 'Tolong analisis tangkapan layar postingan ini, berikan evaluasi performa visual, hook, dan saran perbaikan agar interaksinya lebih tinggi.',
    },
    {
      label: 'Buat Caption Menarik',
      prompt: 'Berdasarkan gambar ini, tolong buatkan 3 opsi caption kreatif lengkap dengan hook pembuka dan hashtag relevan.',
    },
    {
      label: 'Bedah Visual & Ide Konten',
      prompt: 'Periksa estetika dan komposisi gambar ini. Apa rekomendasi konten lanjutan yang cocok dibuat dari topik ini?',
    },
  ];

  return (
    <div
      id="chat-empty-state"
      className="flex-1 flex flex-col items-center justify-center min-h-[55vh] sm:min-h-[60vh] p-4 sm:p-8 text-center select-none"
    >
      <div className="max-w-xl w-full flex flex-col items-center text-center">
        {/* Chat AI Brand Icon Container */}
        <div className="w-18 h-18 sm:w-22 sm:h-22 bg-white rounded-3xl shadow-xl shadow-slate-200/80 flex items-center justify-center mb-6 sm:mb-8 border border-slate-100 overflow-hidden p-3">
          <AppLogo type="chat-ai" size={46} className="w-full h-full" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2 tracking-tight">
          Halo, saya ARVIN AI.
        </h1>

        <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-sm sm:max-w-md mb-6">
          Apa yang ingin kamu buat atau analisis hari ini? Tulis pertanyaan atau unggah tangkapan layar untuk analisis visual.
        </p>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Multimodal Image Drop Zone Card (Tahap 8E Feature) */}
        <div
          id="empty-state-upload-dropzone"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`w-full p-4 sm:p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer mb-6 group ${
            isDragging
              ? 'border-slate-900 bg-slate-100/80 scale-[1.01]'
              : 'border-slate-200 hover:border-slate-400 bg-white hover:bg-slate-50/80 shadow-xs'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 text-center sm:text-left">
            <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-white group-hover:shadow-xs flex items-center justify-center text-slate-700 transition-colors shrink-0">
              <UploadCloud className="w-5 h-5 text-slate-700" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 font-semibold text-slate-900 text-sm">
                <span>Unggah Gambar atau Screenshot</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900 text-white tracking-wide">
                  VISION AI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Klik atau tarik tangkapan layar ke sini untuk analisis visual & rekomendasi konten
              </p>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Prompts */}
        <div className="w-full flex flex-col sm:flex-row gap-2 justify-center">
          {samplePrompts.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectPrompt && onSelectPrompt(item.prompt)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-medium text-slate-700 transition-all text-left sm:text-center shadow-2xs hover:shadow-xs cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
