import React, { useState } from 'react';
import {
  Sun,
  Contrast,
  Droplet,
  Flame,
  Sparkles,
  RotateCcw,
  Eye,
  Check,
  X,
  Sliders,
  Maximize2,
  Copy,
  Layers,
  Thermometer,
  Palette,
  Focus,
  ChevronDown,
} from 'lucide-react';
import { VideoClip, VideoAdjustment } from './types';
import { DEFAULT_ADJUSTMENTS, AUTO_ENHANCE_ADJUSTMENTS } from './videoUtils';

interface AdjustmentPanelProps {
  selectedClip: VideoClip;
  selectedClipIndex: number;
  totalClips: number;
  isComparingBefore: boolean;
  onToggleCompareBefore: () => void;
  onAdjustmentsChange: (
    clipId: string,
    newAdjustments: VideoAdjustment,
    applyToAll?: boolean
  ) => void;
  onAutoEnhance: (clipId: string, applyToAll?: boolean) => void;
  onResetAdjustments: (clipId: string, resetAllClips?: boolean) => void;
  onClose: () => void;
}

export const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({
  selectedClip,
  selectedClipIndex,
  totalClips,
  isComparingBefore,
  onToggleCompareBefore,
  onAdjustmentsChange,
  onAutoEnhance,
  onResetAdjustments,
  onClose,
}) => {
  const currentAdjustments: VideoAdjustment = {
    ...DEFAULT_ADJUSTMENTS,
    ...(selectedClip.adjustments || {}),
  };

  const [activeTab, setActiveTab] = useState<'all' | 'light' | 'color' | 'detail'>('all');
  const [applyToAll, setApplyToAll] = useState(false);

  // Ubah nilai satu slider
  const handleSliderChange = (key: keyof VideoAdjustment, value: number) => {
    const updated: VideoAdjustment = {
      ...currentAdjustments,
      [key]: value,
    };
    onAdjustmentsChange(selectedClip.id, updated, applyToAll);
  };

  // Reset nilai slider tertentu ke 0
  const handleResetSingle = (key: keyof VideoAdjustment) => {
    handleSliderChange(key, 0);
  };

  const renderSlider = (
    key: keyof VideoAdjustment,
    label: string,
    icon: React.ReactNode,
    min: number = -100,
    max: number = 100,
    hint?: string,
    leftLabel?: string,
    rightLabel?: string
  ) => {
    const val = currentAdjustments[key] || 0;
    const isModified = val !== 0;

    return (
      <div
        key={key}
        className={`p-2.5 sm:p-3 rounded-2xl border transition-all ${
          isModified
            ? 'bg-blue-50/40 border-blue-200/80 shadow-2xs'
            : 'bg-white border-slate-200/80 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl ${
                isModified ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {icon}
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800">{label}</span>
              {hint && <span className="hidden sm:inline text-[10px] text-slate-400 ml-1.5">{hint}</span>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleResetSingle(key)}
              disabled={!isModified}
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg transition-all cursor-pointer ${
                isModified
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-2xs'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
              title={isModified ? 'Klik untuk reset slider ini ke 0' : 'Nilai default'}
            >
              {val > 0 ? `+${val}` : val}
            </button>
          </div>
        </div>

        {/* Range Slider Track */}
        <div className="relative flex items-center py-1">
          <input
            type="range"
            min={min}
            max={max}
            step="1"
            value={val}
            onChange={(e) => handleSliderChange(key, parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-hidden"
          />
        </div>

        {/* Labels Left & Right */}
        {(leftLabel || rightLabel) && (
          <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      id="video-adjustment-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Panel Header & Quick Controls (Sticky) */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-5 py-2.5 border-b border-slate-200 shrink-0 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                Color & Light
              </h3>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0">
                #{selectedClipIndex + 1}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 truncate max-w-[150px] sm:max-w-xs">
              {selectedClip.name}
            </p>
          </div>
        </div>

        {/* Header Right Action Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* ✨ Auto Enhance Button */}
          <button
            id="btn-adjust-auto-enhance"
            type="button"
            onClick={() => onAutoEnhance(selectedClip.id, applyToAll)}
            className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[11px] py-1 px-2.5 rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            title="Tingkatkan kualitas visual video secara otomatis & natural"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Auto Enhance</span>
          </button>

          {/* 👁️ Before / After Toggle */}
          <button
            id="btn-adjust-compare-before"
            type="button"
            onClick={onToggleCompareBefore}
            className={`flex items-center gap-1 font-bold text-[11px] py-1 px-2 rounded-xl border transition-all cursor-pointer ${
              isComparingBefore
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-300'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
            }`}
            title="Bandingkan visual sebelum vs sesudah adjustment"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isComparingBefore ? 'Asli' : 'B/A'}</span>
          </button>

          {/* ↩ Reset Menu */}
          <button
            id="btn-adjust-reset-clip"
            type="button"
            onClick={() => onResetAdjustments(selectedClip.id, false)}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-1 rounded-xl text-[11px] font-semibold cursor-pointer"
            title="Reset adjustment klip ini ke original"
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

        {/* 2. Target Scope & Category Filter Tabs (Sticky Top Bar) */}
        <div className="px-4 sm:px-6 py-2 bg-slate-100/70 border-b border-slate-200 shrink-0 space-y-2">
          {/* Target Scope Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Terapkan Ke:</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setApplyToAll(false)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !applyToAll
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Klip Ini Saja
              </button>

              <button
                type="button"
                onClick={() => {
                  setApplyToAll(true);
                  onAdjustmentsChange(selectedClip.id, currentAdjustments, true);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  applyToAll
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Terapkan pengaturan warna ini ke semua video di timeline"
              >
                <Copy className="w-3 h-3" />
                <span>Semua Klip ({totalClips})</span>
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'light', label: '☀️ Cahaya & Kontras' },
              { id: 'color', label: '🎨 Warna & Tone' },
              { id: 'detail', label: '🔍 Ketajaman' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Sliders Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-3.5 sm:px-6 sm:py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* LIGHT CATEGORY */}
            {(activeTab === 'all' || activeTab === 'light') && (
              <>
                {renderSlider(
                  'brightness',
                  'Brightness (Kecerahan)',
                  <Sun className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Menerangkan atau menggelapkan video',
                  'Gelap (-100)',
                  'Terang (+100)'
                )}
                {renderSlider(
                  'contrast',
                  'Contrast (Kontras)',
                  <Contrast className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Perbedaan area terang & gelap',
                  'Lembut (-100)',
                  'Tajam (+100)'
                )}
                {renderSlider(
                  'exposure',
                  'Exposure (Pencahayaan)',
                  <Sun className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Intensitas cahaya sensor kamera',
                  'Underexposed',
                  'Overexposed'
                )}
                {renderSlider(
                  'highlights',
                  'Highlights (Sorotan Terang)',
                  <Sun className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Koreksi area putih / langit',
                  'Rendam Silau',
                  'Tingkatkan'
                )}
                {renderSlider(
                  'shadows',
                  'Shadows (Bayangan Gelap)',
                  <Contrast className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Membuka detail area bayangan',
                  'Pekat (-100)',
                  'Angkat (+100)'
                )}
              </>
            )}

            {/* COLOR CATEGORY */}
            {(activeTab === 'all' || activeTab === 'color') && (
              <>
                {renderSlider(
                  'saturation',
                  'Saturation (Kejenuhan Warna)',
                  <Droplet className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Intensitas & kepekatan warna',
                  'Monokrom (-100)',
                  'Vivid (+100)'
                )}
                {renderSlider(
                  'temperature',
                  'Temperature (Suhu Warna)',
                  <Thermometer className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Nuansa dingin sejuk vs hangat',
                  'Sejuk (Biru)',
                  'Hangat (Golden)'
                )}
                {renderSlider(
                  'tint',
                  'Tint (Koreksi Hijau/Magenta)',
                  <Palette className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Koreksi warna hijau daun vs magenta',
                  '🌿 Daun Hijau',
                  'Magenta'
                )}
              </>
            )}

            {/* DETAIL CATEGORY */}
            {(activeTab === 'all' || activeTab === 'detail') && (
              <>
                {renderSlider(
                  'sharpness',
                  'Sharpness / Clarity (Ketajaman)',
                  <Focus className="w-3.5 h-3.5" />,
                  -100,
                  100,
                  'Menonjolkan detail tekstur & tepi objek',
                  'Halus',
                  'Detail Tinggi'
                )}
              </>
            )}
          </div>
        </div>

        {/* 4. Sticky Bottom Actions Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onResetAdjustments(selectedClip.id, true)}
            className="text-slate-500 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold"
            title="Kembalikan seluruh klip di proyek ini ke kondisi warna original"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Seluruh Klip</span>
          </button>

          <button
            id="btn-done-adjustment"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
