import React, { useEffect, useState } from 'react';
import {
  Cpu,
  RefreshCw,
  Clock,
  Filter,
  BarChart3,
  Calendar,
  MessageSquare,
  FileSearch,
  Lightbulb,
  FileText,
  Anchor,
  Scroll,
  Hash,
} from 'lucide-react';
import { DailyUsageRecord } from '../../types';
import { getAdminAiUsage } from '../../services/adminService';

export const AiUsageMonitoring: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('7d');
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [byFeature, setByFeature] = useState<Record<string, number>>({});
  const [records, setRecords] = useState<DailyUsageRecord[]>([]);

  const featureMetadata: Record<string, { label: string; icon: any; color: string }> = {
    chat: { label: 'Chat AI', icon: MessageSquare, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'content-analyzer': { label: 'Content Analyzer', icon: FileSearch, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'content-ideas': { label: 'Content Ideas', icon: Lightbulb, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'caption-maker': { label: 'Caption Maker', icon: FileText, color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'hook-generator': { label: 'Hook Generator', icon: Anchor, color: 'bg-pink-50 text-pink-700 border-pink-200' },
    'script-maker': { label: 'Script Maker', icon: Scroll, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'hashtag-generator': { label: 'Hashtag Generator', icon: Hash, color: 'bg-teal-50 text-teal-700 border-teal-200' },
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAdminAiUsage(period);
      setTotalCount(data.totalCount);
      setByFeature(data.byFeature);
      setRecords(data.records);
    } catch (err) {
      console.error('Failed to load AI usage monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [period]);

  return (
    <div id="admin-ai-usage-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-purple-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AI Usage Monitoring</h1>
          </div>
          <p className="text-sm text-slate-600">
            Pantau statistik konsumsi token dan frekuensi pemanggilan model Gemini per fitur secara real-time.
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

      {/* Period Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-medium text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Periode Waktu:</span>
        </div>

        <div className="flex gap-1.5">
          {[
            { key: 'today', label: 'Hari Ini' },
            { key: '7d', label: '7 Hari Terakhir' },
            { key: '30d', label: '30 Hari Terakhir' },
            { key: 'all', label: 'Semua Waktu' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setPeriod(tab.key as any)}
              className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer transition-colors ${
                period === tab.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            TOTAL GENERASI AI ({period === 'today' ? 'HARI INI' : period === '7d' ? '7 HARI' : period === '30d' ? '30 HARI' : 'SEMUA'})
          </span>
          <div className="text-3xl font-black tracking-tight">{totalCount.toLocaleString('id-ID')} request</div>
        </div>
        <div className="text-xs text-slate-300 max-w-sm">
          Semua request diproses melalui backend Google Gemini 2.5 Flash API dengan isolasi kuota aman Firestore.
        </div>
      </div>

      {/* Feature Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(featureMetadata).map(([key, meta]) => {
          const Icon = meta.icon;
          const count = byFeature[key] || 0;
          const percentage = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

          return (
            <div key={key} className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-semibold text-xs text-slate-800">{meta.label}</span>
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${meta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-xl font-bold text-slate-900">{count}x</div>
                <div className="text-[11px] text-slate-500">{percentage}% dari total</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Usage Records Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Log Penggunaan Harian Per User</h3>
          <span className="text-xs text-slate-500">{records.length} record terdata</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Fitur AI</th>
                <th className="py-3 px-4">Jumlah Pemanggilan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4 text-right">Terakhir Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Memuat log pemakaian AI...</span>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada riwayat penggunaan AI pada periode ini.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const meta = featureMetadata[r.feature] || { label: r.feature };
                  return (
                    <tr key={r.id || `${r.userId}_${r.feature}_${r.date}`} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-700">
                        {r.userId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {meta.label}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                          {r.count}x request
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {r.date}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                        {new Date(r.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
