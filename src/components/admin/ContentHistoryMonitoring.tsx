import React, { useEffect, useState } from 'react';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Eye,
  X,
  FileText,
  Calendar,
  Copy,
  Check,
} from 'lucide-react';
import { AiHistoryItem } from '../../types';
import { getAdminAiHistory } from '../../services/adminService';

export const ContentHistoryMonitoring: React.FC = () => {
  const [items, setItems] = useState<AiHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [featureFilter, setFeatureFilter] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<AiHistoryItem | null>(null);
  const [copied, setCopied] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAdminAiHistory(search, featureFilter);
      setItems(list);
    } catch (err) {
      console.error('Failed to load content history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [featureFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="admin-content-history-root" className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-slate-900" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content History Monitoring</h1>
          </div>
          <p className="text-sm text-slate-600">
            Arsip seluruh konten dan instruksi prompt yang digenerate oleh kreator di platform ARVIN STUDIO.
          </p>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-slate-900' : 'text-slate-500'}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan judul, topik prompt, hasil, atau User ID..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-slate-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Cari
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Fitur:</span>
          </div>

          <select
            value={featureFilter}
            onChange={(e) => setFeatureFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL">Semua Fitur AI</option>
            <option value="Chat AI">Chat AI</option>
            <option value="Content Analyzer">Content Analyzer</option>
            <option value="Content Ideas">Content Ideas</option>
            <option value="Caption Maker">Caption Maker</option>
            <option value="Hook Generator">Hook Generator</option>
            <option value="Script Maker">Script Maker</option>
            <option value="Hashtag Generator">Hashtag Generator</option>
          </select>

          <span className="text-[11px] text-slate-600 ml-auto">
            Total: <strong className="text-slate-800 font-bold">{items.length}</strong> konten tersimpan
          </span>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fitur AI</th>
                <th className="py-3 px-4">Judul / Prompt Utama</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Cuplikan Output</th>
                <th className="py-3 px-4">Tanggal Dibuat</th>
                <th className="py-3 px-4 text-right">Lihat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    <span>Memuat arsip riwayat konten dari Firestore...</span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Tidak ditemukan konten tersimpan.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold text-[10px] whitespace-nowrap">
                        {item.feature}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs truncate">
                      {item.title || item.inputSummary || '-'}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {item.userId ? `${item.userId.slice(0, 12)}...` : '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate text-[11px]">
                      {item.result}
                    </td>

                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(item.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                        title="Lihat Teks Lengkap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content Preview Modal */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-2xl w-full rounded-2xl border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold">
                  {selectedItem.feature}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {selectedItem.title || 'Arsip Konten AI'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs">
              {selectedItem.inputSummary && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1">
                    INPUT / PROMPT USER
                  </span>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{selectedItem.inputSummary}</p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    HASIL GENERASI AI
                  </span>
                  <button
                    onClick={() => handleCopy(selectedItem.result)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-80 overflow-y-auto font-sans leading-relaxed text-slate-900 whitespace-pre-wrap">
                  {selectedItem.result}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-500">
              <span>Dibuat: {new Date(selectedItem.createdAt).toLocaleString('id-ID')}</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
