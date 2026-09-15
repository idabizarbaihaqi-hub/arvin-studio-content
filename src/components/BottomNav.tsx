import React from 'react';
import { Home, LayoutGrid, MessageSquarePlus, Crown, User } from 'lucide-react';
import { ActiveView } from '../types';

interface BottomNavProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenSidebar: () => void;
  onNewChat: () => void;
  hasMessages: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  onSelectView,
  onOpenSidebar,
  onNewChat,
  hasMessages,
}) => {
  const isHomeActive = activeView === 'chat' && !hasMessages;
  const isChatActive = activeView === 'chat' && hasMessages;
  const isToolsActive = [
    'content-analyzer',
    'content-ideas',
    'caption-maker',
    'hook-generator',
    'script-maker',
    'hashtag-generator',
    'content-planner',
    'analytics',
  ].includes(activeView);
  const isPremiumActive = activeView === 'premium' || activeView === 'credits';
  const isAccountActive = activeView === 'account' || activeView === 'profile' || activeView === 'settings';

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Beranda / Home */}
        <button
          id="btn-nav-home"
          type="button"
          onClick={() => {
            if (activeView !== 'chat') {
              onSelectView('chat');
            } else if (hasMessages) {
              onNewChat();
            }
          }}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all cursor-pointer ${
            isHomeActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isHomeActive ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Home className="w-5 h-5" strokeWidth={isHomeActive ? 2.3 : 1.9} />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Beranda</span>
        </button>

        {/* AI Tools (Sidebar Trigger / Tools Overview) */}
        <button
          id="btn-nav-tools"
          type="button"
          onClick={onOpenSidebar}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all cursor-pointer ${
            isToolsActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isToolsActive ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <LayoutGrid className="w-5 h-5" strokeWidth={isToolsActive ? 2.3 : 1.9} />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">AI Tools</span>
        </button>

        {/* Create / Chat AI Center Action Button */}
        <button
          id="btn-nav-create"
          type="button"
          onClick={() => {
            onSelectView('chat');
            if (!hasMessages) {
              // already on home, focus input if available
              const textarea = document.getElementById('chat-textarea');
              textarea?.focus();
            } else {
              onNewChat();
            }
          }}
          className="flex flex-col items-center justify-center -mt-3.5 group cursor-pointer"
          title="Buat Konten / Chat Baru"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 group-active:scale-95 transition-transform">
            <MessageSquarePlus className="w-6 h-6" strokeWidth={2.2} />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 mt-1">Buat</span>
        </button>

        {/* Premium */}
        <button
          id="btn-nav-premium"
          type="button"
          onClick={() => onSelectView('premium')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all cursor-pointer ${
            isPremiumActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isPremiumActive ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <Crown className="w-5 h-5" strokeWidth={isPremiumActive ? 2.3 : 1.9} />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Premium</span>
        </button>

        {/* Profile / Account */}
        <button
          id="btn-nav-account"
          type="button"
          onClick={() => onSelectView('account')}
          className={`flex flex-col items-center justify-center min-w-[56px] h-12 rounded-xl transition-all cursor-pointer ${
            isAccountActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isAccountActive ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            <User className="w-5 h-5" strokeWidth={isAccountActive ? 2.3 : 1.9} />
          </div>
          <span className="text-[10px] leading-tight mt-0.5">Akun</span>
        </button>
      </div>
    </nav>
  );
};
