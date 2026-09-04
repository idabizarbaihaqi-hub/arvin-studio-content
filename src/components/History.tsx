import React, { useState, useEffect, useMemo } from 'react';
import { AiHistoryItem, AiHistoryCategory } from '../types';
import { fetchAiHistory, deleteAiHistory } from '../services/storageService';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Copy,
  Check,
  Trash2,
  Eye,
  X,
  Sparkles,
  Clock,
  AlertCircle,
  FileText,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface HistoryProps {
  onBackToChat?: () => void;
  onNavigateToTool?: (toolId: string) => void;
}

const CATEGORIES: AiHistoryCategory[] = [
  'Semua',
  'Content Analyzer',
  'Content Ideas',
  'Caption Maker',
  'Hook Generator',
  'Script Maker',
  'Hashtag Generator',
];

export const History: React.FC<HistoryProps> = ({
  onBackToChat,
  onNavigateToTool,
}) => {
  const [historyItems, setHistoryItems] = useState<AiHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<AiHistoryCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & States
  const [detailItem, setDetailItem] = useState<AiHistoryItem | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load History
  const loadHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAiHistory(
        selectedCategory === 'Semua' ? undefined : selectedCategory,
        searchQuery.trim() || undefined
      );
      setHistoryItems(data);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Gagal memuat riwayat AI.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [selectedCategory]);

  // Handle Copy to Clipboard
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Handle Delete Item
  const handleDelete = async (id: string) => {
    try {
      await deleteAiHistory(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      if (detailItem?.id === id) {
        setDetailItem(null);
      }
      setDeletingItemId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menghapus riwayat.');
    }
  };

  // Filtered in-memory search for fast responsive typing
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return historyItems;
    const q = searchQuery.toLowerCase().trim();
    return historyItems.filter((item) => {
      const title = (item.title || '').toLowerCase();
      const feature = (item.feature || '').toLowerCase();
      const input = (item.inputSummary || '').toLowerCase();
      const result = (item.result || '').toLowerCase();
      return (
        title.includes(q) ||
        feature.includes(q) ||
        input.includes(q) ||
        result.includes(q)
      );
    });
  }, [historyItems, searchQuery]);

  // Feature icon & badge helper
  const getFeatureStyle = (feature: string) => {
    switch (feature) {
      case 'Content Analyzer':
        return {
          icon: '📊',
          badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'Content Ideas':
        return {
          icon: '💡',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'Caption Maker':
        return {
          icon: '✍️',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'Hook Generator':
        return {
          icon: '🔥',
          badge: 'bg-orange-50 text-orange-700 border-orange-200',
        };
      case 'Script Maker':
        return {
          icon: '🎬',
          badge: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      case 'Hashtag Generator':
        return {
          icon: '#️⃣',
          badge: 'bg-pink-50 text-pink-700 border-pink-200',
        };
      default:
        return {
          icon: '🤖',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  // Formatted date
  const formatDate = (iso: string) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Top Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <HistoryIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Riwayat AI (History)
              </h1>
              <p className="text-xs text-slate-500">
                Arsip hasil komputasi dan penulisan konten yang telah dibuat
              </p>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl w-fit">
            {filteredItems.length} Riwayat Tersimpan
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col gap-5">
        {/* Error message */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
            <button
              type="button"
              onClick={loadHistory}
              className="ml-auto underline font-medium text-xs hover:text-rose-900"
            >
              Coba lagi
            </button>
          </div>
        )}

        {/* Search & Category Filter Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
          {/* Search Box */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari berdasarkan judul, fitur, atau ringkasan input..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Filter Categories Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* List of History Items */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse flex flex-col gap-3"
              >
                <div className="h-4 bg-slate-200 rounded-md w-1/3" />
                <div className="h-3 bg-slate-100 rounded-md w-3/4" />
                <div className="h-3 bg-slate-100 rounded-md w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          /* Empty State */
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
              <HistoryIcon className="w-6 h-6" />
            </div>
            <div className="max-w-md">
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                {searchQuery || selectedCategory !== 'Semua'
                  ? 'Tidak ada riwayat yang sesuai filter'
                  : 'Belum ada riwayat AI.'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {searchQuery || selectedCategory !== 'Semua'
                  ? 'Coba ganti kata kunci pencarian atau pilih kategori Semua.'
                  : 'Gunakan salah satu AI Creator Tools untuk mulai membuat konten dan riwayatmu akan tersimpan otomatis di sini.'}
              </p>
            </div>
            {onBackToChat && (
              <button
                type="button"
                onClick={onBackToChat}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Mulai Buat Konten</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const featStyle = getFeatureStyle(item.feature);
              const isCopied = copiedId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col gap-3 group"
                >
                  {/* Card Header: Feature badge, Title, and Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border flex items-center gap-1.5 shrink-0 ${featStyle.badge}`}
                      >
                        <span>{featStyle.icon}</span>
                        <span>{item.feature}</span>
                      </span>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400 text-xs shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Input Summary Pill (if available) */}
                  {item.inputSummary && (
                    <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl text-xs text-slate-600 line-clamp-1 font-medium">
                      <span className="text-slate-400">Input:</span> {item.inputSummary}
                    </div>
                  )}

                  {/* Result Preview snippet */}
                  <div
                    onClick={() => setDetailItem(item)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/70 border border-slate-100 rounded-xl text-xs text-slate-700 font-sans cursor-pointer transition-colors leading-relaxed"
                  >
                    <p className="line-clamp-3 whitespace-pre-wrap">
                      {item.result}
                    </p>
                    <span className="text-[11px] text-indigo-600 font-bold mt-1.5 inline-block hover:underline">
                      Baca Hasil Lengkap &rarr;
                    </span>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <button
                      type="button"
                      onClick={() => setDetailItem(item)}
                      className="text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail Lengkap</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Copy Result */}
                      <button
                        type="button"
                        onClick={() => handleCopy(item.result, item.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                          isCopied
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeletingItemId(item.id)}
                        title="Hapus riwayat ini"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================= */}
      {/* MODAL: DETAIL RESULT */}
      {/* ================================================= */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 shrink-0 ${
                    getFeatureStyle(detailItem.feature).badge
                  }`}
                >
                  <span>{getFeatureStyle(detailItem.feature).icon}</span>
                  <span>{detailItem.feature}</span>
                </span>
                <span className="text-xs text-slate-400 shrink-0">
                  {formatDate(detailItem.createdAt)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                  {detailItem.title}
                </h2>
                {detailItem.inputSummary && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-700">
                    <span className="font-bold text-slate-500 block mb-0.5">
                      Input / Topik:
                    </span>
                    <p className="leading-relaxed">{detailItem.inputSummary}</p>
                  </div>
                )}
              </div>

              {/* Full Result Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    Hasil Generasi AI
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(detailItem.result, detailItem.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    {copiedId === detailItem.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Semua</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed select-text">
                  {detailItem.result}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeletingItemId(detailItem.id)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(detailItem.result, detailItem.id)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  {copiedId === detailItem.id ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Berhasil Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Hasil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* CONFIRMATION DIALOG: DELETE */}
      {/* ================================================= */}
      {deletingItemId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm shadow-2xl p-5 text-center flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Hapus Riwayat?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Apakah kamu yakin ingin menghapus riwayat AI ini? Tindakan ini
                tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full pt-2">
              <button
                type="button"
                onClick={() => setDeletingItemId(null)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingItemId)}
                className="flex-1 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
