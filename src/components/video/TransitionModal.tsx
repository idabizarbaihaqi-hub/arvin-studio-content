import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Play,
  RotateCcw,
  Check,
  Ban,
  Moon,
  Layers,
  Blend,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  Aperture,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { VideoClip, TransitionType, ClipTransition } from './types';
import {
  TRANSITION_ITEMS,
  TRANSITION_DURATION_OPTIONS,
  getSafeTransitionDuration,
  TransitionItem,
} from './videoUtils';

interface TransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  fromClip: VideoClip | null;
  toClip: VideoClip | null;
  transitionIndex: number;
  totalTransitions: number;
  currentTransition?: ClipTransition;
  onSaveTransition: (
    index: number,
    transition: ClipTransition,
    applyToAll?: boolean
  ) => void;
  onRemoveTransition: (index: number, applyToAll?: boolean) => void;
}

export const TransitionModal: React.FC<TransitionModalProps> = ({
  isOpen,
  onClose,
  fromClip,
  toClip,
  transitionIndex,
  totalTransitions,
  currentTransition,
  onSaveTransition,
  onRemoveTransition,
}) => {
  const [selectedType, setSelectedType] = useState<TransitionType>(
    currentTransition?.type || 'fade'
  );
  const [duration, setDuration] = useState<number>(
    currentTransition?.duration || 0.5
  );
  const [applyToAll, setApplyToAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'basic' | 'motion' | 'zoom' | 'fx'
  >('all');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialType = currentTransition?.type || 'fade';
      setSelectedType(initialType);

      if (fromClip && toClip) {
        const safe = getSafeTransitionDuration(
          fromClip,
          toClip,
          currentTransition?.duration || 0.5
        );
        setDuration(safe);
      } else {
        setDuration(currentTransition?.duration || 0.5);
      }
      setApplyToAll(false);
      setIsPreviewing(false);
      setPreviewProgress(0);
    }
  }, [isOpen, currentTransition, fromClip, toClip]);

  if (!isOpen || !fromClip || !toClip) return null;

  // Safe duration limit based on adjacent clips
  const maxSafeDuration = getSafeTransitionDuration(fromClip, toClip, 2.0);

  // Run preview animation
  const handleTriggerPreview = () => {
    if (isPreviewing) return;
    setIsPreviewing(true);
    setPreviewProgress(0);

    const startTime = performance.now();
    const animDuration = Math.max(800, duration * 1000);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const p = Math.min(1, elapsed / animDuration);
      setPreviewProgress(p);

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          setIsPreviewing(false);
          setPreviewProgress(0);
        }, 300);
      }
    };
    requestAnimationFrame(step);
  };

  const handleApply = () => {
    const safeDuration = getSafeTransitionDuration(fromClip, toClip, duration);
    onSaveTransition(
      transitionIndex,
      {
        type: selectedType,
        duration: safeDuration,
      },
      applyToAll
    );
    onClose();
  };

  const handleRemove = () => {
    onRemoveTransition(transitionIndex, applyToAll);
    onClose();
  };

  const filteredItems = TRANSITION_ITEMS.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const getTransitionIcon = (type: TransitionType) => {
    switch (type) {
      case 'none':
        return <Ban className="w-4 h-4" />;
      case 'fade':
        return <Moon className="w-4 h-4" />;
      case 'dissolve':
        return <Layers className="w-4 h-4" />;
      case 'crossfade':
        return <Blend className="w-4 h-4" />;
      case 'slide-left':
        return <ArrowLeft className="w-4 h-4" />;
      case 'slide-right':
        return <ArrowRight className="w-4 h-4" />;
      case 'slide-up':
        return <ArrowUp className="w-4 h-4" />;
      case 'slide-down':
        return <ArrowDown className="w-4 h-4" />;
      case 'zoom-in':
        return <ZoomIn className="w-4 h-4" />;
      case 'zoom-out':
        return <ZoomOut className="w-4 h-4" />;
      case 'blur':
        return <Aperture className="w-4 h-4" />;
      case 'flash':
        return <Zap className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  // Compute preview simulation styles for the animated box
  const getPreviewSimulationStyle = () => {
    if (!isPreviewing) return {};
    const p = previewProgress;

    switch (selectedType) {
      case 'fade':
        return {
          backgroundColor: '#000000',
          opacity: 1 - Math.abs(p - 0.5) * 2,
        };
      case 'flash':
        return {
          backgroundColor: '#ffffff',
          opacity: 1 - Math.abs(p - 0.5) * 2,
        };
      case 'blur':
        return {
          filter: `blur(${(14 * (1 - Math.abs(p - 0.5) * 2)).toFixed(1)}px)`,
        };
      case 'zoom-in': {
        const factor = 1 + (1 - Math.abs(p - 0.5) * 2) * 0.35;
        return { transform: `scale(${factor.toFixed(2)})` };
      }
      case 'zoom-out': {
        const factor = 1 - (1 - Math.abs(p - 0.5) * 2) * 0.25;
        return { transform: `scale(${factor.toFixed(2)})` };
      }
      case 'slide-left': {
        const x = p < 0.5 ? -p * 200 : (1 - p) * 200;
        return { transform: `translateX(${x.toFixed(1)}%)` };
      }
      case 'slide-right': {
        const x = p < 0.5 ? p * 200 : -(1 - p) * 200;
        return { transform: `translateX(${x.toFixed(1)}%)` };
      }
      case 'slide-up': {
        const y = p < 0.5 ? -p * 200 : (1 - p) * 200;
        return { transform: `translateY(${y.toFixed(1)}%)` };
      }
      case 'slide-down': {
        const y = p < 0.5 ? p * 200 : -(1 - p) * 200;
        return { transform: `translateY(${y.toFixed(1)}%)` };
      }
      case 'dissolve':
      case 'crossfade':
        return {
          backgroundColor: '#0f172a',
          opacity: (1 - Math.abs(p - 0.5) * 2) * 0.7,
        };
      default:
        return {};
    }
  };

  return (
    <div
      id="transition-modal-card"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 sm:px-5 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Transisi Antar Klip
            </h3>
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[170px] sm:max-w-xs">
              Klip #{transitionIndex + 1} ({fromClip?.name || 'A'}) → Klip #{transitionIndex + 2} ({toClip?.name || 'B'})
            </p>
          </div>
        </div>
        <button
          id="btn-close-transition-modal"
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors shrink-0"
          title="Tutup / Sembunyikan Panel"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Tutup</span>
        </button>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4">
          {/* Mini Live Preview Stage */}
          <div className="p-3.5 bg-slate-900 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-28 h-16 bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                {/* Active Clip Preview Thumbnail or Mock Frame */}
                {fromClip.thumbnail ? (
                  <img
                    src={fromClip.thumbnail}
                    alt={fromClip.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] font-bold text-slate-400">Klip A</span>
                )}

                {/* Animated Transition Simulation Overlay */}
                <div
                  className="absolute inset-0 transition-all pointer-events-none"
                  style={getPreviewSimulationStyle()}
                />

                {/* Status Indicator */}
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white font-bold">
                  {selectedType}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-200">
                  {selectedType === 'none'
                    ? 'Tanpa Transisi (Cut)'
                    : `Efek: ${TRANSITION_ITEMS.find((t) => t.id === selectedType)?.name || selectedType}`}
                </div>
                <div className="text-[11px] text-slate-400">
                  Durasi:{' '}
                  <span className="text-blue-400 font-bold font-mono">
                    {duration} detik
                  </span>
                </div>
              </div>
            </div>

            <button
              id="btn-preview-transition-animation"
              type="button"
              onClick={handleTriggerPreview}
              disabled={isPreviewing || selectedType === 'none'}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Play className={`w-3.5 h-3.5 ${isPreviewing ? 'animate-spin' : 'fill-white'}`} />
              <span>{isPreviewing ? 'Memutar...' : 'Tes Animasi'}</span>
            </button>
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Durasi Transisi
              </label>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                {duration}s
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {TRANSITION_DURATION_OPTIONS.map((opt) => {
                const isTooLong = opt > maxSafeDuration;
                const isSelected = duration === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    disabled={isTooLong}
                    onClick={() => setDuration(opt)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-1'
                        : isTooLong
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{opt}s</span>
                  </button>
                );
              })}
            </div>

            {duration > maxSafeDuration && (
              <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
                * Durasi disesuaikan otomatis maks {maxSafeDuration}s agar sesuai panjang klip.
              </p>
            )}
          </div>

          {/* Category Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Pilih Tipe Transisi
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredItems.length} pilihan
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'basic', label: 'Dasar' },
                { id: 'motion', label: 'Slide / Gerak' },
                { id: 'zoom', label: 'Zoom' },
                { id: 'fx', label: 'Efek Khusus' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setActiveCategory(
                      cat.id as 'all' | 'basic' | 'motion' | 'zoom' | 'fx'
                    )
                  }
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transition Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {filteredItems.map((item) => {
              const isSelected = selectedType === item.id;
              return (
                <button
                  key={item.id}
                  id={`btn-transition-${item.id}`}
                  type="button"
                  onClick={() => setSelectedType(item.id)}
                  className={`p-3 rounded-2xl text-left border transition-all relative flex flex-col justify-between cursor-pointer group ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 shadow-sm ring-2 ring-blue-600/30'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        }`}
                      >
                        {getTransitionIcon(item.id)}
                      </div>

                      {item.badge && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700">
                          {item.badge}
                        </span>
                      )}

                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-900">
                      {item.name}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Apply to all transitions checkbox */}
          {totalTransitions > 1 && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Terapkan ke Seluruh Titik Transisi
                </div>
                <div className="text-[11px] text-slate-500">
                  Pasang transisi ini pada semua {totalTransitions} sambungan klip
                </div>
              </div>
              <input
                type="checkbox"
                id="checkbox-apply-all-transitions"
                checked={applyToAll}
                onChange={(e) => setApplyToAll(e.target.checked)}
                className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-5 border-t border-slate-100 bg-slate-50/90 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <button
            id="btn-remove-transition"
            type="button"
            onClick={handleRemove}
            className="px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-600 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hapus Transisi</span>
            <span className="sm:hidden">Hapus</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-cancel-transition"
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/60 text-xs font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-apply-transition"
              type="button"
              onClick={handleApply}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Terapkan</span>
            </button>
          </div>
        </div>
      </div>
  );
};
