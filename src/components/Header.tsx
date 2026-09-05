import React from 'react';
import { Menu, MoreVertical } from 'lucide-react';
import { AsLogo } from './AsLogo';
import { ActiveView } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenMenu: () => void;
  hasMessages?: boolean;
  activeView?: ActiveView;
  onOpenApiKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenMenu,
  hasMessages,
  activeView = 'chat',
}) => {
  return (
    <header
      id="app-header"
      className="sticky top-0 z-20 w-full h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0"
    >
      {/* Left: Hamburger button & Brand */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          id="btn-open-sidebar"
          type="button"
          onClick={onOpenSidebar}
          aria-label="Buka Menu Navigasi"
          title="Buka Navigasi"
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <AsLogo size={24} />
          <h2 className="font-bold tracking-tight text-slate-800 text-sm sm:text-lg">
            ARVIN STUDIO
          </h2>
          {activeView === 'content-analyzer' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
              Analyzer
            </span>
          )}
          {activeView === 'content-ideas' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              Content Ideas
            </span>
          )}
          {activeView === 'caption-maker' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Caption Maker
            </span>
          )}
          {activeView === 'hook-generator' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
              Hook Generator
            </span>
          )}
          {activeView === 'script-maker' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Script Maker
            </span>
          )}
          {activeView === 'hashtag-generator' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
              Hashtag Generator
            </span>
          )}
          {activeView === 'content-planner' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Content Planner
            </span>
          )}
          {activeView === 'analytics' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              Analytics
            </span>
          )}
          {activeView === 'history' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
              History
            </span>
          )}
          {activeView === 'account' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
              Dashboard Akun
            </span>
          )}
          {activeView === 'profile' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
              Profil
            </span>
          )}
          {activeView === 'premium' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              Premium
            </span>
          )}
          {activeView === 'credits' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
              Credits
            </span>
          )}
          {activeView === 'settings' && (
            <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              Pengaturan
            </span>
          )}
        </div>
      </div>

      {/* Right: Status badge & More menu */}
      <div className="flex items-center gap-2">
        <div className="px-2.5 sm:px-3 py-0.5 sm:py-1 bg-emerald-50 text-[10px] sm:text-[11px] font-bold text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-wider">
          {activeView !== 'chat' || hasMessages ? 'Aktif' : 'Online'}
        </div>

        <button
          id="btn-header-more"
          type="button"
          onClick={onOpenMenu}
          aria-label="Pilihan Lainnya"
          title="Informasi & Opsi"
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
