import React, { useState } from 'react';
import {
  CaptionPlatform,
  CaptionStyle,
  CaptionGoal,
  CaptionLength,
  CaptionLanguage,
  CaptionCta,
  CaptionVariant,
  GenerateCaptionResult,
} from '../types';
import { generateCaptions } from '../services/aiService';
import {
  ArrowLeft,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  AlertCircle,
  Hash,
  Share2,
  Sliders,
  CheckCircle2,
  Flame,
  MessageCircle,
  BookOpen,
} from 'lucide-react';

const PLATFORMS: CaptionPlatform[] = [
  'Instagram',
  'TikTok',
  'Facebook',
  'YouTube',
  'X',
  'LinkedIn',
  'Umum',
];

const STYLES: CaptionStyle[] = [
  'Santai',
  'Profesional',
  'Edukatif',
  'Persuasif',
  'Storytelling',
  'Inspiratif',
  'Lucu',
  'Elegan',
  'Viral / Catchy',
];

const GOALS: CaptionGoal[] = [
  'Engagement',
  'Followers',
  'Penjualan',
  'Branding',
  'Edukasi',
  'Promosi',
  'Personal Branding',
];

const LENGTHS: CaptionLength[] = ['Pendek', 'Sedang', 'Panjang'];

const LANGUAGES: CaptionLanguage[] = [
  'Indonesia',
  'Indonesia + English',
  'English',
];

const CTAS: CaptionCta[] = [
  'Tanpa CTA',
  'CTA Soft',
  'CTA Engagement',
  'CTA Penjualan',
  'CTA Follow',
];

interface CaptionMakerProps {
  onBackToChat?: () => void;
}

export const CaptionMaker: React.FC<CaptionMakerProps> = ({ onBackToChat }) => {
  // Form input state
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<CaptionPlatform>('Instagram');
  const [style, setStyle] = useState<CaptionStyle>('Santai');
  const [goal, setGoal] = useState<CaptionGoal>('Engagement');
  const [length, setLength] = useState<CaptionLength>('Sedang');
  const [language, setLanguage] = useState<CaptionLanguage>('Indonesia');
  const [cta, setCta] = useState<CaptionCta>('CTA Engagement');

  // UI state
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<GenerateCaptionResult | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [regenerateCounter, setRegenerateCounter] = useState(0);

  // Toast / Copy notification state
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [copiedVariantId, setCopiedVariantId] = useState<string | null>(null);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const showToast = (message: string) => {
    setCopyNotification(message);
    setTimeout(() => {
      setCopyNotification(null);
    }, 3200);
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

  // Generate handler
  const handleGenerate = async (isRegenerate = false) => {
    // 1. Validation
    const trimmed = content.trim();
    if (!trimmed) {
      setValidationError('Silakan jelaskan konten yang ingin dibuatkan caption.');
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
      const data = await generateCaptions({
        content: trimmed,
        platform,
        style,
        goal,
        length,
        language,
        cta,
        regenerateCount: nextCount,
      });

      setResult(data);
      setActiveVariantIndex(0);
      setIsFormVisible(false);
    } catch (err: any) {
      console.error('Caption generation error:', err);
      const msg = err?.message || 'Maaf, caption belum berhasil dibuat. Silakan coba lagi.';
      if (msg.includes('terhubung') || msg.includes('koneksi')) {
        setErrorMessage('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyVariant = async (variant: CaptionVariant) => {
    const success = await copyToClipboard(variant.caption, 'Caption berhasil disalin.');
    if (success) {
      setCopiedVariantId(variant.id);
      setTimeout(() => setCopiedVariantId(null), 2500);
    }
  };

  const handleCopyHashtags = async () => {
    if (!result || !result.hashtags || result.hashtags.length === 0) return;
    const hashtagString = result.hashtags.join(' ');
    const success = await copyToClipboard(hashtagString, 'Hashtag berhasil disalin.');
    if (success) {
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2500);
    }
  };

  const handleEditInput = () => {
    setIsFormVisible(true);
  };

  const activeVariant = result?.variants?.[activeVariantIndex] || result?.variants?.[0];

  const getVariantIcon = (index: number) => {
    if (index === 0) return <Flame className="w-4 h-4 text-amber-500" />;
    if (index === 1) return <BookOpen className="w-4 h-4 text-indigo-500" />;
    return <MessageCircle className="w-4 h-4 text-emerald-500" />;
  };

  return (
    <div id="caption-maker-view" className="flex-1 overflow-y-auto flex flex-col w-full bg-[#F8FAFC]">
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
                id="btn-back-from-caption-maker"
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
                <span className="text-xl sm:text-2xl">✍️</span>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Caption Maker
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tahap 4
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Buat caption yang menarik, natural, dan sesuai dengan karakter kontenmu menggunakan AI.
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div
            id="caption-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-rose-600 text-xs mt-0.5">
                Silakan periksa kembali input atau klik tombol Buat Caption lagi.
              </p>
            </div>
          </div>
        )}

        {/* Main Content Area: Form OR Result (or Form toggle) */}
        {isFormVisible ? (
          <div
            id="caption-input-form-card"
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6"
          >
            {/* A. Tentang Konten */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="caption-content-input"
                  className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                >
                  <span>Tentang Konten</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {content.length} karakter
                </span>
              </div>

              <textarea
                id="caption-content-input"
                rows={4}
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
                placeholder="Ceritakan tentang konten yang ingin kamu posting..."
                className={`w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-y ${
                  validationError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
                }`}
              />

              {/* Validation Message */}
              {validationError && (
                <div
                  id="caption-validation-message"
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
                    setContent('Video saya membahas 5 kesalahan UMKM saat membuat konten Instagram.');
                    setValidationError(null);
                  }}
                  className="text-[11px] sm:text-xs text-left text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  💡 &ldquo;Video saya membahas 5 kesalahan UMKM saat membuat konten Instagram.&rdquo;
                </button>
              </div>
            </div>

            {/* Grid Configuration Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {/* B. Platform */}
              <div className="space-y-1.5">
                <label
                  htmlFor="caption-select-platform"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Platform
                </label>
                <select
                  id="caption-select-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as CaptionPlatform)}
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

              {/* C. Gaya Caption */}
              <div className="space-y-1.5">
                <label
                  htmlFor="caption-select-style"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Gaya Caption
                </label>
                <select
                  id="caption-select-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as CaptionStyle)}
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

              {/* D. Tujuan Caption */}
              <div className="space-y-1.5">
                <label
                  htmlFor="caption-select-goal"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Tujuan Caption
                </label>
                <select
                  id="caption-select-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as CaptionGoal)}
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

              {/* E. Panjang Caption */}
              <div className="space-y-1.5">
                <label
                  htmlFor="caption-select-length"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Panjang Caption
                </label>
                <select
                  id="caption-select-length"
                  value={length}
                  onChange={(e) => setLength(e.target.value as CaptionLength)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {LENGTHS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* F. Bahasa */}
              <div className="space-y-1.5">
                <label
                  htmlFor="caption-select-language"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Bahasa
                </label>
                <select
                  id="caption-select-language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as CaptionLanguage)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* G. CTA */}
              <div className="space-y-1.5">
                <label
                  htmlFor="caption-select-cta"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Call to Action (CTA)
                </label>
                <select
                  id="caption-select-cta"
                  value={cta}
                  onChange={(e) => setCta(e.target.value as CaptionCta)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {CTAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>3 Varian Caption • Rekomendasi Hashtag Otomatis</span>
              </div>

              <button
                id="btn-generate-caption"
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                    <span>AI sedang membuat caption...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>✨ Buat Caption</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* When result is ready but user can expand form back */
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  Parameter: {platform} • {style} • {goal}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-md">
                  &ldquo;{content}&rdquo;
                </p>
              </div>
            </div>
            <button
              id="btn-quick-edit-input"
              type="button"
              onClick={handleEditInput}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Ubah Input</span>
            </button>
          </div>
        )}

        {/* Loading Indicator State (When generating) */}
        {isLoading && (
          <div
            id="caption-loading-state"
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 animate-pulse">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                AI sedang membuat caption...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Menganalisis sudut pandang Direct &amp; Catchy, Storytelling, dan Engagement untuk{' '}
                <span className="font-semibold text-slate-700">{platform}</span>.
              </p>
            </div>
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
              <div className="w-full h-full bg-slate-900 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
            </div>
          </div>
        )}

        {/* SECTION 7, 8, 9: RESULTS CARD */}
        {result && !isLoading && (
          <div id="caption-results-section" className="space-y-6">
            {/* Multiple Caption Variants Switcher */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pilih Varian ({result.variants.length} Varian Tersedia)
                </span>
                <span className="text-[11px] text-slate-500">
                  Dibuat khusus untuk {result.platform}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {result.variants.map((variant, idx) => {
                  const isSelected = activeVariantIndex === idx;
                  return (
                    <button
                      key={variant.id || idx}
                      id={`btn-select-variant-${idx + 1}`}
                      type="button"
                      onClick={() => setActiveVariantIndex(idx)}
                      className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                          : 'bg-white/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-1.5">
                          {getVariantIcon(idx)}
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? 'text-slate-900' : 'text-slate-700'
                            }`}
                          >
                            Varian {idx + 1}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-tight">
                        {variant.name}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {variant.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Result Card: "Caption Kamu" */}
            {activeVariant && (
              <div
                id="caption-kamu-card"
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-slate-900">
                        Caption Kamu
                      </h2>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {activeVariant.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeVariant.description}
                    </p>
                  </div>

                  {/* Quick Copy for this Variant */}
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-copy-active-variant"
                      type="button"
                      onClick={() => handleCopyVariant(activeVariant)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                        copiedVariantId === activeVariant.id
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xs'
                      }`}
                    >
                      {copiedVariantId === activeVariant.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Caption</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Caption Body Text with Paragraph Formatting preserved */}
                <div
                  id="caption-text-body"
                  className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 sm:p-5 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans select-all"
                >
                  {activeVariant.caption}
                </div>

                {/* Hashtag Section (Hashtag yang Disarankan) */}
                {result.hashtags && result.hashtags.length > 0 && (
                  <div
                    id="hashtags-suggested-section"
                    className="pt-4 border-t border-slate-100 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Hash className="w-4 h-4 text-slate-400" />
                        <span>Hashtag yang Disarankan</span>
                        <span className="text-[11px] font-normal text-slate-400">
                          ({result.hashtags.length} hashtag relevan)
                        </span>
                      </div>

                      <button
                        id="btn-copy-hashtags"
                        type="button"
                        onClick={handleCopyHashtags}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                          copiedHashtags
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {copiedHashtags ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span>Copy Hashtag</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {result.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Primary Card Actions: Copy Caption, Generate Ulang, Edit Input */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      id="btn-bottom-copy-caption"
                      type="button"
                      onClick={() => handleCopyVariant(activeVariant)}
                      className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Copy className="w-4 h-4" />
                      <span>📋 Copy Caption</span>
                    </button>

                    <button
                      id="btn-regenerate-caption"
                      type="button"
                      onClick={() => handleGenerate(true)}
                      disabled={isLoading}
                      className="px-4 py-2.5 text-xs sm:text-sm font-bold bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>🔄 Generate Ulang</span>
                    </button>
                  </div>

                  <button
                    id="btn-edit-input-from-card"
                    type="button"
                    onClick={handleEditInput}
                    className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>✏️ Edit Input</span>
                  </button>
                </div>
              </div>
            )}

            {/* All 3 Variants Reference List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Semua Varian Caption
              </h3>
              <div className="space-y-3">
                {result.variants.map((v, i) => (
                  <div
                    key={v.id || i}
                    className={`bg-white border rounded-xl p-4 sm:p-5 transition-all ${
                      activeVariantIndex === i
                        ? 'border-slate-400 shadow-xs'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getVariantIcon(i)}
                        <span className="text-xs font-bold text-slate-800">
                          Varian {i + 1}: {v.name}
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          — {v.description}
                        </span>
                      </div>
                      <button
                        id={`btn-copy-variant-item-${i + 1}`}
                        type="button"
                        onClick={() => handleCopyVariant(v)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 font-sans">
                      {v.caption}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
