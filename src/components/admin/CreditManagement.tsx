import React, { useEffect, useState } from 'react';
import {
  Coins,
  Search,
  RefreshCw,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
  X,
  History,
} from 'lucide-react';
import { UserProfile, CreditTransaction } from '../../types';
import { getAdminUsers, adjustUserCredits, getUserDetailData } from '../../services/adminService';

interface CreditManagementProps {
  currentUser: UserProfile | null;
  presetTargetUserId?: string | null;
  onClearPreset?: () => void;
}

export const CreditManagement: React.FC<CreditManagementProps> = ({
  currentUser,
  presetTargetUserId,
  onClearPreset,
}) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Adjustment Modal State
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [amount, setAmount] = useState<number>(50);
  const [reason, setReason] = useState('Bonus operasional Super Admin');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // User transaction history drawer
  const [historyUser, setHistoryUser] = useState<UserProfile | null>(null);
  const [userTxList, setUserTxList] = useState<CreditTransaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getAdminUsers({ search });
      setUsers(list);

      // Handle preset from other screens
      if (presetTargetUserId) {
        const found = list.find((u) => (u.uid || u.id) === presetTargetUserId);
        if (found) {
          setTargetUser(found);
          onClearPreset?.();
        }
      }
    } catch (err) {
      console.error('Failed to load users for credit management:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [presetTargetUserId]);

  const handleOpenAdjustment = (user: UserProfile, type: 'ADD' | 'DEDUCT') => {
    setTargetUser(user);
    setAdjustmentType(type);
    setAmount(type === 'ADD' ? 50 : 20);
    setReason(
      type === 'ADD'
        ? 'Bonus operasional Super Admin'
        : 'Penyesuaian saldo berlebih oleh Super Admin'
    );
    setFeedback(null);
  };

  const handleOpenHistory = async (user: UserProfile) => {
    setHistoryUser(user);
    setHistoryLoading(true);
    try {
      const detail = await getUserDetailData(user.uid || user.id);
      setUserTxList(detail.transactions);
    } catch (err) {
      console.error('Failed to load user transactions:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !currentUser) return;

    if (amount <= 0) {
      setFeedback({ type: 'error', message: 'Jumlah kredit harus lebih besar dari 0.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    const finalAmount = adjustmentType === 'ADD' ? amount : -amount;

    try {
      const newBalance = await adjustUserCredits(
        targetUser.uid || targetUser.id,
        finalAmount,
        reason,
        currentUser
      );

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          (u.uid || u.id) === (targetUser.uid || targetUser.id)
            ? { ...u, credits: newBalance }
            : u
        )
      );

      setFeedback({
        type: 'success',
        message: `Berhasil menyesuaikan kredit ${targetUser.fullName}. Saldo sekarang: ${newBalance} kredit.`,
      });

      setTimeout(() => {
        setTargetUser(null);
        setFeedback(null);
      }, 1500);
    } catch (err: any) {
      console.error('Adjustment failed:', err);
      setFeedback({ type: 'error', message: err.message || 'Gagal menyesuaikan kredit.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="admin-credit-management-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Coins className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Credit Management</h1>
          </div>
          <p className="text-sm text-slate-600">
            Monitor saldo kredit pengguna, lakukan top-up manual, atau penyesuaian debit saldo dengan audit log Firestore.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user berdasarkan nama, username, atau email..."
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
          />
        </div>
        <button
          onClick={loadUsers}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
        >
          Cari
        </button>
      </div>

      {/* Users & Credit Balance Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Paket</th>
                <th className="py-3 px-4">Saldo Kredit</th>
                <th className="py-3 px-4">Riwayat</th>
                <th className="py-3 px-4 text-right">Penyesuaian Kredit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Memuat data saldo pengguna...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ditemukan pengguna yang cocok.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id || u.uid} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{u.fullName}</div>
                      <div className="text-[11px] text-slate-500">@{u.username}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{u.email}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          u.plan === 'PREMIUM'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.plan}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-900">
                        <Coins className="w-4 h-4 text-amber-500" />
                        <span>{u.credits ?? 50}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleOpenHistory(u)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>Lihat Ledger</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAdjustment(u, 'ADD')}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-emerald-200"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah</span>
                        </button>
                        <button
                          onClick={() => handleOpenAdjustment(u, 'DEDUCT')}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer border border-red-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          <span>Kurangi</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Adjustment Modal */}
      {targetUser && (
        <div
          id="credit-adjustment-modal"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {adjustmentType === 'ADD' ? 'Tambah Kredit Pengguna' : 'Kurangi Kredit Pengguna'}
                </h3>
              </div>
              <button
                onClick={() => setTargetUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Target User:</span>
              <div className="font-bold text-slate-900 text-sm">{targetUser.fullName} (@{targetUser.username})</div>
              <div className="text-[11px] text-slate-500">{targetUser.email}</div>
              <div className="mt-1 font-semibold text-slate-700">
                Saldo Saat Ini: <span className="font-bold text-purple-700">{targetUser.credits ?? 50} kredit</span>
              </div>
            </div>

            {feedback && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitAdjustment} className="space-y-3 text-xs">
              {/* Adjustment Mode Toggle */}
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">TIPE PENYESUAIAN</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('ADD')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      adjustmentType === 'ADD'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah (+)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('DEDUCT')}
                    className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      adjustmentType === 'DEDUCT'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Kurangi (-)</span>
                  </button>
                </div>
              </div>

              {/* Amount Quick Presets */}
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">JUMLAH KREDIT</label>
                <div className="flex gap-1.5 mb-2">
                  {[20, 50, 100, 250, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmount(preset)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                        amount === preset
                          ? 'border-purple-600 bg-purple-50 text-purple-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={amount}
                  onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500 font-bold"
                  required
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-[11px] text-slate-600 font-semibold block mb-1">CATATAN / ALASAN</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Bonus kompensasi, promo loyalty, dll..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTargetUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 rounded-xl text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    adjustmentType === 'ADD' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{adjustmentType === 'ADD' ? 'Tambahkan Kredit' : 'Kurangi Kredit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Transaction History Drawer */}
      {historyUser && (
        <div
          onClick={() => setHistoryUser(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-lg w-full rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Ledger Kredit Pengguna</h3>
                <p className="text-xs text-slate-500">{historyUser.fullName} • Saldo: {historyUser.credits ?? 50} kredit</p>
              </div>
              <button
                onClick={() => setHistoryUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {historyLoading ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mb-2 text-slate-600" />
                  <span>Memuat riwayat transaksi...</span>
                </div>
              ) : userTxList.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Belum ada transaksi kredit tercatat di Firestore.</p>
              ) : (
                userTxList.map((tx) => (
                  <div key={tx.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-slate-900">{tx.feature || tx.description}</div>
                      <div className="text-[11px] text-slate-500">{new Date(tx.createdAt).toLocaleString('id-ID')}</div>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                        {tx.type}
                      </span>
                    </div>
                    <span className={`font-black text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setHistoryUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
