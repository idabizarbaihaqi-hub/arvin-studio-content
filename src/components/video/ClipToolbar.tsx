import React, { useState } from 'react';
import {
  Scissors,
  SplitSquareVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Undo2,
  Redo2,
  Info,
  Clock,
  HardDrive,
  Maximize,
  Sliders,
  Check,
  X,
  RefreshCw,
  Palette,
  Sparkles,
  Eye,
  Film,
  Wand2,
  Type,
  Image as ImageIcon,
  Music,
  MessageSquare,
} from 'lucide-react';
import { VideoClip, VideoAdjustment, VideoEffectItem, ClipTransition } from './types';
import {
  formatTime,
  formatFileSize,
  hasActiveAdjustments,
  hasActiveEffects,
  FilterPresetItem,
} from './videoUtils';
import { AdjustmentPanel } from './AdjustmentPanel';
import { FilterPresetsPanel } from './FilterPresetsPanel';
import { EffectsPanel } from './EffectsPanel';

interface ClipToolbarProps {
  selectedClip: VideoClip | null;
  selectedClipIndex: number;
  totalClips: number;
  currentLocalTime: number; // Current playhead time inside the selected clip
  canUndo: boolean;
  canRedo: boolean;
  isComparingBefore: boolean;
  onToggleCompareBefore: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTrimChange: (clipId: string, start: number, end: number) => void;
  onSplitClip: (clipId: string, splitLocalTime: number) => void;
  onDeleteClip: (clipId: string) => void;
  onMoveLeft: (clipId: string) => void;
  onMoveRight: (clipId: string) => void;
  onAdjustmentsChange: (
    clipId: string,
    adjustments: VideoAdjustment,
    applyToAll?: boolean
  ) => void;
  onAutoEnhance: (clipId: string, applyToAll?: boolean) => void;
  onSelectFilter: (
    clipId: string,
    preset: FilterPresetItem,
    applyToAll?: boolean
  ) => void;
  onResetAdjustments: (clipId: string, resetAllClips?: boolean) => void;
  onResetFilters: (clipId: string, resetAllClips?: boolean) => void;
  onApplyEffect: (clipId: string, effect: VideoEffectItem) => void;
  onUpdateEffect: (clipId: string, effectId: string, updates: Partial<VideoEffectItem>) => void;
  onRemoveEffect: (clipId: string, effectId: string) => void;
  onResetEffects: (clipId: string) => void;
  onOpenTransitionModal?: (junctionIndex: number) => void;
  onOpenTextPanel?: () => void;
  onOpenImagePanel?: () => void;
  onOpenAudioPanel?: () => void;
  onOpenSubtitlePanel?: () => void;
  textCount?: number;
  imageCount?: number;
  hasAudio?: boolean;
  subtitleCount?: number;
  activePanel?: 'none' | 'trim' | 'adjust' | 'filters' | 'effects' | 'info';
  onActivePanelChange?: (panel: 'none' | 'trim' | 'adjust' | 'filters' | 'effects' | 'info') => void;
  activeOverlayModal?: 'none' | 'text' | 'image' | 'audio' | 'subtitle';
  isTransitionActive?: boolean;
}

export const ClipToolbar: React.FC<ClipToolbarProps> = ({
  selectedClip,
  selectedClipIndex,
  totalClips,
  currentLocalTime,
  canUndo,
  canRedo,
  isComparingBefore,
  onToggleCompareBefore,
  onUndo,
  onRedo,
  onTrimChange,
  onSplitClip,
  onDeleteClip,
  onMoveLeft,
  onMoveRight,
  onAdjustmentsChange,
  onAutoEnhance,
  onSelectFilter,
  onResetAdjustments,
  onResetFilters,
  onApplyEffect,
  onUpdateEffect,
  onRemoveEffect,
  onResetEffects,
  onOpenTransitionModal,
  onOpenTextPanel,
  onOpenImagePanel,
  onOpenAudioPanel,
  onOpenSubtitlePanel,
  textCount = 0,
  imageCount = 0,
  hasAudio = false,
  subtitleCount = 0,
  activePanel: controlledActivePanel,
  onActivePanelChange,
  activeOverlayModal = 'none',
  isTransitionActive = false,
}) => {
  const [internalActivePanel, setInternalActivePanel] = useState<
    'none' | 'trim' | 'adjust' | 'filters' | 'effects' | 'info'
  >('none');

  const activePanel = controlledActivePanel !== undefined ? controlledActivePanel : internalActivePanel;
  const setActivePanel = (panel: 'none' | 'trim' | 'adjust' | 'filters' | 'effects' | 'info') => {
    if (onActivePanelChange) {
      onActivePanelChange(panel);
    } else {
      setInternalActivePanel(panel);
    }
  };

  if (!selectedClip) {
    return (
      <div
        id="video-clip-toolbar-empty"
        className="shrink-0 bg-slate-50 border-t border-slate-200 px-3 sm:px-6 py-2 flex items-center justify-between text-xs text-slate-500 overflow-x-auto gap-2"
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenTextPanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer shadow-2xs ${
              activeOverlayModal === 'text'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700'
            }`}
          >
            <Type className={`w-3.5 h-3.5 ${activeOverlayModal === 'text' ? 'text-white' : 'text-blue-600'}`} />
            <span>+ Text</span>
            {textCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-0.5 ${
                activeOverlayModal === 'text' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
              }`}>
                {textCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenImagePanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer shadow-2xs ${
              activeOverlayModal === 'image'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700'
            }`}
          >
            <ImageIcon className={`w-3.5 h-3.5 ${activeOverlayModal === 'image' ? 'text-white' : 'text-emerald-600'}`} />
            <span>+ Image</span>
            {imageCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-0.5 ${
                activeOverlayModal === 'image' ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'
              }`}>
                {imageCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenAudioPanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer shadow-2xs ${
              activeOverlayModal === 'audio'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 text-slate-700'
            }`}
          >
            <Music className={`w-3.5 h-3.5 ${activeOverlayModal === 'audio' ? 'text-white' : 'text-amber-600'}`} />
            <span>+ Audio</span>
            {hasAudio && (
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white ml-0.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenSubtitlePanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer shadow-2xs ${
              activeOverlayModal === 'subtitle'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 text-slate-700'
            }`}
          >
            <MessageSquare className={`w-3.5 h-3.5 ${activeOverlayModal === 'subtitle' ? 'text-white' : 'text-purple-600'}`} />
            <span>+ Subtitle</span>
            {subtitleCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-0.5 ${
                activeOverlayModal === 'subtitle' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'
              }`}>
                {subtitleCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
            title="Undo (Urungkan)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-100 cursor-pointer disabled:cursor-not-allowed"
            title="Redo (Ulangi)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Cek apakah klip aktif memiliki perubahan warna
  const isAdjusted = hasActiveAdjustments(selectedClip.adjustments, selectedClip.filter);

  // Apakah playhead berada di dalam klip terpilih untuk dapat di-Split
  const canSplit =
    currentLocalTime > selectedClip.trimStart + 0.3 &&
    currentLocalTime < selectedClip.trimEnd - 0.3;

  const handleSplitClick = () => {
    if (canSplit) {
      onSplitClip(selectedClip.id, currentLocalTime);
      setActivePanel('none');
    }
  };

  // Helper untuk mengubah trim slider
  const handleStartTrimChange = (newStart: number) => {
    const clamped = Math.max(0, Math.min(newStart, selectedClip.trimEnd - 0.5));
    onTrimChange(selectedClip.id, clamped, selectedClip.trimEnd);
  };

  const handleEndTrimChange = (newEnd: number) => {
    const clamped = Math.min(
      selectedClip.originalDuration,
      Math.max(newEnd, selectedClip.trimStart + 0.5)
    );
    onTrimChange(selectedClip.id, selectedClip.trimStart, clamped);
  };

  const handleResetTrim = () => {
    onTrimChange(selectedClip.id, 0, selectedClip.originalDuration);
  };

  return (
    <div
      id="video-clip-toolbar"
      className="shrink-0 bg-white border-t border-slate-200 flex flex-col z-20 shadow-xs"
    >
      {/* 1. Main Action Buttons Bar (Horizontal scroll on mobile) */}
      <div className="px-3 sm:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
        {/* Left Side: Clip Indicator & Core Clip Operations */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Selected Clip Tag */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg text-xs font-bold text-slate-700 shrink-0">
            <span className="text-blue-600 font-black">#{selectedClipIndex + 1}</span>
            <span className="max-w-[90px] truncate">{selectedClip.name}</span>
          </div>

          {/* 📝 TEXT Button */}
          <button
            id="btn-toolbar-text"
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenTextPanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeOverlayModal === 'text'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700'
            }`}
            title="Teks overlay: tambah judul, hook, sticker teks"
          >
            <Type className={`w-3.5 h-3.5 ${activeOverlayModal === 'text' ? 'text-white' : 'text-blue-600'}`} />
            <span>Text</span>
            {textCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-0.5 ${
                activeOverlayModal === 'text' ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'
              }`}>
                {textCount}
              </span>
            )}
          </button>

          {/* 🖼️ IMAGE Button */}
          <button
            id="btn-toolbar-image"
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenImagePanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeOverlayModal === 'image'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-700'
            }`}
            title="Gambar & logo watermark"
          >
            <ImageIcon className={`w-3.5 h-3.5 ${activeOverlayModal === 'image' ? 'text-white' : 'text-emerald-600'}`} />
            <span>Image</span>
            {imageCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-0.5 ${
                activeOverlayModal === 'image' ? 'bg-white text-emerald-600' : 'bg-emerald-600 text-white'
              }`}>
                {imageCount}
              </span>
            )}
          </button>

          {/* 🎵 AUDIO Button */}
          <button
            id="btn-toolbar-audio"
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenAudioPanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeOverlayModal === 'audio'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-700'
            }`}
            title="Audio & musik latar"
          >
            <Music className={`w-3.5 h-3.5 ${activeOverlayModal === 'audio' ? 'text-white' : 'text-amber-600'}`} />
            <span>Audio</span>
            {hasAudio && (
              <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white ml-0.5" />
            )}
          </button>

          {/* 💬 SUBTITLE Button */}
          <button
            id="btn-toolbar-subtitle"
            type="button"
            onClick={() => {
              setActivePanel('none');
              onOpenSubtitlePanel?.();
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeOverlayModal === 'subtitle'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-purple-50 text-slate-800 hover:text-purple-700'
            }`}
            title="Subtitle narasi & dialog"
          >
            <MessageSquare className={`w-3.5 h-3.5 ${activeOverlayModal === 'subtitle' ? 'text-white' : 'text-purple-600'}`} />
            <span>Subtitle</span>
            {subtitleCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ml-0.5 ${
                activeOverlayModal === 'subtitle' ? 'bg-white text-purple-600' : 'bg-purple-600 text-white'
              }`}>
                {subtitleCount}
              </span>
            )}
          </button>

          <div className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />

          {/* 🎨 ADJUST Button */}
          <button
            id="btn-clip-adjust"
            type="button"
            onClick={() => setActivePanel(activePanel === 'adjust' ? 'none' : 'adjust')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
              activePanel === 'adjust'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Koreksi warna: Kecerahan, Kontras, Saturasi, Suhu, Ketajaman"
          >
            <Sliders className={`w-3.5 h-3.5 ${activePanel === 'adjust' ? 'text-white' : 'text-blue-500'}`} />
            <span>Adjust</span>
            {isAdjusted && (
              <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white ml-0.5" />
            )}
          </button>

          {/* 🎞️ FILTERS Button */}
          <button
            id="btn-clip-filters"
            type="button"
            onClick={() => setActivePanel(activePanel === 'filters' ? 'none' : 'filters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
              activePanel === 'filters'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Preset filter warna: Natural, Vivid, Cinematic, Nature 🌿, dsb"
          >
            <Palette className={`w-3.5 h-3.5 ${activePanel === 'filters' ? 'text-white' : 'text-indigo-500'}`} />
            <span>Filters</span>
            {selectedClip.filter && selectedClip.filter !== 'original' && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white ml-0.5" />
            )}
          </button>

          {/* ✨ AUTO ENHANCE Quick Action */}
          <button
            id="btn-clip-auto-enhance"
            type="button"
            onClick={() => onAutoEnhance(selectedClip.id, false)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 border border-blue-200/80 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Tingkatkan visual secara otomatis & seimbang (Auto Enhance)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Auto Enhance</span>
            <span className="sm:hidden">Enhance</span>
          </button>

          {/* 🎞️ EFFECTS Button */}
          <button
            id="btn-clip-effects"
            type="button"
            onClick={() => setActivePanel(activePanel === 'effects' ? 'none' : 'effects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer relative ${
              activePanel === 'effects'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
            }`}
            title="Efek video visual: Zoom In/Out, Shake, Pulse, Flash, Slow Zoom, Ken Burns"
          >
            <Film className={`w-3.5 h-3.5 ${activePanel === 'effects' ? 'text-white' : 'text-purple-500'}`} />
            <span>Effects</span>
            {hasActiveEffects(selectedClip) && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[9px] font-black ring-2 ring-white ml-0.5">
                {selectedClip.effects!.filter((e) => e.type !== 'none').length}
              </span>
            )}
          </button>

          {/* ✨ TRANSISI Button (if there is a next clip) */}
          {selectedClipIndex < totalClips - 1 && onOpenTransitionModal && (
            <button
              id="btn-clip-transition-junction"
              type="button"
              onClick={() => {
                setActivePanel('none');
                onOpenTransitionModal(selectedClipIndex);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer border ${
                isTransitionActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 border-transparent hover:border-blue-200'
              }`}
              title="Atur animasi transisi ke klip berikutnya"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTransitionActive ? 'text-white' : 'text-blue-500'}`} />
              <span>Transisi</span>
              {selectedClip.transitionAfter && selectedClip.transitionAfter.type !== 'none' && (
                <span className="w-2 h-2 rounded-full bg-blue-500 ring-2 ring-white ml-0.5" />
              )}
            </button>
          )}

          {/* ✂ TRIM Button */}
          <button
            id="btn-clip-trim"
            type="button"
            onClick={() => setActivePanel(activePanel === 'trim' ? 'none' : 'trim')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activePanel === 'trim'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Potong awal & akhir klip (Trim)"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Trim</span>
          </button>

          {/* ✂ SPLIT Button */}
          <button
            id="btn-clip-split"
            type="button"
            onClick={handleSplitClick}
            disabled={!canSplit}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              canSplit
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-2xs'
                : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title={
              canSplit
                ? `Bagi klip di posisi ${formatTime(currentLocalTime)}`
                : 'Posisikan playhead di dalam klip (bukan tepat di ujung) untuk membagi'
            }
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Split ({formatTime(currentLocalTime)})</span>
          </button>

          {/* 🗑 DELETE Button */}
          <button
            id="btn-clip-delete"
            type="button"
            onClick={() => onDeleteClip(selectedClip.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
            title="Hapus klip ini dari timeline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus</span>
          </button>

          {/* ⬅ Move Left */}
          <button
            id="btn-clip-move-left"
            type="button"
            disabled={selectedClipIndex === 0}
            onClick={() => onMoveLeft(selectedClip.id)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Geser posisi klip ke kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* ➡ Move Right */}
          <button
            id="btn-clip-move-right"
            type="button"
            disabled={selectedClipIndex >= totalClips - 1}
            onClick={() => onMoveRight(selectedClip.id)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Geser posisi klip ke kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side: Before/After, Info, Undo, Redo */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 👁️ Quick Compare Before / After button */}
          <button
            type="button"
            onClick={onToggleCompareBefore}
            className={`p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold ${
              isComparingBefore
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Bandingkan visual sebelum vs sesudah adjustment"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden md:inline">{isComparingBefore ? 'Asli' : 'B/A'}</span>
          </button>

          {/* Info Toggle */}
          <button
            type="button"
            onClick={() => setActivePanel(activePanel === 'info' ? 'none' : 'info')}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
              activePanel === 'info'
                ? 'bg-blue-100 text-blue-700 font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
            title="Informasi Detail Klip"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* ↩ Undo */}
          <button
            id="btn-clip-undo"
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Undo (Urungkan perubahan)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* ↪ Redo */}
          <button
            id="btn-clip-redo"
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Redo (Ulangi perubahan)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Docked Tool Panel Container for Clip Editing Tools */}
      {activePanel !== 'none' && (
        <div
          id="clip-toolbar-docked-panel"
          className="h-[250px] sm:h-[280px] md:h-[305px] max-h-[38vh] flex flex-col overflow-hidden border-t border-slate-200 bg-white"
        >
          {/* COLOR ADJUSTMENT PANEL */}
          {activePanel === 'adjust' && (
            <AdjustmentPanel
              selectedClip={selectedClip}
              selectedClipIndex={selectedClipIndex}
              totalClips={totalClips}
              isComparingBefore={isComparingBefore}
              onToggleCompareBefore={onToggleCompareBefore}
              onAdjustmentsChange={onAdjustmentsChange}
              onAutoEnhance={onAutoEnhance}
              onResetAdjustments={onResetAdjustments}
              onClose={() => setActivePanel('none')}
            />
          )}

          {/* FILTER PRESETS PANEL */}
          {activePanel === 'filters' && (
            <FilterPresetsPanel
              selectedClip={selectedClip}
              selectedClipIndex={selectedClipIndex}
              totalClips={totalClips}
              isComparingBefore={isComparingBefore}
              onToggleCompareBefore={onToggleCompareBefore}
              onSelectFilter={onSelectFilter}
              onResetFilters={onResetFilters}
              onClose={() => setActivePanel('none')}
            />
          )}

          {/* Interactive TRIM Panel */}
          {activePanel === 'trim' && (
            <div
              id="clip-trim-panel"
              className="bg-blue-50/50 px-4 py-3 flex flex-col gap-3 h-full overflow-y-auto overscroll-contain touch-pan-y"
            >
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    Trim Durasi Klip #{selectedClipIndex + 1}
                  </span>
                  <span className="text-xs font-mono font-black text-blue-600 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    Durasi Baru: {formatTime(selectedClip.duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetTrim}
                    className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Reset ke Original
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePanel('none')}
                    className="p-1 rounded-lg hover:bg-blue-100 text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dual range handles / inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-2xl border border-blue-200/80 shadow-2xs">
                {/* Start Time Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Mulai (Start):</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {formatTime(selectedClip.trimStart)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleStartTrimChange(selectedClip.trimStart - 0.5)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                      title="Kurangi 0.5 detik"
                    >
                      -0.5s
                    </button>
                    <input
                      type="range"
                      min="0"
                      max={selectedClip.originalDuration}
                      step="0.1"
                      value={selectedClip.trimStart}
                      onChange={(e) => handleStartTrimChange(parseFloat(e.target.value))}
                      className="flex-1 accent-blue-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleStartTrimChange(selectedClip.trimStart + 0.5)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                      title="Tambah 0.5 detik"
                    >
                      +0.5s
                    </button>
                  </div>
                </div>

                {/* End Time Control */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Selesai (End):</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {formatTime(selectedClip.trimEnd)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEndTrimChange(selectedClip.trimEnd - 0.5)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                      title="Kurangi 0.5 detik"
                    >
                      -0.5s
                    </button>
                    <input
                      type="range"
                      min="0"
                      max={selectedClip.originalDuration}
                      step="0.1"
                      value={selectedClip.trimEnd}
                      onChange={(e) => handleEndTrimChange(parseFloat(e.target.value))}
                      className="flex-1 accent-blue-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => handleEndTrimChange(selectedClip.trimEnd + 0.5)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                      title="Tambah 0.5 detik"
                    >
                      +0.5s
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Effects Panel Drawer */}
          {activePanel === 'effects' && (
            <EffectsPanel
              clip={selectedClip}
              currentLocalTime={currentLocalTime}
              onApplyEffect={onApplyEffect}
              onUpdateEffect={onUpdateEffect}
              onRemoveEffect={onRemoveEffect}
              onResetEffects={onResetEffects}
              onClose={() => setActivePanel('none')}
            />
          )}

          {/* Real Clip Information Panel */}
          {activePanel === 'info' && (
            <div
              id="clip-info-panel"
              className="bg-slate-50 px-4 py-3 flex flex-col gap-2 text-xs h-full overflow-y-auto overscroll-contain touch-pan-y"
            >
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 shrink-0">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Informasi Video Asli</span>
                </span>
                <button
                  type="button"
                  onClick={() => setActivePanel('none')}
                  className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold">Nama File</div>
                  <div className="font-bold text-slate-800 truncate" title={selectedClip.name}>
                    {selectedClip.name}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold">Durasi Efektif</div>
                  <div className="font-mono font-bold text-blue-600">
                    {formatTime(selectedClip.duration)}
                    <span className="text-slate-400 font-normal text-[10px] ml-1">
                      (Ori: {formatTime(selectedClip.originalDuration)})
                    </span>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold">Ukuran File</div>
                  <div className="font-mono font-bold text-slate-700">
                    {formatFileSize(selectedClip.size)}
                  </div>
                </div>

                <div className="bg-white p-2 rounded-xl border border-slate-200">
                  <div className="text-[10px] text-slate-400 font-semibold">Resolusi</div>
                  <div className="font-mono font-bold text-slate-700">
                    {selectedClip.width && selectedClip.height
                      ? `${selectedClip.width} × ${selectedClip.height}`
                      : 'Otren/Standar'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

