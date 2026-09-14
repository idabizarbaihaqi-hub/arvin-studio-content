import React, { useState, useRef } from 'react';
import {
  Palette,
  Upload,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Info,
  Menu,
  MoreVertical,
  RefreshCw,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { UserProfile, LogoType, BrandingConfig } from '../../types';
import { useBranding } from '../../contexts/BrandingContext';
import {
  uploadLogoFile,
  updateBrandingLogo,
  resetBrandingLogo,
  isBrandingAdminAuthorized,
  LOGO_LABELS,
} from '../../services/brandingService';
import { AppLogo } from '../AppLogo';

interface BrandLogoManagementProps {
  currentUser: UserProfile | null;
}

interface StagedLogo {
  logoType: LogoType;
  file: File;
  previewUrl: string;
}

export const BrandLogoManagement: React.FC<BrandLogoManagementProps> = ({ currentUser }) => {
  const { branding, refreshBranding } = useBranding();

  const [stagedLogo, setStagedLogo] = useState<StagedLogo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [isResetting, setIsResetting] = useState<LogoType | null>(null);
  const [resetModalType, setResetModalType] = useState<LogoType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Hidden file inputs
  const splashInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const chatAiInputRef = useRef<HTMLInputElement>(null);

  const isAuthorized = isBrandingAdminAuthorized(currentUser);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, logoType: LogoType) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file triggers change
    e.target.value = '';

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMessage(
        'Ukuran file terlalu besar. Silakan gunakan gambar dengan ukuran maksimal yang ditentukan sistem (5MB).'
      );
      return;
    }

    // Validate type
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowed.includes(file.type.toLowerCase())) {
      setErrorMessage(
        'Format file tidak didukung. Harap gunakan format PNG, JPG, JPEG, atau WEBP (prioritaskan PNG transparan).'
      );
      return;
    }

    // Clean up previous staged object URL
    if (stagedLogo?.previewUrl) {
      URL.revokeObjectURL(stagedLogo.previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setStagedLogo({
      logoType,
      file,
      previewUrl: objectUrl,
    });
  };

  const handleCancelStaged = () => {
    if (stagedLogo?.previewUrl) {
      URL.revokeObjectURL(stagedLogo.previewUrl);
    }
    setStagedLogo(null);
    setErrorMessage(null);
  };

  const handleApplyStagedLogo = async () => {
    if (!stagedLogo || !currentUser) return;

    setIsUploading(true);
    setUploadStatus('Mengoptimalkan & mengunggah gambar...');
    setErrorMessage(null);
    setSuccessMessage(null);

    // Global 15s watchdog timer to guarantee the UI NEVER hangs
    const safetyTimeout = setTimeout(() => {
      setIsUploading(false);
      setUploadStatus('');
      setErrorMessage('Proses penyimpanan membutuhkan waktu terlalu lama. Silakan coba unggah kembali dengan file gambar lain.');
    }, 15000);

    try {
      // 1. Upload file with instant server & background storage synchronization
      const downloadUrl = await uploadLogoFile(stagedLogo.file, stagedLogo.logoType, currentUser);

      // 2. Save active URL in settings and record Audit Log
      setUploadStatus('Menyimpan ke pengaturan aplikasi...');
      await updateBrandingLogo(stagedLogo.logoType, downloadUrl, currentUser);

      // 3. Refresh context and active view
      setUploadStatus('Memperbarui logo di sistem...');
      await refreshBranding();

      clearTimeout(safetyTimeout);
      const label = LOGO_LABELS[stagedLogo.logoType];
      setSuccessMessage(`Logo ${label} berhasil disimpan dan langsung aktif di seluruh aplikasi.`);

      // Clean up staging
      URL.revokeObjectURL(stagedLogo.previewUrl);
      setStagedLogo(null);
    } catch (err: any) {
      clearTimeout(safetyTimeout);
      console.error('[BrandLogoManagement] Upload failed:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan saat menyimpan logo baru. Silakan coba kembali.');
    } finally {
      clearTimeout(safetyTimeout);
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleConfirmReset = async () => {
    if (!resetModalType || !currentUser) return;

    const targetType = resetModalType;
    setResetModalType(null);
    setIsResetting(targetType);
    setErrorMessage(null);
    setSuccessMessage(null);

    const safetyResetTimeout = setTimeout(() => {
      setIsResetting(null);
      setErrorMessage('Waktu reset logo habis. Silakan coba kembali.');
    }, 10000);

    try {
      await resetBrandingLogo(targetType, currentUser);
      await refreshBranding();
      clearTimeout(safetyResetTimeout);
      const label = LOGO_LABELS[targetType];
      setSuccessMessage(`Logo ${label} berhasil dikembalikan ke logo default ARVIN STUDIO.`);
    } catch (err: any) {
      clearTimeout(safetyResetTimeout);
      console.error('[BrandLogoManagement] Reset failed:', err);
      setErrorMessage(err?.message || 'Gagal mengembalikan logo ke default.');
    } finally {
      clearTimeout(safetyResetTimeout);
      setIsResetting(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div id="brand-logo-unauthorized" className="p-8 max-w-2xl mx-auto text-center">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Dibatasi</h2>
        <p className="text-sm text-slate-500">
          Halaman Brand & Logo hanya dapat diakses oleh akun resmi Super Admin ARVIN STUDIO.
        </p>
      </div>
    );
  }

  return (
    <div id="brand-logo-management-view" className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
            <Palette className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Brand & Logo
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Kelola logo yang digunakan di berbagai bagian ARVIN STUDIO.
            </p>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        <div className="mt-4 p-4 rounded-xl bg-indigo-50/70 border border-indigo-100/80 text-xs text-indigo-900 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold">Panduan Brand & Logo:</span> Super Admin dapat mengganti logo Splash Screen, Header, dan Chat AI secara independen tanpa perlu redeploy. Gunakan format <span className="font-semibold">PNG transparan (rekomendasi)</span>, JPG, JPEG, atau WEBP dengan ukuran maksimal 5MB. Logo baru hanya aktif setelah Anda menekan tombol <strong>"Gunakan Logo Ini"</strong>.
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {isUploading && (
        <div
          id="brand-logo-uploading-banner"
          className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-3 animate-in fade-in"
        >
          <RefreshCw className="w-5 h-5 shrink-0 text-blue-600 animate-spin" />
          <div className="flex-1 font-medium">
            {uploadStatus || 'Sedang memproses dan menyimpan logo...'}
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          id="brand-logo-error-banner"
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-3 animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div
          id="brand-logo-success-banner"
          className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={splashInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'splash')}
      />
      <input
        ref={headerInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'header')}
      />
      <input
        ref={chatAiInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
        onChange={(e) => handleFileSelect(e, 'chat-ai')}
      />

      {/* 3 LOGO MANAGEMENT CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* =========================================================================
            CARD 1: SPLASH SCREEN LOGO
           ========================================================================= */}
        <div
          id="card-splash-logo"
          className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between ${
            stagedLogo?.logoType === 'splash'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                SPLASH SCREEN
              </span>
              {branding.splashLogoUrl ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Kustom Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Default Logo
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Logo Splash Screen
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Digunakan saat aplikasi pertama dibuka dan saat proses otentikasi awal.
            </p>

            {/* REALISTIC PREVIEW: Simulasi Splash Screen */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5 px-0.5">
                <span>Simulasi Tampilan Splash Screen</span>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="w-full h-44 rounded-xl bg-slate-950 p-4 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-800">
                {/* Background ambient glow */}
                <div className="absolute inset-0 bg-radial from-indigo-900/20 to-transparent pointer-events-none" />

                {/* Splash Logo Box */}
                <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800/80 text-white flex items-center justify-center shadow-lg mb-3 overflow-hidden p-2 z-10 transition-transform">
                  <AppLogo
                    type="splash"
                    size={38}
                    variant="light"
                    customUrl={stagedLogo?.logoType === 'splash' ? stagedLogo.previewUrl : undefined}
                    className="w-full h-full"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium z-10">
                  <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
                  <span>Menghubungkan ke ARVIN STUDIO...</span>
                </div>

                {stagedLogo?.logoType === 'splash' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded tracking-wider uppercase z-20">
                    PREVIEW BARU
                  </span>
                )}
              </div>
            </div>

            {/* Staged Alert */}
            {stagedLogo?.logoType === 'splash' && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Logo baru dipilih. Klik <strong>Gunakan Logo Ini</strong> untuk mengaktifkannya.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {stagedLogo?.logoType === 'splash' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-apply-splash-logo"
                  onClick={handleApplyStagedLogo}
                  disabled={isUploading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isUploading ? 'Menyimpan...' : 'Gunakan Logo Ini'}</span>
                </button>
                <button
                  type="button"
                  id="btn-cancel-splash-logo"
                  onClick={handleCancelStaged}
                  disabled={isUploading}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-upload-splash-logo"
                  onClick={() => splashInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:bg-black transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{branding.splashLogoUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                </button>

                {branding.splashLogoUrl && (
                  <button
                    type="button"
                    id="btn-reset-splash-logo"
                    onClick={() => setResetModalType('splash')}
                    disabled={isResetting === 'splash'}
                    title="Reset ke Logo Default"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 2: HEADER LOGO
           ========================================================================= */}
        <div
          id="card-header-logo"
          className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between ${
            stagedLogo?.logoType === 'header'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                HEADER UTAMA
              </span>
              {branding.headerLogoUrl ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Kustom Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Default Logo
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Logo Header
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Digunakan pada header aplikasi, navigasi utama, dan area branding ARVIN STUDIO.
            </p>

            {/* REALISTIC PREVIEW: Simulasi Header Aplikasi */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5 px-0.5">
                <span>Simulasi Tampilan Header Aplikasi</span>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="w-full h-44 rounded-xl bg-slate-100/70 p-3 flex flex-col justify-center relative overflow-hidden border border-slate-200">
                {/* Mock Browser/Header Bar */}
                <div className="w-full bg-white rounded-lg shadow-sm border border-slate-200 px-3 py-2 flex items-center justify-between">
                  {/* Left: Menu & Brand */}
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-500">
                      <Menu className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 flex items-center justify-center overflow-hidden shrink-0">
                        <AppLogo
                          type="header"
                          size={24}
                          customUrl={stagedLogo?.logoType === 'header' ? stagedLogo.previewUrl : undefined}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight">
                        ARVIN STUDIO
                      </span>
                    </div>
                  </div>

                  {/* Right mock controls */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                      Pro
                    </span>
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                      A
                    </div>
                  </div>
                </div>

                {/* Sub-header mock content */}
                <div className="mt-3 px-1 text-center">
                  <div className="h-2 w-28 bg-slate-200 rounded mx-auto mb-1.5 animate-pulse" />
                  <div className="h-1.5 w-40 bg-slate-200/80 rounded mx-auto" />
                </div>

                {stagedLogo?.logoType === 'header' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded tracking-wider uppercase z-20">
                    PREVIEW BARU
                  </span>
                )}
              </div>
            </div>

            {/* Staged Alert */}
            {stagedLogo?.logoType === 'header' && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Logo baru dipilih. Klik <strong>Gunakan Logo Ini</strong> untuk mengaktifkannya.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {stagedLogo?.logoType === 'header' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-apply-header-logo"
                  onClick={handleApplyStagedLogo}
                  disabled={isUploading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isUploading ? 'Menyimpan...' : 'Gunakan Logo Ini'}</span>
                </button>
                <button
                  type="button"
                  id="btn-cancel-header-logo"
                  onClick={handleCancelStaged}
                  disabled={isUploading}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-upload-header-logo"
                  onClick={() => headerInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:bg-black transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{branding.headerLogoUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                </button>

                {branding.headerLogoUrl && (
                  <button
                    type="button"
                    id="btn-reset-header-logo"
                    onClick={() => setResetModalType('header')}
                    disabled={isResetting === 'header'}
                    title="Reset ke Logo Default"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 3: CHAT AI LOGO
           ========================================================================= */}
        <div
          id="card-chat-ai-logo"
          className={`bg-white rounded-2xl border transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between ${
            stagedLogo?.logoType === 'chat-ai'
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
              : 'border-slate-200/90 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div>
            {/* Header / Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                CHAT AI
              </span>
              {branding.chatAiLogoUrl ? (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Kustom Aktif
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Default Logo
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Logo Chat AI
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Digunakan pada tampilan awal Chat AI, empty state, dan welcome screen percakapan.
            </p>

            {/* REALISTIC PREVIEW: Simulasi Halaman Awal Chat AI */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-1.5 px-0.5">
                <span>Simulasi Tampilan Awal Chat AI</span>
                <Eye className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="w-full h-44 rounded-xl bg-slate-50 p-3 flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-200">
                {/* Chat AI Logo Card Container */}
                <div className="w-12 h-12 bg-white rounded-2xl shadow-md shadow-slate-200/70 border border-slate-100 flex items-center justify-center mb-1.5 overflow-hidden p-1.5">
                  <AppLogo
                    type="chat-ai"
                    size={34}
                    customUrl={stagedLogo?.logoType === 'chat-ai' ? stagedLogo.previewUrl : undefined}
                    className="w-full h-full"
                  />
                </div>

                <div className="text-xs font-bold text-slate-900 mb-0.5">
                  Halo, saya ARVIN AI.
                </div>
                <div className="text-[10px] text-slate-500 max-w-[200px] leading-tight mb-2">
                  Apa yang ingin kamu buat atau analisis hari ini?
                </div>

                {/* Sample suggestion prompt pill */}
                <div className="px-2 py-1 bg-white border border-slate-200 rounded-full text-[9px] text-slate-600 shadow-2xs truncate max-w-[220px]">
                  💡 Buat Ide Konten Viral Instagram
                </div>

                {stagedLogo?.logoType === 'chat-ai' && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black rounded tracking-wider uppercase z-20">
                    PREVIEW BARU
                  </span>
                )}
              </div>
            </div>

            {/* Staged Alert */}
            {stagedLogo?.logoType === 'chat-ai' && (
              <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Logo baru dipilih. Klik <strong>Gunakan Logo Ini</strong> untuk mengaktifkannya.</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {stagedLogo?.logoType === 'chat-ai' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-apply-chat-ai-logo"
                  onClick={handleApplyStagedLogo}
                  disabled={isUploading}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:bg-black transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isUploading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>{isUploading ? 'Menyimpan...' : 'Gunakan Logo Ini'}</span>
                </button>
                <button
                  type="button"
                  id="btn-cancel-chat-ai-logo"
                  onClick={handleCancelStaged}
                  disabled={isUploading}
                  className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-upload-chat-ai-logo"
                  onClick={() => chatAiInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 active:bg-black transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{branding.chatAiLogoUrl ? 'Ganti Logo' : 'Upload Logo'}</span>
                </button>

                {branding.chatAiLogoUrl && (
                  <button
                    type="button"
                    id="btn-reset-chat-ai-logo"
                    onClick={() => setResetModalType('chat-ai')}
                    disabled={isResetting === 'chat-ai'}
                    title="Reset ke Logo Default"
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR RESETTING LOGO */}
      {resetModalType && (
        <div
          id="reset-logo-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100">
              <RotateCcw className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Reset Logo {LOGO_LABELS[resetModalType]}?
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Logo akan dikembalikan ke logo default ARVIN STUDIO. File custom logo tidak akan digunakan lagi oleh aplikasi.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-cancel-reset-modal"
                onClick={() => setResetModalType(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-reset-modal"
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
              >
                Ya, Kembalikan ke Default
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
