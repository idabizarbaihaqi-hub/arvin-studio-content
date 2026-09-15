import React from 'react';
import { Home, Bot, PlusCircle, Crown, User } from 'lucide-react';
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
  const isHomeActive = activeView === 'home';
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
  const isCreateActive = activeView === 'chat';
  const isPremiumActive = activeView === 'premium' || activeView === 'credits';
  const isProfileActive = activeView === 'account' || activeView === 'profile' || activeView === 'settings';

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-30 sm:hidden bg-white/95 backdrop-blur-md border-t border-slate-100/90 shadow-[0_-2px_12px_rgba(0,0,0,0.03)] px-3 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
    >
      <div className="max-w-md mx-auto flex items-center justify-between px-1">
        {/* Home */}
        <button
          id="btn-nav-home"
          type="button"
          onClick={() => onSelectView('home')}
          className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
            isHomeActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <Home className="w-5.5 h-5.5" strokeWidth={isHomeActive ? 2.3 : 1.8} />
          <span className="text-[10.5px] leading-tight mt-1">Home</span>
        </button>

        {/* AI Tools */}
        <button
          id="btn-nav-tools"
          type="button"
          onClick={onOpenSidebar}
          className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
            isToolsActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <Bot className="w-5.5 h-5.5" strokeWidth={isToolsActive ? 2.3 : 1.8} />
          <span className="text-[10.5px] leading-tight mt-1">AI Tools</span>
        </button>

        {/* Create */}
        <button
          id="btn-nav-create"
          type="button"
          onClick={() => {
            onSelectView('chat');
            setTimeout(() => {
              const textarea = document.getElementById('chat-textarea');
              textarea?.focus();
            }, 60);
          }}
          className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
            isCreateActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
          title="Buat Konten Baru"
        >
          <PlusCircle className="w-6 h-6" strokeWidth={isCreateActive ? 2.3 : 1.8} />
          <span className="text-[10.5px] leading-tight mt-1 font-medium">Create</span>
        </button>

        {/* Premium */}
        <button
          id="btn-nav-premium"
          type="button"
          onClick={() => onSelectView('premium')}
          className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
            isPremiumActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <Crown className="w-5.5 h-5.5" strokeWidth={isPremiumActive ? 2.3 : 1.8} />
          <span className="text-[10.5px] leading-tight mt-1">Premium</span>
        </button>

        {/* Profile */}
        <button
          id="btn-nav-account"
          type="button"
          onClick={() => onSelectView('account')}
          className={`flex flex-col items-center justify-center flex-1 h-12 transition-colors cursor-pointer ${
            isProfileActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-700 font-medium'
          }`}
        >
          <User className="w-5.5 h-5.5" strokeWidth={isProfileActive ? 2.3 : 1.8} />
          <span className="text-[10.5px] leading-tight mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};
