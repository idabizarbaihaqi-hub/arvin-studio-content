import React, { useState } from 'react';
import {
  ScriptPlatform,
  ScriptGoal,
  ScriptDuration,
  ScriptStyle,
  GenerateScriptResult,
} from '../types';
import { generateScript } from '../services/aiService';
import {
  ArrowLeft,
  Clapperboard,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Timer,
  Video,
  Eye,
  Mic,
  Type,
  Award,
} from 'lucide-react';

const PLATFORMS: ScriptPlatform[] = [
  'TikTok',
  'Instagram Reels',
  'YouTube Shorts',
  'YouTube',
  'Facebook',
  'X',
  'LinkedIn',
  'Umum',
];

const GOALS: ScriptGoal[] = [
  'Engagement',
  'Views',
  'Followers',
  'Penjualan',
  'Branding',
  'Edukasi',
  'Entertainment',
];

const DURATIONS: ScriptDuration[] = [
  '15 detik',
  '30 detik',
  '60 detik',
  '90 detik',
  '3 menit',
  '5 menit',
  '10 menit',
];

const STYLES: ScriptStyle[] = [
  'Edukatif',
  'Storytelling',
  'Santai',
  'Profesional',
  'Persuasif',
  'Inspiratif',
  'Lucu',
  'Dramatis',
  'Viral / Catchy',
];

interface ScriptMakerProps {
  onBackToChat?: () => void;
}

export const ScriptMaker: React.FC<ScriptMakerProps> = ({ onBackToChat }) => {
  // Form input state
  const [topic, setTopic] = useState('');
  const [platform, setPlatform] = useState<ScriptPlatform>('TikTok');
  const [targetAudience, setTargetAudience] = useState('');
  const [goal, setGoal] = useState<ScriptGoal>('Engagement');
  const [duration, setDuration] = useState<ScriptDuration>('60 detik');
  const [style, setStyle] = useState<ScriptStyle>('Edukatif');
  const [useHook, setUseHook] = useState<boolean>(true);

  // UI state
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<GenerateScriptResult | null>(null);
  const [regenerateCounter, setRegenerateCounter] = useState(0);

  // Toast / Copy notification state
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);

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
    setValidationError(null);
    setErrorMessage(null);

    const nextCount = isRegenerate ? regenerateCounter + 1 : 0;
    if (isRegenerate) {
      setRegenerateCounter(nextCount);
    }

    setIsLoading(true);

    try {
      const data = await generateScript({
        topic: trimmed,
        platform,
        targetAudience: targetAudience.trim() || undefined,
        goal,
        duration,
        style,
        useHook,
        regenerateCount: nextCount,
      });

      setResult(data);
      setIsFormVisible(false);
    } catch (err: any) {
      console.error('Script generation error:', err);
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

  const handleCopyScript = async () => {
    if (!result) return;

    const sections: string[] = [];
    sections.push(`JUDUL: ${result.title}`);
    sections.push(`Platform: ${result.platform} | Durasi: ${result.duration} | Skor: ${result.score}/100\n`);

    if (result.hook) {
      sections.push(`[HOOK - 3 DETIK PERTAMA]\n"${result.hook}"\n`);
    }

    sections.push(`[OPENING]\n${result.opening}\n`);

    if (result.scenes && result.scenes.length > 0) {
      sections.push(`[SCENE BREAKDOWN]`);
      result.scenes.forEach((s) => {
        sections.push(
          `SCENE ${s.sceneNumber} (${s.timeRange || ''})\nVisual: ${s.visual}\nVoice Over: "${s.voiceOver}"${
            s.textOverlay ? `\nText Overlay: ${s.textOverlay}` : ''
          }\n`
        );
      });
    }

    sections.push(`[BODY / ISI]\n${result.body}\n`);
    sections.push(`[CALL TO ACTION]\n${result.cta}\n`);
    sections.push(`[ENDING]\n${result.ending}`);

    const fullScriptText = sections.join('\n');
    const success = await copyToClipboard(fullScriptText, 'Script berhasil disalin.');
    if (success) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  const handleEditInput = () => {
    setIsFormVisible(true);
  };

  return (
    <div id="script-maker-view" className="flex-1 overflow-y-auto flex flex-col w-full bg-[#F8FAFC]">
      {/* Toast Notification */}
      {copyNotification && (
        <div
          id="toast-notification-script"
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
                id="btn-back-from-script-maker"
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
                <span className="text-xl sm:text-2xl">🎬</span>
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Script Maker
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tahap 6
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Buat script konten yang terstruktur dan siap digunakan dengan bantuan AI.
              </p>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div
            id="script-error-banner"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-rose-600 text-xs mt-0.5">
                Silakan periksa kembali input atau klik tombol Buat Script lagi.
              </p>
            </div>
          </div>
        )}

        {/* Main Form Card OR Quick Switcher */}
        {isFormVisible ? (
          <div
            id="script-input-form-card"
            className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6"
          >
            {/* A. TOPIK / ISI KONTEN */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="script-topic-input"
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
                id="script-topic-input"
                rows={3}
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={isLoading}
                placeholder="Jelaskan konten yang ingin dibuatkan script..."
                className={`w-full p-3.5 text-xs sm:text-sm text-slate-800 bg-slate-50 border rounded-xl placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all resize-y ${
                  validationError
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-slate-400 focus:ring-slate-100'
                }`}
              />

              {/* Validation Message */}
              {validationError && (
                <div
                  id="script-validation-message"
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
                    setTopic('5 kesalahan UMKM saat membuat konten Instagram.');
                    setValidationError(null);
                  }}
                  className="text-[11px] sm:text-xs text-left text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                >
                  💡 &ldquo;5 kesalahan UMKM saat membuat konten Instagram.&rdquo;
                </button>
              </div>
            </div>

            {/* Grid Controls: Platform, Target Audiens, Tujuan, Durasi, Gaya */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              {/* B. Platform */}
              <div className="space-y-1.5">
                <label
                  htmlFor="script-select-platform"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Platform
                </label>
                <select
                  id="script-select-platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as ScriptPlatform)}
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
                  htmlFor="script-input-audience"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Target Audiens
                </label>
                <input
                  id="script-input-audience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  disabled={isLoading}
                  placeholder="Contoh: Pemilik UMKM, mahasiswa..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium placeholder:text-slate-400"
                />
              </div>

              {/* D. Tujuan */}
              <div className="space-y-1.5">
                <label
                  htmlFor="script-select-goal"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Tujuan
                </label>
                <select
                  id="script-select-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as ScriptGoal)}
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

              {/* E. Durasi */}
              <div className="space-y-1.5">
                <label
                  htmlFor="script-select-duration"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Durasi
                </label>
                <select
                  id="script-select-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value as ScriptDuration)}
                  disabled={isLoading}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all font-medium"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* F. Gaya */}
              <div className="space-y-1.5">
                <label
                  htmlFor="script-select-style"
                  className="text-xs font-bold text-slate-700 block"
                >
                  Gaya
                </label>
                <select
                  id="script-select-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as ScriptStyle)}
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

              {/* G. Gunakan Hook (Toggle ON/OFF) */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="text-xs font-bold text-slate-700 block">
                  Gunakan Hook
                </label>
                <button
                  id="btn-toggle-script-hook"
                  type="button"
                  onClick={() => setUseHook(!useHook)}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 text-xs sm:text-sm font-bold rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    useHook
                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span>🔥 Pembuka Hook</span>
                  </span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold ${
                      useHook
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-300 text-slate-700'
                    }`}
                  >
                    {useHook ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-500 text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Format Scene Breakdown • Script Score • Siap Baca</span>
              </div>

              <button
                id="btn-generate-script"
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-300" />
                    <span>AI sedang menyusun script...</span>
                  </>
                ) : (
                  <>
                    <Clapperboard className="w-4 h-4 text-emerald-400" />
                    <span>🎬 Buat Script</span>
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
                <Clapperboard className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {result?.platform} • {result?.duration} • {style}
                </p>
                <p className="text-[11px] text-slate-400 truncate max-w-md">
                  &ldquo;{topic}&rdquo;
                </p>
              </div>
            </div>
            <button
              id="btn-quick-edit-script-input"
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
            id="script-loading-state"
            className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 shadow-xs"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 animate-pulse">
              <Clapperboard className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                AI sedang menyusun script...
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                Menyusun narasi, arahan visual per scene, dan optimasi durasi{' '}
                <span className="font-semibold text-slate-700">{duration}</span> untuk{' '}
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
          <div id="script-results-section" className="space-y-6">
            {/* Top Action & Meta Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                  Hasil Naskah Konten
                </span>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  {result.title}
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Video className="w-3.5 h-3.5" /> {result.platform}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" /> {result.duration}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="btn-copy-script"
                  type="button"
                  onClick={handleCopyScript}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Script Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>📋 Copy Script</span>
                    </>
                  )}
                </button>

                <button
                  id="btn-regenerate-script"
                  type="button"
                  onClick={() => handleGenerate(true)}
                  disabled={isLoading}
                  className="px-3.5 py-2 text-xs font-bold bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>🔄 Generate Ulang</span>
                </button>

                <button
                  id="btn-edit-script-input"
                  type="button"
                  onClick={handleEditInput}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>✏️ Edit Input</span>
                </button>
              </div>
            </div>

            {/* SCRIPT SCORE CARD */}
            <div
              id="script-score-card"
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                      SCRIPT SCORE
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                      {result.score}/100
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xl leading-relaxed">
                    {result.scoreReason}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 self-stretch sm:self-auto justify-center">
                <span>Hook • Struktur • Clarity • Engagement • CTA</span>
              </div>
            </div>

            {/* HOOK CARD (IF HOOK ACTIVE) */}
            {result.hook && (
              <div
                id="script-hook-card"
                className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                    HOOK (0:00–0:03)
                  </span>
                  <span className="text-[11px] font-semibold text-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Stop-Scroll Pembuka
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  &ldquo;{result.hook}&rdquo;
                </p>
              </div>
            )}

            {/* OPENING CARD */}
            <div
              id="script-opening-card"
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  OPENING
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                {result.opening}
              </p>
            </div>

            {/* SCENE BREAKDOWN SECTION */}
            {result.scenes && result.scenes.length > 0 && (
              <div id="script-scene-breakdown-section" className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Scene Breakdown ({result.scenes.length} Scene)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Arahan Visual & Audio
                  </span>
                </div>

                <div className="space-y-3">
                  {result.scenes.map((scene) => (
                    <div
                      key={scene.sceneNumber}
                      id={`scene-item-${scene.sceneNumber}`}
                      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-extrabold text-slate-900 tracking-tight">
                          SCENE {scene.sceneNumber}
                        </span>
                        {scene.timeRange && (
                          <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {scene.timeRange}
                          </span>
                        )}
                      </div>

                      {/* Visual instructions */}
                      <div className="flex items-start gap-2.5">
                        <Eye className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm">
                          <span className="font-semibold text-slate-700">Visual: </span>
                          <span className="text-slate-600">{scene.visual}</span>
                        </div>
                      </div>

                      {/* Voice Over */}
                      <div className="flex items-start gap-2.5">
                        <Mic className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-xs sm:text-sm">
                          <span className="font-semibold text-slate-800">Voice Over: </span>
                          <span className="font-medium text-slate-900">
                            &ldquo;{scene.voiceOver}&rdquo;
                          </span>
                        </div>
                      </div>

                      {/* Text Overlay if present */}
                      {scene.textOverlay && (
                        <div className="flex items-start gap-2.5 pt-1">
                          <Type className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-600">Text Overlay: </span>
                            <span className="font-mono text-slate-700 bg-amber-50 text-amber-900 px-2 py-0.5 rounded border border-amber-200">
                              {scene.textOverlay}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BODY / ISI CARD */}
            <div
              id="script-body-card"
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  BODY / ISI LENGKAP
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {result.body}
              </div>
            </div>

            {/* CTA & ENDING GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CTA CARD */}
              <div
                id="script-cta-card"
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2"
              >
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                  CALL TO ACTION (CTA)
                </span>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed">
                  {result.cta}
                </p>
              </div>

              {/* ENDING CARD */}
              <div
                id="script-ending-card"
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-2"
              >
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  ENDING / SIGN-OFF
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {result.ending}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
