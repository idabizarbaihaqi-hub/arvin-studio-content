import React, { useState } from 'react';
import {
  Palette,
  Sparkles,
  RotateCcw,
  Eye,
  Check,
  X,
  Copy,
  Layers,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { VideoClip, VideoFilterPreset } from './types';
import { FILTER_PRESET_ITEMS, FilterPresetItem } from './videoUtils';

interface FilterPresetsPanelProps {
  selectedClip: VideoClip;
  selectedClipIndex: number;
  totalClips: number;
  isComparingBefore: boolean;
  onToggleCompareBefore: () => void;
  onSelectFilter: (
    clipId: string,
    preset: FilterPresetItem,
    applyToAll?: boolean
  ) => void;
  onResetFilters: (clipId: string, resetAllClips?: boolean) => void;
  onClose: () => void;
}

export const FilterPresetsPanel: React.FC<FilterPresetsPanelProps> = ({
  selectedClip,
  selectedClipIndex,
  totalClips,
  isComparingBefore,
  onToggleCompareBefore,
  onSelectFilter,
  onResetFilters,
  onClose,
}) => {
  const currentFilter = selectedClip.filter || 'original';
  const [applyToAll, setApplyToAll] = useState(false);

  return (
    <div
      id="video-filters-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Header & Quick Actions (Sticky) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Palette className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Preset Filter
              </h3>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0">
                #{selectedClipIndex + 1}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-xs">
              {selectedClip.name}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 👁️ Before / After Toggle */}
          <button
            id="btn-filter-compare-before"
            type="button"
            onClick={onToggleCompareBefore}
            className={`flex items-center gap-1 font-bold text-[11px] py-1 px-2 rounded-xl border transition-all cursor-pointer ${
              isComparingBefore
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Bandingkan filter aktif dengan video original"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isComparingBefore ? 'Asli' : 'B/A'}</span>
          </button>

          {/* Reset Filter */}
          <button
            type="button"
            onClick={() => onResetFilters(selectedClip.id, false)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-xl text-[11px] font-semibold cursor-pointer"
            title="Kembalikan klip ini ke filter Original"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Close / Collapse Panel */}
          <button
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

        {/* 2. Target Scope Toggle: Apply to this clip vs Apply to all clips (Sticky) */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100/70 border-b border-slate-200 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Terapkan Filter Ke:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setApplyToAll(false)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !applyToAll
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Klip Ini Saja
              </button>

              <button
                type="button"
                onClick={() => setApplyToAll(true)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  applyToAll
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Pilihan filter berikutnya akan diterapkan ke semua video di timeline"
              >
                <Copy className="w-3 h-3" />
                <span>Semua Klip ({totalClips})</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Preset Cards Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:px-6 sm:py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {FILTER_PRESET_ITEMS.map((preset) => {
              const isSelected = currentFilter === preset.id;

              return (
                <button
                  key={preset.id}
                  type="button"
                  id={`btn-filter-preset-${preset.id}`}
                  onClick={() => onSelectFilter(selectedClip.id, preset, applyToAll)}
                  className={`group text-left p-3 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    {/* Visual Swatch Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl bg-gradient-to-br ${preset.previewColor} shadow-2xs flex items-center justify-center text-white text-xs font-bold group-hover:scale-105 transition-transform`}
                      >
                        {preset.id === 'nature' ? '🌿' : isSelected ? '✓' : ''}
                      </div>

                      {preset.badge && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                          {preset.badge}
                        </span>
                      )}

                      {isSelected && (
                        <span className="text-indigo-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </span>
                      )}
                    </div>

                    {/* Preset Name & Description */}
                    <div className="font-black text-slate-900 text-xs sm:text-sm flex items-center gap-1">
                      <span>{preset.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                      {preset.description}
                    </p>
                  </div>

                  {/* Status bar */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className={isSelected ? 'text-indigo-600 font-bold' : 'text-slate-400'}>
                      {isSelected ? 'Sedang Aktif' : 'Pilih Preset'}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Footer Reset All Option (Sticky) */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onResetFilters(selectedClip.id, true)}
            className="text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Kembalikan semua klip di timeline ke preset Original"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Seluruh Filter</span>
          </button>

          <button
            id="btn-done-filters"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
