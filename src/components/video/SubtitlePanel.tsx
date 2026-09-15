import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Plus,
  Trash2,
  Clock,
  Sliders,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Layers,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { SubtitleItem } from './types';
import { formatTime } from './videoUtils';

interface SubtitlePanelProps {
  subtitles: SubtitleItem[];
  selectedSubtitleId: string | null;
  totalDuration: number;
  currentGlobalTime: number;
  onAddSubtitle: (startTime: number, duration: number) => void;
  onUpdateSubtitle: (id: string, updates: Partial<SubtitleItem>) => void;
  onDeleteSubtitle: (id: string) => void;
  onSelectSubtitle: (id: string) => void;
  onClose: () => void;
}

const SUBTITLE_COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Yellow', hex: '#fde047' },
  { name: 'Cyan', hex: '#38bdf8' },
  { name: 'Green', hex: '#4ade80' },
  { name: 'Red', hex: '#f87171' },
];

export const SubtitlePanel: React.FC<SubtitlePanelProps> = ({
  subtitles,
  selectedSubtitleId,
  totalDuration,
  currentGlobalTime,
  onAddSubtitle,
  onUpdateSubtitle,
  onDeleteSubtitle,
  onSelectSubtitle,
  onClose,
}) => {
  const activeSub =
    subtitles.find((s) => s.id === selectedSubtitleId) ||
    (subtitles.length > 0 ? subtitles[0] : null);

  const [activeTab, setActiveTab] = useState<'list' | 'style'>('list');

  const handleAddAtCurrentTime = () => {
    const start = Math.max(0, Math.min(totalDuration - 0.5, currentGlobalTime));
    const duration = Math.min(3, Math.max(1, totalDuration - start));
    onAddSubtitle(start, duration);
  };

  return (
    <div
      id="video-subtitle-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Header (Sticky) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Subtitle & Dialog
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {subtitles.length} Subtitle • Narasi dialog & caption
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-add-subtitle-quick"
            type="button"
            onClick={handleAddAtCurrentTime}
            className="px-2 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
            title="Tambah subtitle pada detik saat ini"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </button>

          <button
            id="btn-close-subtitle-panel"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
            title="Tutup / Sembunyikan Panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Tutup</span>
          </button>
        </div>
      </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-100 px-4 pt-1 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'list'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Daftar Subtitle ({subtitles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('style')}
            className={`px-4 py-2 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
              activeTab === 'style'
                ? 'border-purple-600 text-purple-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Gaya & Posisi Subtitle
          </button>
        </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4">
          {activeTab === 'list' ? (
            <>
              {/* List of Subtitles */}
              {subtitles.length === 0 ? (
                <div
                  onClick={handleAddAtCurrentTime}
                  className="p-8 border-2 border-dashed border-purple-200 bg-purple-50/30 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-purple-50/60 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-bold text-slate-900">
                    Belum Ada Subtitle
                  </h5>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Klik tombol di bawah untuk menambahkan dialog atau keterangan teks pertama.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddAtCurrentTime();
                    }}
                    className="mt-3 px-4 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-xs"
                  >
                    + Tambah Subtitle ({formatTime(currentGlobalTime)})
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {subtitles.map((sub, index) => {
                    const isSelected = activeSub?.id === sub.id;
                    return (
                      <div
                        key={sub.id}
                        id={`subtitle-item-${sub.id}`}
                        onClick={() => onSelectSubtitle(sub.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/70 shadow-xs ring-2 ring-purple-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              #{index + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-purple-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(sub.startTime)} - {formatTime(sub.endTime)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteSubtitle(sub.id);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Subtitle Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Editable Text Area for this subtitle */}
                        <textarea
                          rows={2}
                          value={sub.text}
                          onChange={(e) =>
                            onUpdateSubtitle(sub.id, { text: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                          placeholder="Ketik kalimat dialog/subtitle di sini..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-slate-900 text-xs font-medium outline-none resize-none bg-white"
                        />

                        {/* Timing Adjusters */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                              Mulai: {formatTime(sub.startTime)}
                            </span>
                            <input
                              type="range"
                              min={0}
                              max={Math.max(0, sub.endTime - 0.2)}
                              step={0.1}
                              value={sub.startTime}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                onUpdateSubtitle(sub.id, {
                                  startTime: Number(e.target.value),
                                })
                              }
                              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 font-bold block mb-0.5">
                              Selesai: {formatTime(sub.endTime)}
                            </span>
                            <input
                              type="range"
                              min={sub.startTime + 0.2}
                              max={totalDuration}
                              step={0.1}
                              value={sub.endTime}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) =>
                                onUpdateSubtitle(sub.id, {
                                  endTime: Number(e.target.value),
                                })
                              }
                              className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-purple-600"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* Subtitle Global Styling Tab */
            <div className="space-y-4">
              {/* Position presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-600" />
                  <span>Posisi Subtitle (Default: Bawah Tengah)</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'bottom-center', label: 'Bawah Tengah' },
                    { id: 'bottom-left', label: 'Bawah Kiri' },
                    { id: 'bottom-right', label: 'Bawah Kanan' },
                    { id: 'center', label: 'Tengah Layar' },
                  ].map((pos) => {
                    const isSelected =
                      (activeSub?.positionPreset || 'bottom-center') === pos.id;
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => {
                          if (activeSub) {
                            onUpdateSubtitle(activeSub.id, {
                              positionPreset: pos.id as any,
                            });
                          }
                        }}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer truncate ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Alignment */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Ukuran Teks Subtitle
                    </label>
                    <span className="text-xs font-mono font-bold text-purple-600">
                      {activeSub?.fontSize || 18}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={36}
                    step={1}
                    value={activeSub?.fontSize || 18}
                    onChange={(e) => {
                      if (activeSub) {
                        onUpdateSubtitle(activeSub.id, {
                          fontSize: Number(e.target.value),
                        });
                      }
                    }}
                    className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-purple-600"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    Perataan Teks (Alignment)
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'left', icon: <AlignLeft className="w-3.5 h-3.5" /> },
                      { id: 'center', icon: <AlignCenter className="w-3.5 h-3.5" /> },
                      { id: 'right', icon: <AlignRight className="w-3.5 h-3.5" /> },
                    ].map((al) => (
                      <button
                        key={al.id}
                        type="button"
                        onClick={() => {
                          if (activeSub) {
                            onUpdateSubtitle(activeSub.id, {
                              alignment: al.id as any,
                            });
                          }
                        }}
                        className={`flex-1 py-1 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          (activeSub?.alignment || 'center') === al.id
                            ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {al.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtitle Colors */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Warna Huruf Subtitle
                </label>
                <div className="flex items-center gap-2">
                  {SUBTITLE_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => {
                        if (activeSub) {
                          onUpdateSubtitle(activeSub.id, { color: col.hex });
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        (activeSub?.color || '#ffffff').toLowerCase() === col.hex.toLowerCase()
                          ? 'border-purple-600 bg-purple-50 text-purple-700 ring-2 ring-purple-500/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Style */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Latar Gelap Subtitle (Box Background)
                  </label>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'semi', label: 'Semi Transparan' },
                      { id: 'solid', label: 'Hitam Solid' },
                      { id: 'none', label: 'Tanpa Kotak' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => {
                          if (activeSub) {
                            onUpdateSubtitle(activeSub.id, {
                              background: bg.id as any,
                            });
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          (activeSub?.background || 'semi') === bg.id
                            ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(activeSub?.background || 'semi') === 'semi' && (
                  <div className="pt-2 border-t border-slate-200/60">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Transparansi Kotak</span>
                      <span className="font-mono text-purple-600">
                        {activeSub?.bgOpacity ?? 75}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={20}
                      max={95}
                      step={5}
                      value={activeSub?.bgOpacity ?? 75}
                      onChange={(e) => {
                        if (activeSub) {
                          onUpdateSubtitle(activeSub.id, {
                            bgOpacity: Number(e.target.value),
                          });
                        }
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <span className="text-xs text-slate-500">
            Subtitle tampil otomatis sesuai timing
          </span>
          <button
            id="btn-done-subtitle"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
