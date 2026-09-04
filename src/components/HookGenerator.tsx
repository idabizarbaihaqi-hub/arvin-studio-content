import React, { useState } from 'react';
import {
  HookPlatform,
  HookGoal,
  HookStyle,
  HookCount,
  HookItem,
  GenerateHooksResult,
  ActiveView,
} from '../types';
import { generateHooks } from '../services/aiService';
import { recordAiUsage, saveAiHistory } from '../services/storageService';
import { canUseFeature, consumeFeatureUsage } from '../services/accessControlService';
import { QuotaExceededModal } from './QuotaExceededModal';
import {
  ArrowLeft,
  Zap,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Trophy,
  Star,
  Sliders,
  Sparkles,
} from 'lucide-react';

const PLATFORMS: HookPlatform[] = [
  'TikTok',
  'Instagram Reels',
  'Instagram Post',
  'YouTube',
  'YouTube Shorts',
  'Facebook',
  'X',
  'LinkedIn',
  'Umum',
];

const GOALS: HookGoal[] = [
  'Engagement',
  'Views',
  'Followers',
  'Penjualan',
  'Branding',
  'Edukasi',
  'Curiosity',
];

const STYLES: HookStyle[] = [
  'Curiosity',
  'Problem / Pain Point',
  'Question',
  'Bold Statement',
  'Controversial',
  'Storytelling',
  'Fear of Missing Out',
  'Surprise',
  'Statistic',
  'Emotional',
  'Direct',
  'Educational',
];

const COUNTS: HookCount[] = [5, 10, 15, 20];

interface HookGeneratorProps {
  onBackToChat?: () => void;
  onNavigate?: (view: ActiveView) => void;
}

export const HookGenerator: React.FC<HookGeneratorProps> = ({ onBackToChat, onNavigate }) => {
  // Form input state
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<HookPlatform>('TikTok');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState<HookGoal>('Engagement');
  const [style, setStyle] = useState<HookStyle>('Curiosity');
  const [count, setCount] = useState<HookCount>(10);

  // UI state
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Result state
  const [result, setResult] = useState<GenerateHooksResult | null>(null);
  const [regenerateCounter, setRegenerateCounter] = useState(0);

  // Toast / Copy notification state
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const showToast = (message: string) => {
    setCopyNotification(message);
    setTimeout(() => {
      setCopyNotification(null);
    }, 3000);
  };

  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast(successMessage);
      return true;
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      showToast('Gagal menyalin ke clipboard.');
      return false;
    }
  };

  const handleGenerate = async (isRegenerate = false) => {
    // 1. Validation
    const trimmed = topic.trim();
    if (!trimmed) {
      setValidationError('Silakan jelaskan isi konten terlebih dahulu.');
      return;
    }
    setValidationError(null);
    setErrorMessage(null);

    const nextCount = isRegenerate ? regenerateCounter + 1 : 0;
    if (isRegenerate) {
      setRegenerateCounter(nextCount);
    }

    // Check daily usage quota for FREE accounts (5x/day per tool)
    const quotaCheck = await canUseFeature('hook-generator');
    if (!quotaCheck.allowed) {
      setShowQuotaModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const data = await generateHooks({
        topic: trimmed,
        platform,
        targetAudience: targetAudience.trim() || undefined,
        goal,
        style,
        count,
        regenerateCount: nextCount,
      });

      setResult(data);
      setIsFormVisible(false);

      // Record quota consumption only on success
      await consumeFeatureUsage('hook-generator');

      try {
        await recordAiUsage('Hook Generator');
        await saveAiHistory({
          feature: 'Hook Generator',
          title: `Hook: ${trimmed.substring(0, 40)}${trimmed.length > 40 ? '...' : ''}`,
          inputSummary: `Topik: ${trimmed.substring(0, 80)} | Platform: ${platform} | Gaya: ${style}`,
          result: data.hooks
            .map(
              (h, i) =>
                `${i + 1}. [${h.category}] "${h.text}" (Skor: ${h.score}/100)\nAlasan: ${h.reason}`
            )
            .join('\n\n'),
        });
      } catch (saveErr) {
        console.warn('Auto-save history error:', saveErr);
      }
    } catch (err: any) {
      console.error('Hook generation error:', err);
      const msg = err?.message || 'Maaf, hook belum berhasil dibuat. Silakan coba lagi.';
      if (msg.includes('terhubung') || msg.includes('koneksi')) {
        setErrorMessage('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySingle = async (hook: HookItem, identifier: string) => {
    const success = await copyToClipboard(hook.text, 'Hook berhasil disalin.');
    if (success) {
      setCopiedHookId(identifier);
      setTimeout(() => setCopiedHookId(null), 2500);
    }
  };

  const handleCopyAll = async () => {
    if (!result || !result.hooks || result.hooks.length === 0) return;

    const formattedList = result.hooks
      .map(
        (h, index) =>
          `HOOK #${index + 1} (${h.category} - ${h.score}/100)\n"${h.text}"\nAlasan: ${h.reason}\n`
      )
      .join('\n');

    const allText = `HOOK TERBAIK UNTUK KONTENMU - ${result.platform}\nTopik: ${result.topic}\n\n${formattedList}`;

    const success = await copyToClipboard(allText, 'Semua hook berhasil disalin.');
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleEditInput = () => {
    setIsFormVisible(true);
  };

  const renderStars = (score: number) => {
    const starCount = score >= 94 ? 5 : score >= 85 ? 4 : 3;
    return (
      <div className="flex items-center gap-0.5 text-amber-500" title={`Potensi: ${starCount} dari 5 bintang`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < starCount ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div id="hook-generator-view" className="flex-1 overflow-y-auto flex flex-col w-full bg-[#F8FAFC]">
      {/* Toast Notification */}
      {copyNotification && (
        <div
          id="toast-notification"
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white text-xs sm:text-sm font-medium rounded-xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyNotification}</span>
        </div>
      )}

      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {onBackToChat && (
              <button
                id="btn-back-from-hook-generator"
                type="button"
                onClick={onBackToChat}
                className="mt-0.5 w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0 shadow-xs"
                title="Kembali ke Chat"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">🔥</span>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Hook Generator
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tahap 5
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Buat hook yang membuat audiens berhenti scroll dan ingin melihat kontenmu sampai selesai.
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div
            id="hook-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-rose-600 text-xs mt-0.5">
                Silakan periksa kembali input atau klik tombol Buat Hook lagi.
              </p>
            </div>
          </div>
        )}

        {/* Main Form Card OR Quick Switcher */}
        {isFormVisible ? (
          <div
            id="hook-input-form-card"
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6"
          >
            {/* A. TOPIK / ISI KONTEN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="hook-topic-input"
                  className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <span>Topik / Isi Konten</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {topic.length} karakter
                </span>
              </div>

              <textarea
                id="hook-topic-input"
                rows={3}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
                placeholder="Jelaskan isi konten yang ingin dibuatkan hook..."
                className={`w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-y ${
                  validationError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
                }`}
              />

              {/* Validation Message */}
              {validationError && (
                <div
                  id="hook-validation-message"
                  className="flex items-center gap-1.5 text-rose-600 text-xs font-medium"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Helper suggestion chip */}
              <div className="pt-1">
                <p className="text-[11px] text-slate-400 mb-1.5">Contoh inspirasi:</p>
                <button
                  type="button"
                  onClick={() => {
                    setTopic('5 kesalahan UMKM saat membuat konten di Instagram.');
                    setValidationError(null);
                  }}
                  className="text-[11px] sm:text-xs text-left text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  💡 &ldquo;5 kesalahan UMKM saat membuat konten di Instagram.&rdquo;
                </button>
              </div>
            </div>

            {/* Grid Controls: Platform, Target Audiens, Tujuan, Gaya, Jumlah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {/* B. Platform */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hook-select-platform"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Platform
                </label>
                <select
                  id="hook-select-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as HookPlatform)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* C. Target Audiens */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hook-input-audience"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Target Audiens
                </label>
                <input
                  id="hook-input-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isLoading}
                  placeholder="Contoh: pemilik UMKM, mahasiswa..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* D. Tujuan */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hook-select-goal"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Tujuan
                </label>
                <select
                  id="hook-select-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as HookGoal)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {GOALS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {/* E. Gaya Hook */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hook-select-style"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Gaya Hook
                </label>
                <select
                  id="hook-select-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as HookStyle)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* F. Jumlah Hook */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <label
                  className="text-xs font-bold text-slate-700 block"
                >
                  Jumlah Hook
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COUNTS.map((c) => (
                    <button
                      key={c}
                      id={`btn-select-count-${c}`}
                      type="button"
                      onClick={() => setCount(c)}
                      disabled={isLoading}
                      className={`py-2 px-3 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                        count === c
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c} Hook
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Optimasi Stop-Scroll • Skor Kualitas • Rekomendasi Top 3</span>
              </div>

              <button
                id="btn-generate-hooks"
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                    <span>AI sedang mencari hook terbaik...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span>⚡ Buat Hook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* When results are shown, user can edit input */
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {result?.platform} • {style} • {count} Hook
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-md">
                  &ldquo;{topic}&rdquo;
                </p>
              </div>
            </div>
            <button
              id="btn-quick-edit-hook-input"
              type="button"
              onClick={handleEditInput}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Input</span>
            </button>
          </div>
        )}

        {/* Loading Indicator State */}
        {isLoading && (
          <div
            id="hook-loading-state"
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 animate-pulse">
              <Zap className="w-6 h-6 animate-spin fill-amber-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                AI sedang mencari hook terbaik...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Mengeksplorasi sudut pandang psikologis stop-scroll untuk{' '}
                <span className="font-semibold text-slate-700">{platform}</span>.
              </p>
            </div>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-slate-900 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* RESULTS SECTION */}
        {result && !isLoading && (
          <div id="hook-results-section" className="space-y-6">
            {/* Action Bar: Title + Copy All, Generate Ulang, Edit Input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  HOOK TERBAIK UNTUK KONTENMU
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dihasilkan {result.hooks.length} hook pilihan untuk {result.platform}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-copy-all-hooks"
                  type="button"
                  onClick={handleCopyAll}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Semua Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Copy All</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-regenerate-hooks"
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isLoading}
                  className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>🔄 Generate Ulang</span>
                </button>

                <button
                  id="btn-edit-input-from-results"
                  type="button"
                  onClick={handleEditInput}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ Edit Input</span>
                </button>
              </div>
            </div>

            {/* SECTION 8: 🏆 TOP 3 HOOK */}
            {result.topHooks && result.topHooks.length > 0 && (
              <div
                id="top-3-hooks-section"
                className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-amber-100">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                      <span>🏆 Top 3 Hook</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">
                      Rekomendasi teratas berdasarkan attention, curiosity, dan kecocokan platform {result.platform}.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {result.topHooks.map((th, idx) => {
                    const topIdentifier = `top-hook-${idx + 1}`;
                    const isCopied = copiedHookId === topIdentifier;
                    return (
                      <div
                        key={idx}
                        id={topIdentifier}
                        className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-2xs hover:border-amber-300 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                              Top #{idx + 1}
                            </span>
                            <span className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Rekomendasi Unggulan
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                            &ldquo;{th.text}&rdquo;
                          </p>
                          <p className="text-[11px] text-slate-500 leading-normal">
                            <span className="font-semibold text-slate-600">Alasan:</span> {th.reason}
                          </p>
                        </div>

                        <button
                          id={`btn-copy-top-hook-${idx + 1}`}
                          type="button"
                          onClick={() =>
                            handleCopySingle(
                              { text: th.text, category: 'Top 3', score: 95, reason: th.reason },
                              topIdentifier
                            )
                          }
                          className={`self-start sm:self-center px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 6 & 7: DAFTAR SEMUA HOOK CARD */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daftar Hook Lengkap ({result.hooks.length} Hook)
                </span>
                <span className="text-[11px] text-slate-500">
                  Target: {result.platform}
                </span>
              </div>

              <div className="space-y-3">
                {result.hooks.map((hook, index) => {
                  const hookNumber = hook.number || index + 1;
                  const hookIdentifier = `hook-item-${hookNumber}`;
                  const isCopied = copiedHookId === hookIdentifier;

                  return (
                    <div
                      key={hook.id || index}
                      id={hookIdentifier}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
                    >
                      {/* Top Meta: Hook Number, Category, Potensi, Score */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                            HOOK #{hookNumber}
                          </span>
                          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {hook.category}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Potensi Stars */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] text-slate-400 hidden sm:inline">Potensi:</span>
                            {renderStars(hook.score)}
                          </div>

                          {/* Hook Score Badge */}
                          <div className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-mono font-bold tracking-tight">
                            SCORE {hook.score}/100
                          </div>
                        </div>
                      </div>

                      {/* Hook Text Body */}
                      <div className="py-1">
                        <p className="text-xs sm:text-base font-bold text-slate-900 leading-relaxed select-all">
                          &ldquo;{hook.text}&rdquo;
                        </p>
                      </div>

                      {/* Bottom Reason & Copy Action */}
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="text-xs text-slate-500 leading-normal flex-1">
                          <span className="font-semibold text-slate-600">Alasan: </span>
                          <span>{hook.reason}</span>
                        </div>

                        <button
                          id={`btn-copy-hook-${hookNumber}`}
                          type="button"
                          onClick={() => handleCopySingle(hook, hookIdentifier)}
                          className={`self-end sm:self-center px-3.5 py-1.5 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quota Exceeded Modal (Daily 5x Limit for FREE accounts) */}
      <QuotaExceededModal
        isOpen={showQuotaModal}
        featureLabel="Hook Generator"
        onClose={() => setShowQuotaModal(false)}
        onUpgrade={() => {
          setShowQuotaModal(false);
          onNavigate?.('premium');
        }}
      />
    </div>
  );
};
