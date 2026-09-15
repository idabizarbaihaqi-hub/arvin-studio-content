import React from 'react';
import {
  Type,
  X,
  Trash2,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Sparkles,
  Clock,
  Layers,
  ChevronDown,
  Check,
} from 'lucide-react';
import {
  TextOverlayItem,
  OverlayPositionPreset,
  TextAnimation,
} from './types';
import { getPresetCoordinates } from './overlayUtils';
import { formatTime } from './videoUtils';

interface TextPanelProps {
  textItem: TextOverlayItem;
  totalDuration: number;
  currentGlobalTime: number;
  onUpdate: (updates: Partial<TextOverlayItem>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Black', hex: '#000000' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Orange', hex: '#f97316' },
];

const POSITION_PRESETS: { id: OverlayPositionPreset; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-center', label: 'Top Center' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'center', label: 'Center' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

const ANIMATION_PRESETS: { id: TextAnimation; label: string; desc: string }[] = [
  { id: 'none', label: 'Tanpa Animasi', desc: 'Tampil statis sesuai durasi' },
  { id: 'fade-in', label: 'Fade In', desc: 'Masuk perlahan dengan transparansi halus' },
  { id: 'fade-out', label: 'Fade Out', desc: 'Menghilang bertahap di akhir durasi' },
  { id: 'fade-in-out', label: 'Fade In + Out', desc: 'Muncul dan menghilang dengan halus' },
  { id: 'slide-up', label: 'Slide Up', desc: 'Meluncur ke atas dari bawah' },
  { id: 'slide-down', label: 'Slide Down', desc: 'Meluncur ke bawah dari atas' },
  { id: 'slide-left', label: 'Slide Left', desc: 'Meluncur dari sisi kanan ke kiri' },
  { id: 'slide-right', label: 'Slide Right', desc: 'Meluncur dari sisi kiri ke kanan' },
  { id: 'pop', label: 'Pop Spring', desc: 'Membesar dengan efek pegas elastis' },
];

export const TextPanel: React.FC<TextPanelProps> = ({
  textItem,
  totalDuration,
  currentGlobalTime,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose,
}) => {
  const handlePositionPreset = (preset: OverlayPositionPreset) => {
    const coords = getPresetCoordinates(preset);
    onUpdate({
      positionPreset: preset,
      x: coords.x,
      y: coords.y,
    });
  };

  return (
    <div
      id="video-text-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Header (Sticky) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Type className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Pengaturan Teks
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate">
              {formatTime(textItem.startTime)} - {formatTime(textItem.endTime)} ({(textItem.endTime - textItem.startTime).toFixed(1)}s)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            id="btn-duplicate-text"
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Duplikasi Teks Ini"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-delete-text"
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
            title="Hapus Teks Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            id="btn-close-text-panel"
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
          {/* Text Input Area */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              <span>Konten Teks</span>
            </label>
            <textarea
              id="input-text-content"
              rows={2}
              value={textItem.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              placeholder="Ketik teks di sini (misal: Jangan menyerah hari ini)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 font-medium text-sm outline-none resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Preset Positions & Custom Placement */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Posisi Teks pada Video</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                X: {Math.round(textItem.x)}% | Y: {Math.round(textItem.y)}%
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {POSITION_PRESETS.map((p) => {
                const isSelected = textItem.positionPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePositionPreset(p.id)}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              💡 Tips: Anda juga dapat langsung menggeser / men-drag teks di atas video preview!
            </p>
          </div>

          {/* Typography & Font Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
            {/* Font Family */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Gaya Font (Font Family)
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'sans', label: 'Sans' },
                  { id: 'serif', label: 'Serif' },
                  { id: 'bold', label: 'Impact' },
                  { id: 'mono', label: 'Mono' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onUpdate({ fontFamily: f.id as any })}
                    className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      textItem.fontFamily === f.id
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Ketebalan (Weight)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'normal', label: 'Normal' },
                  { id: 'medium', label: 'Medium' },
                  { id: 'bold', label: 'Tebal' },
                ].map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onUpdate({ fontWeight: w.id as any })}
                    className={`py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      textItem.fontWeight === w.id
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Text Alignment */}
            <div>
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
                    onClick={() => onUpdate({ alignment: al.id as any })}
                    className={`flex-1 py-1 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      textItem.alignment === al.id
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {al.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size Slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-600">
                  Ukuran Font (Size)
                </label>
                <span className="text-xs font-mono font-bold text-blue-600">
                  {textItem.fontSize}px
                </span>
              </div>
              <input
                type="range"
                min={14}
                max={72}
                step={1}
                value={textItem.fontSize}
                onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Color & Opacity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-600" />
                <span>Warna Teks</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={textItem.color}
                  onChange={(e) => onUpdate({ color: e.target.value })}
                  className="w-6 h-6 rounded-md border border-slate-300 cursor-pointer p-0"
                  title="Pilih warna custom"
                />
                <span className="text-[11px] font-mono text-slate-500 font-bold uppercase">
                  {textItem.color}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {COLOR_PRESETS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => onUpdate({ color: col.hex })}
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 transition-transform cursor-pointer shadow-2xs ${
                    textItem.color.toLowerCase() === col.hex.toLowerCase()
                      ? 'scale-110 ring-2 ring-blue-500 ring-offset-1 border-transparent'
                      : 'border-slate-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                >
                  {textItem.color.toLowerCase() === col.hex.toLowerCase() && (
                    <Check
                      className={`w-3.5 h-3.5 ${
                        col.hex === '#ffffff' || col.hex === '#eab308'
                          ? 'text-slate-900'
                          : 'text-white'
                      } stroke-[3]`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Text Background Box */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Latar Belakang Teks (Background)
              </label>
              <div className="flex items-center gap-1">
                {[
                  { id: 'none', label: 'None' },
                  { id: 'semi', label: 'Semi Transparan' },
                  { id: 'solid', label: 'Solid' },
                ].map((bg) => (
                  <button
                    key={bg.id}
                    type="button"
                    onClick={() => onUpdate({ background: bg.id as any })}
                    className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      textItem.background === bg.id
                        ? 'border-blue-600 bg-blue-600 text-white shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {textItem.background !== 'none' && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                    <span>Warna Latar</span>
                    <input
                      type="color"
                      value={textItem.backgroundColor || '#000000'}
                      onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer p-0 border border-slate-300"
                    />
                  </div>
                </div>

                {textItem.background === 'semi' && (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Transparansi Latar</span>
                      <span className="font-mono text-blue-600">{textItem.bgOpacity ?? 60}%</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={95}
                      step={5}
                      value={textItem.bgOpacity ?? 60}
                      onChange={(e) => onUpdate({ bgOpacity: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Total Text Opacity */}
            <div className="pt-2 border-t border-slate-200/60">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>Opacity Teks Keseluruhan</span>
                <span className="font-mono text-blue-600">{textItem.opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={textItem.opacity}
                onChange={(e) => onUpdate({ opacity: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Animation Presets */}
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Animasi Teks (Animation)</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {ANIMATION_PRESETS.map((anim) => {
                const isSelected = (textItem.animation || 'none') === anim.id;
                return (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => onUpdate({ animation: anim.id })}
                    className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {anim.label}
                    </span>
                    <span className="text-[9px] text-slate-400 line-clamp-1 mt-0.5">
                      {anim.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timing / Duration Settings */}
          <div className="p-3 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu Tampil Teks pada Timeline</span>
              </label>
              <span className="text-xs font-mono font-bold text-blue-700">
                {formatTime(textItem.startTime)} - {formatTime(textItem.endTime)}
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
                className="py-1 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors cursor-pointer"
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
                className="py-1 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors cursor-pointer"
              >
                5 Detik Pertama
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    startTime: currentGlobalTime,
                    endTime: Math.min(totalDuration, currentGlobalTime + 4),
                  })
                }
                className="py-1 px-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 transition-colors cursor-pointer"
              >
                Mulai di Playhead
              </button>
            </div>

            {/* Range sliders */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">
                  Mulai: {formatTime(textItem.startTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, textItem.endTime - 0.5)}
                  step={0.1}
                  value={textItem.startTime}
                  onChange={(e) => onUpdate({ startTime: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">
                  Selesai: {formatTime(textItem.endTime)}
                </span>
                <input
                  type="range"
                  min={Math.min(totalDuration, textItem.startTime + 0.5)}
                  max={totalDuration}
                  step={0.1}
                  value={textItem.endTime}
                  onChange={(e) => onUpdate({ endTime: Number(e.target.value) })}
                  className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600"
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
            id="btn-done-text"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
