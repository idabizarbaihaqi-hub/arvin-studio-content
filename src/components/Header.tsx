import React from 'react';
import { Menu, MoreVertical, Bell, Search } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ActiveView, UserProfile } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenMenu: () => void;
  hasMessages?: boolean;
  activeView?: ActiveView;
  currentUser?: UserProfile | null;
  onNavigate?: (view: ActiveView) => void;
  onSearchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenMenu,
  hasMessages,
  activeView = 'chat',
  currentUser,
  onNavigate,
  onSearchClick,
}) => {
  const getBadgeLabel = () => {
    switch (activeView) {
      case 'content-analyzer':
        return { label: 'Analyzer', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'content-ideas':
        return { label: 'Content Ideas', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'caption-maker':
        return { label: 'Caption Maker', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'hook-generator':
        return { label: 'Hook Generator', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'script-maker':
        return { label: 'Script Maker', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'hashtag-generator':
        return { label: 'Hashtags', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'content-planner':
        return { label: 'Planner', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'analytics':
        return { label: 'Analytics', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'history':
        return { label: 'History', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'account':
        return { label: 'Akun', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'profile':
        return { label: 'Profil', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'premium':
        return { label: 'PRO', bg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent' };
      case 'credits':
        return { label: 'Credits', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'settings':
        return { label: 'Pengaturan', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'chat':
        return { label: 'Create AI', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return null;
    }
  };

  const badgeInfo = getBadgeLabel();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-20 w-full h-15 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-100/90 px-3.5 sm:px-6 flex items-center justify-between shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
    >
      {/* Left: Navigation Trigger & Brand Typography */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          id="btn-open-sidebar"
          type="button"
          onClick={onOpenSidebar}
          aria-label="Buka Menu Navigasi"
          title="Buka Navigasi"
          className="w-8.5 h-8.5 sm:w-9 sm:h-9 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => onNavigate && onNavigate('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0">
            <AppLogo type="header" size={30} variant="dark" className="w-full h-full" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-[14px] sm:text-[15px] leading-none">
                ARVIN STUDIO
              </span>
              {badgeInfo && (
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${badgeInfo.bg}`}
                >
                  {badgeInfo.label}
                </span>
              )}
            </div>
            <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.16em] text-slate-400 uppercase mt-0.5 leading-none">
              BY. ARVIN ERLANGGA
            </span>
          </div>
        </div>
      </div>

      {/* Right: Search, Notifications, Avatar & Options (matching reference image) */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Search Icon */}
        <button
          id="btn-header-search"
          type="button"
          onClick={() => {
            if (onSearchClick) onSearchClick();
            else if (onNavigate) onNavigate('content-ideas');
          }}
          aria-label="Pencarian Alat AI"
          title="Cari Alat & Template AI"
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <Search className="w-5 h-5" strokeWidth={2} />
        </button>

        {/* Notification Icon */}
        <button
          id="btn-header-notifications"
          type="button"
          onClick={() => onNavigate && onNavigate('history')}
          aria-label="Riwayat & Notifikasi"
          title="Riwayat & Notifikasi"
          className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer relative"
        >
          <Bell className="w-5 h-5" strokeWidth={2} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Profile Avatar (Circular, matching reference) */}
        {currentUser && (
          <button
            id="btn-header-avatar"
            type="button"
            onClick={() => onNavigate && onNavigate('account')}
            aria-label="Dashboard Akun"
            title="Dashboard Akun"
            className="w-8.5 h-8.5 rounded-full overflow-hidden border border-slate-200/90 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-bold shrink-0 ml-1 shadow-2xs"
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
                alt="User Profile"
                className="w-full h-full object-cover"
              />
            )}
          </button>
        )}

        {/* More Menu */}
        <button
          id="btn-header-more"
          type="button"
          onClick={onOpenMenu}
          aria-label="Pilihan Lainnya"
          title="Opsi & Informasi"
          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer ml-0.5"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
