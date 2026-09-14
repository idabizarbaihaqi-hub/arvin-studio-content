import React from 'react';
import { Sparkles, AlertCircle, X, ArrowRight, ShieldAlert, Lock, Clock } from 'lucide-react';

interface QuotaExceededModalProps {
  isOpen: boolean;
  featureKey?: string;
  featureLabel?: string;
  onClose: () => void;
  onUpgrade: () => void;
}

export const QuotaExceededModal: React.FC<QuotaExceededModalProps> = ({
  isOpen,
  featureKey = '',
  featureLabel = 'fitur ini',
  onClose,
  onUpgrade,
}) => {
  if (!isOpen) return null;

  const isChat = featureKey === 'chat' || featureLabel.toLowerCase().includes('chat');

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
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon Badge */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-xs ${
          isChat ? 'bg-amber-50 border border-amber-200 text-amber-600' : 'bg-rose-50 border border-rose-200 text-rose-600'
        }`}>
          {isChat ? <Clock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
        </div>

        {/* Heading & Notice */}
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
          {isChat ? 'Limit Harian Chat AI Habis' : 'Kesempatan Trial Gratis Habis'}
        </h2>

        <p className="text-sm font-medium text-slate-700 mb-4 leading-relaxed">
          {isChat ? (
            <>
              Free credit harian <span className="font-semibold text-amber-700">Chat AI</span> untuk akun FREE sudah mencapai batas maksimal (3× per hari). Coba lagi besok atau upgrade ke Premium untuk chat tanpa batas.
            </>
          ) : (
            <>
              Kesempatan trial gratis (1×) untuk <span className="font-semibold text-amber-700">{featureLabel}</span> pada akun ini sudah digunakan. Upgrade ke Premium untuk membuka akses tanpa batas.
            </>
          )}
        </p>

        {/* Informational Callout */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-600 space-y-2 mb-6">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <p>
              {isChat ? (
                <>
                  Akun <strong>FREE</strong> mendapatkan <strong>3 kredit Chat AI gratis setiap hari</strong>. Kuota akan di-reset otomatis setiap hari baru pada pukul 00:00 WIB.
                </>
              ) : (
                <>
                  Akun <strong>FREE</strong> mendapatkan <strong>1× kesempatan trial gratis seumur hidup</strong> untuk masing-masing fitur AI lainnya.
                </>
              )}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 pl-6.5">
            Ingin akses tanpa batas ke seluruh AI Creator Tools ARVIN STUDIO? Tingkatkan akun Anda ke paket Premium aktif sekarang.
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
            className="flex-1 py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Upgrade ke Premium</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            id="btn-dismiss-quota"
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-colors cursor-pointer"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
