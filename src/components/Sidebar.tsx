import React from 'react';
import { X, ChevronRight } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { MenuGroup, MenuItem, ActiveView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onSelectFeaturePlaceholder: (item: MenuItem) => void;
  isSuperAdmin?: boolean;
  isPremium?: boolean;
  onNavigateToAdmin?: () => void;
  userName?: string;
  userPhotoURL?: string | null;
}

export const SIDEBAR_MENU_GROUPS: MenuGroup[] = [
  {
    category: 'UTAMA',
    items: [
      {
        id: 'home',
        label: 'Beranda Studio',
        iconName: '🏠',
        badge: '',
      },
      {
        id: 'new-chat',
        label: 'Buat Konten AI',
        iconName: '✨',
        badge: 'Chat',
      },
    ],
  },
  {
    category: 'AI CREATOR TOOLS',
    items: [
      { id: 'content-analyzer', label: 'Content Analyzer', iconName: '📊', badge: 'Insight' },
      { id: 'content-ideas', label: 'Content Ideas', iconName: '💡', badge: 'Kreatif' },
      { id: 'caption-maker', label: 'Caption Maker', iconName: '✍️', badge: 'Viral' },
      { id: 'hook-generator', label: 'Hook Generator', iconName: '🔥', badge: 'Retensi' },
      { id: 'script-maker', label: 'Script Maker', iconName: '📜', badge: 'Naskah' },
      { id: 'hashtag-generator', label: 'Hashtag Generator', iconName: '#️⃣', badge: 'Tagar' },
      { id: 'edit-video', label: 'Edit Video', iconName: '🎬', badge: '🔒 Premium' },
      { id: 'ai-video-ad', label: 'AI Video Iklan', iconName: '📢', badge: '1× Trial' },
    ],
  },
  {
    category: 'MANAGEMENT',
    items: [
      { id: 'content-planner', label: 'Content Planner', iconName: '📅', badge: 'PRO' },
      { id: 'analytics', label: 'Analytics', iconName: '📈', badge: 'PRO' },
      { id: 'history', label: 'Riwayat Ekspor', iconName: '🕘', badge: 'Arsip' },
    ],
  },
  {
    category: 'ACCOUNT & BILLING',
    items: [
      { id: 'account', label: 'Dashboard Akun', iconName: '📱', badge: 'Profil' },
      { id: 'profile', label: 'Edit Profil', iconName: '👤', badge: '' },
      { id: 'premium', label: 'Upgrade PRO', iconName: '⭐', badge: 'PRO' },
      { id: 'credits', label: 'Credits & Kuota', iconName: '💳', badge: '' },
      { id: 'settings', label: 'Pengaturan', iconName: '⚙️', badge: '' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onNewChat,
  activeView,
  onSelectView,
  onSelectFeaturePlaceholder,
  isSuperAdmin,
  isPremium,
  onNavigateToAdmin,
  userName,
  userPhotoURL,
}) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        id="sidebar-backdrop"
        className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-[285px] sm:w-[310px] max-w-[85vw] bg-white border-r border-slate-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0 overflow-hidden p-2">
              <AppLogo type="header" size={24} variant="light" className="w-full h-full text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-slate-900 text-base leading-tight">
                ARVIN STUDIO
              </span>
              <span className="text-[9px] font-bold tracking-[0.16em] text-blue-600 uppercase mt-0.5">
                BY. ARVIN ERLANGGA
              </span>
            </div>
          </div>
          <button
            id="btn-close-sidebar"
            type="button"
            onClick={onClose}
            aria-label="Tutup Navigasi"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          {SIDEBAR_MENU_GROUPS.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-2.5 mb-1.5">
                {group.category}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isHome = item.id === 'home';
                  const isNewChat = item.id === 'new-chat';
                  const isContentAnalyzer = item.id === 'content-analyzer';
                  const isContentIdeas = item.id === 'content-ideas';
                  const isCaptionMaker = item.id === 'caption-maker';
                  const isHookGenerator = item.id === 'hook-generator';
                  const isScriptMaker = item.id === 'script-maker';
                  const isHashtagGenerator = item.id === 'hashtag-generator';
                  const isContentPlanner = item.id === 'content-planner';
                  const isAnalytics = item.id === 'analytics';
                  const isHistory = item.id === 'history';
                  const isAccount = item.id === 'account';
                  const isProfile = item.id === 'profile';
                  const isPremiumView = item.id === 'premium';
                  const isCredits = item.id === 'credits';
                  const isSettings = item.id === 'settings';
                  const isEditVideo = item.id === 'edit-video';

                  const isActive =
                    (isHome && activeView === 'home') ||
                    (isNewChat && activeView === 'chat') ||
                    (isContentAnalyzer && activeView === 'content-analyzer') ||
                    (isContentIdeas && activeView === 'content-ideas') ||
                    (isCaptionMaker && activeView === 'caption-maker') ||
                    (isHookGenerator && activeView === 'hook-generator') ||
                    (isScriptMaker && activeView === 'script-maker') ||
                    (isHashtagGenerator && activeView === 'hashtag-generator') ||
                    (isEditVideo && activeView === 'edit-video') ||
                    (isContentPlanner && activeView === 'content-planner') ||
                    (isAnalytics && activeView === 'analytics') ||
                    (isHistory && activeView === 'history') ||
                    (isAccount && activeView === 'account') ||
                    (isProfile && activeView === 'profile') ||
                    (isPremiumView && activeView === 'premium') ||
                    (isCredits && activeView === 'credits') ||
                    (isSettings && activeView === 'settings');

                  // Dynamic badge for Edit Video depending on user privileges
                  let displayBadge = item.badge;
                  let badgeStyle = 'bg-blue-50 text-blue-700 border border-blue-100';

                  if (isEditVideo) {
                    if (isSuperAdmin) {
                      displayBadge = 'Admin';
                      badgeStyle = 'bg-amber-50 text-amber-800 border border-amber-200';
                    } else if (isPremium) {
                      displayBadge = 'PRO';
                      badgeStyle = 'bg-emerald-50 text-emerald-800 border border-emerald-200';
                    } else {
                      displayBadge = '🔒 Premium';
                      badgeStyle = 'bg-amber-50 text-amber-800 border border-amber-200';
                    }
                  }

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      type="button"
                      onClick={() => {
                        if (isHome) {
                          onSelectView('home');
                          onClose();
                        } else if (isNewChat) {
                          onSelectView('chat');
                          onClose();
                        } else if (isContentAnalyzer) {
                          onSelectView('content-analyzer');
                          onClose();
                        } else if (isContentIdeas) {
                          onSelectView('content-ideas');
                          onClose();
                        } else if (isCaptionMaker) {
                          onSelectView('caption-maker');
                          onClose();
                        } else if (isHookGenerator) {
                          onSelectView('hook-generator');
                          onClose();
                        } else if (isScriptMaker) {
                          onSelectView('script-maker');
                          onClose();
                        } else if (isHashtagGenerator) {
                          onSelectView('hashtag-generator');
                          onClose();
                        } else if (isEditVideo) {
                          onSelectView('edit-video');
                          onClose();
                        } else if (isContentPlanner) {
                          onSelectView('content-planner');
                          onClose();
                        } else if (isAnalytics) {
                          onSelectView('analytics');
                          onClose();
                        } else if (isHistory) {
                          onSelectView('history');
                          onClose();
                        } else if (isAccount) {
                          onSelectView('account');
                          onClose();
                        } else if (isProfile) {
                          onSelectView('profile');
                          onClose();
                        } else if (isPremiumView) {
                          onSelectView('premium');
                          onClose();
                        } else if (isCredits) {
                          onSelectView('credits');
                          onClose();
                        } else if (isSettings) {
                          onSelectView('settings');
                          onClose();
                        } else {
                          onSelectFeaturePlaceholder(item);
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0 select-none">
                          {item.iconName}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {displayBadge ? (
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : badgeStyle
                          }`}
                        >
                          {displayBadge}
                        </span>
                      ) : (
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-white/70' : 'text-slate-300'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Super Admin Special Entry */}
          {isSuperAdmin && (
            <div className="pt-2 px-1">
              <div className="px-2.5 pb-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                ADMINISTRASI SISTEM
              </div>
              <button
                id="sidebar-super-admin-link"
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToAdmin?.();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🛡️</span>
                  <span>Super Admin Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Credit & Status Panel */}
        <div className="p-3.5 border-t border-slate-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={() => {
              onSelectView('account');
              onClose();
            }}
            className="w-full bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 rounded-2xl p-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer"
          >
            {userPhotoURL ? (
              <img
                src={userPhotoURL}
                alt={userName || 'User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {userName ? userName.slice(0, 2).toUpperCase() : 'AS'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900">
                {userName || 'Kreator ARVIN'}
              </p>
              <p className="text-[10px] text-blue-600 font-semibold">
                {isSuperAdmin ? 'Super Administrator' : 'Akun Kreator • Kelola'}
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
