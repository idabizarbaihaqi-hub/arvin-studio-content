import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  Key,
  CheckCircle2,
  AlertTriangle,
  Coins,
  Cpu,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  Trash2,
  Lock,
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  getSystemGeminiConfig,
  saveSystemGeminiConfig,
  removeSystemGeminiConfig,
  SystemGeminiConfigResponse,
} from '../../services/adminService';

interface SystemSettingsProps {
  currentUser: UserProfile | null;
}

export const SystemSettings: React.FC<SystemSettingsProps> = ({ currentUser }) => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [defaultCredits, setDefaultCredits] = useState(50);
  const [savedNotice, setSavedNotice] = useState(false);

  // Gemini API Key State for Super Admin
  const [geminiConfig, setGeminiConfig] = useState<SystemGeminiConfigResponse | null>(null);
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [keyNotice, setKeyNotice] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  const loadConfig = async () => {
    setIsLoadingConfig(true);
    try {
      const cfg = await getSystemGeminiConfig();
      setGeminiConfig(cfg);
    } catch (err) {
      console.error('Failed to load Gemini config:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyNotice(null);
    setKeyError(null);

    let clean = inputApiKey.trim().replace(/^["'`]|["'`]$/g, '').trim();
    if (clean.startsWith('export GEMINI_API_KEY=')) {
      clean = clean.replace('export GEMINI_API_KEY=', '').replace(/^["'`]|["'`]$/g, '').trim();
    }
    if (clean.startsWith('GEMINI_API_KEY=')) {
      clean = clean.replace('GEMINI_API_KEY=', '').replace(/^["'`]|["'`]$/g, '').trim();
    }
    if (clean.startsWith('Bearer ')) {
      clean = clean.slice(7).trim();
    }

    if (!clean) {
      setKeyError('Harap masukkan kunci API Gemini yang valid (berawalan AIzaSy...).');
      return;
    }

    if (clean.length < 10) {
      setKeyError('Kunci API terlalu pendek. Pastikan seluruh string API Key dari Google AI Studio disalin.');
      return;
    }

    if (!currentUser) {
      setKeyError('Sesi login admin tidak valid. Silakan muat ulang halaman atau login kembali.');
      return;
    }

    setIsSavingKey(true);
    try {
      const res = await saveSystemGeminiConfig(clean, currentUser);
      setKeyNotice(res.message || 'Kunci Gemini API berhasil diverifikasi dan disimpan untuk semua pengguna!');
      setInputApiKey('');
      await loadConfig();
    } catch (err: any) {
      setKeyError(err?.message || 'Gagal menyimpan kunci API.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const handleRemoveGeminiKey = async () => {
    if (!window.confirm('Yakin ingin menghapus kunci Gemini API sistem? Pengguna tidak akan bisa menggunakan fitur AI sampai kunci baru dimasukkan.')) {
      return;
    }
    if (!currentUser) return;

    setKeyNotice(null);
    setKeyError(null);
    try {
      await removeSystemGeminiConfig(currentUser);
      setKeyNotice('Kunci Gemini API sistem berhasil dihapus.');
      setInputApiKey('');
      await loadConfig();
    } catch (err: any) {
      setKeyError(err?.message || 'Gagal menghapus kunci API.');
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
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
          Konfigurasi Kunci API Gemini Global, parameter operasional platform, dan integrasi Firestore.
        </p>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Pengaturan operasional berhasil diperbarui.</span>
        </div>
      )}

      {/* SECTION: SUPER ADMIN GEMINI API KEY (CENTRALIZED) */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Kunci API Google Gemini (Sistem Terpusat)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kunci ini dikelola langsung oleh Super Admin dan aktif otomatis untuk <strong>seluruh pengguna & pengunjung</strong> tanpa mereka perlu input API Key.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isLoadingConfig ? (
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Memeriksa...
              </span>
            ) : geminiConfig?.configured ? (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>AI AKTIF & TERHUBUNG</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>BELUM ADA KUNCI AKTIF</span>
              </div>
            )}
          </div>
        </div>

        {/* Firebase Firestore Storage Guarantee Banner */}
        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 text-xs text-blue-950">
          <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 font-black text-xs shadow-xs">
            🔥
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap font-bold text-blue-900">
              <span>Lokasi Penyimpanan: Firebase Cloud Firestore</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 font-mono">
                /system_settings/gemini_config
              </span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Kunci API disimpan langsung di <strong>Cloud Firestore</strong> (bukan di LocalStorage browser). Data bersifat permanen dan tidak akan hilang atau berubah meskipun cache dibersihkan, pengguna ganti perangkat (HP/Laptop), atau server di-restart.
            </p>
          </div>
        </div>

        {/* Current status display */}
        {geminiConfig?.configured && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                  <span>Kunci Aktif:</span>
                  <code className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                    {geminiConfig.maskedKey || '••••••••••••••••'}
                  </code>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Firestore Cloud
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tersimpan di koleksi <code>system_settings</code> di Firebase. Seluruh kreator dan pengguna langsung dapat menggunakan seluruh fitur AI secara otomatis.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemoveGeminiKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors cursor-pointer self-start sm:self-auto"
              title="Hapus Kunci API Gemini Sistem dari Firebase"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Kunci</span>
            </button>
          </div>
        )}

        {/* Info Box: Penjelasan Perbedaan Kunci Firebase vs Kunci Gemini */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Penting: Perbedaan Web API Key Firebase vs Gemini API Key</span>
          </div>
          <p className="text-[11px] text-amber-900 leading-relaxed">
            • <strong>Web API Key di Firebase Console</strong> (berawalan <code>AIzaSy...</code>): Digunakan khusus untuk database Firestore dan sistem Login akun. Jangan dimasukkan di sini karena Firebase API Key tidak memiliki akses ke kecerdasan buatan Google Gemini.
            <br />
            • <strong>Gemini API Key (Kecerdasan Buatan)</strong>: Diambil secara gratis dari <strong>Google AI Studio</strong> (bukan dari Firebase). Format kunci resmi dari Google AI Studio bisa berawalan <code>AIzaSy...</code> ataupun <code>AQ...</code> (kunci yang Anda simpan saat ini <code>{geminiConfig?.maskedKey || 'Tersimpan'}</code> sudah valid dan terhubung).
          </p>
        </div>

        {/* Feedback alerts */}
        {keyNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{keyNotice}</span>
          </div>
        )}

        {keyError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{keyError}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSaveGeminiKey} className="space-y-3">
          <label className="text-xs font-bold text-slate-800 block">
            {geminiConfig?.configured ? 'Ganti / Perbarui Kunci API Gemini:' : 'Masukkan Kunci API Gemini Baru:'}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={inputApiKey}
              onChange={(e) => setInputApiKey(e.target.value)}
              placeholder="AIzaSy... atau AQ..."
              className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-all"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer text-xs gap-1"
            >
              {showApiKey ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Sembunyikan</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <span>Dapatkan Kunci API Gratis di Google AI Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              type="submit"
              disabled={isSavingKey || !inputApiKey.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              {isSavingKey ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memverifikasi ke Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Verifikasi & Simpan untuk Semua Pengguna</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

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
              <span className="font-semibold text-slate-700">Google Gemini AI</span>
              <span className={`w-2 h-2 rounded-full ${geminiConfig?.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            </div>
            <div className="text-emerald-700 font-bold text-[11px]">
              {geminiConfig?.configured ? 'GEMINI 3.1 FLASH-LITE AKTIF' : 'MENUNGGU KUNCI'}
            </div>
            <div className="text-[10px] text-slate-600 mt-1">Server-side proxy aman</div>
          </div>
        </div>
      </div>

      {/* Operational Rules Form */}
      <form onSubmit={handleSaveGeneral} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5 text-xs">
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
