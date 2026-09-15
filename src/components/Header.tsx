import React from 'react';
import { Menu, MoreVertical, Bell } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { ActiveView, UserProfile } from '../types';

interface HeaderProps {
  onOpenSidebar: () => void;
  onOpenMenu: () => void;
  hasMessages?: boolean;
  activeView?: ActiveView;
  currentUser?: UserProfile | null;
  onNavigate?: (view: ActiveView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onOpenMenu,
  hasMessages,
  activeView = 'chat',
  currentUser,
  onNavigate,
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
      default:
        return null;
    }
  };

  const badgeInfo = getBadgeLabel();

  return (
    <header
      id="app-header"
      className="sticky top-0 z-20 w-full h-15 sm:h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
    >
      {/* Left: Navigation Trigger & Brand Typography */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        <button
          id="btn-open-sidebar"
          type="button"
          onClick={onOpenSidebar}
          aria-label="Buka Menu Navigasi"
          title="Buka Navigasi"
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => onNavigate && onNavigate('chat')}
          className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-xl p-1.5 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform shrink-0">
            <AppLogo type="header" size={22} variant="light" className="w-full h-full text-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base leading-none">
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
            <span className="text-[8px] sm:text-[9.5px] font-bold tracking-[0.18em] text-blue-600 uppercase mt-0.5 leading-none">
              BY. ARVIN ERLANGGA
            </span>
          </div>
        </div>
      </div>

      {/* Right: Notifications, Avatar & Options */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50/80 text-[11px] font-semibold text-emerald-700 rounded-full border border-emerald-200/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{activeView !== 'chat' || hasMessages ? 'Aktif' : 'Online'}</span>
        </div>

        {/* Notification Icon */}
        <button
          id="btn-header-notifications"
          type="button"
          onClick={() => onNavigate && onNavigate('history')}
          aria-label="Riwayat & Notifikasi"
          title="Riwayat & Notifikasi"
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer relative"
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        {/* User Profile Avatar */}
        {currentUser && (
          <button
            id="btn-header-avatar"
            type="button"
            onClick={() => onNavigate && onNavigate('account')}
            aria-label="Dashboard Akun"
            title="Dashboard Akun"
            className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200/90 hover:border-blue-500 transition-colors cursor-pointer flex items-center justify-center bg-blue-50 text-blue-700 text-xs font-bold shrink-0 ml-0.5"
          >
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{currentUser.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : 'AS'}</span>
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
          className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
