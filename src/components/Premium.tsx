import React, { useEffect, useState, useRef } from 'react';
import {
  Crown,
  Check,
  ArrowLeft,
  Calendar,
  Clock,
  Info,
  Upload,
  Copy,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { SubscriptionRecord, UserProfile, PaymentAccount } from '../types';
import {
  getUserProfile,
  fetchUserSubscriptions,
  createSubscriptionOrder,
  submitPaymentProofOrder,
  validatePaymentProofFile,
} from '../services/accessControlService';
import { getActivePaymentAccounts } from '../services/paymentAccountService';

interface PremiumProps {
  onBack: () => void;
}

interface PackagePlan {
  name: string;
  price: number;
  duration: string;
  popular?: boolean;
  benefits: string[];
}

const PACKAGES: PackagePlan[] = [
  {
    name: 'PREMIUM 7 HARI',
    price: 50000,
    duration: '7 Hari',
    benefits: [
      'Akses tanpa batas seluruh AI Creator Tools',
      'Chat AI tanpa limit 5x/hari',
      'Content Analyzer & Content Ideas unlimited',
      'Caption Maker, Hook & Script Maker unlimited',
      'Hashtag Generator unlimited',
      'Content Planner & Kalender Terjadwal',
      'Analytics & Pelacakan AI Usage',
      'Bebas Iklan & Premium Badge Kreator',
    ],
  },
  {
    name: 'PREMIUM 30 HARI',
    price: 150000,
    duration: '30 Hari',
    popular: true,
    benefits: [
      'Semua keuntungan paket 7 hari',
      'Akses 30 hari penuh tanpa batas',
      'Hemat 40% dibandingkan mingguan',
      'Prioritas pemrosesan server berkecepatan tinggi',
      'Ekspor riwayat dan jadwal konten tanpa batas',
      'Dukungan prioritas kreator ARVIN',
    ],
  },
  {
    name: 'PREMIUM 12 BULAN',
    price: 180000,
    duration: '12 Bulan',
    benefits: [
      'Semua fitur dan alat premium tanpa batas',
      'Akses penuh 365 hari untuk kreator profesional',
      'Hemat maksimal hingga 60%',
      'Akses awal ke fitur baru mendatang',
      'Konsultasi optimasi alur kerja konten',
    ],
  },
];

export const Premium: React.FC<PremiumProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Payment Accounts (Tahap 8C)
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Modal State for Payment & Upload Proof
  const [selectedPlan, setSelectedPlan] = useState<PackagePlan | null>(null);
  const [activeSubscriptionId, setActiveSubscriptionId] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'success' | 'error'>('idle');
  const [uploadStatusMessage, setUploadStatusMessage] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingAccounts(true);
      const [userProf, userSubs, activeAccounts] = await Promise.all([
        getUserProfile(),
        fetchUserSubscriptions(),
        getActivePaymentAccounts(),
      ]);
      setProfile(userProf);
      setSubscriptions(userSubs);
      setPaymentAccounts(activeAccounts);
    } catch (err) {
      console.error('Failed to load subscription or payment account data:', err);
    } finally {
      setLoading(false);
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPackage = async (pkg: PackagePlan) => {
    try {
      setUploadError(null);
      setSubmissionSuccess(false);
      setUploadStatus('idle');
      setUploadStatusMessage('');
      setProofFile(null);
      setProofPreview(null);
      setSelectedPlan(pkg);

      // Refresh active payment accounts in background
      getActivePaymentAccounts()
        .then((accs) => setPaymentAccounts(accs))
        .catch((e) => console.error('Failed to refresh payment accounts:', e));

      // Create new pending subscription record in Firestore
      const newSub = await createSubscriptionOrder({
        plan: pkg.name,
        price: pkg.price,
        duration: pkg.duration,
      });

      setActiveSubscriptionId(newSub.id);
      setSubscriptions((prev) => [newSub, ...prev.filter((s) => s.id !== newSub.id)]);
    } catch (err: any) {
      console.error('Error creating subscription order:', err);
      setUploadError(err.message || 'Gagal memulai pesanan langganan.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Immediate validation of MIME type and file size
    const validation = validatePaymentProofFile(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Format atau ukuran file tidak didukung.');
      setProofFile(null);
      setProofPreview(null);
      return;
    }

    setProofFile(file);
    setUploadError(null);
    setUploadStatus('idle');
    setUploadStatusMessage('');

    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  };

  const handleSubmitProof = async () => {
    if (!activeSubscriptionId || !proofFile) {
      setUploadError('Silakan pilih file bukti transfer terlebih dahulu.');
      return;
    }

    const validation = validatePaymentProofFile(proofFile);
    if (!validation.isValid) {
      setUploadError(validation.error || 'File tidak valid.');
      return;
    }

    try {
      setSubmittingProof(true);
      setUploadError(null);
      setUploadStatus('uploading');

      const updated = await submitPaymentProofOrder({
        subscriptionId: activeSubscriptionId,
        plan: selectedPlan?.name || 'PREMIUM',
        price: selectedPlan?.price || 0,
        duration: selectedPlan?.duration || '30 Hari',
        file: proofFile,
        onStateChange: (state, message) => {
          setUploadStatus(state);
          if (message) setUploadStatusMessage(message);
        },
      });

      setUploadStatus('success');
      setSubmissionSuccess(true);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === activeSubscriptionId ? updated : s))
      );
      // Realtime refetch of user profile and subscriptions
      await loadData();
    } catch (err: any) {
      console.error('Error submitting proof:', err);
      setUploadStatus('error');
      setUploadError(err.message || 'Bukti transfer gagal diunggah. Silakan coba lagi.');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleCopy = (text: string, bankId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(bankId);
    setCopyToast('Nomor rekening berhasil disalin');
    setTimeout(() => {
      setCopiedBank(null);
      setCopyToast(null);
    }, 2500);
  };

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

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Disetujui (Premium Aktif)
          </span>
        );
      case 'PAYMENT_SUBMITTED':
      case 'UNDER_REVIEW':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Review Admin
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Pembayaran
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            Ditolak Admin
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
            Kedaluwarsa
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const isPremiumActive = profile?.plan === 'PREMIUM' && profile?.subscriptionStatus === 'ACTIVE';

  return (
    <div id="premium-view" className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Kembali"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Paket Langganan Premium
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  ARVIN PRO
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Akses tanpa batas ke seluruh AI Creator Tools dan ekosistem konten
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Status Banner */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                Status Akun Anda Saat Ini
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {isPremiumActive ? 'PREMIUM PLAN' : 'FREE PLAN'}
                </h2>
                {isPremiumActive ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aktif
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    Gratis (5× per hari/fitur)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Terdaftar: <strong className="text-slate-700">{formatDate(profile?.createdAt)}</strong>
                </span>
                {isPremiumActive && profile?.subscriptionExpiry && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Berakhir: <strong className="text-emerald-700">{formatDate(profile.subscriptionExpiry)}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Official Flow Note */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1.5 max-w-sm">
              <span className="font-bold text-slate-800 block text-xs flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-600" />
                Alur Aktivasi Langganan:
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Pilih Paket &rarr; Transfer Bank &rarr; Unggah Bukti &rarr; Tinjauan Admin &rarr; Premium Aktif.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.name}
              className={`bg-white rounded-3xl p-6 flex flex-col justify-between relative transition-all ${
                pkg.popular
                  ? 'border-2 border-amber-400 shadow-md ring-4 ring-amber-400/10'
                  : 'border border-slate-200/90 shadow-xs hover:border-slate-300'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-500 text-white text-[11px] font-bold rounded-full shadow-sm">
                  PALING POPULER
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${
                      pkg.popular
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {pkg.duration}
                  </span>
                  <Crown
                    className={`w-5 h-5 ${pkg.popular ? 'text-amber-500' : 'text-slate-400'}`}
                  />
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h2>
                <p className="text-xs text-slate-500 mb-4">
                  Masa aktif {pkg.duration} penuh tanpa batas
                </p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">
                      {formatRupiah(pkg.price)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ {pkg.duration}</span>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 pt-4 border-t border-slate-100">
                  {pkg.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                id={`btn-select-package-${pkg.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => handleSelectPackage(pkg)}
                className={`mt-6 w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                <span>Pilih Paket {pkg.duration}</span>
              </button>
            </div>
          ))}
        </div>

        {/* User's Order & Subscription History (Firestore Real Data) */}
        {subscriptions.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              Riwayat Pengajuan & Langganan Anda
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Paket</th>
                    <th className="py-2.5 px-3">Nominal</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Diajukan</th>
                    <th className="py-2.5 px-3">Bukti</th>
                    <th className="py-2.5 px-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-slate-900">{sub.plan}</td>
                      <td className="py-3 px-3">{formatRupiah(sub.price)}</td>
                      <td className="py-3 px-3">{getStatusBadge(sub.status)}</td>
                      <td className="py-3 px-3 text-slate-400">{formatDate(sub.createdAt)}</td>
                      <td className="py-3 px-3">
                        {sub.paymentProofUrl ? (
                          <a
                            href={sub.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat Bukti
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">Belum diunggah</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {sub.status === 'PENDING_PAYMENT' && (
                          <button
                            type="button"
                            onClick={() => {
                              const pkg = PACKAGES.find((p) => p.name === sub.plan) || PACKAGES[0];
                              setSelectedPlan(pkg);
                              setActiveSubscriptionId(sub.id);
                              setSubmissionSuccess(false);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-medium text-[11px] hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            Unggah Bukti
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment & Upload Modal */}
        {selectedPlan && activeSubscriptionId && (
          <div
            id="payment-modal-overlay"
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
            onClick={() => setSelectedPlan(null)}
          >
            <div
              id="payment-modal-content"
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 relative text-slate-900 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                aria-label="Tutup"
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Crown className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Instruksi Pembayaran {selectedPlan.name}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Selesaikan transfer dan unggah bukti pembayaran untuk verifikasi Admin.
              </p>

              {/* Order summary box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Paket Pilihan:</span>
                  <span className="font-bold text-slate-900">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Durasi:</span>
                  <span className="font-bold text-slate-900">{selectedPlan.duration}</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Total Transfer:</span>
                  <span className="font-extrabold text-amber-600 text-lg">
                    {formatRupiah(selectedPlan.price)}
                  </span>
                </div>
              </div>

              {/* Bank Accounts (Tahap 8C Dynamic) */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Rekening Tujuan Transfer
                  </span>
                  {copyToast && (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 animate-in fade-in duration-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {copyToast}
                    </span>
                  )}
                </div>

                {loadingAccounts ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                    <span>Memuat rekening pembayaran...</span>
                  </div>
                ) : paymentAccounts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-xs flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Rekening pembayaran sedang dipersiapkan. Silakan hubungi Admin.</span>
                  </div>
                ) : (
                  paymentAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {account.bankName}
                          </span>
                          {account.description && (
                            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 truncate max-w-[140px]">
                              {account.description}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-mono font-extrabold text-slate-900 tracking-wide block">
                          {account.accountNumber}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          a.n. {account.accountName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(account.accountNumber, account.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-2xs"
                        title="Salin Nomor Rekening"
                      >
                        {copiedBank === account.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Upload Proof Area */}
              <div className="space-y-3 mb-5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Unggah Bukti Transfer
                </span>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {submissionSuccess ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>Bukti transfer berhasil diunggah. Menunggu verifikasi admin.</span>
                    </div>
                    <p className="text-xs leading-relaxed text-emerald-700">
                      File bukti transfer Anda telah tersimpan dengan aman di Firebase Storage. Status pesanan Anda kini <strong>PAYMENT_SUBMITTED</strong>. Super Admin akan memverifikasi pembayaran Anda segera.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan(null);
                        setSubmissionSuccess(false);
                        setUploadStatus('idle');
                        setProofFile(null);
                        setProofPreview(null);
                      }}
                      className="mt-2 w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Selesai & Tutup
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {proofFile ? (
                      <div className="space-y-2">
                        {proofPreview ? (
                          <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-48 bg-slate-900 flex items-center justify-center">
                            <img
                              src={proofPreview}
                              alt="Preview Bukti Transfer"
                              className="max-h-48 object-contain w-full"
                            />
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600 shrink-0" />
                            <div className="text-xs truncate">
                              <span className="font-bold text-slate-800 block truncate">{proofFile.name}</span>
                              <span className="text-slate-500 text-[11px]">Dokumen PDF</span>
                            </div>
                          </div>
                        )}

                        {/* File details */}
                        <div className="flex items-center justify-between text-[11px] text-slate-600 px-1">
                          <span className="font-medium truncate max-w-[240px]">{proofFile.name}</span>
                          <span className="font-mono text-slate-500 shrink-0">
                            {(proofFile.size / (1024 * 1024)).toFixed(2)} MB
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={submittingProof}
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs text-slate-600 hover:underline block text-center w-full cursor-pointer disabled:opacity-50"
                        >
                          Ganti file bukti transfer
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
                      >
                        <Upload className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-700 block">
                          Klik untuk memilih bukti transfer
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-1">
                          Format JPG, PNG, WEBP, atau PDF (maks. 5MB)
                        </span>
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-2">
                      <button
                        type="button"
                        id="btn-submit-payment-proof"
                        disabled={submittingProof || !proofFile || uploadStatus === 'success'}
                        onClick={handleSubmitProof}
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>{uploadStatusMessage || 'Mengunggah...'}</span>
                          </>
                        ) : uploadStatus === 'success' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            <span>Berhasil Diunggah</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Unggah Bukti</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        disabled={submittingProof}
                        onClick={() => {
                          setSelectedPlan(null);
                          setProofFile(null);
                          setProofPreview(null);
                          setUploadError(null);
                          setUploadStatus('idle');
                        }}
                        className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Batal
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
