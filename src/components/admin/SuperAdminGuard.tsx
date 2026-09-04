import React from 'react';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { UserProfile } from '../../types';
import { isSuperAdminUser } from '../../services/accessControlService';

interface SuperAdminGuardProps {
  currentUser: UserProfile | null;
  onNavigateToLogin: () => void;
  onNavigateToUserDashboard: () => void;
  children: React.ReactNode;
}

/**
 * SuperAdminGuard restricts access exclusively to authenticated users with SUPER_ADMIN role.
 * Any ordinary user or unauthenticated visitor is blocked and redirected.
 */
export const SuperAdminGuard: React.FC<SuperAdminGuardProps> = ({
  currentUser,
  onNavigateToLogin,
  onNavigateToUserDashboard,
  children,
}) => {
  // 1. If unauthenticated, prompt to login
  if (!currentUser) {
    return (
      <div
        id="admin-unauth-guard"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Akses Dibatasi</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Halaman Admin Panel hanya dapat diakses oleh akun Super Administrator ARVIN STUDIO. Silakan masuk terlebih dahulu dengan kredensial yang berwenang.
          </p>
          <button
            id="admin-guard-login-btn"
            onClick={onNavigateToLogin}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk sebagai Super Admin</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. If authenticated but role is NOT SUPER_ADMIN, display Access Denied
  if (!isSuperAdminUser(currentUser)) {
    return (
      <div
        id="admin-forbidden-guard"
        className="min-h-screen bg-slate-50 flex items-center justify-center p-4"
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-center mx-auto mb-4 text-red-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <span className="inline-block px-2.5 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
            Akses Ditolak
          </span>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Bukan Super Admin</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Akun Anda (<strong className="font-semibold text-slate-800">{currentUser.email}</strong>) terdaftar sebagai pengguna biasa dan tidak memiliki izin akses ke Super Admin Panel ARVIN STUDIO.
          </p>
          <button
            id="admin-guard-back-dashboard-btn"
            onClick={onNavigateToUserDashboard}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Workspace Creator</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Authorized Super Admin
  return <>{children}</>;
};
