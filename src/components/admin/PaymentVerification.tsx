import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Eye,
  AlertCircle,
  DollarSign,
  Calendar,
  X,
  FileCheck,
} from 'lucide-react';
import { SubscriptionRecord, UserProfile } from '../../types';
import { getPendingPayments, approvePayment, rejectPayment } from '../../services/adminService';

interface PaymentVerificationProps {
  currentUser: UserProfile | null;
  onRefreshStats?: () => void;
}

export const PaymentVerification: React.FC<PaymentVerificationProps> = ({
  currentUser,
  onRefreshStats,
}) => {
  const [pendingList, setPendingList] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Reject Modal State
  const [rejectingSub, setRejectingSub] = useState<SubscriptionRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Bukti transfer tidak jelas / blur');
  const [customReason, setCustomReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getPendingPayments();
      setPendingList(data);
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Approve
  const handleApprove = async (sub: SubscriptionRecord) => {
    if (!currentUser) return;
    const confirmApprove = window.confirm(
      `Setujui pembayaran paket ${sub.plan} (${sub.duration}) seharga Rp ${(sub.price || 0).toLocaleString('id-ID')} untuk user ${sub.userId}? Akun user akan langsung aktif menjadi PREMIUM.`
    );
    if (!confirmApprove) return;

    setProcessingId(sub.id);
    setErrorMessage(null);

    try {
      await approvePayment(sub.id, currentUser);
      await loadData();
      onRefreshStats?.();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setErrorMessage(err.message || 'Gagal menyetujui pembayaran.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Reject Submit
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSub || !currentUser) return;

    const finalReason = rejectionReason === 'LAINNYA' ? customReason.trim() : rejectionReason;
    if (!finalReason) {
      setErrorMessage('Harap tentukan alasan penolakan.');
      return;
    }

    setProcessingId(rejectingSub.id);
    setErrorMessage(null);

    try {
      await rejectPayment(rejectingSub.id, currentUser, finalReason);
      setRejectingSub(null);
      setCustomReason('');
      await loadData();
      onRefreshStats?.();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setErrorMessage(err.message || 'Gagal menolak pembayaran.');
    } finally {
      setProcessingId(null);
    }
  };

  const predefinedReasons = [
    'Bukti transfer tidak jelas / blur',
    'Nominal transfer tidak sesuai dengan harga paket',
    'Dana pembayaran belum ditemukan pada mutasi rekening',
    'Bukti transfer tidak valid atau diduga palsu',
    'Rekening tujuan tidak sesuai dengan instruksi',
    'LAINNYA',
  ];

  return (
    <div id="admin-payment-verification-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Verification</h1>
            {pendingList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
                {pendingList.length} Menunggu
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600">
            Tinjau bukti transfer bank/e-wallet pengguna dan aktifkan status langganan Premium.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-600" />
          <p className="text-xs">Memeriksa pengajuan pembayaran di Firestore...</p>
        </div>
      ) : pendingList.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-2xl bg-white border border-slate-200 text-center max-w-lg mx-auto shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center mx-auto mb-3 text-emerald-600">
            <FileCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Semua Pembayaran Telah Ditinjau</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Tidak ada pengajuan pembayaran baru yang sedang menunggu verifikasi saat ini. Sistem akan otomatis memunculkan pembayaran ketika user mengunggah bukti transfer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingList.map((sub) => {
            const isProcessing = processingId === sub.id;
            return (
              <div
                key={sub.id}
                className="rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-sm transition-all"
              >
                {/* Order Top Bar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                      {sub.status}
                    </span>
                    <span className="text-[11px] text-slate-500">ID: {sub.id.slice(0, 10)}...</span>
                  </div>
                  <div className="text-xs font-black text-slate-900">
                    Rp {(sub.price || 0).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3 text-xs flex-1">
                  <div>
                    <span className="text-[11px] text-slate-600 font-semibold block mb-0.5">PAKET LANGGANAN</span>
                    <div className="font-bold text-slate-900 text-sm">
                      {sub.plan} • <span className="font-medium text-slate-600">{sub.duration}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-600 font-semibold block mb-0.5">USER ID (PEMILIK)</span>
                    <div className="font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-1 rounded-md break-all">
                      {sub.userId}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('id-ID') : 'Hari ini'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{sub.submittedAt ? new Date(sub.submittedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                    </span>
                  </div>

                  {/* Payment Proof Preview */}
                  <div>
                    <span className="text-[11px] text-slate-600 font-semibold block mb-1.5">BUKTI TRANSFER</span>
                    {sub.paymentProofUrl ? (
                      <div
                        onClick={() => setPreviewImageUrl(sub.paymentProofUrl || null)}
                        className="relative group rounded-xl border border-slate-200 overflow-hidden bg-slate-100 cursor-pointer h-36 flex items-center justify-center"
                      >
                        <img
                          src={sub.paymentProofUrl}
                          alt="Bukti transfer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-semibold">
                          <Eye className="w-4 h-4" />
                          <span>Perbesar Bukti</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-[11px] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Kreator belum melampirkan URL bukti pembayaran.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex gap-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => setRejectingSub(sub)}
                    className="flex-1 py-2 px-3 rounded-xl bg-white border border-slate-200 text-red-600 hover:bg-red-50 hover:border-red-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak</span>
                  </button>

                  <button
                    disabled={isProcessing}
                    onClick={() => handleApprove(sub)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Setujui</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingSub && (
        <div
          id="admin-reject-payment-modal"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Alasan Penolakan Pembayaran</h3>
              <button
                onClick={() => setRejectingSub(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Pilih alasan mengapa pembayaran paket <strong>{rejectingSub.plan}</strong> untuk user{' '}
              <strong className="font-mono">{rejectingSub.userId.slice(0, 12)}...</strong> ditolak. Alasan ini akan tercatat dalam sistem.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <div className="space-y-2">
                {predefinedReasons.map((reason) => (
                  <label
                    key={reason}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="radio"
                      name="rejectionReason"
                      value={reason}
                      checked={rejectionReason === reason}
                      onChange={() => setRejectionReason(reason)}
                      className="text-slate-900 focus:ring-slate-900"
                    />
                    <span className="text-slate-700">
                      {reason === 'LAINNYA' ? 'Tuliskan alasan lainnya...' : reason}
                    </span>
                  </label>
                ))}
              </div>

              {rejectionReason === 'LAINNYA' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Ketikkan alasan spesifik penolakan..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
                  rows={3}
                  required
                />
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectingSub(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingId === rejectingSub.id}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                >
                  {processingId === rejectingSub.id && <RefreshCw className="w-3 h-3 animate-spin" />}
                  <span>Tolak Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Proof Lightbox Modal */}
      {previewImageUrl && (
        <div
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl bg-slate-900 shadow-2xl">
            <img
              src={previewImageUrl}
              alt="Bukti Transfer Penuh"
              className="max-w-full max-h-[85vh] object-contain mx-auto"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
