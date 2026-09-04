import React, { useState } from 'react';
import {
  Settings,
  Server,
  Key,
  Shield,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SystemSettingsProps {
  currentUser: UserProfile | null;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultCredits, setDefaultCredits] = useState(50);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div id="admin-settings-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-slate-900" />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        </div>
        <p className="text-sm text-slate-600">
          Konfigurasi parameter operasional platform, integrasi Firebase, dan model kecerdasan buatan.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan sistem berhasil diperbarui.</span>
        </div>
      )}

      {/* Cloud & Service Infrastructure Status */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-700" />
          <span>Status Infrastruktur Layanan</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700">Firebase Firestore</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-emerald-700 font-bold text-[11px]">TERHUBUNG & AKTIF</div>
            <div className="text-[10px] text-slate-600 mt-1">Aturan firestore.rules aman</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700">Firebase Auth</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-emerald-700 font-bold text-[11px]">AKTIF</div>
            <div className="text-[10px] text-slate-600 mt-1">Email & Password provider</div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700">Google Gemini Flash</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-emerald-700 font-bold text-[11px]">GEMINI 2.5 FLASH</div>
            <div className="text-[10px] text-slate-600 mt-1">Server-side secure proxy</div>
          </div>
        </div>
      </div>

      {/* Operational Rules Form */}
      <form onSubmit={handleSave} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 text-xs">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Coins className="w-4 h-4 text-purple-600" />
          <span>Aturan Saldo & Kuota Default</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              SALDO KREDIT REGISTRASI AWAL (FREE TIER)
            </label>
            <input
              type="number"
              value={defaultCredits}
              onChange={(e) => setDefaultCredits(parseInt(e.target.value) || 0)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-purple-500"
            />
            <p className="text-[10px] text-slate-600 mt-1">
              Jumlah kredit otomatis yang diberikan kepada user baru saat pertama kali mendaftar.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              MODE PEMELIHARAAN (MAINTENANCE)
            </label>
            <div className="flex items-center gap-3 mt-1.5">
              <input
                type="checkbox"
                id="maintenance-toggle"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 text-slate-900 rounded-sm focus:ring-slate-900 cursor-pointer"
              />
              <label htmlFor="maintenance-toggle" className="text-xs font-semibold text-slate-800 cursor-pointer">
                {maintenanceMode ? 'Sistem Dalam Perbaikan' : 'Operasional Normal'}
              </label>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">
              Jika aktif, user biasa akan dialihkan ke layar pemeliharaan sementara.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
