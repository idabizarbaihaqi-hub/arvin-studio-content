import React, { useEffect, useState } from 'react';
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  Calendar,
  X,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { PaymentAccount, UserProfile } from '../../types';
import {
  getPaymentAccounts,
  createPaymentAccount,
  updatePaymentAccount,
  deletePaymentAccount,
  togglePaymentAccountStatus,
  PaymentAccountInput,
} from '../../services/paymentAccountService';

interface PaymentAccountManagementProps {
  currentUser: UserProfile | null;
}

export const PaymentAccountManagement: React.FC<PaymentAccountManagementProps> = ({ currentUser }) => {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form modal state (for Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<PaymentAccountInput>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    description: '',
    isActive: true,
  });

  // Delete confirmation modal state
  const [accountToDelete, setAccountToDelete] = useState<PaymentAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle status loading per account
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getPaymentAccounts();
      setAccounts(data);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat daftar rekening pembayaran.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAccounts();
  };

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setEditingAccountId(null);
    setFormData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      description: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (account: PaymentAccount) => {
    setModalMode('edit');
    setEditingAccountId(account.id);
    setFormData({
      bankName: account.bankName,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      description: account.description || '',
      isActive: account.isActive,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccountId(null);
    setFormData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      description: '',
      isActive: true,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      showToast('error', 'Sesi Super Admin tidak valid.');
      return;
    }

    if (!formData.bankName.trim()) {
      showToast('error', 'Nama bank wajib diisi.');
      return;
    }
    if (!formData.accountName.trim()) {
      showToast('error', 'Nama pemilik rekening wajib diisi.');
      return;
    }
    if (!formData.accountNumber.trim()) {
      showToast('error', 'Nomor rekening wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        await createPaymentAccount(formData, currentUser);
        showToast('success', 'Rekening berhasil ditambahkan.');
      } else if (editingAccountId) {
        await updatePaymentAccount(editingAccountId, formData, currentUser);
        showToast('success', 'Rekening berhasil diperbarui.');
      }
      handleCloseModal();
      await loadAccounts();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menyimpan data rekening.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accountToDelete || !currentUser) return;
    setDeleting(true);
    try {
      await deletePaymentAccount(
        accountToDelete.id,
        { bankName: accountToDelete.bankName, accountNumber: accountToDelete.accountNumber },
        currentUser
      );
      showToast('success', 'Rekening berhasil dihapus.');
      setAccountToDelete(null);
      await loadAccounts();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus rekening.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (account: PaymentAccount) => {
    if (!currentUser) return;
    setTogglingId(account.id);
    try {
      const newStatus = await togglePaymentAccountStatus(
        account.id,
        account.isActive,
        { bankName: account.bankName, accountNumber: account.accountNumber },
        currentUser
      );
      showToast(
        'success',
        `Rekening ${account.bankName} berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}.`
      );
      await loadAccounts();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status rekening.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCopyAccountNumber = async (account: PaymentAccount) => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopiedId(account.id);
      showToast('success', 'Nomor rekening berhasil disalin.');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      showToast('error', 'Gagal menyalin nomor rekening ke clipboard.');
    }
  };

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.isActive).length;
  const inactiveAccounts = totalAccounts - activeAccounts;

  return (
    <div id="payment-accounts-management-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          id="payment-account-toast"
          className={`p-4 rounded-2xl border flex items-center justify-between text-sm transition-all shadow-sm ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 hover:bg-black/5 rounded-lg text-slate-500 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekening Pembayaran</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Kelola rekening bank tujuan transfer manual untuk pembayaran paket langganan Premium pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Segarkan data dari Firestore"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="btn-add-payment-account"
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              TOTAL REKENING
            </span>
            <div className="text-2xl font-black text-slate-900">{totalAccounts}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Tersimpan di Firestore</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              REKENING AKTIF
            </span>
            <div className="text-2xl font-black text-emerald-600">{activeAccounts}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Ditampilkan ke User</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
              REKENING NONAKTIF
            </span>
            <div className="text-2xl font-black text-slate-600">{inactiveAccounts}</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Disembunyikan dari User</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Account Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Daftar Rekening Bank</h2>
          <span className="text-xs text-slate-500">
            {accounts.length} rekening terdaftar
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-600">Memuat rekening dari Firestore...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Belum Ada Rekening Pembayaran</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Silakan tambahkan rekening bank resmi yang akan digunakan pengguna untuk melakukan transfer manual saat upgrade ke Premium.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekening Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => {
              const isCopied = copiedId === account.id;
              const isToggling = togglingId === account.id;

              return (
                <div
                  key={account.id}
                  id={`account-card-${account.id}`}
                  className={`p-5 rounded-2xl bg-white border transition-all flex flex-col justify-between ${
                    account.isActive
                      ? 'border-slate-200 shadow-xs hover:border-slate-300'
                      : 'border-slate-200/70 bg-slate-50/70 opacity-80'
                  }`}
                >
                  {/* Top Header of Card */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          account.isActive
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {account.bankName.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 leading-tight">
                            {account.bankName}
                          </h3>
                          <span className="text-xs text-slate-500">
                            a.n. {account.accountName}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        account.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {account.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Account Number Box */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-0.5">
                          NOMOR REKENING
                        </span>
                        <span className="text-base font-mono font-bold text-slate-900 tracking-wide">
                          {account.accountNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyAccountNumber(account)}
                        title="Salin nomor rekening"
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px] font-medium">{isCopied ? 'Disalin' : 'Salin'}</span>
                      </button>
                    </div>

                    {/* Description if present */}
                    {account.description && (
                      <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                        {account.description}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="text-[10px] text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-100">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>
                        Dibuat:{' '}
                        {account.createdAt
                          ? new Date(account.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* Toggle Active Status */}
                    <button
                      onClick={() => handleToggleStatus(account)}
                      disabled={isToggling}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                        account.isActive
                          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {isToggling ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : account.isActive ? (
                        <ToggleRight className="w-4 h-4 text-amber-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-emerald-600" />
                      )}
                      <span>{account.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(account)}
                      className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
                      title="Edit rekening"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setAccountToDelete(account)}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                      title="Hapus rekening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal (Create / Edit) */}
      {isModalOpen && (
        <div
          id="payment-account-form-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                  <Landmark className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  {modalMode === 'create' ? 'Tambah Rekening Baru' : 'Edit Rekening Pembayaran'}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Bank Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="Contoh: BCA, BRI, Mandiri, BNI"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Account Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nama Pemilik Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  placeholder="Nama sesuai buku tabungan / PT"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="Contoh: 8735092114"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Deskripsi / Catatan <span className="text-slate-400 text-[10px] font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Rekening utama operasional transfer BCA"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors resize-none"
                />
              </div>

              {/* Status Toggle */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Status Rekening</span>
                  <span className="text-[11px] text-slate-500">
                    {formData.isActive ? 'Aktif (Ditampilkan kepada user)' : 'Nonaktif (Disembunyikan)'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Simpan Rekening' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {accountToDelete && (
        <div
          id="payment-account-delete-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !deleting && setAccountToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-slate-900">Hapus Rekening?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus rekening{' '}
                <strong className="text-slate-900">{accountToDelete.bankName} - {accountToDelete.accountNumber}</strong>{' '}
                (a.n. {accountToDelete.accountName})?
              </p>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              Tindakan ini tidak dapat dibatalkan. Riwayat transaksi sebelumnya yang mencatat rekening ini tetap terjaga.
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
