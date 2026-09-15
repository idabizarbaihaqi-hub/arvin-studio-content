import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  Sliders,
  Clock,
  Trash2,
  Check,
  X,
  Zap,
  Activity,
  ZoomIn,
  ZoomOut,
  Film,
  Aperture,
  Ban,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { VideoClip, VideoEffectItem, EffectType } from './types';
import { EFFECT_CATALOG_ITEMS, EffectCatalogItem, formatTime } from './videoUtils';

interface EffectsPanelProps {
  clip: VideoClip;
  currentLocalTime: number;
  onApplyEffect: (clipId: string, effect: VideoEffectItem) => void;
  onUpdateEffect: (clipId: string, effectId: string, updates: Partial<VideoEffectItem>) => void;
  onRemoveEffect: (clipId: string, effectId: string) => void;
  onResetEffects: (clipId: string) => void;
  onClose: () => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  clip,
  onApplyEffect,
  onUpdateEffect,
  onRemoveEffect,
  onResetEffects,
  onClose,
}) => {
  const activeEffects = (clip.effects || []).filter((e) => e.type !== 'none');
  const [selectedEffectId, setSelectedEffectId] = useState<string | null>(
    activeEffects.length > 0 ? activeEffects[0].id : null
  );
  const [isStackingMode, setIsStackingMode] = useState(false);

  // Active effect currently being tuned
  const currentEffect =
    activeEffects.find((e) => e.id === selectedEffectId) || activeEffects[0] || null;

  // Active effect type (or 'none' if empty)
  const currentType: EffectType = currentEffect ? currentEffect.type : 'none';

  // Handler saat user memilih sebuah efek dari katalog
  const handleSelectEffectType = (type: EffectType) => {
    if (type === 'none') {
      onResetEffects(clip.id);
      setSelectedEffectId(null);
      setIsStackingMode(false);
      return;
    }

    // Jika sedang dalam mode menumpuk efek baru (+ Efek Tambahan)
    if (isStackingMode) {
      const catalogItem = EFFECT_CATALOG_ITEMS.find((c) => c.id === type);
      const newId = `eff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newEffect: VideoEffectItem = {
        id: newId,
        type,
        intensity: catalogItem?.defaultIntensity ?? 50,
        startTime: 0,
        endTime: clip.duration,
      };
      onApplyEffect(clip.id, newEffect);
      setSelectedEffectId(newId);
      setIsStackingMode(false);
      return;
    }

    // Jika sudah ada efek yang aktif, perbarui tipe dan reset intensitas ke default
    if (currentEffect) {
      const catalogItem = EFFECT_CATALOG_ITEMS.find((c) => c.id === type);
      onUpdateEffect(clip.id, currentEffect.id, {
        type,
        intensity: catalogItem?.defaultIntensity ?? 50,
      });
    } else {
      // Buat efek baru langsung untuk klip
      const catalogItem = EFFECT_CATALOG_ITEMS.find((c) => c.id === type);
      const newId = `eff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newEffect: VideoEffectItem = {
        id: newId,
        type,
        intensity: catalogItem?.defaultIntensity ?? 50,
        startTime: 0,
        endTime: clip.duration,
      };
      onApplyEffect(clip.id, newEffect);
      setSelectedEffectId(newId);
    }
  };

  const getEffectIcon = (type: EffectType) => {
    switch (type) {
      case 'none':
        return <Ban className="w-4 h-4 text-slate-400" />;
      case 'zoom-in':
        return <ZoomIn className="w-4 h-4 text-blue-600" />;
      case 'zoom-out':
        return <ZoomOut className="w-4 h-4 text-indigo-600" />;
      case 'slow-zoom':
        return <Film className="w-4 h-4 text-cyan-600" />;
      case 'ken-burns':
        return <Film className="w-4 h-4 text-emerald-600" />;
      case 'shake':
        return <Activity className="w-4 h-4 text-amber-600" />;
      case 'pulse':
        return <Activity className="w-4 h-4 text-purple-600" />;
      case 'flash':
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'blur':
        return <Aperture className="w-4 h-4 text-rose-500" />;
      case 'fade-in':
      case 'fade-out':
        return <Sliders className="w-4 h-4 text-slate-700" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  const getEffectCatalogMeta = (type: EffectType): EffectCatalogItem | undefined => {
    return EFFECT_CATALOG_ITEMS.find((c) => c.id === type);
  };

  return (
    <div
      id="video-effects-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Sticky Header */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-slate-100 shrink-0 bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
              <span>Efek Video</span>
              {activeEffects.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 text-[10px] font-black shrink-0">
                  {activeEffects.length} Aktif
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] sm:max-w-xs">
              {clip.name} ({formatTime(clip.duration)})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {activeEffects.length > 0 && (
            <button
              id="btn-reset-all-effects"
              type="button"
              onClick={() => {
                onResetEffects(clip.id);
                setSelectedEffectId(null);
                setIsStackingMode(false);
              }}
              className="px-2 py-1 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Hapus seluruh efek pada klip ini dan kembali normal"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Reset Efek</span>
            </button>
          )}

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

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4">
          {/* Active Effects Pill Tabs (Jika memiliki lebih dari 1 efek) */}
          {activeEffects.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Efek Aktif:
              </span>
              {activeEffects.map((eff, idx) => {
                const meta = getEffectCatalogMeta(eff.type);
                const isSelected = currentEffect?.id === eff.id;
                return (
                  <button
                    key={eff.id}
                    type="button"
                    onClick={() => {
                      setSelectedEffectId(eff.id);
                      setIsStackingMode(false);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>#{idx + 1}</span>
                    <span>{meta?.name || eff.type}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveEffect(clip.id, eff.id);
                      }}
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-black/20 ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                      }`}
                      title="Hapus efek ini"
                    >
                      ×
                    </button>
                  </button>
                );
              })}
            </div>
          )}

          {/* Catalog Grid of Effects */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <span>Pilih Efek Visual Klip</span>
                {currentEffect && (
                  <span className="text-purple-600 lowercase font-normal">
                    (klik untuk mengganti)
                  </span>
                )}
              </label>
              {activeEffects.length > 0 && !isStackingMode && (
                <button
                  type="button"
                  onClick={() => setIsStackingMode(true)}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                  <span>+ Tumpuk Efek Lain</span>
                </button>
              )}
              {isStackingMode && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                  Pilih efek ke-{activeEffects.length + 1}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EFFECT_CATALOG_ITEMS.map((cat) => {
                const isSelected = !isStackingMode && currentType === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`btn-select-effect-${cat.id}`}
                    onClick={() => handleSelectEffectType(cat.id)}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative group ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/90 shadow-xs ring-2 ring-purple-600/30'
                        : 'border-slate-200 hover:border-purple-200 bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-purple-100 group-hover:text-purple-700'
                        }`}
                      >
                        {getEffectIcon(cat.id)}
                      </div>

                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      ) : cat.badge ? (
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                          {cat.badge}
                        </span>
                      ) : null}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 leading-tight">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                        {cat.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Effect Adjustment Controls (Intensity & Timing) */}
          {currentEffect && currentEffect.type !== 'none' && (
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    {getEffectIcon(currentEffect.type)}
                  </div>
                  <div>
                    <span className="text-xs font-black text-purple-950 block">
                      Pengaturan: {getEffectCatalogMeta(currentEffect.type)?.name || currentEffect.type}
                    </span>
                    <p className="text-[10px] text-purple-700 font-medium">
                      {getEffectCatalogMeta(currentEffect.type)?.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onRemoveEffect(clip.id, currentEffect.id);
                    setSelectedEffectId(null);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Hapus efek ini dan kembali ke normal"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus</span>
                </button>
              </div>

              {/* 1. Intensity Slider (0 to 100) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-600" />
                    <span>Intensitas Efek (Intensity)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      {currentEffect.intensity}%
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateEffect(clip.id, currentEffect.id, {
                          intensity:
                            getEffectCatalogMeta(currentEffect.type)?.defaultIntensity ?? 50,
                        })
                      }
                      className="text-[10px] text-purple-600 hover:text-purple-800 underline font-medium cursor-pointer"
                    >
                      Reset Nilai
                    </button>
                  </div>
                </div>

                <input
                  id="slider-effect-intensity"
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={currentEffect.intensity}
                  onChange={(e) =>
                    onUpdateEffect(clip.id, currentEffect.id, {
                      intensity: Number(e.target.value),
                    })
                  }
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>10% (Ringan)</span>
                  <span>50% (Sedang)</span>
                  <span>100% (Kuat)</span>
                </div>
              </div>

              {/* 2. Timing / Duration Range Controls */}
              <div className="pt-2 border-t border-purple-100/80">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    <span>Rentang Waktu Efek pada Klip</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {formatTime(currentEffect.startTime || 0)} -{' '}
                    {formatTime(currentEffect.endTime || clip.duration)}
                  </span>
                </div>

                {/* Quick Presets for Timing */}
                <div className="grid grid-cols-3 gap-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateEffect(clip.id, currentEffect.id, {
                        startTime: 0,
                        endTime: clip.duration,
                      })
                    }
                    className={`py-1 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currentEffect.startTime === 0 &&
                      currentEffect.endTime >= clip.duration - 0.05
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Seluruh Klip
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateEffect(clip.id, currentEffect.id, {
                        startTime: 0,
                        endTime: Math.min(clip.duration, 1.5),
                      })
                    }
                    className={`py-1 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currentEffect.startTime === 0 &&
                      Math.abs(currentEffect.endTime - Math.min(clip.duration, 1.5)) < 0.1
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Awal Klip (1.5s)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateEffect(clip.id, currentEffect.id, {
                        startTime: Math.max(0, clip.duration - 1.5),
                        endTime: clip.duration,
                      })
                    }
                    className={`py-1 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      currentEffect.endTime === clip.duration &&
                      Math.abs(currentEffect.startTime - Math.max(0, clip.duration - 1.5)) < 0.1
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Akhir Klip (1.5s)
                  </button>
                </div>

                {/* Sliders for fine-tuning Start and End */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">
                      Mulai: {formatTime(currentEffect.startTime || 0)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, (currentEffect.endTime || clip.duration) - 0.2)}
                      step={0.1}
                      value={currentEffect.startTime || 0}
                      onChange={(e) =>
                        onUpdateEffect(clip.id, currentEffect.id, {
                          startTime: Number(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">
                      Selesai: {formatTime(currentEffect.endTime || clip.duration)}
                    </span>
                    <input
                      type="range"
                      min={Math.min(clip.duration, (currentEffect.startTime || 0) + 0.2)}
                      max={clip.duration}
                      step={0.1}
                      value={currentEffect.endTime || clip.duration}
                      onChange={(e) =>
                        onUpdateEffect(clip.id, currentEffect.id, {
                          endTime: Number(e.target.value),
                        })
                      }
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Sticky Bottom Action Buttons Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <div className="text-[11px] text-slate-500">
            {activeEffects.length > 0 ? (
              <span>
                Efek aktif:{' '}
                <strong className="text-purple-700">
                  {activeEffects.map((e) => getEffectCatalogMeta(e.type)?.name || e.type).join(', ')}
                </strong>
              </span>
            ) : (
              <span>Tanpa efek visual (Normal)</span>
            )}
          </div>
          <button
            id="btn-done-effects"
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
