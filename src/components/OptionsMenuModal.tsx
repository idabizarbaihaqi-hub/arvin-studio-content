import React from 'react';
import { X, Sparkles, RefreshCw, Info, CheckCircle2, User, Settings as SettingsIcon } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ActiveView } from '../types';

interface OptionsMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  messageCount: number;
  onNavigate?: (view: ActiveView) => void;
  onOpenApiKeyModal?: () => void;
}

export const OptionsMenuModal: React.FC<OptionsMenuModalProps> = ({
  isOpen,
  onClose,
  onNewChat,
  messageCount,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="options-menu-overlay"
      className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-xs flex items-start justify-end p-3 sm:p-4 pt-16 sm:pt-20"
      onClick={onClose}
    >
      <div
        id="options-menu-dropdown"
        className="w-full max-w-xs bg-white rounded-3xl border border-slate-200/90 shadow-2xl p-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center p-1.5 shadow-sm text-white">
              <AppLogo type="header" size={18} variant="light" className="w-full h-full text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-900 leading-none">ARVIN STUDIO</span>
              <span className="text-[8px] font-bold tracking-[0.16em] text-blue-600 uppercase mt-0.5">BY. ARVIN ERLANGGA</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-2 space-y-1">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-blue-600" />
            <span>Mulai Chat Baru</span>
          </button>

          {onNavigate && (
            <>
              <button
                type="button"
                onClick={() => {
                  onNavigate('account');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
              >
                <User className="w-4 h-4 text-blue-600" />
                <span>Dashboard Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onNavigate('settings');
                  onClose();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 hover:bg-slate-100 transition-colors text-left cursor-pointer"
              >
                <SettingsIcon className="w-4 h-4 text-slate-600" />
                <span>Pengaturan</span>
              </button>
            </>
          )}

          <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs space-y-2 mt-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Pesan di sesi ini:
              </span>
              <span className="font-bold text-slate-900">{messageCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Koneksi AI:
              </span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Siap
              </span>
            </div>
          </div>
        </div>

        <div className="pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 text-center font-medium">
          ARVIN STUDIO • SaaS AI Kreator
        </div>
      </div>
    </div>
  );
};
