import React, { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  Clock,
  Cpu,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
  Coins,
  ShieldCheck,
  Landmark,
  Key,
  Sparkles,
} from 'lucide-react';
import { AdminDashboardMetrics, AdminViewKey, SubscriptionRecord, AdminActivityLog } from '../../types';
import {
  getAdminStats,
  getPendingPayments,
  getAdminActivityLogs,
  getSystemGeminiConfig,
  SystemGeminiConfigResponse,
} from '../../services/adminService';
import { getPaymentAccountStats } from '../../services/paymentAccountService';

interface AdminDashboardProps {
  onNavigate: (view: AdminViewKey) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [pendingPayments, setPendingPayments] = useState<SubscriptionRecord[]>([]);
  const [recentLogs, setRecentLogs] = useState<AdminActivityLog[]>([]);
  const [paymentStats, setPaymentStats] = useState<{ total: number; active: number }>({ total: 0, active: 0 });
  const [geminiConfig, setGeminiConfig] = useState<SystemGeminiConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [stats, pending, logs, accStats, gConfig] = await Promise.all([
        getAdminStats(),
        getPendingPayments(),
        getAdminActivityLogs(),
        getPaymentAccountStats(),
        getSystemGeminiConfig(),
      ]);
      setMetrics(stats);
      setPendingPayments(pending.slice(0, 5));
      setRecentLogs(logs.slice(0, 5));
      setPaymentStats(accStats);
      setGeminiConfig(gConfig);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-600 mb-2" />
        <p className="text-sm font-medium text-slate-600">Memuat data real-time Firestore...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: 'TOTAL USERS',
      value: metrics?.totalUsers || 0,
      description: 'Total pengguna terdaftar di Firestore',
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      action: () => onNavigate('user-management'),
    },
    {
      label: 'FREE USERS',
      value: metrics?.freeUsers || 0,
      description: 'Akun dengan paket Free',
      icon: Users,
      color: 'text-slate-600 bg-slate-100 border-slate-200',
      action: () => onNavigate('user-management'),
    },
    {
      label: 'PREMIUM USERS',
      value: metrics?.premiumUsers || 0,
      description: 'Akun Premium status aktif',
      icon: CreditCard,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      action: () => onNavigate('premium-management'),
    },
    {
      label: 'PENDING PAYMENTS',
      value: metrics?.pendingPayments || 0,
      description: 'Menunggu konfirmasi bukti transfer',
      icon: Clock,
      color: metrics?.pendingPayments
        ? 'text-amber-600 bg-amber-50 border-amber-200 ring-2 ring-amber-400/20'
        : 'text-slate-600 bg-slate-50 border-slate-200',
      action: () => onNavigate('payment-verification'),
      highlight: (metrics?.pendingPayments || 0) > 0,
    },
    {
      label: 'TOTAL AI USAGE',
      value: (metrics?.totalAiUsage || 0).toLocaleString('id-ID'),
      description: 'Generasi konten AI di sistem',
      icon: Cpu,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
      action: () => onNavigate('ai-usage'),
    },
    {
      label: 'ACTIVE SUBSCRIPTIONS',
      value: metrics?.activeSubscriptions || 0,
      description: 'Paket langganan aktif yang disetujui',
      icon: CheckCircle2,
      color: 'text-teal-600 bg-teal-50 border-teal-100',
      action: () => onNavigate('premium-management'),
    },
    {
      label: 'ESTIMATED REVENUE',
      value: `Rp ${(metrics?.revenue || 0).toLocaleString('id-ID')}`,
      description: 'Total penerimaan pembayaran disetujui',
      icon: DollarSign,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
      action: () => onNavigate('premium-management'),
    },
  ];

  return (
    <div id="admin-dashboard-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Super Admin Dashboard</h1>
            <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
              LIVE DATA
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Monitoring operasional, pengguna, pembayaran, dan pemakaian AI ARVIN STUDIO secara real-time.
          </p>
        </div>

        <button
          id="admin-dashboard-refresh-btn"
          onClick={handleRefresh}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* Pending Payments Banner Alert */}
      {(metrics?.pendingPayments || 0) > 0 && (
        <div
          id="admin-pending-alert-banner"
          onClick={() => onNavigate('payment-verification')}
          className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between gap-4 cursor-pointer hover:bg-amber-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Ada {metrics?.pendingPayments} Pembayaran Menunggu Verifikasi
              </h3>
              <p className="text-xs text-amber-800">
                Kreator telah mengunggah bukti transfer langganan Premium. Klik di sini untuk meninjau dan mengaktifkan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-900 shrink-0">
            <span>Verifikasi Sekarang</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Gemini API Key System Status Banner */}
      {!geminiConfig?.configured ? (
        <div
          id="admin-gemini-alert-banner"
          onClick={() => onNavigate('system-settings')}
          className="p-4 rounded-2xl bg-red-50/90 border border-red-200 flex items-center justify-between gap-4 cursor-pointer hover:bg-red-100/70 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-950 flex items-center gap-2">
                <span>KUNCI API GEMINI BELUM DIAKTIFKAN</span>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-red-200 text-red-900">Penting</span>
              </h3>
              <p className="text-xs text-red-800">
                Fitur AI untuk pengguna belum bisa berjalan. Masukkan Kunci Gemini API sekarang agar seluruh pengguna dapat langsung menikmati layanan AI tanpa perlu input manual.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-red-900 shrink-0">
            <span>Input API Key Sekarang</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      ) : (
        <div
          id="admin-gemini-active-banner"
          onClick={() => onNavigate('system-settings')}
          className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between gap-4 cursor-pointer hover:bg-emerald-100/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950">Kunci Gemini API Sistem Aktif</span>
                <code className="text-[11px] font-mono bg-white/90 border border-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded">
                  {geminiConfig.maskedKey}
                </code>
              </div>
              <p className="text-[11px] text-emerald-800/90 mt-0.5">
                AI aktif secara terpusat untuk seluruh pengguna dan pengunjung. Pengguna tidak perlu memasukkan API key secara manual.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-900 shrink-0">
            <span>Kelola Kunci</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={card.action}
              className={`p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between ${
                card.highlight ? 'ring-2 ring-amber-400/30' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                  {card.value}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{card.description}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => onNavigate('payment-verification')}
          className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 text-left transition-all cursor-pointer shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-slate-900">Verifikasi Transfer</div>
          <div className="text-[11px] text-slate-500">Tinjau bukti bayar</div>
        </button>

        <button
          id="quick-action-payment-accounts"
          onClick={() => onNavigate('payment-accounts')}
          className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 text-left transition-all cursor-pointer shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <Landmark className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-slate-900">Rekening Bayar</div>
          <div className="text-[11px] text-slate-500">{paymentStats.active} rekening aktif</div>
        </button>

        <button
          onClick={() => onNavigate('user-management')}
          className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 text-left transition-all cursor-pointer shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-slate-900">Kelola Pengguna</div>
          <div className="text-[11px] text-slate-500">Lihat semua akun</div>
        </button>

        <button
          onClick={() => onNavigate('credit-management')}
          className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 text-left transition-all cursor-pointer shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
            <Coins className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-slate-900">Penyesuaian Kredit</div>
          <div className="text-[11px] text-slate-500">Tambah/potong saldo</div>
        </button>

        <button
          onClick={() => onNavigate('admin-profile')}
          className="p-3.5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50 text-left transition-all cursor-pointer shadow-xs"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="font-semibold text-xs text-slate-900">Profil Super Admin</div>
          <div className="text-[11px] text-slate-500">Status otoritas sistem</div>
        </button>
      </div>

      {/* Kartu Rekening Pembayaran (Tahap 8C) */}
      <div
        id="admin-dashboard-payment-accounts-card"
        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Landmark className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-base text-slate-900">Rekening Pembayaran</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                DATA FIRESTORE
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Rekening bank tujuan transfer pembayaran paket Premium yang aktif ditampilkan kepada pengguna.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-center sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">TOTAL REKENING</span>
            <span className="text-xl font-black text-slate-900">{paymentStats.total}</span>
          </div>
          <div className="text-center sm:text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">REKENING AKTIF</span>
            <span className="text-xl font-black text-emerald-600">{paymentStats.active}</span>
          </div>
          <button
            id="btn-manage-payment-accounts-dashboard"
            onClick={() => onNavigate('payment-accounts')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <span>Kelola Rekening</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Two Column Section: Recent Pending Payments & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pending Payments */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900">Pembayaran Menunggu Konfirmasi</h3>
              </div>
              <button
                onClick={() => onNavigate('payment-verification')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Tidak ada pembayaran yang sedang menunggu verifikasi.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingPayments.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => onNavigate('payment-verification')}
                    className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:bg-slate-100/70 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900">
                        Paket {sub.plan} ({sub.duration})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        UID: {sub.userId.slice(0, 10)}... • Rp {(sub.price || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      TINJAU
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Operational Activity Logs */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Aktivitas Super Admin Terkini</h3>
              </div>
              <button
                onClick={() => onNavigate('activity-logs')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer flex items-center gap-1"
              >
                <span>Lihat Log Lengkap</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentLogs.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada catatan aktivitas admin di sistem.
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide">
                        {log.action.replace('SUPER_ADMIN_', '')}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs line-clamp-1">{log.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
