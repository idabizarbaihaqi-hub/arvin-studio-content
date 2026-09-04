import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Shield,
  CreditCard,
  Coins,
  History,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  UserProfile,
  SubscriptionRecord,
  CreditTransaction,
  DailyUsageRecord,
  AiHistoryItem,
} from '../../types';
import { getUserDetailData, isPrimarySuperAdmin } from '../../services/adminService';

interface UserDetailModalProps {
  userId: string | null;
  onClose: () => void;
  onOpenCreditAdjustment?: (userId: string) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  userId,
  onClose,
  onOpenCreditAdjustment,
}) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'credits' | 'usage' | 'history'>('overview');
  const [data, setData] = useState<{
    profile: UserProfile | null;
    subscriptions: SubscriptionRecord[];
    transactions: CreditTransaction[];
    usageList: DailyUsageRecord[];
    historyList: AiHistoryItem[];
  } | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    getUserDetailData(userId)
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load user detail:', err))
      .finally(() => setLoading(false));
  }, [userId]);

  if (!userId) return null;

  const profile = data?.profile;
  const isSuper = isPrimarySuperAdmin(profile);

  return (
    <div
      id="user-detail-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div
        id="user-detail-modal-card"
        className="bg-white w-full max-w-3xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
              {profile?.fullName?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  {profile?.fullName || 'Detail Pengguna'}
                </h3>
                {isSuper ? (
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-900 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" />
                    SUPER ADMIN UTAMA
                  </span>
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      profile?.role === 'SUPER_ADMIN'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {profile?.role || 'USER'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">
                {profile?.email} • @{profile?.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-4 gap-2 overflow-x-auto bg-white text-xs font-semibold shrink-0">
          {[
            { key: 'overview', label: 'Ringkasan', icon: User },
            { key: 'subscriptions', label: `Langganan (${data?.subscriptions.length || 0})`, icon: CreditCard },
            { key: 'credits', label: `Kredit (${data?.transactions.length || 0})`, icon: Coins },
            { key: 'usage', label: `AI Usage (${data?.usageList.length || 0})`, icon: Clock },
            { key: 'history', label: `Riwayat Konten (${data?.historyList.length || 0})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-3 px-3 flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-600" />
              <p className="text-xs">Memuat data user...</p>
            </div>
          ) : !profile ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Data profil pengguna tidak ditemukan di Firestore.
            </div>
          ) : activeTab === 'overview' ? (
            <div className="space-y-4">
              {/* Account Quick Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-600 font-semibold mb-0.5">PAKET</div>
                  <div className="text-sm font-bold text-slate-900">{profile.plan}</div>
                  <div className="text-[10px] text-slate-600 capitalize">{profile.subscriptionStatus.toLowerCase()}</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-600 font-semibold mb-0.5">SALDO KREDIT</div>
                  <div className="text-sm font-bold text-slate-900">{profile.credits ?? 50}</div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenCreditAdjustment?.(profile.uid || profile.id);
                    }}
                    className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Sesuaikan kredit
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-600 font-semibold mb-0.5">PERAN / ROLE</div>
                  <div className="text-sm font-bold text-slate-900">{profile.role}</div>
                  <div className="text-[10px] text-slate-600">
                    {profile.adminAccess ? 'Akses Admin: Ya' : 'Akses Admin: Tidak'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-600 font-semibold mb-0.5">BERGABUNG</div>
                  <div className="text-xs font-bold text-slate-900">
                    {new Date(profile.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    UID: {profile.uid?.slice(0, 8)}...
                  </div>
                </div>
              </div>

              {/* Detail list */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nama Lengkap</span>
                  <span className="font-semibold text-slate-900">{profile.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-900">{profile.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Username</span>
                  <span className="font-semibold text-slate-900">@{profile.username}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bio</span>
                  <span className="font-semibold text-slate-900">{profile.bio || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Masa Aktif Premium</span>
                  <span className="font-semibold text-slate-900">
                    {profile.subscriptionExpiry
                      ? new Date(profile.subscriptionExpiry).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : 'Tidak ada / Gratis'}
                  </span>
                </div>
              </div>
            </div>
          ) : activeTab === 'subscriptions' ? (
            <div className="space-y-3">
              {data?.subscriptions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">User ini belum pernah membuat order langganan.</p>
              ) : (
                data?.subscriptions.map((sub) => (
                  <div key={sub.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">Paket {sub.plan} ({sub.duration})</div>
                      <div className="text-[11px] text-slate-500">
                        Rp {(sub.price || 0).toLocaleString('id-ID')} • Dibuat: {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                      </div>
                      {sub.rejectionReason && (
                        <div className="text-[11px] text-red-600 mt-1">Alasan ditolak: {sub.rejectionReason}</div>
                      )}
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                        sub.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'credits' ? (
            <div className="space-y-2">
              {data?.transactions.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada riwayat transaksi kredit.</p>
              ) : (
                data?.transactions.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl border border-slate-200 bg-white text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900">{tx.feature || tx.description}</div>
                      <div className="text-[11px] text-slate-500">{new Date(tx.createdAt).toLocaleString('id-ID')}</div>
                    </div>
                    <span className={`font-bold text-xs ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'usage' ? (
            <div className="space-y-2">
              {data?.usageList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada catatan pemakaian AI.</p>
              ) : (
                data?.usageList.map((u) => (
                  <div key={u.id} className="p-3 rounded-xl border border-slate-200 bg-white text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900 capitalize">{u.feature}</div>
                      <div className="text-[11px] text-slate-500">Tanggal: {u.date}</div>
                    </div>
                    <div className="px-2 py-1 bg-slate-100 rounded-md font-bold text-slate-800">
                      {u.count}x
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {data?.historyList.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Belum ada arsip generasi konten tersimpan.</p>
              ) : (
                data?.historyList.map((h) => (
                  <div key={h.id} className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{h.title || h.feature}</span>
                      <span className="text-[10px] text-slate-600">{new Date(h.createdAt).toLocaleDateString('id-ID')}</span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 text-[11px]">{h.result}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
