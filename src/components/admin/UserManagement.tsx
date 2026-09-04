import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldAlert,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile } from '../../types';
import { getAdminUsers, isPrimarySuperAdmin } from '../../services/adminService';
import { UserDetailModal } from './UserDetailModal';

interface UserManagementProps {
  onOpenCreditAdjustment?: (userId: string) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onOpenCreditAdjustment }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'SUPER_ADMIN'>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | 'FREE' | 'PREMIUM'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAdminUsers({
        search,
        role: roleFilter,
        plan: planFilter,
        status: statusFilter,
      });
      setUsers(data);
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, planFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  return (
    <div id="admin-user-management-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          </div>
          <p className="text-sm text-slate-600">
            Kelola data seluruh pengguna, status keanggotaan, dan hak akses ARVIN STUDIO.
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

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan nama, username, atau email..."
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
            <span>Filter:</span>
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Peran (Role)</option>
            <option value="USER">User</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          {/* Plan Filter */}
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Paket</option>
            <option value="FREE">Free</option>
            <option value="PREMIUM">Premium</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Active)</option>
            <option value="INACTIVE">Tidak Aktif (Inactive)</option>
          </select>

          <span className="text-[11px] text-slate-600 ml-auto">
            Ditemukan: <strong className="text-slate-800 font-bold">{users.length}</strong> akun
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Paket</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Bergabung</th>
                <th className="py-3 px-4">Premium Sampai</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Memuat data pengguna dari Firestore...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Tidak ada akun yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isPrimary = isPrimarySuperAdmin(u);
                  return (
                    <tr
                      key={u.id || u.uid}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isPrimary ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {u.fullName?.slice(0, 1).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.fullName || 'User Tanpa Nama'}</span>
                              {isPrimary && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-100 border border-amber-300 text-[9px] font-bold text-amber-900">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{u.email}</td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.role === 'SUPER_ADMIN'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            u.plan === 'PREMIUM'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.plan}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                            u.subscriptionStatus === 'ACTIVE'
                              ? 'text-emerald-700'
                              : 'text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {u.subscriptionStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {u.subscriptionExpiry
                          ? new Date(u.subscriptionExpiry).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedUserId(u.uid || u.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Lihat Detail Pengguna"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onOpenCreditAdjustment={onOpenCreditAdjustment}
        />
      )}
    </div>
  );
};
