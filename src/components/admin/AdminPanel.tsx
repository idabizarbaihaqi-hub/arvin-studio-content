import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Bell,
  Sparkles,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { AdminViewKey, UserProfile } from '../../types';
import { isPrimarySuperAdmin } from '../../services/adminService';
import { AdminSidebar } from './AdminSidebar';
import { AdminDashboard } from './AdminDashboard';
import { UserManagement } from './UserManagement';
import { PremiumManagement } from './PremiumManagement';
import { PaymentVerification } from './PaymentVerification';
import { CreditManagement } from './CreditManagement';
import { AiUsageMonitoring } from './AiUsageMonitoring';
import { ContentHistoryMonitoring } from './ContentHistoryMonitoring';
import { AdminActivityLogs } from './AdminActivityLogs';
import { AdminProfile } from './AdminProfile';
import { SystemSettings } from './SystemSettings';
import { PaymentAccountManagement } from './PaymentAccountManagement';

interface AdminPanelProps {
  currentUser: UserProfile | null;
  onLogout: () => void;
  onSwitchToUserDashboard?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  onLogout,
  onSwitchToUserDashboard,
}) => {
  const [currentView, setCurrentView] = useState<AdminViewKey>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin/payment-accounts' || path.startsWith('/admin/payment-accounts')) {
        return 'payment-accounts';
      }
      const searchParams = new URLSearchParams(window.location.search);
      const viewParam = searchParams.get('view') as AdminViewKey;
      if (viewParam) return viewParam;
    }
    return 'dashboard';
  });
  const [presetTargetUserId, setPresetTargetUserId] = useState<string | null>(null);
  const [pendingBadgeCount, setPendingBadgeCount] = useState<number>(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isPrimary = isPrimarySuperAdmin(currentUser);

  const handleNavigate = (view: AdminViewKey) => {
    setCurrentView(view);
    setIsMobileSidebarOpen(false);
    if (typeof window !== 'undefined') {
      if (view === 'dashboard') {
        window.history.pushState(null, '', '/admin');
      } else if (view === 'payment-accounts') {
        window.history.pushState(null, '', '/admin/payment-accounts');
      } else {
        window.history.pushState(null, '', `/admin?view=${view}`);
      }
    }
  };

  const handleOpenCreditAdjustment = (userId: string) => {
    setPresetTargetUserId(userId);
    setCurrentView('credit-management');
    setIsMobileSidebarOpen(false);
  };

  return (
    <div id="admin-panel-layout" className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-900">
      {/* Top Admin Navigation Header */}
      <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            title="Buka Menu Admin"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-black text-lg tracking-wider text-slate-900">ARVIN</span>
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[10px] tracking-wider uppercase">
              SUPER ADMIN
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {isPrimary && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>SUPER ADMIN UTAMA</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onSwitchToUserDashboard && (
            <button
              onClick={onSwitchToUserDashboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
              title="Buka tampilan Dashboard User biasa"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Mode Kreator (User)</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.fullName || 'Admin'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-xl object-cover border border-slate-200 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300/60 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser?.fullName ? currentUser.fullName.slice(0, 2).toUpperCase() : 'SA'}
              </div>
            )}
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight">
                {currentUser?.fullName || 'Super Administrator'}
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                {currentUser?.email}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Keluar dari Akun Super Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row">
        <AdminSidebar
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          activeView={currentView}
          onSelectView={handleNavigate}
          pendingCount={pendingBadgeCount}
          currentUser={currentUser}
          onLogout={onLogout}
        />

        {/* View Router */}
        <main className="flex-1 min-w-0 pb-16 lg:pb-8">
          {currentView === 'dashboard' && (
            <AdminDashboard onNavigate={handleNavigate} />
          )}

          {currentView === 'user-management' && (
            <UserManagement onOpenCreditAdjustment={handleOpenCreditAdjustment} />
          )}

          {currentView === 'payment-verification' && (
            <PaymentVerification
              currentUser={currentUser}
              onRefreshStats={() => {}}
            />
          )}

          {currentView === 'payment-accounts' && (
            <PaymentAccountManagement currentUser={currentUser} />
          )}

          {currentView === 'premium-management' && (
            <PremiumManagement />
          )}

          {currentView === 'credit-management' && (
            <CreditManagement
              currentUser={currentUser}
              presetTargetUserId={presetTargetUserId}
              onClearPreset={() => setPresetTargetUserId(null)}
            />
          )}

          {currentView === 'ai-usage' && (
            <AiUsageMonitoring />
          )}

          {currentView === 'content-history' && (
            <ContentHistoryMonitoring />
          )}

          {currentView === 'activity-logs' && (
            <AdminActivityLogs />
          )}

          {currentView === 'admin-profile' && (
            <AdminProfile currentUser={currentUser} />
          )}

          {currentView === 'system-settings' && (
            <SystemSettings currentUser={currentUser} />
          )}
        </main>
      </div>
    </div>
  );
};
