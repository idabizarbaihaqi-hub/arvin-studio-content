import React from 'react';
import { Sparkles, AlertCircle, X, ArrowRight, ShieldAlert } from 'lucide-react';

interface QuotaExceededModalProps {
  isOpen: boolean;
  featureLabel?: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  featureLabel = 'fitur ini',
  onClose,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="quota-exceeded-overlay"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        id="quota-exceeded-modal"
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          id="btn-close-quota-modal"
          type="button"
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-5 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Heading & Notice as mandated */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
          Kuota Harian Habis
        </h2>

        <p className="text-sm font-medium text-slate-700 mb-4 leading-relaxed">
          Limit harian <span className="font-semibold text-amber-700">{featureLabel}</span> untuk akun FREE sudah habis. Coba lagi besok atau upgrade ke Premium.
        </p>

        {/* Informational Callout */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2 mb-6">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              Setiap fitur AI memiliki kuota terpisah <strong>5× per hari</strong> untuk akun <strong>FREE</strong>. Kuota akan di-reset otomatis besok (00:00).
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pl-6.5">
            Ingin berkarya tanpa batasan harian? Tingkatkan akun Anda ke paket Premium ARVIN STUDIO.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            id="btn-upgrade-from-quota"
            type="button"
            onClick={() => {
              onClose();
              onUpgrade();
            }}
            className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade ke Premium</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="btn-dismiss-quota"
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
