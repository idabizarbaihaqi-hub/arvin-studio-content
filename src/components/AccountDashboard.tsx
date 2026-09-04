import React, { useEffect, useState } from 'react';
import {
  User,
  Crown,
  CreditCard,
  Settings as SettingsIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ActiveView, AccountSummary } from '../types';
import { getAccountSummary } from '../services/accessControlService';
import { AsLogo } from './AsLogo';

interface AccountDashboardProps {
  onNavigate: (view: ActiveView) => void;
  onBackToChat: () => void;
  onNavigateToAdmin?: () => void;
}

export const AccountDashboard: React.FC<AccountDashboardProps> = ({
  onNavigate,
  onBackToChat,
  onNavigateToAdmin,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AccountSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAccountSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load account:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading && !data) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-600 mb-2" />
        <span className="text-sm">Memuat informasi akun...</span>
      </div>
    );
  }

  const user = data?.user;
  const subscription = data?.subscription;
  const isPremium = data?.isPremium;
  const credits = data?.creditsBalance ?? 0;
  const dailyUsage = data?.dailyUsage;

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="account-dashboard-view" className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Dashboard Akun
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Pusat kendali profil kreator, status langganan, dan saldo kredit
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Profile Card as specified in prompt section A */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 relative overflow-hidden">
          {/* Subtle decorative background glow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-slate-100 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative">
            {/* Profile Photo */}
            <div className="relative shrink-0">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-md border-2 border-slate-100">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
              {isPremium && (
                <div className="absolute -bottom-1 -right-1 p-1 bg-amber-500 text-white rounded-lg shadow-sm" title="Akun Premium">
                  <Crown className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Profile Information */}
            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {user?.displayName || 'Kreator ARVIN'}
                </h2>
                {user?.username && (
                  <span className="text-xs sm:text-sm font-medium text-slate-400">
                    @{user.username}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-500 font-mono">
                {user?.email || 'email@example.com'}
              </p>

              {user?.bio && (
                <p className="text-xs sm:text-sm text-slate-600 pt-1 max-w-lg">
                  {user.bio}
                </p>
              )}

              {/* Status Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2.5">
                {isPremium ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Crown className="w-3.5 h-3.5 text-amber-600" />
                    PREMIUM PLAN • {subscription?.plan}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                    FREE PLAN
                  </span>
                )}

                {subscription?.status === 'PREMIUM_EXPIRED' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    <AlertTriangle className="w-3 h-3" />
                    Premium Kedaluwarsa
                  </span>
                )}
              </div>
            </div>

            {/* Credits Display */}
            <div className="w-full sm:w-auto sm:border-l sm:border-slate-100 sm:pl-6 flex flex-col items-center sm:items-end justify-center pt-3 sm:pt-0 border-t border-slate-100 sm:border-t-0">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                Credits
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl sm:text-4xl font-black text-slate-900">
                  {credits}
                </span>
                <span className="text-xs font-medium text-slate-500">Kredit</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('credits')}
                className="mt-2 text-xs font-semibold text-slate-700 hover:text-slate-900 underline underline-offset-2 flex items-center gap-1"
              >
                <span>Lihat Riwayat</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Super Admin Access Banner */}
        {user?.role === 'SUPER_ADMIN' && onNavigateToAdmin && (
          <div
            id="super-admin-banner-card"
            className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm font-black text-sm">
                SA
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Hak Akses Super Administrator</h3>
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                    SUPER_ADMIN
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Anda memiliki otoritas penuh untuk verifikasi transfer pembayaran, audit pemakaian AI, dan manajemen user.
                </p>
              </div>
            </div>

            <button
              id="open-super-admin-panel-btn"
              type="button"
              onClick={onNavigateToAdmin}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Buka Super Admin Panel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 px-1">
            Menu Akun
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. Edit Profile */}
            <button
              id="btn-quick-profile"
              type="button"
              onClick={() => onNavigate('profile')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-0.5">Edit Profile</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Nama, foto & bio</p>
            </button>

            {/* 2. Premium */}
            <button
              id="btn-quick-premium"
              type="button"
              onClick={() => onNavigate('premium')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-amber-300 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-0.5">Premium</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Paket & status aktif</p>
            </button>

            {/* 3. Credits */}
            <button
              id="btn-quick-credits"
              type="button"
              onClick={() => onNavigate('credits')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-blue-300 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-0.5">Credits</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Saldo & transaksi</p>
            </button>

            {/* 4. Settings */}
            <button
              id="btn-quick-settings"
              type="button"
              onClick={() => onNavigate('settings')}
              className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <SettingsIcon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-0.5">Settings</h3>
              <p className="text-xs text-slate-500 line-clamp-1">Privasi, akun & opsi</p>
            </button>
          </div>
        </div>

        {/* Free Daily Limit Progress (All 7 AI Features) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Pemakaian Kuota Harian (Free Limit)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pengguna FREE memiliki 5 penggunaan per hari untuk masing-masing fitur AI.
              </p>
            </div>
            {isPremium ? (
              <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                Tanpa Batas Kuota
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                Reset: 00:00 WIB
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dailyUsage &&
              Object.entries(dailyUsage).map(([key, stat]) => {
                const count = stat.count;
                const limit = isPremium ? 99999 : stat.limit;
                const remaining = isPremium ? '∞' : stat.remaining;
                const percent = isPremium ? 100 : Math.min(100, Math.round((count / stat.limit) * 100));
                const isExceeded = !isPremium && count >= stat.limit;

                return (
                  <div
                    key={key}
                    className={`p-3.5 rounded-2xl border ${
                      isExceeded
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-slate-50/70 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-xs text-slate-800">
                        {stat.featureLabel}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isExceeded
                            ? 'bg-rose-100 text-rose-700'
                            : count > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200/70 text-slate-600'
                        }`}
                      >
                        {isPremium ? 'Unlimited' : `${count}/${stat.limit}`}
                      </span>
                    </div>

                    {!isPremium && (
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isExceeded
                              ? 'bg-rose-500'
                              : percent > 60
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                      <span>{isExceeded ? 'Kuota habis hari ini' : 'Sisa kuota'}</span>
                      <span className="font-semibold text-slate-700">
                        {remaining} {typeof remaining === 'number' ? 'x lagi' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Subscription Detail Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Rincian Langganan
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                {isPremium ? `Paket ${subscription?.plan}` : 'Paket Gratis (FREE)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('premium')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors self-start sm:self-auto flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Kelola Langganan</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Paket Aktif</span>
              <span className="font-bold text-slate-800">{subscription?.plan || 'FREE'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Status</span>
              <span className={`font-bold ${isPremium ? 'text-emerald-600' : 'text-slate-700'}`}>
                {isPremium ? 'Aktif' : subscription?.status === 'PREMIUM_EXPIRED' ? 'Kedaluwarsa' : 'Gratis'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Mulai Langganan</span>
              <span className="font-medium text-slate-700">{formatDate(subscription?.startDate)}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Berakhir Pada</span>
              <span className="font-medium text-slate-700">
                {subscription?.endDate ? formatDate(subscription?.endDate) : 'Tidak Berbatas (Free)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
