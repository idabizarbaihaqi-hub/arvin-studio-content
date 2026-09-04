import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { SubscriptionRecord } from '../../types';
import { getAdminSubscriptions } from '../../services/adminService';

export const PremiumManagement: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'REJECTED'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedSub, setSelectedSub] = useState<SubscriptionRecord | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminSubscriptions({
        status: statusFilter,
        search,
      });
      setSubscriptions(data);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div id="admin-premium-management-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Premium Management</h1>
          </div>
          <p className="text-sm text-slate-600">
            Monitoring seluruh pesanan langganan Premium, masa aktif, dan riwayat transaksi.
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan User ID atau nama paket..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Status Langganan:</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { key: 'ALL', label: 'Semua' },
              { key: 'ACTIVE', label: 'Aktif (Approved)' },
              { key: 'PENDING', label: 'Pending / Review' },
              { key: 'REJECTED', label: 'Ditolak' },
              { key: 'EXPIRED', label: 'Kedaluwarsa' },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === f.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <span className="text-[11px] text-slate-600 ml-auto">
            Total: <strong className="text-slate-800 font-bold">{subscriptions.length}</strong> pesanan
          </span>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Order ID & User</th>
                <th className="py-3 px-4">Paket & Durasi</th>
                <th className="py-3 px-4">Harga</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Tanggal Mulai</th>
                <th className="py-3 px-4">Tanggal Selesai</th>
                <th className="py-3 px-4">Bukti</th>
                <th className="py-3 px-4 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Memuat data langganan dari Firestore...</span>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada pesanan langganan yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const isApproved = sub.status === 'APPROVED';
                  const isRejected = sub.status === 'REJECTED';
                  const isPending =
                    sub.status === 'PAYMENT_SUBMITTED' ||
                    sub.status === 'UNDER_REVIEW' ||
                    sub.status === 'PENDING_PAYMENT';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 font-mono text-[11px]">{sub.id.slice(0, 14)}...</div>
                        <div className="text-[10px] text-slate-600 font-mono">UID: {sub.userId.slice(0, 10)}...</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{sub.plan}</div>
                        <div className="text-[11px] text-slate-500">{sub.duration}</div>
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Rp {(sub.price || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isRejected
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {sub.startDate
                          ? new Date(sub.startDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        {sub.endDate
                          ? new Date(sub.endDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      <td className="py-3 px-4">
                        {sub.paymentProofUrl ? (
                          <a
                            href={sub.paymentProofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                          >
                            <span>Lihat</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-slate-600">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedSub(sub)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="Lihat Detail Pesanan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Quick Detail Modal */}
      {selectedSub && (
        <div
          onClick={() => setSelectedSub(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Detail Langganan</h3>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  selectedSub.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedSub.status === 'REJECTED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                {selectedSub.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Order ID</span>
                <span className="font-mono text-slate-800">{selectedSub.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">User ID</span>
                <span className="font-mono text-slate-800">{selectedSub.userId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Paket</span>
                <span className="font-bold text-slate-900">{selectedSub.plan} ({selectedSub.duration})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Nominal</span>
                <span className="font-bold text-slate-900">Rp {(selectedSub.price || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Ditinjau Oleh</span>
                <span className="text-slate-800">{selectedSub.reviewedBy || '-'}</span>
              </div>
              {selectedSub.rejectionReason && (
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 block mb-0.5">Alasan Penolakan</span>
                  <span className="text-red-700 font-medium">{selectedSub.rejectionReason}</span>
                </div>
              )}
            </div>

            {selectedSub.paymentProofUrl && (
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-1">Bukti Transfer:</span>
                <img
                  src={selectedSub.paymentProofUrl}
                  alt="Proof"
                  className="w-full h-40 object-cover rounded-xl border border-slate-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSub(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
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
