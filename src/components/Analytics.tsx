import React, { useState, useEffect } from 'react';
import { AnalyticsPeriod, AnalyticsSummary } from '../types';
import { fetchAnalytics } from '../services/storageService';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  FileEdit,
  XCircle,
  RefreshCw,
  AlertCircle,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AnalyticsProps {
  onBackToChat?: () => void;
}

const PERIOD_OPTIONS: Array<{ id: AnalyticsPeriod; label: string }> = [
  { id: '7d', label: '7 Hari' },
  { id: '30d', label: '30 Hari' },
  { id: '90d', label: '90 Hari' },
  { id: 'all', label: 'Semua' },
];

export const Analytics: React.FC<AnalyticsProps> = ({ onBackToChat }) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>('all');
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (selectedPeriod: AnalyticsPeriod) => {
    setIsLoading(true);
    setError(null);
    try {
      const summary = await fetchAnalytics(selectedPeriod);
      setData(summary);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memuat data analytics.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(period);
  }, [period]);

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setPeriod(newPeriod);
  };

  // Platform color helper
  const getPlatformBg = (name: string) => {
    switch (name) {
      case 'Instagram':
        return 'bg-pink-500';
      case 'TikTok':
        return 'bg-slate-900';
      case 'Facebook':
        return 'bg-blue-600';
      case 'YouTube':
        return 'bg-red-600';
      case 'X':
        return 'bg-neutral-800';
      case 'Other':
      default:
        return 'bg-purple-600';
    }
  };

  const totalContentCount = data?.totalContent ?? 0;
  const scheduledCount = data?.scheduled ?? 0;
  const publishedCount = data?.published ?? 0;
  const draftCount = data?.draft ?? 0;
  const cancelledCount = data?.cancelled ?? 0;
  const totalAiGenerations = data?.totalAiGenerations ?? 0;

  const platforms = [
    { name: 'Instagram', count: data?.platformDistribution?.Instagram || 0 },
    { name: 'TikTok', count: data?.platformDistribution?.TikTok || 0 },
    { name: 'Facebook', count: data?.platformDistribution?.Facebook || 0 },
    { name: 'YouTube', count: data?.platformDistribution?.YouTube || 0 },
    { name: 'X', count: data?.platformDistribution?.X || 0 },
    { name: 'Other', count: data?.platformDistribution?.Other || 0 },
  ];

  const aiFeatures = [
    {
      name: 'Content Analyzer',
      icon: '📊',
      count: data?.aiFeatureBreakdown?.['Content Analyzer'] || 0,
    },
    {
      name: 'Content Ideas',
      icon: '💡',
      count: data?.aiFeatureBreakdown?.['Content Ideas'] || 0,
    },
    {
      name: 'Caption Maker',
      icon: '✍️',
      count: data?.aiFeatureBreakdown?.['Caption Maker'] || 0,
    },
    {
      name: 'Hook Generator',
      icon: '🔥',
      count: data?.aiFeatureBreakdown?.['Hook Generator'] || 0,
    },
    {
      name: 'Script Maker',
      icon: '🎬',
      count: data?.aiFeatureBreakdown?.['Script Maker'] || 0,
    },
    {
      name: 'Hashtag Generator',
      icon: '#️⃣',
      count: data?.aiFeatureBreakdown?.['Hashtag Generator'] || 0,
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Top Header with Period Filter */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Analytics Dashboard
              </h1>
              <p className="text-xs text-slate-500">
                Statistik real-time konten dan pemanfaatan AI Anda
              </p>
            </div>
          </div>

          {/* Period Filter Buttons & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handlePeriodChange(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    period === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => loadData(period)}
              disabled={isLoading}
              title="Perbarui Data"
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-6">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => loadData(period)}
              className="ml-auto underline font-medium text-xs hover:text-rose-900"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* SECTION 1: CONTENT STATUS METRIC CARDS */}
        {/* ======================================================== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ringkasan Status Konten
            </h2>
            <span className="text-[11px] text-slate-400">
              Periode: {PERIOD_OPTIONS.find((p) => p.id === period)?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Content */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold text-slate-600">Total Content</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                  <Layers className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {isLoading ? '...' : totalContentCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">konten</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Seluruh rencana konten
              </p>
            </div>

            {/* Scheduled */}
            <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-blue-600 mb-2">
                <span className="text-xs font-bold text-blue-900">Scheduled</span>
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-blue-700">
                  {isLoading ? '...' : scheduledCount}
                </span>
                <span className="text-xs text-blue-400 font-medium">konten</span>
              </div>
              <p className="text-[10px] text-blue-500 mt-2 font-medium">
                Siap dirilis sesuai jadwal
              </p>
            </div>

            {/* Published */}
            <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-bold text-emerald-900">Published</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  {isLoading ? '...' : publishedCount}
                </span>
                <span className="text-xs text-emerald-400 font-medium">konten</span>
              </div>
              <p className="text-[10px] text-emerald-500 mt-2 font-medium">
                Berhasil dipublikasikan
              </p>
            </div>

            {/* Draft */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold text-slate-700">Draft</span>
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <FileEdit className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-slate-700">
                  {isLoading ? '...' : draftCount}
                </span>
                <span className="text-xs text-slate-400 font-medium">konten</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">
                Dalam tahap penyusunan
              </p>
            </div>

            {/* Cancelled */}
            <div className="bg-white border border-rose-100 rounded-2xl p-4 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-rose-600 mb-2">
                <span className="text-xs font-bold text-rose-900">Cancelled</span>
                <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <XCircle className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold text-rose-700">
                  {isLoading ? '...' : cancelledCount}
                </span>
                <span className="text-xs text-rose-400 font-medium">konten</span>
              </div>
              <p className="text-[10px] text-rose-400 mt-2">
                Dibatalkan / ditunda
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 2: PLATFORM DISTRIBUTION */}
        {/* ======================================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Platform Distribution
              </h2>
              <p className="text-xs text-slate-500">
                Sebaran konten berdasarkan saluran media sosial target
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
              {totalContentCount} Total Konten
            </span>
          </div>

          {/* Horizontal Proportional Distribution Bar */}
          {totalContentCount > 0 ? (
            <div className="space-y-4 pt-1">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                {platforms.map((p) => {
                  if (p.count === 0) return null;
                  const pct = ((p.count / totalContentCount) * 100).toFixed(1);
                  return (
                    <div
                      key={p.name}
                      style={{ width: `${pct}%` }}
                      title={`${p.name}: ${p.count} (${pct}%)`}
                      className={`${getPlatformBg(p.name)} transition-all`}
                    />
                  );
                })}
              </div>

              {/* Grid of Platform Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                {platforms.map((p) => {
                  const pct =
                    totalContentCount > 0
                      ? Math.round((p.count / totalContentCount) * 100)
                      : 0;

                  return (
                    <div
                      key={p.name}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${getPlatformBg(
                            p.name
                          )}`}
                        />
                        <span className="text-xs font-bold text-slate-700 truncate">
                          {p.name}
                        </span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-lg font-bold text-slate-900">
                          {p.count}
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-1.5">
              <Layers className="w-5 h-5 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">
                Belum ada konten untuk menghitung distribusi platform.
              </p>
              <p className="text-[11px] text-slate-400">
                Tambahkan rencana konten di Content Planner untuk melihat sebarannya di sini.
              </p>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* SECTION 3: CONTENT PERFORMANCE / ACTIVITY */}
        {/* (Mandate: JANGAN buat angka palsu. Jika belum ada data, tampilkan empty state yang jelas) */}
        {/* ======================================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Content Performance
              </h2>
              <p className="text-xs text-slate-500">
                Metrik jangkauan dan performa analitik langsung
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Tahap Integrasi
            </span>
          </div>

          {/* Mandated Empty State */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 flex items-center justify-center text-slate-500">
              <Activity className="w-5 h-5" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm font-bold text-slate-800">
                Belum ada data performa konten.
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Metrik interaksi live (tayangan, likes, shares, dan reach) belum
                tercatat di Firestore karena akun media sosial belum dihubungkan.
                Semua statistik yang ditampilkan di ARVIN STUDIO 100% berbasis data
                nyata tanpa angka tiruan.
              </p>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* SECTION 4: AI USAGE ANALYTICS */}
        {/* ======================================================== */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                  AI Usage Analytics
                </h2>
                <p className="text-xs text-slate-500">
                  Data aktual pemanfaatan fitur kecerdasan buatan (koleksi: ai_usage)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-xl w-fit">
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-950">
                Total Generasi:{' '}
                <span className="text-indigo-600">{totalAiGenerations}</span>
              </span>
            </div>
          </div>

          {/* AI Feature Breakdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {aiFeatures.map((feat) => {
              const pct =
                totalAiGenerations > 0
                  ? Math.round((feat.count / totalAiGenerations) * 100)
                  : 0;

              return (
                <div
                  key={feat.name}
                  className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{feat.icon}</span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {feat.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 shrink-0">
                      {feat.count}{' '}
                      <span className="text-[10px] text-slate-400 font-normal">
                        kali
                      </span>
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-900 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Porsi penggunaan</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Daily Activity (Real Firestore records) */}
          {data?.dailyActivity && data.dailyActivity.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 mb-2">
                Aktivitas Harian (Rencana Konten vs Penggunaan AI)
              </h3>
              <div className="grid grid-cols-7 sm:grid-cols-7 lg:grid-cols-14 gap-1.5 text-center">
                {data.dailyActivity.map((day) => {
                  const d = new Date(day.date + 'T00:00:00');
                  const dayLabel = d.toLocaleDateString('id-ID', {
                    weekday: 'narrow',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={day.date}
                      className="bg-slate-50 border border-slate-100 rounded-lg p-1.5 flex flex-col items-center justify-between min-h-[50px]"
                    >
                      <span className="text-[9px] text-slate-400 font-medium">
                        {dayLabel}
                      </span>
                      <div className="flex items-center gap-1 my-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                          title={`AI: ${day.ai}`}
                        />
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                          title={`Plan: ${day.plans}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700">
                        {day.ai + day.plans}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
