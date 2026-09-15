import React, { useRef } from 'react';
import {
  Image as ImageIcon,
  X,
  Trash2,
  Upload,
  Layers,
  Clock,
  Sliders,
  RotateCw,
  Maximize2,
  ChevronDown,
} from 'lucide-react';
import { ImageOverlayItem, OverlayPositionPreset } from './types';
import { getPresetCoordinates } from './overlayUtils';
import { formatTime } from './videoUtils';

interface ImagePanelProps {
  imageItem: ImageOverlayItem;
  totalDuration: number;
  currentGlobalTime: number;
  onUpdate: (updates: Partial<ImageOverlayItem>) => void;
  onReplaceFile: (file: File) => void;
  onDelete: () => void;
  onClose: () => void;
}

const POSITION_PRESETS: { id: OverlayPositionPreset; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center', label: 'Center' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export const ImagePanel: React.FC<ImagePanelProps> = ({
  imageItem,
  totalDuration,
  currentGlobalTime,
  onUpdate,
  onReplaceFile,
  onDelete,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePositionPreset = (preset: OverlayPositionPreset) => {
    const coords = getPresetCoordinates(preset);
    onUpdate({
      positionPreset: preset,
      x: coords.x,
      y: coords.y,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplaceFile(file);
    }
  };

  return (
    <div
      id="video-image-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Header (Sticky) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Pengaturan Gambar / Logo
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] sm:max-w-xs">
              {imageItem.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            id="btn-delete-image"
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
            title="Hapus Gambar Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-close-image-panel"
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

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4">
          {/* Image Thumbnail & Replace button */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="w-16 h-16 rounded-xl bg-slate-200/80 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 relative">
              <img
                src={imageItem.url}
                alt={imageItem.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-800 block truncate">
                {imageItem.name}
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Format transparan (PNG/WebP) dipertahankan utuh
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-1.5 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Ganti Gambar</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Position Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                <span>Posisi Gambar / Logo</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                X: {Math.round(imageItem.x)}% | Y: {Math.round(imageItem.y)}%
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {POSITION_PRESETS.map((p) => {
                const isSelected = imageItem.positionPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePositionPreset(p.id)}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              💡 Tips: Anda juga dapat langsung menggeser / men-drag logo langsung pada preview video!
            </p>
          </div>

          {/* Scale / Size Slider (10% to 200%) */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ukuran / Skala Gambar (Scale)</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {imageItem.scale}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                step={5}
                value={imageItem.scale}
                onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>10% (Kecil)</span>
                <span>100% (Normal)</span>
                <span>200% (Besar)</span>
              </div>
            </div>

            {/* Opacity Slider (0 - 100%) */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Transparansi / Opacity Watermark</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {imageItem.opacity}%
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={imageItem.opacity}
                onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>10% (Transparan)</span>
                <span>50% (Watermark)</span>
                <span>100% (Solid)</span>
              </div>
            </div>

            {/* Rotation Slider (0 - 360) */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rotasi Gambar</span>
                </label>
                <span className="text-xs font-mono font-bold text-emerald-600">
                  {imageItem.rotation || 0}°
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={imageItem.rotation || 0}
                onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
          </div>

          {/* Timing / Duration Settings */}
          <div className="p-3 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Waktu Tampil Gambar pada Timeline</span>
              </label>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {formatTime(imageItem.startTime)} - {formatTime(imageItem.endTime)}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    startTime: 0,
                    endTime: totalDuration,
                  })
                }
                className="py-1 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors cursor-pointer"
              >
                Seluruh Video
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    startTime: 0,
                    endTime: Math.min(totalDuration, 5),
                  })
                }
                className="py-1 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors cursor-pointer"
              >
                5 Detik Pertama
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    startTime: currentGlobalTime,
                    endTime: Math.min(totalDuration, currentGlobalTime + 5),
                  })
                }
                className="py-1 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors cursor-pointer"
              >
                Mulai di Playhead
              </button>
            </div>

            {/* Range sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">
                  Mulai: {formatTime(imageItem.startTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, imageItem.endTime - 0.5)}
                  step={0.1}
                  value={imageItem.startTime}
                  onChange={(e) => onUpdate({ startTime: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">
                  Selesai: {formatTime(imageItem.endTime)}
                </span>
                <input
                  type="range"
                  min={Math.min(totalDuration, imageItem.startTime + 0.5)}
                  max={totalDuration}
                  step={0.1}
                  value={imageItem.endTime}
                  onChange={(e) => onUpdate({ endTime: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-emerald-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <span className="text-xs text-slate-500">
            Preview tersinkronisasi otomatis
          </span>
          <button
            id="btn-done-image"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
