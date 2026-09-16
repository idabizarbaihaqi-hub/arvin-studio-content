import React, { useRef } from 'react';
import {
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Film,
  Scissors,
  Check,
  Palette,
  Sparkles,
  Type,
  Image as ImageIcon,
  Music,
  MessageSquare,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  VideoClip,
  TextOverlayItem,
  ImageOverlayItem,
  AudioTrackItem,
  SubtitleItem,
} from './types';
import { formatTime, hasActiveAdjustments, hasActiveEffects } from './videoUtils';

interface TimelineProps {
  clips: VideoClip[];
  selectedClipId: string | null;
  currentTime: number;
  totalDuration: number;
  timelineZoom: number;
  onSelectClip: (clipId: string) => void;
  onSeek: (globalTime: number) => void;
  onAddVideoClick: () => void;
  onMoveClipLeft: (clipId: string) => void;
  onMoveClipRight: (clipId: string) => void;
  onDeleteClip: (clipId: string) => void;
  onOpenTransitionModal?: (junctionIndex: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  texts?: TextOverlayItem[];
  selectedTextId?: string | null;
  onSelectText?: (id: string) => void;
  onAddTextClick?: () => void;
  images?: ImageOverlayItem[];
  selectedImageId?: string | null;
  onSelectImage?: (id: string) => void;
  onAddImageClick?: () => void;
  audios?: AudioTrackItem[];
  selectedAudioId?: string | null;
  onSelectAudio?: (id: string) => void;
  onAddAudioClick?: () => void;
  subtitles?: SubtitleItem[];
  selectedSubtitleId?: string | null;
  onSelectSubtitle?: (id: string) => void;
  onAddSubtitleClick?: () => void;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  activeOverlayModal?: 'none' | 'text' | 'image' | 'audio' | 'subtitle';
}

export const Timeline: React.FC<TimelineProps> = ({
  clips,
  selectedClipId,
  currentTime,
  totalDuration,
  timelineZoom,
  onSelectClip,
  onSeek,
  onAddVideoClick,
  onMoveClipLeft,
  onMoveClipRight,
  onDeleteClip,
  onOpenTransitionModal,
  onZoomIn,
  onZoomOut,
  texts = [],
  selectedTextId = null,
  onSelectText,
  onAddTextClick,
  images = [],
  selectedImageId = null,
  onSelectImage,
  onAddImageClick,
  audios = [],
  selectedAudioId = null,
  onSelectAudio,
  onAddAudioClick,
  subtitles = [],
  selectedSubtitleId = null,
  onSelectSubtitle,
  onAddSubtitleClick,
  isMinimized = false,
  onToggleMinimize,
  activeOverlayModal = 'none',
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleRulerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current || totalDuration <= 0) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * totalDuration);
  };

  const playheadPercent =
    totalDuration > 0
      ? Math.max(0, Math.min(100, (currentTime / totalDuration) * 100))
      : 0;

  return (
    <div
      id="video-multiclip-timeline"
      className="shrink-0 bg-white border-t border-slate-200 p-2 sm:p-3 flex flex-col gap-2 z-10 select-none"
    >
      {/* Timeline Controls & Info Header */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <div className="flex items-center gap-2 font-semibold flex-wrap">
          <span className="text-slate-900 font-bold flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-blue-600" />
            <span>Timeline</span>
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-blue-600 font-mono font-bold">
            {formatTime(currentTime)}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-slate-500 font-mono">
            {formatTime(totalDuration)}
          </span>
          <span className="text-slate-300">•</span>
          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
            {clips.length} Klip
          </span>
          {texts.length > 0 && (
            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {texts.length} Teks
            </span>
          )}
          {images.length > 0 && (
            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {images.length} Gambar
            </span>
          )}
          {audios.length > 0 && (
            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {audios.length} Audio
            </span>
          )}
          {subtitles.length > 0 && (
            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
              {subtitles.length} Subtitle
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Skip buttons */}
          <button
            type="button"
            onClick={() => onSeek(Math.max(0, currentTime - 5))}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer transition-colors"
            title="Mundur 5 detik"
          >
            -5s
          </button>
          <button
            type="button"
            onClick={() => onSeek(Math.min(totalDuration, currentTime + 5))}
            className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] font-bold cursor-pointer transition-colors"
            title="Maju 5 detik"
          >
            +5s
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              onClick={onZoomOut}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
              title="Perkecil Timeline"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] w-7 text-center font-bold text-slate-700">
              {Math.round(timelineZoom * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="p-1 rounded hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors"
              title="Perbesar Timeline"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Minimize / Expand Timeline Toggle */}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              className="p-1 px-1.5 rounded-lg hover:bg-slate-100 text-slate-600 cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-bold border border-slate-200"
              title={isMinimized ? 'Perluas Timeline' : 'Perkecil Timeline'}
            >
              {isMinimized ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Perluas</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Perkecil</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Global Time Ruler & Playhead Multi-Track Viewport */}
      <div
        id="timeline-scroll-viewport"
        className={`w-full overflow-x-auto bg-slate-50/90 border border-slate-200 rounded-xl relative transition-all ${
          isMinimized ? 'p-1.5' : 'p-2 sm:p-2.5 pb-2.5'
        }`}
      >
        <div
          style={{ width: `${Math.max(100, 100 * timelineZoom)}%`, minWidth: '100%' }}
          className={`relative flex flex-col ${isMinimized ? 'gap-0' : 'gap-2'}`}
        >
          {/* Time Ruler (Click to seek anywhere in timeline) */}
          <div
            ref={rulerRef}
            onClick={handleRulerClick}
            className={`relative ${
              isMinimized ? 'h-6' : 'h-5'
            } bg-white border border-slate-200/80 rounded-md cursor-pointer flex items-center justify-between px-2 text-[9px] font-mono text-slate-400 shadow-2xs hover:border-blue-300 transition-colors`}
            title="Klik pada ruler untuk menggeser waktu video"
          >
            <span>00:00</span>
            <span>{formatTime(totalDuration * 0.25)}</span>
            <span>{formatTime(totalDuration * 0.5)}</span>
            <span>{formatTime(totalDuration * 0.75)}</span>
            <span>{formatTime(totalDuration)}</span>

            {/* Needle indicator on ruler */}
            {totalDuration > 0 && (
              <div
                style={{ left: `${playheadPercent}%` }}
                className="absolute top-0 bottom-0 w-0.5 bg-red-600 pointer-events-none z-40"
              >
                <div className="w-2.5 h-2.5 -ml-1 bg-red-600 rounded-full shadow-xs -mt-0.5" />
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* Global Playhead Needle traversing across ALL tracks */}
              {totalDuration > 0 && (
                <div
                  style={{ left: `${playheadPercent}%` }}
                  className="absolute top-5 bottom-0 w-0.5 bg-red-500 pointer-events-none z-40 transition-all duration-75"
                >
                  <div className="w-2 h-2 -ml-[3px] bg-red-500 rounded-full shadow-sm" />
                </div>
              )}

          {/* 1. TRACK VIDEO CLIPS */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
              <span className="flex items-center gap-1">
                <Film className="w-3 h-3 text-blue-600" />
                <span>Track Video ({clips.length})</span>
              </span>
            </div>

            <div className="relative flex items-stretch gap-2.5 min-h-[78px]">
              {clips.map((clip, index) => {
                const isSelected = clip.id === selectedClipId;
                const isFirst = index === 0;
                const isLast = index === clips.length - 1;

                return (
                  <React.Fragment key={clip.id}>
                    <div
                      id={`timeline-clip-${clip.id}`}
                      onClick={() => onSelectClip(clip.id)}
                      className={`relative flex-shrink-0 w-44 sm:w-52 h-18 rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col justify-between p-2 shadow-xs group ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Clip Header: Index, Name, Actions */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                              isSelected
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <span
                            className="text-[11px] font-bold text-slate-800 truncate"
                            title={clip.name}
                          >
                            {clip.name}
                          </span>
                          {hasActiveAdjustments(clip.adjustments, clip.filter) && (
                            <span
                              className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[8px] font-black px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 shrink-0"
                              title={`Filter: ${clip.filter || 'Kustom'}`}
                            >
                              {clip.filter === 'nature' ? '🌿 Nature' : clip.filter && clip.filter !== 'original' ? clip.filter : '✨ Edit'}
                            </span>
                          )}
                          {hasActiveEffects(clip) && (
                            <span
                              className="bg-purple-50 text-purple-700 border border-purple-200 text-[8px] font-black px-1.5 py-0.2 rounded-full inline-flex items-center gap-0.5 shrink-0"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                              <span>{clip.effects!.filter((e) => e.type !== 'none').length}</span>
                            </span>
                          )}
                        </div>

                        {/* Quick Move and Delete controls */}
                        <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                          {!isFirst && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveClipLeft(clip.id);
                              }}
                              className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 text-[10px] cursor-pointer"
                              title="Geser ke kiri"
                            >
                              <ChevronLeft className="w-3 h-3" />
                            </button>
                          )}
                          {!isLast && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveClipRight(clip.id);
                              }}
                              className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 text-[10px] cursor-pointer"
                              title="Geser ke kanan"
                            >
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteClip(clip.id);
                            }}
                            className="p-1 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 text-[10px] cursor-pointer ml-0.5"
                            title="Hapus klip ini"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Clip Content: Thumbnail + Duration Badges */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="w-12 h-8 rounded-lg bg-slate-900 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center relative">
                          {clip.thumbnail ? (
                            <img
                              src={clip.thumbnail}
                              alt={clip.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Film className="w-4 h-4 text-slate-500" />
                          )}

                          {(clip.trimStart > 0 || clip.trimEnd < clip.originalDuration) && (
                            <span
                              className="absolute bottom-0 right-0 bg-amber-500 text-white text-[8px] font-black px-1 rounded-tl"
                            >
                              ✂
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-[11px] font-mono font-bold text-slate-900">
                            {formatTime(clip.duration)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-mono truncate">
                            {clip.trimStart > 0 || clip.trimEnd < clip.originalDuration ? (
                              <span>
                                {formatTime(clip.trimStart)} – {formatTime(clip.trimEnd)}
                              </span>
                            ) : (
                              <span>Asli: {formatTime(clip.originalDuration)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-b-xl" />
                      )}
                    </div>

                    {/* Transition Junction Button */}
                    {!isLast && (
                      <div className="flex items-center justify-center shrink-0 self-center z-20">
                        <button
                          id={`btn-timeline-transition-${index}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onOpenTransitionModal) onOpenTransitionModal(index);
                          }}
                          className={`h-6 px-2 rounded-full border text-[9px] font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer hover:scale-105 active:scale-95 ${
                            clip.transitionAfter && clip.transitionAfter.type !== 'none'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/25 ring-2 ring-blue-500/20'
                              : 'bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          <span className="capitalize">
                            {clip.transitionAfter && clip.transitionAfter.type !== 'none'
                              ? `${clip.transitionAfter.type}`
                              : '+ Transisi'}
                          </span>
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Inline "+ Tambah Video" Slot */}
              <button
                type="button"
                onClick={onAddVideoClick}
                className="flex-shrink-0 w-24 sm:w-28 h-18 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-blue-600 cursor-pointer shadow-2xs group"
                title="Tambah video baru ke timeline"
              >
                <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                <span className="text-[9px] font-bold">+ Video</span>
              </button>
            </div>
          </div>

          {/* 2. TRACK TEXT OVERLAYS */}
          {(texts.length > 0 || activeOverlayModal === 'text') && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
                <span className="flex items-center gap-1 text-blue-700">
                  <Type className="w-2.5 h-2.5 text-blue-600" />
                  <span>Track Teks ({texts.length})</span>
                </span>
                {onAddTextClick && (
                  <button
                    type="button"
                    onClick={onAddTextClick}
                    className="text-[9px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-2 h-2" />
                    <span>Tambah Teks</span>
                  </button>
                )}
              </div>

              <div className="relative h-7 bg-white rounded-lg border border-slate-200 p-0.5 flex items-center">
                {texts.length === 0 ? (
                  <div
                    onClick={onAddTextClick}
                    className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 italic cursor-pointer hover:text-blue-600 transition-colors"
                  >
                    + Klik untuk menambahkan teks overlay di timeline
                  </div>
                ) : (
                  texts.map((txt) => {
                    const isSelected = selectedTextId === txt.id;
                    const startPct =
                      totalDuration > 0
                        ? Math.max(0, Math.min(100, (txt.startTime / totalDuration) * 100))
                        : 0;
                    const durationPct =
                      totalDuration > 0
                        ? Math.max(
                            4,
                            Math.min(100 - startPct, ((txt.endTime - txt.startTime) / totalDuration) * 100)
                          )
                        : 20;

                    return (
                      <div
                        key={txt.id}
                        onClick={() => {
                          onSeek(txt.startTime);
                          if (onSelectText) onSelectText(txt.id);
                        }}
                        style={{ left: `${startPct}%`, width: `${durationPct}%` }}
                        className={`absolute h-5.5 rounded px-1.5 flex items-center justify-between gap-1 transition-all cursor-pointer overflow-hidden border shadow-2xs ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500/30 z-20'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-200 z-10'
                        }`}
                        title={`Teks: "${txt.text}" (${formatTime(txt.startTime)} - ${formatTime(txt.endTime)})`}
                      >
                        <span className="text-[9px] font-bold truncate">
                          {txt.text || 'Teks kosong'}
                        </span>
                        <span
                          className={`text-[8px] font-mono shrink-0 ${
                            isSelected ? 'text-blue-100' : 'text-blue-600'
                          }`}
                        >
                          {(txt.endTime - txt.startTime).toFixed(1)}s
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 3. TRACK IMAGE / LOGO OVERLAYS */}
          {(images.length > 0 || activeOverlayModal === 'image') && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
                <span className="flex items-center gap-1 text-emerald-700">
                  <ImageIcon className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Track Gambar ({images.length})</span>
                </span>
                {onAddImageClick && (
                  <button
                    type="button"
                    onClick={onAddImageClick}
                    className="text-[9px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-2 h-2" />
                    <span>Tambah Gambar</span>
                  </button>
                )}
              </div>

              <div className="relative h-7 bg-white rounded-lg border border-slate-200 p-0.5 flex items-center">
                {images.length === 0 ? (
                  <div
                    onClick={onAddImageClick}
                    className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 italic cursor-pointer hover:text-emerald-600 transition-colors"
                  >
                    + Klik untuk menambahkan gambar / logo
                  </div>
                ) : (
                  images.map((img) => {
                    const isSelected = selectedImageId === img.id;
                    const startPct =
                      totalDuration > 0
                        ? Math.max(0, Math.min(100, (img.startTime / totalDuration) * 100))
                        : 0;
                    const durationPct =
                      totalDuration > 0
                        ? Math.max(
                            4,
                            Math.min(100 - startPct, ((img.endTime - img.startTime) / totalDuration) * 100)
                          )
                        : 20;

                    return (
                      <div
                        key={img.id}
                        onClick={() => {
                          onSeek(img.startTime);
                          if (onSelectImage) onSelectImage(img.id);
                        }}
                        style={{ left: `${startPct}%`, width: `${durationPct}%` }}
                        className={`absolute h-5.5 rounded px-1.5 flex items-center gap-1 transition-all cursor-pointer overflow-hidden border shadow-2xs ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 ring-2 ring-emerald-500/30 z-20'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-200 z-10'
                        }`}
                        title={`Gambar: ${img.name}`}
                      >
                        <div className="w-3.5 h-3.5 rounded bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={img.url} alt={img.name} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[9px] font-bold truncate">
                          {img.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 4. TRACK AUDIO / MUSIK */}
          {(audios.length > 0 || activeOverlayModal === 'audio') && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
                <span className="flex items-center gap-1 text-amber-700">
                  <Music className="w-2.5 h-2.5 text-amber-600" />
                  <span>Track Audio ({audios.length})</span>
                </span>
                {onAddAudioClick && (
                  <button
                    type="button"
                    onClick={onAddAudioClick}
                    className="text-[9px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-2 h-2" />
                    <span>Tambah Audio</span>
                  </button>
                )}
              </div>

              <div className="relative h-7 bg-white rounded-lg border border-slate-200 p-0.5 flex items-center">
                {audios.length === 0 ? (
                  <div
                    onClick={onAddAudioClick}
                    className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 italic cursor-pointer hover:text-amber-600 transition-colors"
                  >
                    + Klik untuk menambahkan musik latar
                  </div>
                ) : (
                  audios.map((aud) => {
                    const isSelected = selectedAudioId === aud.id;
                    const startPct =
                      totalDuration > 0
                        ? Math.max(0, Math.min(100, (aud.startTime / totalDuration) * 100))
                        : 0;
                    const durationPct =
                      totalDuration > 0
                        ? Math.max(
                            6,
                            Math.min(100 - startPct, (aud.duration / totalDuration) * 100)
                          )
                        : 30;

                    return (
                      <div
                        key={aud.id}
                        onClick={() => {
                          onSeek(aud.startTime);
                          if (onSelectAudio) onSelectAudio(aud.id);
                        }}
                        style={{ left: `${startPct}%`, width: `${durationPct}%` }}
                        className={`absolute h-5.5 rounded px-1.5 flex items-center justify-between gap-1 transition-all cursor-pointer overflow-hidden border shadow-2xs ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400/30 z-20'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200 z-10'
                        }`}
                        title={`Audio: ${aud.name}`}
                      >
                        <div className="flex items-center gap-1 min-w-0">
                          {aud.isMuted ? (
                            <VolumeX className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                          ) : (
                            <Volume2 className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                          )}
                          <span className="text-[9px] font-bold truncate">
                            {aud.name}
                          </span>
                        </div>
                        <span
                          className={`text-[8px] font-mono shrink-0 ${
                            isSelected ? 'text-amber-100' : 'text-amber-700'
                          }`}
                        >
                          {aud.isMuted ? 'Muted' : `${aud.volume}%`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* 5. TRACK SUBTITLE */}
          {(subtitles.length > 0 || activeOverlayModal === 'subtitle') && (
            <div className="space-y-0.5">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-1">
                <span className="flex items-center gap-1 text-purple-700">
                  <MessageSquare className="w-2.5 h-2.5 text-purple-600" />
                  <span>Track Subtitle ({subtitles.length})</span>
                </span>
                {onAddSubtitleClick && (
                  <button
                    type="button"
                    onClick={onAddSubtitleClick}
                    className="text-[9px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-2 h-2" />
                    <span>Tambah Subtitle</span>
                  </button>
                )}
              </div>

              <div className="relative h-7 bg-white rounded-lg border border-slate-200 p-0.5 flex items-center">
                {subtitles.length === 0 ? (
                  <div
                    onClick={onAddSubtitleClick}
                    className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 italic cursor-pointer hover:text-purple-600 transition-colors"
                  >
                    + Klik untuk menambahkan subtitle teks
                  </div>
                ) : (
                  subtitles.map((sub, idx) => {
                    const isSelected = selectedSubtitleId === sub.id;
                    const startPct =
                      totalDuration > 0
                        ? Math.max(0, Math.min(100, (sub.startTime / totalDuration) * 100))
                        : 0;
                    const durationPct =
                      totalDuration > 0
                        ? Math.max(
                            4,
                            Math.min(100 - startPct, ((sub.endTime - sub.startTime) / totalDuration) * 100)
                          )
                        : 15;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => {
                          onSeek(sub.startTime);
                          if (onSelectSubtitle) onSelectSubtitle(sub.id);
                        }}
                        style={{ left: `${startPct}%`, width: `${durationPct}%` }}
                        className={`absolute h-5.5 rounded px-1.5 flex items-center justify-between gap-1 transition-all cursor-pointer overflow-hidden border shadow-2xs ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-700 ring-2 ring-purple-500/30 z-20'
                            : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200 z-10'
                        }`}
                        title={`#${idx + 1} "${sub.text}"`}
                      >
                        <span className="text-[9px] font-bold truncate">
                          #{idx + 1} {sub.text || 'Kosong'}
                        </span>
                        <span
                          className={`text-[8px] font-mono shrink-0 ${
                            isSelected ? 'text-purple-100' : 'text-purple-600'
                          }`}
                        >
                          {(sub.endTime - sub.startTime).toFixed(1)}s
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
  );
};
