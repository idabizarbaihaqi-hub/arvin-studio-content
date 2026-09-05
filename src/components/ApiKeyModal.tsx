import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Trash2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  getStoredApiKey,
  setStoredApiKey,
  removeStoredApiKey,
  testGeminiApiKey,
} from '../services/apiKeyService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeySaved,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getStoredApiKey();
      setApiKey(current);
      setTestResult(null);
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Masukkan API Key terlebih dahulu sebelum menguji koneksi.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(apiKey.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Gagal menguji koneksi API.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: 'Kunci API tidak boleh kosong.',
      });
      return;
    }

    setStoredApiKey(apiKey.trim());
    setSaveSuccess(true);
    setTestResult({
      success: true,
      message: 'Kunci API berhasil disimpan! AI sekarang siap digunakan.',
    });

    if (onKeySaved) {
      onKeySaved();
    }

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleDelete = () => {
    removeStoredApiKey();
    setApiKey('');
    setTestResult({
      success: true,
      message: 'Kunci API berhasil dihapus dari browser.',
    });
    if (onKeySaved) {
      onKeySaved();
    }
  };

  const isConfigured = Boolean(apiKey.trim());

  return (
    <div
      id="api-key-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="api-key-modal-container"
        className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900 animate-in fade-in zoom-in-95 duration-150 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Pengaturan API Key Gemini</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
                  GEMINI_API_KEY
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan langsung ARVIN AI menggunakan kunci API Gemini Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-600 font-medium">Status Kunci AI:</span>
            {isConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Kunci Terkonfigurasi
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Belum Diatur
              </span>
            )}
          </div>

          {/* Form Input */}
          <div className="space-y-2">
            <label
              htmlFor="gemini-api-key-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider"
            >
              Masukkan GEMINI_API_KEY
            </label>
            <div className="relative flex items-center">
              <input
                id="gemini-api-key-input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                  setSaveSuccess(false);
                }}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-24 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono text-slate-800 transition-all shadow-2xs"
              />
              <div className="absolute right-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors"
                  title={showKey ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {apiKey.trim() && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    title="Hapus API Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Kunci API disimpan dengan aman di penyimpanan browser lokal Anda (Local Storage).
            </p>
          </div>

          {/* Automatic Setup Guide for Website Owner */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[13px]">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Ingin Agar Pengguna/Pengunjung Tidak Perlu Input API Key?</span>
            </div>
            <p className="text-amber-900 leading-relaxed text-[12px]">
              Agar web Anda di Vercel (<code>arvin-studio-content.vercel.app</code>) langsung aktif otomatis untuk <strong>semua pengunjung</strong> tanpa perlu mereka input API Key manual:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-amber-900/90 text-[11.5px] bg-white/70 p-2.5 rounded-lg border border-amber-200/60 font-medium">
              <li>Buka dashboard proyek Anda di <strong>vercel.com</strong></li>
              <li>Pilih menu <strong>Settings</strong> $\rightarrow$ <strong>Environment Variables</strong></li>
              <li>Tambahkan variable: <strong>Key</strong> = <code>GEMINI_API_KEY</code>, <strong>Value</strong> = <em>(Kunci Gemini Anda)</em></li>
              <li>Klik <strong>Save</strong> lalu lakukan <strong>Redeploy</strong> proyek</li>
            </ol>
            <p className="text-[11px] text-amber-800 italic">
              ✨ Setelah disimpan di Vercel, ARVIN AI akan bekerja otomatis untuk semua pengunjung secara gratis tanpa popup peringatan!
            </p>
          </div>

          {/* Help box */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-800">
              <Key className="w-4 h-4 text-blue-600" />
              <span>Atau Gunakan Kunci Sementara di Browser Ini:</span>
            </div>
            <p className="text-blue-900/90 text-[12px]">
              Jika belum mengatur Environment Variable di Vercel, Anda dapat memasukkan kunci pribadi langsung di bawah untuk perangkat ini:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800/90 leading-relaxed text-[11.5px]">
              <li>Buka Google AI Studio melalui tombol di bawah.</li>
              <li>Klik <strong>Get API key</strong> $\rightarrow$ <strong>Create API key</strong>.</li>
              <li>Salin kunci yang berawalan <code>AIzaSy...</code> lalu tempel di kolom di atas.</li>
            </ol>
            <div className="pt-1">
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
              >
                <span>Buka Google AI Studio (aistudio.google.com)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Test feedback banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 px-6 py-4 bg-slate-50/70 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !apiKey.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/70 border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Menguji...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Uji Koneksi AI</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!apiKey.trim()}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tersimpan!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan & Hubungkan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
