import React, { useState } from 'react';
import {
  IdeaPlatform,
  IdeaGoal,
  IdeaStyle,
  IdeaCount,
  ContentIdeaItem,
} from '../types';
import {
  generateContentIdeas,
  regenerateSingleIdea,
} from '../services/aiService';
import {
  ArrowLeft,
  Sparkles,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  AlertCircle,
  Maximize2,
  CheckCircle2,
  X,
  Target,
  Flame,
  Radio,
  Share2,
  Zap,
} from 'lucide-react';

const PLATFORMS: IdeaPlatform[] = [
  'Instagram',
  'TikTok',
  'Facebook',
  'YouTube',
  'X',
  'LinkedIn',
  'Semua Platform',
];

const GOALS: IdeaGoal[] = [
  'Meningkatkan Engagement',
  'Mendapatkan Followers',
  'Meningkatkan Penjualan',
  'Membangun Personal Branding',
  'Edukasi',
  'Entertainment',
  'Promosi Produk',
  'Branding',
];

const STYLES: IdeaStyle[] = [
  'Edukatif',
  'Santai',
  'Profesional',
  'Storytelling',
  'Kontroversial',
  'Inspiratif',
  'Lucu',
  'Persuasif',
];

const COUNTS: IdeaCount[] = [5, 10, 15];

const POPULAR_NICHES = [
  'Digital Marketing',
  'Kuliner & Kafe',
  'Fashion & OOTD',
  'Finansial & Investasi',
  'Pengembangan Diri',
  'Teknologi & AI',
  'Kesehatan & Fitness',
];

const POPULAR_AUDIENCES = [
  'UMKM',
  'Mahasiswa',
  'Content Creator Pemula',
  'Pekerja Kantoran',
  'Ibu Rumah Tangga',
  'Gen Z',
];

interface ContentIdeasProps {
  onBackToChat?: () => void;
}

export const ContentIdeas: React.FC<ContentIdeasProps> = ({ onBackToChat }) => {
  // Form State
  const [niche, setNiche] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState<IdeaPlatform>('Instagram');
  const [goal, setGoal] = useState<IdeaGoal>('Meningkatkan Engagement');
  const [style, setStyle] = useState<IdeaStyle>('Edukatif');
  const [count, setCount] = useState<IdeaCount>(5);

  // Status and Results State
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<ContentIdeaItem[] | null>(null);

  // Active Modals & Card State
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<ContentIdeaItem | null>(null);
  const [useIdeaItem, setUseIdeaItem] = useState<ContentIdeaItem | null>(null);

  // Handle Generate Ideas
  const handleGenerate = async () => {
    const trimmedNiche = niche.trim();
    if (!trimmedNiche) {
      setValidationError('Silakan isi niche atau topik terlebih dahulu.');
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);

    try {
      const generated = await generateContentIdeas({
        niche: trimmedNiche,
        targetAudience: targetAudience.trim() || undefined,
        platform,
        goal,
        style,
        count,
      });

      setIdeas(generated);
    } catch (err: unknown) {
      console.error('Error generating ideas:', err);
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Regenerate Single Idea Card
  const handleRegenerateCard = async (ideaItem: ContentIdeaItem, index: number) => {
    if (regeneratingId || isLoading) return;
    setRegeneratingId(ideaItem.id);

    try {
      const updatedIdea = await regenerateSingleIdea({
        niche: niche.trim() || 'Konten Kreatif',
        targetAudience: targetAudience.trim() || ideaItem.targetAudience,
        platform,
        goal,
        style,
        currentTitle: ideaItem.title,
      });

      setIdeas((prev) => {
        if (!prev) return null;
        const next = [...prev];
        next[index] = {
          ...updatedIdea,
          id: `idea-${Date.now()}-${index + 1}`,
        };
        return next;
      });
    } catch (err) {
      console.error('Failed to regenerate single idea:', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  // Copy full idea text to clipboard
  const handleCopyIdea = (item: ContentIdeaItem) => {
    const formatted = `💡 ${item.title.toUpperCase()}
Format: ${item.format}
Platform: ${platform}
Target: ${item.targetAudience}

🎯 Hook:
"${item.hook}"

📝 Konsep:
${item.concept}

📢 Call To Action (CTA):
"${item.cta}"

📈 Potensi:
${item.potential}
${item.executionTips ? `\n✨ Tips Eksekusi:\n${item.executionTips}` : ''}

Dibuat dengan ARVIN STUDIO AI Content Strategist`;

    navigator.clipboard.writeText(formatted);
    setCopiedId(item.id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === item.id ? null : curr));
    }, 2000);
  };

  return (
    <div
      id="content-ideas-container"
      className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8FAFC] flex flex-col w-full"
    >
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col gap-5">
        {/* Top Header Card */}
        <div
          id="content-ideas-header"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            {onBackToChat && (
              <button
                id="btn-back-to-chat"
                type="button"
                onClick={onBackToChat}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                title="Kembali ke Chat Utama"
                aria-label="Kembali ke Chat Utama"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl select-none">💡</span>
                <h1 className="text-base sm:text-lg font-bold text-slate-900">
                  Content Ideas
                </h1>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                  AI Creator Tools
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Temukan ide konten yang relevan dan menarik dengan bantuan AI.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Gemini AI Connected
            </span>
          </div>
        </div>

        {/* If ideas exist and not loading, show Results view; otherwise show Form input */}
        {ideas && !isLoading ? (
          <div id="ideas-results-view" className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Summary Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm text-slate-600">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  {ideas.length} Ide Dihasilkan
                </span>
                <span className="text-slate-300">•</span>
                <span>Niche: <strong className="text-slate-800">{niche}</strong></span>
                <span className="text-slate-300">•</span>
                <span>Platform: <strong className="text-slate-800">{platform}</strong></span>
                {targetAudience && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>Audiens: <strong className="text-slate-800">{targetAudience}</strong></span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-edit-input-top"
                  type="button"
                  onClick={() => setIdeas(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  Edit Input
                </button>

                <button
                  id="btn-generate-again-top"
                  type="button"
                  onClick={handleGenerate}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                  Generate Ulang Semua
                </button>
              </div>
            </div>

            {/* Ideas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ideas.map((item, index) => {
                const isItemRegenerating = regeneratingId === item.id;
                const isItemCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    id={`idea-card-${index + 1}`}
                    className={`bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-4 sm:p-5 relative ${
                      isItemRegenerating ? 'opacity-70 pointer-events-none' : ''
                    }`}
                  >
                    {/* Top Card Badge & Format */}
                    <div>
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white tracking-wider">
                            IDE #{index + 1}
                          </span>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            {item.format}
                          </span>
                        </div>

                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {item.potential}
                        </span>
                      </div>

                      {/* Idea Title */}
                      <h3 className="text-base font-bold text-slate-900 mt-3 leading-snug">
                        {item.title}
                      </h3>

                      {/* Hook Quote Box */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          Hook 3 Detik:
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800 italic">
                          "{item.hook}"
                        </p>
                      </div>

                      {/* Concept */}
                      <div className="mt-3">
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {item.concept}
                        </p>
                      </div>

                      {/* Target & CTA Pills */}
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-start gap-1.5">
                          <Target className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-700">Target:</strong> {item.targetAudience}
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span>
                            <strong className="text-slate-700">CTA:</strong> "{item.cta}"
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Actions (Copy, Gunakan Ide, Generate Ulang, Detail) */}
                    <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {/* 1. Copy Button */}
                      <button
                        id={`btn-copy-idea-${index + 1}`}
                        type="button"
                        onClick={() => handleCopyIdea(item)}
                        className={`w-full py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                          isItemCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Salin seluruh ide ke clipboard"
                      >
                        {isItemCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* 2. Gunakan Ide */}
                      <button
                        id={`btn-use-idea-${index + 1}`}
                        type="button"
                        onClick={() => setUseIdeaItem(item)}
                        className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center gap-1 transition-colors"
                        title="Gunakan ide ini untuk diproduksi"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Gunakan</span>
                      </button>

                      {/* 3. Generate Ulang Card */}
                      <button
                        id={`btn-regen-idea-${index + 1}`}
                        type="button"
                        disabled={isItemRegenerating}
                        onClick={() => handleRegenerateCard(item, index)}
                        className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                        title="Minta AI buatkan ide alternatif untuk card ini"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 text-slate-500 ${
                            isItemRegenerating ? 'animate-spin text-amber-500' : ''
                          }`}
                        />
                        <span>{isItemRegenerating ? 'Menulis...' : 'Regen'}</span>
                      </button>

                      {/* 4. Detail */}
                      <button
                        id={`btn-detail-idea-${index + 1}`}
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="w-full py-1.5 px-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center justify-center gap-1 transition-colors"
                        title="Lihat detail lengkap ide ini"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div
              id="ideas-bottom-bar"
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 mt-2"
            >
              <div className="text-xs sm:text-sm text-slate-500">
                Puas dengan ide yang dihasilkan atau ingin mengeksplorasi sudut pandang lain?
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  id="btn-edit-input-bottom"
                  type="button"
                  onClick={() => setIdeas(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                  ✏️ Edit Input
                </button>

                <button
                  id="btn-generate-again-bottom"
                  type="button"
                  onClick={handleGenerate}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-900 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 flex items-center justify-center gap-2 shadow-md shadow-slate-900/10 transition-colors"
                >
                  <RefreshCw className="w-4 h-4 text-amber-400" />
                  🔄 Generate Ideas Again
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Form Input View */
          <div
            id="content-ideas-form"
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-6 flex flex-col gap-5"
          >
            {/* Validation Error Banner */}
            {validationError && (
              <div
                id="ideas-validation-error"
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150"
              >
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* API Error Banner */}
            {apiError && (
              <div
                id="ideas-api-error"
                className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in duration-150"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{apiError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 shrink-0 transition-colors"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Loading Indicator when generating */}
            {isLoading ? (
              <div
                id="ideas-loading-state"
                className="py-12 px-4 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-200"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
                    <Sparkles className="w-7 h-7 text-amber-400 animate-spin" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    ARVIN AI Sedang Menyusun Ide Konten...
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                    Menganalisis tren, formulasi hook, dan strategi terbaik untuk niche{' '}
                    <strong>{niche || 'pilihanmu'}</strong> di {platform}.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping" />
                  Memproses {count} ide konten berkualitas tinggi
                </div>
              </div>
            ) : (
              <>
                {/* A. Niche / Topik */}
                <div id="field-niche" className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="input-niche"
                      className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">
                        A
                      </span>
                      Niche / Topik Konten <span className="text-red-500">*</span>
                    </label>
                  </div>

                  <input
                    id="input-niche"
                    type="text"
                    value={niche}
                    onChange={(e) => {
                      setNiche(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="Contoh: Digital marketing, fashion, kuliner, teknologi..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                  />

                  {/* Quick Niche Suggestion Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[11px] font-medium text-slate-400">Pilihan Cepat:</span>
                    {POPULAR_NICHES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setNiche(item);
                          if (validationError) setValidationError(null);
                        }}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors ${
                          niche === item
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* B. Target Audiens */}
                <div id="field-target-audience" className="flex flex-col gap-2">
                  <label
                    htmlFor="input-target-audience"
                    className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                      B
                    </span>
                    Target Audiens <span className="text-xs font-normal text-slate-400">(Opsional)</span>
                  </label>

                  <input
                    id="input-target-audience"
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Contoh: UMKM, mahasiswa, content creator pemula..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                  />

                  {/* Quick Target Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    <span className="text-[11px] font-medium text-slate-400">Pilihan Cepat:</span>
                    {POPULAR_AUDIENCES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setTargetAudience(item)}
                        className={`text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors ${
                          targetAudience === item
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* C. Platform Selection */}
                <div id="field-platform" className="flex flex-col gap-2">
                  <label
                    htmlFor="select-platform"
                    className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                      C
                    </span>
                    Platform
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        id={`btn-platform-${p.toLowerCase().replace(/\s+/g, '-')}`}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                          platform === p
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* D. Tujuan Konten */}
                <div id="field-goal" className="flex flex-col gap-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                      D
                    </span>
                    Tujuan Konten
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {GOALS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGoal(g)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center gap-2 ${
                          goal === g
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Radio
                          className={`w-3.5 h-3.5 shrink-0 ${
                            goal === g ? 'text-amber-400' : 'text-slate-300'
                          }`}
                        />
                        <span className="truncate">{g}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* E. Gaya Konten */}
                <div id="field-style" className="flex flex-col gap-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                      E
                    </span>
                    Gaya Konten
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {STYLES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStyle(s)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-center ${
                          style === s
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* F. Jumlah Ide */}
                <div id="field-count" className="flex flex-col gap-2">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                      F
                    </span>
                    Jumlah Ide
                  </label>

                  <div className="flex items-center gap-2 max-w-xs">
                    {COUNTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setCount(c)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                          count === c
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {c} Ide
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tombol Utama: ✨ Generate Ideas */}
                <div className="pt-3 border-t border-slate-100">
                  <button
                    id="btn-generate-ideas"
                    type="button"
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 text-white text-sm sm:text-base font-bold flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-md shadow-slate-900/10 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>✨ Generate Ideas</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal: Detail Lengkap Ide */}
      {detailItem && (
        <div
          id="idea-detail-modal"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setDetailItem(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 sm:p-6 text-slate-900 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <h3 className="font-bold text-base text-slate-900">Detail Lengkap Ide</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                aria-label="Tutup modal"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Judul Konten
                </span>
                <h4 className="text-base font-bold text-slate-900">{detailItem.title}</h4>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  🎯 Hook 3 Detik Pertama
                </span>
                <p className="font-semibold text-slate-800 italic">"{detailItem.hook}"</p>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  📝 Konsep Konten
                </span>
                <p className="text-slate-700 leading-relaxed">{detailItem.concept}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Format</span>
                  <span className="font-semibold text-slate-800">{detailItem.format}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Target</span>
                  <span className="font-semibold text-slate-800">{detailItem.targetAudience}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">CTA</span>
                  <span className="font-semibold text-slate-800">"{detailItem.cta}"</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Potensi</span>
                  <span className="font-semibold text-amber-600">{detailItem.potential}</span>
                </div>
              </div>

              {detailItem.executionTips && (
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                    ✨ Tips Eksekusi Creator
                  </span>
                  <p className="text-amber-900 leading-relaxed text-xs">{detailItem.executionTips}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopyIdea(detailItem);
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Detail Ide</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gunakan Ide (Non-dummy explanation & direct copy / drafting action) */}
      {useIdeaItem && (
        <div
          id="use-idea-modal"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setUseIdeaItem(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-5 text-slate-900 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">
                    Ide Siap Digunakan!
                  </h3>
                  <p className="text-xs text-slate-500">Langkah selanjutnya untuk eksekusi konten</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUseIdeaItem(null)}
                aria-label="Tutup modal"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">{useIdeaItem.title}</span>
                <p className="text-slate-600 text-xs">{useIdeaItem.concept}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Salin konsep ke catatan atau aplikasi editing video
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Gunakan hook <strong>"{useIdeaItem.hook}"</strong> di 3 detik awal
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Pastikan CTA <strong>"{useIdeaItem.cta}"</strong> terpasang di akhir
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  handleCopyIdea(useIdeaItem);
                  setUseIdeaItem(null);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Salin & Mulai Eksekusi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
