import React from 'react';
import { X, MessageSquare, ChevronRight } from 'lucide-react';
import { AsLogo } from './AsLogo';
import { MenuGroup, MenuItem, ActiveView } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onSelectFeaturePlaceholder: (item: MenuItem) => void;
  isSuperAdmin?: boolean;
  onNavigateToAdmin?: () => void;
  userName?: string;
  userPhotoURL?: string | null;
}

export const SIDEBAR_MENU_GROUPS: MenuGroup[] = [
  {
    category: 'UTAMA',
    items: [
      {
        id: 'new-chat',
        label: 'Chat Baru',
        iconName: '💬',
        badge: 'Aktif',
      },
    ],
  },
  {
    category: 'AI CREATOR TOOLS',
    items: [
      { id: 'content-analyzer', label: 'Content Analyzer', iconName: '📊', badge: 'Aktif' },
      { id: 'content-ideas', label: 'Content Ideas', iconName: '💡', badge: 'Aktif' },
      { id: 'caption-maker', label: 'Caption Maker', iconName: '✍️', badge: 'Aktif' },
      { id: 'hook-generator', label: 'Hook Generator', iconName: '🔥', badge: 'Aktif' },
      { id: 'script-maker', label: 'Script Maker', iconName: '🎬', badge: 'Aktif' },
      { id: 'hashtag-generator', label: 'Hashtag Generator', iconName: '#️⃣', badge: 'Aktif' },
    ],
  },
  {
    category: 'MANAGEMENT',
    items: [
      { id: 'content-planner', label: 'Content Planner', iconName: '📅', badge: 'Aktif' },
      { id: 'analytics', label: 'Analytics', iconName: '📈', badge: 'Aktif' },
      { id: 'history', label: 'History', iconName: '🕘', badge: 'Aktif' },
    ],
  },
  {
    category: 'ACCOUNT',
    items: [
      { id: 'account', label: 'Dashboard Akun', iconName: '📱', badge: 'Aktif' },
      { id: 'profile', label: 'Profile', iconName: '👤', badge: 'Aktif' },
      { id: 'premium', label: 'Premium', iconName: '⭐', badge: 'Aktif' },
      { id: 'credits', label: 'Credits', iconName: '💳', badge: 'Aktif' },
      { id: 'settings', label: 'Settings', iconName: '⚙️', badge: 'Aktif' },
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
  onNavigateToAdmin,
  userName,
  userPhotoURL,
}) => {
  return (
    <>
      {/* Backdrop overlay */}
      <div
        id="sidebar-backdrop"
        className={`fixed inset-0 z-40 bg-neutral-950/40 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-[280px] sm:w-[300px] max-w-[85vw] bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-slate-300 shrink-0">
              <AsLogo size={22} variant="light" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-slate-900 text-base leading-tight">
                ARVIN STUDIO
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Workspace
              </span>
            </div>
          </div>
          <button
            id="btn-close-sidebar"
            type="button"
            onClick={onClose}
            aria-label="Tutup Navigasi"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Navigation Menu List */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {SIDEBAR_MENU_GROUPS.map((group) => (
            <div key={group.category} className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] px-3 mb-2">
                {group.category}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
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
                  const isPremium = item.id === 'premium';
                  const isCredits = item.id === 'credits';
                  const isSettings = item.id === 'settings';

                  const isActive =
                    (isNewChat && activeView === 'chat') ||
                    (isContentAnalyzer && activeView === 'content-analyzer') ||
                    (isContentIdeas && activeView === 'content-ideas') ||
                    (isCaptionMaker && activeView === 'caption-maker') ||
                    (isHookGenerator && activeView === 'hook-generator') ||
                    (isScriptMaker && activeView === 'script-maker') ||
                    (isHashtagGenerator && activeView === 'hashtag-generator') ||
                    (isContentPlanner && activeView === 'content-planner') ||
                    (isAnalytics && activeView === 'analytics') ||
                    (isHistory && activeView === 'history') ||
                    (isAccount && activeView === 'account') ||
                    (isProfile && activeView === 'profile') ||
                    (isPremium && activeView === 'premium') ||
                    (isCredits && activeView === 'credits') ||
                    (isSettings && activeView === 'settings');

                  return (
                    <button
                      key={item.id}
                      id={`sidebar-item-${item.id}`}
                      type="button"
                      onClick={() => {
                        if (isNewChat) {
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
                        } else if (isPremium) {
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-base shrink-0 select-none">
                          {item.iconName}
                        </span>
                        <span className="truncate">{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-slate-800 text-slate-200'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          }`}
                        >
                          {item.badge}
                        </span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
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
              <div className="px-3 pb-1.5 text-[10px] font-bold text-amber-700 uppercase tracking-wider">
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
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => {
              onSelectView('account');
              onClose();
            }}
            className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3 transition-colors text-left cursor-pointer"
          >
            {userPhotoURL ? (
              <img
                src={userPhotoURL}
                alt={userName || 'User'}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {userName ? userName.slice(0, 2).toUpperCase() : 'AS'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate text-slate-900">
                {userName || 'Kreator ARVIN'}
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
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
