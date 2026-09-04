import React, { useState } from 'react';
import {
  PlatformType,
  ContentCategoryType,
  ContentAnalysisResult,
} from '../types';
import { analyzeContent } from '../services/aiService';
import {
  Copy,
  Check,
  RotateCcw,
  Edit3,
  AlertCircle,
  Sparkles,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Share2,
} from 'lucide-react';

const PLATFORMS: PlatformType[] = [
  'Umum',
  'Instagram',
  'TikTok',
  'Facebook',
  'YouTube',
  'X',
  'LinkedIn',
];

const CONTENT_TYPES: ContentCategoryType[] = [
  'Konten Umum',
  'Caption',
  'Hook',
  'Script',
  'Judul',
  'Deskripsi',
  'Copywriting',
  'Ide Konten',
];

interface ContentAnalyzerProps {
  onBackToChat?: () => void;
}

export const ContentAnalyzer: React.FC<ContentAnalyzerProps> = ({ onBackToChat }) => {
  // Input form state
  const [content, setContent] = useState('');
  const [platform, setPlatform] = useState<PlatformType>('Umum');
  const [contentType, setContentType] = useState<ContentCategoryType>('Konten Umum');

  // Status and result states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentAnalysisResult | null>(null);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Character counter helper
  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Handle Analysis request
  const handleAnalyze = async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setValidationError('Masukkan konten terlebih dahulu.');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);

    try {
      const data = await analyzeContent({
        content: trimmed,
        platform,
        contentType,
      });
      setResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'ARVIN AI tidak dapat melakukan analisis saat ini. Silakan coba lagi.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Re-run analysis with same input
  const handleReanalyze = () => {
    if (isLoading) return;
    handleAnalyze();
  };

  // Switch back to edit form keeping user content
  const handleEditContent = () => {
    setResult(null);
    setApiError(null);
    setValidationError(null);
  };

  // Copy to clipboard helper
  const handleCopy = async (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  // Helper score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div
      id="content-analyzer-page"
      className="w-full max-w-3xl mx-auto flex-1 flex flex-col px-3 sm:px-6 py-4 sm:py-6 overflow-y-auto"
    >
      {/* Top Banner & Title */}
      <div className="mb-5 sm:mb-6">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-sm shadow-slate-300 shrink-0">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                Content Analyzer
              </h1>
              <p className="text-xs text-slate-500">
                Evaluasi kualitas konten sebelum dipublikasikan dengan kurasi AI
              </p>
            </div>
          </div>

          {onBackToChat && (
            <button
              id="btn-back-to-chat"
              type="button"
              onClick={onBackToChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Chat Utama</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Container: Result View OR Form View */}
      {result ? (
        /* ================= RESULT VIEW ================= */
        <div id="analyzer-result-container" className="space-y-6 animate-fadeIn pb-12">
          {/* Result Header & Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                {result.platform}
              </span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                {result.contentType}
              </span>
              <span className="text-[11px] text-slate-400">
                • {new Date(result.analyzedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-edit-content"
                type="button"
                onClick={handleEditContent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                title="Kembali ke form input untuk mengedit draf"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Konten</span>
              </button>

              <button
                id="btn-reanalyze"
                type="button"
                onClick={handleReanalyze}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-50 transition-colors shadow-sm"
                title="Kirim ulang konten ke AI untuk analisis baru"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Analisis Ulang</span>
              </button>
            </div>
          </div>

          {/* Loading Overlay during Re-analyze */}
          {isLoading && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-sm text-slate-600 animate-pulse">
              <RotateCcw className="w-4 h-4 animate-spin text-slate-900" />
              <span>ARVIN AI sedang menganalisis ulang...</span>
            </div>
          )}

          {/* Score Hero Card */}
          <div
            id="content-score-card"
            className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center sm:items-stretch gap-6"
          >
            {/* Overall Score Circle */}
            <div className="flex flex-col items-center justify-center p-4 min-w-[160px] text-center shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 pb-5 sm:pb-0 sm:pr-6">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                CONTENT SCORE
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">
                  {result.overallScore}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 100</span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full border ${getScoreColor(
                    result.overallScore
                  )}`}
                >
                  {result.overallScore >= 85
                    ? 'Sangat Siap'
                    : result.overallScore >= 70
                    ? 'Cukup Bagus'
                    : 'Perlu Optimasi'}
                </span>
              </div>
            </div>

            {/* 7 Breakdown Metric Bars */}
            <div className="flex-1 w-full grid grid-cols-1 gap-2.5">
              {[
                { label: 'Hook', desc: 'Kekuatan pembuka', value: result.metrics.hook },
                { label: 'Clarity', desc: 'Kejelasan pesan', value: result.metrics.clarity },
                { label: 'Engagement', desc: 'Potensi interaksi', value: result.metrics.engagement },
                { label: 'Value', desc: 'Manfaat bagi audiens', value: result.metrics.value },
                { label: 'Structure', desc: 'Kerapian struktur', value: result.metrics.structure },
                { label: 'CTA', desc: 'Ajakan bertindak', value: result.metrics.cta },
                { label: 'Platform Fit', desc: `Kesesuaian ${result.platform}`, value: result.metrics.platformFit },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{item.label}</span>
                      <span className="text-[10px] text-slate-400 hidden xs:inline">
                        • {item.desc}
                      </span>
                    </div>
                    <span className="font-bold text-slate-700">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(
                        item.value
                      )}`}
                      style={{ width: `${Math.max(5, item.value)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 📝 RINGKASAN */}
          <div
            id="section-summary"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-base select-none">📝</span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                RINGKASAN
              </h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed pl-6">
              {result.summary}
            </p>
          </div>

          {/* 💪 KELEBIHAN & ⚠️ YANG PERLU DIPERBAIKI (2 Columns or Stacked) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kelebihan */}
            <div
              id="section-strengths"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-base select-none">💪</span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  KELEBIHAN
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 pl-2">
                {result.strengths.map((strength, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Yang Perlu Diperbaiki */}
            <div
              id="section-improvements"
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-base select-none">⚠️</span>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  YANG PERLU DIPERBAIKI
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-slate-700 pl-2">
                {result.improvements.map((improvement, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 💡 REKOMENDASI ARVIN AI */}
          <div
            id="section-recommendations"
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-base select-none">💡</span>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                REKOMENDASI ARVIN AI
              </h3>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-700 pl-2">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="flex-1 leading-relaxed">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ✨ VERSI YANG DISARANKAN (Improved Version) */}
          <div
            id="section-improved-version"
            className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-3"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm sm:text-base">
                  {result.improvedVersionTitle || 'VERSI YANG DISARANKAN'}
                </h3>
              </div>

              <button
                id="btn-copy-improved-version"
                type="button"
                onClick={() => handleCopy(result.improvedVersion, 'improved')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors"
                title="Salin konten ke clipboard"
              >
                {copiedKey === 'improved' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">✓ Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-sans select-text">
              {result.improvedVersion}
            </div>
          </div>

          {/* Bottom Action Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <button
              id="btn-bottom-edit"
              type="button"
              onClick={handleEditContent}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 text-sm font-semibold transition-colors shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Konten</span>
            </button>

            <button
              id="btn-bottom-reanalyze"
              type="button"
              onClick={handleReanalyze}
              disabled={isLoading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Analisis Ulang</span>
            </button>
          </div>
        </div>
      ) : (
        /* ================= INPUT FORM VIEW ================= */
        <div id="analyzer-form-container" className="space-y-5">
          {/* Platform & Jenis Konten Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Platform Selection */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <label
                htmlFor="select-platform"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Platform
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PLATFORMS.map((p) => {
                  const isSelected = platform === p;
                  return (
                    <button
                      key={p}
                      id={`platform-pill-${p.toLowerCase()}`}
                      type="button"
                      onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jenis Konten Selection */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <label
                htmlFor="select-content-type"
                className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
              >
                Jenis Konten
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CONTENT_TYPES.map((t) => {
                  const isSelected = contentType === t;
                  return (
                    <button
                      key={t}
                      id={`type-pill-${t.toLowerCase().replace(/\s+/g, '-')}`}
                      type="button"
                      onClick={() => setContentType(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content Textarea Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="analyzer-textarea"
                className="block text-xs font-bold text-slate-600 uppercase tracking-wider"
              >
                Konten yang Akan Dianalisis
              </label>
              <span className="text-[11px] font-medium text-slate-400">
                {wordCount} kata • {characterCount} karakter
              </span>
            </div>

            <textarea
              id="analyzer-textarea"
              rows={8}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (validationError && e.target.value.trim()) {
                  setValidationError(null);
                }
              }}
              placeholder="Tempel atau tulis konten kamu di sini..."
              disabled={isLoading}
              className="w-full resize-y min-h-[160px] sm:min-h-[200px] p-3 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-50 leading-relaxed font-sans"
              style={{ overflowX: 'hidden' }}
            />

            {/* Validation Message */}
            {validationError && (
              <div
                id="analyzer-validation-error"
                className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* API Error Message */}
            {apiError && (
              <div
                id="analyzer-api-error"
                className="flex items-center justify-between gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{apiError}</span>
                </div>
                <button
                  id="btn-retry-analysis"
                  type="button"
                  onClick={handleAnalyze}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg text-xs font-bold shrink-0 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              id="btn-run-analysis"
              type="button"
              onClick={handleAnalyze}
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:bg-slate-400 text-white font-bold text-sm sm:text-base tracking-wide flex items-center justify-center gap-2 shadow-md shadow-slate-900/15 transition-all"
            >
              {isLoading ? (
                <>
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  <span>ARVIN AI sedang menganalisis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  <span>ANALISIS KONTEN</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Explanatory Note */}
          <div className="p-4 bg-slate-100/70 border border-slate-200/70 rounded-2xl text-xs text-slate-500 space-y-1.5">
            <p className="font-semibold text-slate-700">Tips Evaluasi ARVIN AI:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
              <li>Pilih platform dan jenis konten yang sesuai agar pembobotan skor akurat.</li>
              <li>AI akan mengukur 7 metrik: Hook, Clarity, Engagement, Value, Structure, CTA, dan Platform Fit.</li>
              <li>Hasil mencakup ringkasan, kelebihan, kekurangan, saran perbaikan, serta versi perbaikan konten.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
