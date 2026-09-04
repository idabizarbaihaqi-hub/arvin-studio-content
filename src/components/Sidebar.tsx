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
      { id: 'content-planner', label: 'Content Planner', iconName: '📅' },
      { id: 'analytics', label: 'Analytics', iconName: '📈' },
      { id: 'history', label: 'History', iconName: '🕘' },
    ],
  },
  {
    category: 'ACCOUNT',
    items: [
      { id: 'premium', label: 'Premium', iconName: '⭐' },
      { id: 'credits', label: 'Credits', iconName: '💳' },
      { id: 'profile', label: 'Profile', iconName: '👤' },
      { id: 'settings', label: 'Settings', iconName: '⚙️' },
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
                  const isActive =
                    (isNewChat && activeView === 'chat') ||
                    (isContentAnalyzer && activeView === 'content-analyzer') ||
                    (isContentIdeas && activeView === 'content-ideas') ||
                    (isCaptionMaker && activeView === 'caption-maker') ||
                    (isHookGenerator && activeView === 'hook-generator') ||
                    (isScriptMaker && activeView === 'script-maker') ||
                    (isHashtagGenerator && activeView === 'hashtag-generator');

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
        </div>

        {/* Footer Credit & Status Panel */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-slate-800">Creator Studio</p>
              <p className="text-[10px] text-slate-400">120 Credits • Tahap 1</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online"></div>
          </div>
        </div>
      </aside>
    </>
  );
};
