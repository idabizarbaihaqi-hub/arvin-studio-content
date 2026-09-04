import React from 'react';
import { ShieldCheck, Mail, User, Sparkles, Lock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { UserProfile } from '../../types';
import { isPrimarySuperAdmin } from '../../services/adminService';

interface AdminProfileProps {
  currentUser: UserProfile | null;
}

export const AdminProfile: React.FC<AdminProfileProps> = ({ currentUser }) => {
  const isPrimary = isPrimarySuperAdmin(currentUser);

  return (
    <div id="admin-profile-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-amber-600" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Profile</h1>
        </div>
        <p className="text-sm text-slate-600">
          Informasi akun otoritas Super Administrator yang terautentikasi melalui Firebase Authentication.
        </p>
      </div>

      {/* Profile Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-xl shadow-xs">
            SA
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                {currentUser?.fullName || 'Super Administrator'}
              </h2>
              {isPrimary && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900">
                  <Sparkles className="w-3 h-3" />
                  SUPER ADMIN UTAMA
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              <span>{currentUser?.email}</span>
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">ROLE / TINGKAT AKSES</span>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>SUPER_ADMIN</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-0.5 block">Hak penuh mengelola user, transaksi, dan verifikasi</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">ADMIN ACCESS FLAG</span>
            <div className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>True (Aktif & Terverifikasi)</span>
            </div>
            <span className="text-[10px] text-slate-600 mt-0.5 block">Diotorisasi langsung di Firebase Firestore</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">EMAIL TERDAFTAR</span>
            <div className="text-sm font-bold text-slate-900 font-mono">{currentUser?.email}</div>
            <span className="text-[10px] text-slate-600 mt-0.5 block">Firebase Auth Provider: password</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1">USERNAME</span>
            <div className="text-sm font-bold text-slate-900">@{currentUser?.username || 'superadmin'}</div>
            <span className="text-[10px] text-slate-600 mt-0.5 block">Identitas akun di sistem ARVIN</span>
          </div>
        </div>

        {/* Protection Banner */}
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold mb-0.5">Integritas Keamanan Akun Super Admin</h4>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Akun dengan email <strong>id.abizarbaihaqi@gmail.com</strong> telah diatur secara permanen sebagai Super Administrator Utama ARVIN STUDIO. Sistem melarang penurunan pangkat (demotion) dan penghapusan akun ini demi menjaga kedaulatan platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
