import React from 'react';
import { X, Sparkles } from 'lucide-react';
import { MenuItem } from '../types';

interface FeaturePlaceholderModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const FeaturePlaceholderModal: React.FC<FeaturePlaceholderModalProps> = ({
  item,
  onClose,
}) => {
  if (!item) return null;

  return (
    <div
      id="placeholder-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="placeholder-modal-card"
        className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-xl mb-4">
          <span>{item.iconName}</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {item.label}
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Tahap Selanjutnya
          </span>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed mb-4">
          Fitur ini sedang dipersiapkan.
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 leading-relaxed mb-5">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
            <p>
              Kamu dapat langsung berdiskusi dan meminta AI membuatkan {item.label.toLowerCase()} secara fleksibel melalui ruang <strong>AI Chat</strong> utama.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-all shadow-md shadow-slate-900/10 active:scale-[0.99]"
        >
          Kembali ke AI Chat
        </button>
      </div>
    </div>
  );
};
