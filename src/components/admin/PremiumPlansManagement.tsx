import React, { useEffect, useState } from 'react';
import {
  Gem,
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  Calendar,
  Layers,
  Star,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
} from 'lucide-react';
import { PremiumPlan, PremiumPlanInput, UserProfile, DurationUnit } from '../../types';
import {
  getPremiumPlans,
  createPremiumPlan,
  updatePremiumPlan,
  togglePremiumPlanStatus,
  deletePremiumPlan,
  isPremiumPlansAdmin,
  DESIGNATED_SUPER_ADMIN_EMAIL,
} from '../../services/premiumPlanService';

interface PremiumPlansManagementProps {
  currentUser: UserProfile | null;
}

export const PremiumPlansManagement: React.FC<PremiumPlansManagementProps> = ({ currentUser }) => {
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal
  const [previewPlan, setPreviewPlan] = useState<PremiumPlan | null>(null);

  // Delete Modal
  const [planToDelete, setPlanToDelete] = useState<PremiumPlan | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle Loading State
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Form State
  const initialFormState: PremiumPlanInput = {
    name: '',
    price: 50000,
    duration: 7,
    durationUnit: 'Hari',
    description: '',
    badge: '',
    benefits: ['Akses seluruh AI Creator Tools', 'Generasi Konten tanpa batas'],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
  };

  const [formData, setFormData] = useState<PremiumPlanInput>(initialFormState);
  const [benefitInput, setBenefitInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthorized = isPremiumPlansAdmin(currentUser);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  const loadPlans = async () => {
    if (!isAuthorized) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getPremiumPlans();
      setPlans(data);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal memuat Paket Premium.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, [currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPlans();
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setFormData({
      ...initialFormState,
      sortOrder: plans.length + 1,
    });
    setBenefitInput('');
    setFormError(null);
    setFormMode('create');
    setEditingPlanId(null);
    setIsFormOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (plan: PremiumPlan) => {
    setFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      durationUnit: plan.durationUnit || 'Hari',
      description: plan.description || '',
      badge: plan.badge || '',
      benefits: [...plan.benefits],
      isPopular: Boolean(plan.isPopular),
      isActive: Boolean(plan.isActive),
      sortOrder: plan.sortOrder ?? 1,
    });
    setBenefitInput('');
    setFormError(null);
    setFormMode('edit');
    setEditingPlanId(plan.id);
    setIsFormOpen(true);
  };

  // Benefit List Management in Form
  const handleAddBenefit = () => {
    const trimmed = benefitInput.trim();
    if (!trimmed) return;
    setFormData((prev) => ({
      ...prev,
      benefits: [...prev.benefits, trimmed],
    }));
    setBenefitInput('');
  };

  const handleRemoveBenefit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index),
    }));
  };

  const handleMoveBenefit = (index: number, direction: 'up' | 'down') => {
    const newBenefits = [...formData.benefits];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBenefits.length) return;
    const temp = newBenefits[index];
    newBenefits[index] = newBenefits[targetIndex];
    newBenefits[targetIndex] = temp;
    setFormData((prev) => ({ ...prev, benefits: newBenefits }));
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Validation
    if (!formData.name.trim()) {
      setFormError('Nama paket wajib diisi.');
      return;
    }
    if (formData.price === undefined || formData.price < 0 || isNaN(formData.price)) {
      setFormError('Harga harus berupa angka dan tidak boleh negatif.');
      return;
    }
    if (!formData.duration || formData.duration <= 0 || isNaN(formData.duration)) {
      setFormError('Durasi harus berupa angka dan lebih dari 0.');
      return;
    }
    if (formData.isActive && formData.benefits.length === 0) {
      setFormError('Paket aktif wajib memiliki minimal 1 poin manfaat.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (formMode === 'create') {
        const created = await createPremiumPlan(formData, currentUser);
        showToast('success', `Paket "${created.name}" berhasil dibuat dan disimpan di Firestore!`);
      } else if (formMode === 'edit' && editingPlanId) {
        await updatePremiumPlan(editingPlanId, formData, currentUser);
        showToast('success', `Paket "${formData.name}" berhasil diperbarui!`);
      }
      setIsFormOpen(false);
      await loadPlans();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan paket.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active Status
  const handleToggleStatus = async (plan: PremiumPlan) => {
    if (!currentUser) return;
    setTogglingId(plan.id);
    try {
      const nextStatus = await togglePremiumPlanStatus(plan.id, plan.isActive, plan.name, currentUser);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextStatus } : p))
      );
      showToast('success', `Paket "${plan.name}" sekarang ${nextStatus ? 'Aktif (dapat dibeli user)' : 'Nonaktif (disembunyikan dari user)'}.`);
    } catch (err: any) {
      showToast('error', err.message || 'Gagal mengubah status paket.');
    } finally {
      setTogglingId(null);
    }
  };

  // Confirm and Execute Delete
  const handleConfirmDelete = async () => {
    if (!planToDelete || !currentUser) return;
    setDeleting(true);
    try {
      const result = await deletePremiumPlan(planToDelete.id, planToDelete.name, currentUser);
      showToast('success', result.message);
      setPlanToDelete(null);
      await loadPlans();
    } catch (err: any) {
      showToast('error', err.message || 'Gagal menghapus paket.');
    } finally {
      setDeleting(false);
    }
  };

  // 1. Guard: Non-authorized Access View
  if (!isAuthorized) {
    return (
      <div id="premium-plans-unauthorized" className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-red-200 shadow-xs p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
            Akses Dibatasi Khusus Super Admin
          </div>
          <h2 className="text-xl font-bold text-slate-900">Izin Akses Tidak Memenuhi Syarat</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Halaman Kelola Paket Premium hanya dapat diakses oleh Super Admin yang berwenang (
            <span className="font-semibold text-slate-800">{DESIGNATED_SUPER_ADMIN_EMAIL}</span>).
            Akun Anda (<span className="font-mono text-slate-700">{currentUser?.email || 'Guest'}</span>) tidak memiliki izin untuk mengelola paket ini.
          </p>
        </div>
      </div>
    );
  }

  const activeCount = plans.filter((p) => p.isActive).length;
  const popularCount = plans.filter((p) => p.isPopular).length;

  return (
    <div id="premium-plans-management-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          id="premium-plans-toast"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-current/60 hover:text-current cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Gem className="w-4 h-4" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Premium Plans</h1>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase tracking-wider">
              SUPER ADMIN
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Kelola paket, harga, durasi, dan manfaat Premium ARVIN STUDIO secara dinamis.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            id="premium-plans-refresh-btn"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Muat ulang data paket dari Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            id="premium-plans-add-btn"
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Paket Premium</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Paket Terdaftar</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{plans.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-600">Paket Aktif (Tampil di User)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-amber-600">Paket Populer (Rekomendasi)</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{popularCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Star className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <div className="text-sm font-semibold text-slate-800">Memuat data Paket Premium...</div>
          <div className="text-xs text-slate-500 mt-1">Mengambil data dari collection premium_plans</div>
        </div>
      ) : plans.length === 0 ? (
        /* Empty State */
        <div
          id="premium-plans-empty-state"
          className="p-12 text-center bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-4 max-w-xl mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
            <Gem className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Belum ada Paket Premium</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Buat paket langganan pertama Anda untuk mulai menawarkan akses premium kepada seluruh kreator ARVIN STUDIO.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Paket Premium</span>
          </button>
        </div>
      ) : (
        /* Plans Table / Cards */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Daftar Paket Langganan ({plans.length})
            </div>
            <div className="text-[11px] text-slate-500">
              Urutan berdasarkan prioritas sortOrder
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 w-12 text-center">Urutan</th>
                  <th className="py-3 px-4">Nama Paket & Badge</th>
                  <th className="py-3 px-4">Harga (IDR)</th>
                  <th className="py-3 px-4">Durasi</th>
                  <th className="py-3 px-4 text-center">Populer</th>
                  <th className="py-3 px-4">Manfaat</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-500">
                      #{plan.sortOrder ?? 1}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{plan.name}</span>
                        {plan.badge && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                            {plan.badge}
                          </span>
                        )}
                      </div>
                      {plan.description && (
                        <div className="text-[11px] text-slate-500 line-clamp-1 max-w-xs mt-0.5">
                          {plan.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      Rp {plan.price.toLocaleString('id-ID')}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{plan.duration} {plan.durationUnit}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {plan.isPopular ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          POPULER
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        {plan.benefits?.length || 0} Manfaat
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        disabled={togglingId === plan.id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          plan.isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title={plan.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                        <span>{plan.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPreviewPlan(plan)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Lihat Pratinjau Tampilan User"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(plan)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Edit Paket"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPlanToDelete(plan)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Hapus / Nonaktifkan Paket"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="md:hidden divide-y divide-slate-100">
            {plans.map((plan) => (
              <div key={plan.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-400">#{plan.sortOrder}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{plan.name}</h4>
                    </div>
                    {plan.badge && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {plan.isPopular && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        POPULER
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Harga</div>
                    <div className="font-mono font-bold text-slate-900 text-sm">
                      Rp {plan.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Durasi</div>
                    <div className="font-semibold text-slate-800">
                      {plan.duration} {plan.durationUnit}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-semibold">Status</div>
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold mt-0.5 ${
                        plan.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-600' : 'bg-slate-400'}`} />
                      <span>{plan.isActive ? 'Aktif' : 'Nonaktif'}</span>
                    </button>
                  </div>
                </div>

                {plan.description && (
                  <p className="text-xs text-slate-500">{plan.description}</p>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {plan.benefits?.length || 0} poin manfaat
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPreviewPlan(plan)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleOpenEdit(plan)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setPlanToDelete(plan)}
                      className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal (Tambah / Edit) */}
      {isFormOpen && (
        <div
          id="premium-plan-form-modal"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Gem className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {formMode === 'create' ? 'Tambah Paket Premium Baru' : 'Edit Paket Premium'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Nama Paket */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Nama Paket <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: PREMIUM 7 HARI, PREMIUM PRO"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              {/* 2. Harga & Preview Rupiah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">
                    Harga (Angka/Numeric) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="Contoh: 75000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-mono"
                  />
                  <div className="mt-1 text-[11px] text-blue-600 font-semibold">
                    Format UI: Rp {(formData.price || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* 3. Durasi & Satuan */}
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">
                    Durasi & Satuan <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min={1}
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      placeholder="7"
                      className="w-24 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-mono"
                    />
                    <select
                      value={formData.durationUnit}
                      onChange={(e) => setFormData({ ...formData, durationUnit: e.target.value as DurationUnit })}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-semibold"
                    >
                      <option value="Hari">Hari</option>
                      <option value="Bulan">Bulan</option>
                      <option value="Tahun">Tahun</option>
                    </select>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Durasi aktif: {formData.duration} {formData.durationUnit}
                  </div>
                </div>
              </div>

              {/* 4. Deskripsi Singkat */}
              <div>
                <label className="block font-semibold text-slate-800 mb-1.5">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Contoh: Akses Premium untuk kreator yang ingin mencoba seluruh fitur AI secara intensif."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-xs"
                />
              </div>

              {/* 5. Badge & Urutan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">
                    Label / Badge Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Contoh: BEST SELLER, HEMAT 40%"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1.5">
                    Urutan Tampilan (Sort Order) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white font-mono"
                  />
                </div>
              </div>

              {/* 6. Toggles (Populer & Aktif) */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap gap-6 items-center">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block text-xs sm:text-sm">Tandai sebagai Paket Populer</span>
                    <span className="text-[11px] text-slate-500">Menampilkan badge POPULER dan border sorotan</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div>
                    <span className="font-semibold text-slate-900 block text-xs sm:text-sm">Status Aktif</span>
                    <span className="text-[11px] text-slate-500">Tampil di halaman langganan kreator</span>
                  </div>
                </label>
              </div>

              {/* 7. Manfaat Dinamis (Benefits Manager) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-semibold text-slate-800">
                    Daftar Manfaat Paket ({formData.benefits.length}) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Dapat diurutkan atau dihapus</span>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBenefit();
                      }
                    }}
                    placeholder="Ketik manfaat baru lalu tekan tombol Tambah..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white text-xs sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
                  >
                    + Tambah
                  </button>
                </div>

                {formData.benefits.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Belum ada manfaat yang ditambahkan. Ketik poin di atas lalu klik Tambah.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {formData.benefits.map((benefit, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="text-slate-800 truncate">{benefit}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveBenefit(idx, 'up')}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Pindah ke atas"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === formData.benefits.length - 1}
                            onClick={() => handleMoveBenefit(idx, 'down')}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBenefit(idx)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                            title="Hapus manfaat"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{formMode === 'create' ? 'Simpan Paket Premium' : 'Perbarui Paket'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal (User-Facing Card View) */}
      {previewPlan && (
        <div
          id="premium-plan-preview-modal"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-700">Pratinjau Tampilan Paket User</span>
              </div>
              <button
                onClick={() => setPreviewPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rendered User Card */}
            <div className="p-6">
              <div
                className={`relative rounded-2xl border p-6 transition-all ${
                  previewPlan.isPopular
                    ? 'border-blue-500 bg-blue-50/30 shadow-md ring-1 ring-blue-500/20'
                    : 'border-slate-200 bg-white shadow-xs'
                }`}
              >
                {previewPlan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                    PALING POPULER
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-black text-base text-slate-900 tracking-tight">{previewPlan.name}</h4>
                  {previewPlan.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {previewPlan.badge}
                    </span>
                  )}
                </div>

                {previewPlan.description && (
                  <p className="text-xs text-slate-600 mb-4">{previewPlan.description}</p>
                )}

                <div className="mb-5 pb-4 border-b border-slate-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900">
                      Rp {previewPlan.price.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / {previewPlan.duration} {previewPlan.durationUnit}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5 mb-6 text-xs text-slate-700">
                  {previewPlan.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs opacity-90 cursor-not-allowed text-center"
                >
                  Pilih Paket Ini (Pratinjau Saja)
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
              Tampilan ini menyesuaikan data langsung dari Firestore.
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {planToDelete && (
        <div
          id="premium-plan-delete-modal"
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Hapus Paket Premium?</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus paket <strong className="text-slate-900">"{planToDelete.name}"</strong>?
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Harga:</span>
                <span className="font-bold font-mono">Rp {planToDelete.price.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Durasi:</span>
                <span className="font-semibold">{planToDelete.duration} {planToDelete.durationUnit}</span>
              </div>
              <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 mt-2">
                * Keamanan data: Jika paket ini pernah digunakan untuk transaksi pengguna, sistem secara otomatis melakukan <strong>soft delete</strong> (menonaktifkan & mengarsipkan) agar riwayat langganan pengguna tidak rusak.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPlanToDelete(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{deleting ? 'Memproses...' : 'Hapus Paket'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
