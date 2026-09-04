import React, { useEffect, useState } from 'react';
import {
  Activity,
  RefreshCw,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Coins,
  Settings,
} from 'lucide-react';
import { AdminActivityLog } from '../../types';
import { getAdminActivityLogs } from '../../services/adminService';

export const AdminActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getAdminActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load admin activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.action?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.adminEmail?.toLowerCase().includes(q) ||
      l.targetUserId?.toLowerCase().includes(q)
    );
  });

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          <span>APPROVED PAYMENT</span>
        </span>
      );
    }
    if (action.includes('REJECTED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold text-[10px] border border-red-200">
          <XCircle className="w-3 h-3" />
          <span>REJECTED PAYMENT</span>
        </span>
      );
    }
    if (action.includes('CREDIT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[10px] border border-purple-200">
          <Coins className="w-3 h-3" />
          <span>CREDIT ADJUSTMENT</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
        <ShieldCheck className="w-3 h-3" />
        <span>{action.replace('SUPER_ADMIN_', '')}</span>
      </span>
    );
  };

  return (
    <div id="admin-activity-logs-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-emerald-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Activity Logs</h1>
          </div>
          <p className="text-sm text-slate-600">
            Jejak audit operasional seluruh aksi Super Admin (approval pembayaran, penolakan, penyesuaian kredit, dll).
          </p>
        </div>

        <button
          onClick={loadLogs}
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
            placeholder="Filter log berdasarkan kata kunci aksi, admin email, atau user target..."
            className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Aksi Operasional</th>
                <th className="py-3 px-4">Deskripsi Aktivitas</th>
                <th className="py-3 px-4">Super Admin</th>
                <th className="py-3 px-4">Target (UID / Sub)</th>
                <th className="py-3 px-4 text-right">Waktu Eksekusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Memuat log aktivitas dari Firestore...</span>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Belum ada rekaman log aktivitas.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-md">
                      {log.description}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px] font-mono whitespace-nowrap">
                      {log.adminEmail || log.adminId}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.targetUserId ? `User: ${log.targetUserId.slice(0, 8)}...` : '-'}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
