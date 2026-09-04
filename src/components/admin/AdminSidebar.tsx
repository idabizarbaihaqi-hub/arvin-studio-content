import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CheckCircle2,
  Coins,
  Cpu,
  History,
  Activity,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { AdminViewKey, UserProfile } from '../../types';
import { AsLogo } from '../AsLogo';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AdminViewKey;
  onSelectView: (view: AdminViewKey) => void;
  onLogout: () => void;
  currentUser: UserProfile | null;
  pendingCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  onSelectView,
  onLogout,
  currentUser,
  pendingCount = 0,
}) => {
  const navSections = [
    {
      group: 'DASHBOARD',
      items: [
        { key: 'dashboard' as AdminViewKey, label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'MANAGEMENT',
      items: [
        { key: 'user-management' as AdminViewKey, label: 'User Management', icon: Users },
        { key: 'premium-management' as AdminViewKey, label: 'Premium Management', icon: CreditCard },
        {
          key: 'payment-verification' as AdminViewKey,
          label: 'Payment Verification',
          icon: CheckCircle2,
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
        { key: 'credit-management' as AdminViewKey, label: 'Credit Management', icon: Coins },
      ],
    },
    {
      group: 'MONITORING',
      items: [
        { key: 'ai-usage' as AdminViewKey, label: 'AI Usage', icon: Cpu },
        { key: 'content-history' as AdminViewKey, label: 'Content History', icon: History },
        { key: 'activity-logs' as AdminViewKey, label: 'Activity Logs', icon: Activity },
      ],
    },
    {
      group: 'SYSTEM',
      items: [
        { key: 'system-settings' as AdminViewKey, label: 'System Settings', icon: Settings },
        { key: 'admin-profile' as AdminViewKey, label: 'Admin Profile', icon: ShieldCheck },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="admin-sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="admin-sidebar-container"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <AsLogo className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base text-slate-900 tracking-tight">ARVIN STUDIO</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                  <Sparkles className="w-2.5 h-2.5" />
                  SUPER ADMIN
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Tutup sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {navSections.map((section) => (
            <div key={section.group}>
              <div className="px-3 mb-1.5 text-[11px] font-bold tracking-wider text-slate-600 uppercase">
                {section.group}
              </div>
              <nav className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.key;
                  return (
                    <button
                      key={item.key}
                      id={`admin-nav-${item.key}`}
                      onClick={() => {
                        onSelectView(item.key);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-xs font-bold ${
                            isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-500 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* User Account & Logout Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300/60 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                SA
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {currentUser?.fullName || 'Super Administrator'}
                </p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>

          <button
            id="admin-sidebar-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar dari Super Admin</span>
          </button>
        </div>
      </aside>
    </>
  );
};
