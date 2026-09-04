import React, { useState } from 'react';
import {
  HashtagPlatform,
  HashtagGoal,
  HashtagCount,
  HashtagItem,
  HashtagCategory,
  GenerateHashtagsResult,
  ActiveView,
} from '../types';
import { generateHashtags } from '../services/aiService';
import { recordAiUsage, saveAiHistory } from '../services/storageService';
import { canUseFeature, consumeFeatureUsage } from '../services/accessControlService';
import { QuotaExceededModal } from './QuotaExceededModal';
import {
  ArrowLeft,
  Hash,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Layers,
  Target,
  Compass,
  Zap,
} from 'lucide-react';

const PLATFORMS: HashtagPlatform[] = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Facebook',
  'X',
  'LinkedIn',
  'Umum',
];

const GOALS: HashtagGoal[] = [
  'Reach',
  'Engagement',
  'Followers',
  'Penjualan',
  'Branding',
  'Edukasi',
];

const COUNTS: HashtagCount[] = [5, 10, 15, 20, 30];

interface HashtagGeneratorProps {
  onBackToChat?: () => void;
  onNavigate?: (view: ActiveView) => void;
}

export const HashtagGenerator: React.FC<HashtagGeneratorProps> = ({ onBackToChat, onNavigate }) => {
  // Form input state
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<HashtagPlatform>('Instagram');
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState<HashtagGoal>('Reach');
  const [count, setCount] = useState<HashtagCount>(15);

  // UI state
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Result state
  const [result, setResult] = useState<GenerateHashtagsResult | null>(null);
  const [regenerateCounter, setRegenerateCounter] = useState(0);

  // Toast / Copy state
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);
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
    const trimmed = topic.trim();
    if (!trimmed) {
      setValidationError('Silakan isi topik konten terlebih dahulu.');
      return;
    }

    // Check daily usage quota for FREE accounts (5x/day per tool)
    const quotaCheck = await canUseFeature('hashtag-generator');
    if (!quotaCheck.allowed) {
      setShowQuotaModal(true);
      return;
    }

    setValidationError(null);
    setErrorMessage(null);

    const nextCount = isRegenerate ? regenerateCounter + 1 : 0;
    if (isRegenerate) {
      setRegenerateCounter(nextCount);
    }

    setIsLoading(true);

    try {
      const data = await generateHashtags({
        topic: trimmed,
        platform,
        niche: niche.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        goal,
        count,
        regenerateCount: nextCount,
      });

      setResult(data);
      setIsFormVisible(false);

      // Record quota consumption only on success
      await consumeFeatureUsage('hashtag-generator');

      try {
        await recordAiUsage('Hashtag Generator');
        await saveAiHistory({
          feature: 'Hashtag Generator',
          title: `Hashtags: ${trimmed.substring(0, 40)}`,
          inputSummary: `Topik: ${trimmed.substring(0, 80)} | Platform: ${platform} | Niche: ${niche.trim() || '-'}`,
          result: `Hashtags (${data.hashtags?.length || 0}):\n${(data.hashtags || []).map((h) => `${h.tag} (${h.category} - Relevansi: ${h.relevanceScore}%)`).join('\n')}\n\nRekomendasi:\n${data.recommendation || '-'}`,
        });
      } catch (saveErr) {
        console.warn('Auto-save history error:', saveErr);
      }
    } catch (err: any) {
      console.error('Hashtag generation error:', err);
      const msg = err?.message || 'Maaf, permintaan belum berhasil diproses. Silakan coba lagi.';
      if (msg.includes('terhubung') || msg.includes('koneksi')) {
        setErrorMessage('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyTag = async (tag: string) => {
    const success = await copyToClipboard(tag, 'Hashtag berhasil disalin.');
    if (success) {
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 2000);
    }
  };

  const handleCopyAll = async () => {
    if (!result || !result.hashtags || result.hashtags.length === 0) return;

    const allTagsString = result.hashtags.map((h) => h.tag).join(' ');
    const success = await copyToClipboard(allTagsString, 'Hashtag berhasil disalin.');
    if (success) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2500);
    }
  };

  const handleEditInput = () => {
    setIsFormVisible(true);
  };

  // Group hashtags by 4 categories
  const categoryOrder: HashtagCategory[] = ['Broad', 'Niche', 'Target Audience', 'Intent'];
  const categoryMeta: Record<
    HashtagCategory,
    { label: string; desc: string; icon: React.FC<any>; badgeColor: string }
  > = {
    Broad: {
      label: 'Broad',
      desc: 'Hashtag umum dengan cakupan luas',
      icon: Compass,
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    Niche: {
      label: 'Niche',
      desc: 'Hashtag yang sangat relevan dengan topik & industri',
      icon: Layers,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    'Target Audience': {
      label: 'Target Audience',
      desc: 'Hashtag yang berkaitan dengan persona audiens',
      icon: Target,
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    Intent: {
      label: 'Intent',
      desc: 'Hashtag berdasarkan tujuan dan pencarian konten',
      icon: Zap,
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
  };

  const groupedHashtags: Record<HashtagCategory, HashtagItem[]> = {
    Broad: [],
    Niche: [],
    'Target Audience': [],
    Intent: [],
  };

  if (result && Array.isArray(result.hashtags)) {
    result.hashtags.forEach((item) => {
      const cat = item.category in groupedHashtags ? item.category : 'Niche';
      groupedHashtags[cat].push(item);
    });
  }

  return (
    <div id="hashtag-generator-view" className="flex-1 overflow-y-auto flex flex-col w-full bg-[#F8FAFC]">
      {/* Toast Notification */}
      {copyNotification && (
        <div
          id="toast-notification-hashtag"
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
                id="btn-back-from-hashtag-generator"
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
                <span className="text-xl sm:text-2xl">#️⃣</span>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Hashtag Generator
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tahap 6
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Temukan hashtag yang relevan untuk membantu kontenmu menjangkau audiens yang tepat.
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div
            id="hashtag-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-rose-600 text-xs mt-0.5">
                Silakan periksa kembali input atau klik tombol Buat Hashtag lagi.
              </p>
            </div>
          </div>
        )}

        {/* Main Form Card OR Quick Switcher */}
        {isFormVisible ? (
          <div
            id="hashtag-input-form-card"
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6"
          >
            {/* A. TOPIK KONTEN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="hashtag-topic-input"
                  className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <span>Topik Konten</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {topic.length} karakter
                </span>
              </div>

              <textarea
                id="hashtag-topic-input"
                rows={3}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
                placeholder="Contoh: Tips digital marketing untuk UMKM..."
                className={`w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-y ${
                  validationError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
                }`}
              />

              {/* Validation Message */}
              {validationError && (
                <div
                  id="hashtag-validation-message"
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
                    setTopic('Tips digital marketing untuk UMKM.');
                    setNiche('Digital Marketing');
                    setTargetAudience('Pemilik UMKM');
                    setValidationError(null);
                  }}
                  className="text-[11px] sm:text-xs text-left text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  💡 &ldquo;Tips digital marketing untuk UMKM.&rdquo;
                </button>
              </div>
            </div>

            {/* Grid Controls: Platform, Niche, Target Audiens, Tujuan, Jumlah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {/* B. Platform */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hashtag-select-platform"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Platform
                </label>
                <select
                  id="hashtag-select-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as HashtagPlatform)}
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

              {/* C. Niche */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hashtag-input-niche"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Niche
                </label>
                <input
                  id="hashtag-input-niche"
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  disabled={isLoading}
                  placeholder="Contoh: Digital Marketing, Bisnis..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* D. Target Audiens */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hashtag-input-audience"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Target Audiens
                </label>
                <input
                  id="hashtag-input-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isLoading}
                  placeholder="Contoh: Pemilik UMKM, mahasiswa..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* E. Tujuan */}
              <div className="space-y-1.5">
                <label
                  htmlFor="hashtag-select-goal"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Tujuan
                </label>
                <select
                  id="hashtag-select-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as HashtagGoal)}
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

              {/* F. Jumlah Hashtag */}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Jumlah Hashtag
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COUNTS.map((c) => (
                    <button
                      key={c}
                      id={`btn-select-hashtag-count-${c}`}
                      type="button"
                      onClick={() => setCount(c)}
                      disabled={isLoading}
                      className={`py-2 px-2.5 text-xs sm:text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                        count === c
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {c} Tag
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Kategorisasi 4 Pilar • Relevansi Score • Optimasi Algoritma</span>
              </div>

              <button
                id="btn-generate-hashtags"
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                    <span>AI sedang mencari hashtag yang relevan...</span>
                  </>
                ) : (
                  <>
                    <Hash className="w-4 h-4 text-emerald-400" />
                    <span>#️⃣ Buat Hashtag</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* When results are shown, user can edit input */
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {result?.platform} • {result?.hashtags.length} Hashtag • {goal}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-md">
                  &ldquo;{topic}&rdquo;
                </p>
              </div>
            </div>
            <button
              id="btn-quick-edit-hashtag-input"
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
            id="hashtag-loading-state"
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-pulse">
              <Hash className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                AI sedang mencari hashtag yang relevan...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Mengevaluasi kombinasi Broad, Niche, Target Audiens, dan Intent untuk algoritma{' '}
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
          <div id="hashtag-results-section" className="space-y-6">
            {/* Top Action & Meta Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  REKOMENDASI HASHTAG ({result.hashtags.length} TAG)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dioptimalkan untuk {result.platform} • Klik chip untuk menyalin satu tag
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-copy-all-hashtags"
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
                  id="btn-regenerate-hashtags"
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isLoading}
                  className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>🔄 Generate Ulang</span>
                </button>

                <button
                  id="btn-edit-hashtag-input"
                  type="button"
                  onClick={handleEditInput}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ Edit Input</span>
                </button>
              </div>
            </div>

            {/* AI STRATEGY RECOMMENDATION BANNER */}
            {result.recommendation && (
              <div
                id="hashtag-recommendation-card"
                className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-xs flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Strategi Algoritma & Rekomendasi
                  </h3>
                  <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                    {result.recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* HASHTAGS CHIPS CLOUD (QUICK SELECTION & CLICK TO COPY) */}
            <div
              id="hashtag-chips-cloud-card"
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Daftar Tag Siap Pakai (Klik untuk Copy)
                </span>
                <span className="text-[11px] text-slate-400">
                  Total {result.hashtags.length} hashtag
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {result.hashtags.map((h, i) => {
                  const isCopied = copiedTag === h.tag;
                  return (
                    <button
                      key={i}
                      id={`btn-hashtag-chip-${i + 1}`}
                      type="button"
                      onClick={() => handleCopyTag(h.tag)}
                      title={`Klik untuk menyalin: ${h.tag} (${h.category} - Relevansi ${h.relevanceScore}/100)`}
                      className={`group px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs scale-95'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>{h.tag}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                          isCopied
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white text-slate-500 border border-slate-200 group-hover:border-slate-300'
                        }`}
                      >
                        {h.relevanceScore}%
                      </span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-white" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-300 group-hover:text-slate-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4-PILLAR CATEGORIZED BREAKDOWN */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kategorisasi 4 Pilar Hashtag
                </span>
                <span className="text-[11px] text-slate-500">
                  Broad • Niche • Target Audience • Intent
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryOrder.map((catKey) => {
                  const meta = categoryMeta[catKey];
                  const Icon = meta.icon;
                  const tagsInCat = groupedHashtags[catKey];

                  return (
                    <div
                      key={catKey}
                      id={`category-card-${catKey.toLowerCase().replace(/\s+/g, '-')}`}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        {/* Category Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">
                                {meta.label}
                              </h4>
                              <p className="text-[10px] text-slate-400 leading-tight">
                                {meta.desc}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${meta.badgeColor}`}
                          >
                            {tagsInCat.length} Tag
                          </span>
                        </div>

                        {/* List of tags with details */}
                        <div className="divide-y divide-slate-100 mt-2">
                          {tagsInCat.length === 0 ? (
                            <p className="text-xs text-slate-400 italic py-2">
                              Tidak ada tag dalam kategori ini.
                            </p>
                          ) : (
                            tagsInCat.map((item, tIdx) => {
                              const isCopied = copiedTag === item.tag;
                              return (
                                <div
                                  key={tIdx}
                                  className="py-2.5 flex items-start justify-between gap-2"
                                >
                                  <div className="space-y-0.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-slate-900 font-mono">
                                        {item.tag}
                                      </span>
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                        Relevance: {item.relevanceScore}/100
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-normal">
                                      {item.reason}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleCopyTag(item.tag)}
                                    title="Salin hashtag"
                                    className={`px-2 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 transition-colors shrink-0 cursor-pointer ${
                                      isCopied
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {isCopied ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-600" />
                                        <span className="text-[11px]">Tersalin</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3 text-slate-400" />
                                        <span className="text-[11px]">Copy</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
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
        featureLabel="Hashtag Generator"
        onClose={() => setShowQuotaModal(false)}
        onUpgrade={() => {
          setShowQuotaModal(false);
          onNavigate?.('premium');
        }}
      />
    </div>
  );
};
