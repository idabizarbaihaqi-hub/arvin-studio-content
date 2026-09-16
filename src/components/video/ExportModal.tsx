import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Film,
  Play,
  Volume2,
  VolumeX,
  Crown,
  Lock,
  Sparkles,
  Info,
  ShieldCheck,
  Smartphone,
  Tv,
  Square,
  FileVideo,
} from 'lucide-react';
import {
  VideoClip,
  AspectRatio,
  TextOverlayItem,
  ImageOverlayItem,
  SubtitleItem,
  AudioTrackItem,
} from './types';
import { formatTime } from './videoUtils';
import {
  calculateEstimatedSizeMB,
  getSupportedVideoMimeType,
  renderProjectToVideo,
  RenderResult,
} from './renderEngine';
import { UserProfile } from '../../types';
import { verifyVideoEditorAccess } from '../../services/accessControlService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: VideoClip[];
  texts: TextOverlayItem[];
  images: ImageOverlayItem[];
  subtitles: SubtitleItem[];
  audios: AudioTrackItem[];
  aspectRatio: AspectRatio;
  rotation: number;
  originalAudioVolume: number;
  isOriginalAudioMuted: boolean;
  currentUser?: UserProfile | null;
  isSuperAdmin?: boolean;
  onNavigateToPremium?: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  clips,
  texts,
  images,
  subtitles,
  audios,
  aspectRatio,
  rotation,
  originalAudioVolume,
  isOriginalAudioMuted,
  currentUser,
  isSuperAdmin,
  onNavigateToPremium,
}) => {
  // Settings
  const [resolution, setResolution] = useState<'original' | '1080p' | '720p'>('1080p');
  const [quality, setQuality] = useState<'standard' | 'high'>('high');

  // Process states
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStep, setProgressStep] = useState<string>('');
  const [renderResult, setRenderResult] = useState<RenderResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Security / Premium Validation
  const [isVerifyingAccess, setIsVerifyingAccess] = useState<boolean>(false);
  const [isAccessAllowed, setIsAccessAllowed] = useState<boolean>(true);

  // Abort controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Total duration calculation
  const totalDuration = clips.reduce((acc, c) => {
    const speed = c.speed || 1;
    const dur = (c.trimEnd - c.trimStart) / speed;
    return acc + Math.max(0, dur);
  }, 0);

  // Supported format info
  const formatInfo = getSupportedVideoMimeType();
  const formatBadge = formatInfo.extension.toUpperCase();

  // Estimated file size in MB
  const estimatedSizeMB = calculateEstimatedSizeMB(totalDuration, resolution, quality);

  // Resolusi sumber video pertama untuk deteksi original
  const primaryClip = clips[0];
  const sourceWidth = primaryClip?.width || 1080;
  const sourceHeight = primaryClip?.height || 1920;
  const isSource720pOrBelow = Math.max(sourceWidth, sourceHeight) <= 1280;

  // Verifikasi akses Premium saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function checkAuth() {
      setIsVerifyingAccess(true);
      try {
        const res = await verifyVideoEditorAccess(currentUser);
        if (isMounted) {
          setIsAccessAllowed(res.allowed);
        }
      } catch (err) {
        console.error('Verifikasi export gagal:', err);
        if (isMounted) {
          setIsAccessAllowed(false);
        }
      } finally {
        if (isMounted) {
          setIsVerifyingAccess(false);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser]);

  // Handle Ekspor Mulai
  const handleStartExport = async () => {
    // 1. Verifikasi keamanan Premium & Super Admin sekali lagi
    try {
      const accessCheck = await verifyVideoEditorAccess(currentUser);
      if (!accessCheck.allowed) {
        setIsAccessAllowed(false);
        return;
      }
    } catch {
      setIsAccessAllowed(false);
      return;
    }

    // 2. Mulai rendering riil
    setIsRendering(true);
    setProgressPercent(0);
    setProgressStep('Mempersiapkan render engine...');
    setErrorMessage(null);
    setRenderResult(null);

    abortControllerRef.current = new AbortController();

    try {
      const result = await renderProjectToVideo({
        clips,
        texts,
        images,
        subtitles,
        audios,
        aspectRatio,
        resolution,
        quality,
        rotation,
        originalAudioVolume,
        isOriginalAudioMuted,
        onProgress: (percent, stepText) => {
          setProgressPercent(percent);
          setProgressStep(stepText);
        },
        signal: abortControllerRef.current.signal,
      });

      setRenderResult(result);
    } catch (err: unknown) {
      console.error('Error saat render video:', err);
      const msg = err instanceof Error ? err.message : 'Terjadi kegagalan saat rendering video.';
      if (!msg.includes('dibatalkan')) {
        setErrorMessage(
          msg.includes('MediaRecorder') || msg.includes('encoding')
            ? 'Browser atau perangkat Anda tidak mendukung proses enkripsi video ini. Harap gunakan browser Chrome atau Edge terbaru.'
            : msg
        );
      }
    } finally {
      setIsRendering(false);
      abortControllerRef.current = null;
    }
  };

  // Batalkan rendering
  const handleCancelExport = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsRendering(false);
    setProgressPercent(0);
    setProgressStep('');
  };

  // Download video hasil render
  const handleDownload = () => {
    if (!renderResult) return;
    const a = document.createElement('a');
    a.href = renderResult.url;
    a.download = renderResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Reset untuk export ulang
  const handleReExport = () => {
    if (renderResult) {
      URL.revokeObjectURL(renderResult.url);
    }
    setRenderResult(null);
    setErrorMessage(null);
    setProgressPercent(0);
    setProgressStep('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="export-video-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={() => {
        if (!isRendering) onClose();
      }}
    >
      <div
        id="export-video-modal-card"
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                  EXPORT VIDEO
                </h3>
                {isSuperAdmin ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                    <ShieldCheck className="w-2.5 h-2.5" />
                    Admin
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5 shadow-2xs">
                    <Crown className="w-2.5 h-2.5 fill-white" />
                    PREMIUM
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Rasio {aspectRatio} • {clips.length} Klip • Durasi: {formatTime(totalDuration)}
              </p>
            </div>
          </div>

          {!isRendering && (
            <button
              id="btn-close-export-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-6 space-y-4">
          {/* A. JIKA STATUS USER FREE / TERKUNCI */}
          {!isAccessAllowed && !isVerifyingAccess ? (
            <div id="export-premium-lock-card" className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base sm:text-lg">
                  Upgrade ke Premium untuk Export Video
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Fitur Real Video Export dan rendering MP4 berkualitas tinggi hanya tersedia untuk pengguna
                  berlangganan <strong>Premium ARVIN STUDIO</strong> atau <strong>Super Admin</strong>.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-100 max-w-sm mx-auto text-left text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Keuntungan Export Premium:
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5 pl-1">
                  <li>Export video tanpa watermark</li>
                  <li>Mendukung resolusi Full HD 1080p & 720p</li>
                  <li>Encoding MP4 instan & kompatibel Android</li>
                  <li>Semua teks, logo, efek & filter terpasang rapi</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col gap-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToPremium?.();
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm py-3 px-4 rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                >
                  Upgrade ke Premium Sekarang
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-slate-500 hover:text-slate-800 py-1.5 cursor-pointer"
                >
                  Kembali ke Editor
                </button>
              </div>
            </div>
          ) : isVerifyingAccess ? (
            /* Loading saat verifikasi lisensi */
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-bold text-slate-700">Memeriksa lisensi akun...</p>
            </div>
          ) : errorMessage ? (
            /* B. TAMPILAN ERROR SAAT RENDER GAGAL */
            <div id="export-error-card" className="text-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Export Gagal</h4>
                <p className="text-xs text-rose-700 mt-1 max-w-sm mx-auto leading-relaxed bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                  {errorMessage}
                </p>
              </div>
              <div className="flex gap-2 max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={handleStartExport}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : renderResult ? (
            /* C. TAMPILAN SETELAH EXPORT BERHASIL (PREVIEW VIDEO FINAL & DOWNLOAD) */
            <div id="export-complete-view" className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="font-black text-slate-900 text-base sm:text-lg">
                  Export Complete ✓
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Video berhasil dibuat dan siap disimpan ke perangkat.
                </p>
              </div>

              {/* REAL VIDEO PREVIEW OF THE EXPORTED FILE */}
              <div className="relative bg-black rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex items-center justify-center max-h-[300px] sm:max-h-[360px] mx-auto">
                <video
                  id="rendered-video-preview"
                  src={renderResult.url}
                  controls
                  playsInline
                  autoPlay={false}
                  className="w-full h-full max-h-[300px] sm:max-h-[360px] object-contain"
                />
              </div>

              {/* File Info Meta */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Nama File:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[200px]">
                    {renderResult.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Resolusi:</span>
                  <span className="font-bold text-slate-800">
                    {renderResult.width} × {renderResult.height} ({aspectRatio})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ukuran File:</span>
                  <span className="font-bold text-emerald-700">
                    {(renderResult.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="font-bold text-blue-700">
                    {renderResult.extension.toUpperCase()} ({renderResult.mimeType.split(';')[0]})
                  </span>
                </div>
              </div>
            </div>
          ) : isRendering ? (
            /* D. TAMPILAN PROGRES EXPORT REAL-TIME */
            <div id="export-progress-view" className="py-8 space-y-5 text-center">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
              </div>

              <div>
                <div className="text-2xl font-black text-slate-900">
                  Exporting {progressPercent}%
                </div>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  {progressStep || 'Memproses video...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-150"
                />
              </div>

              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                Harap jangan menutup browser selama proses encoding berlangsung agar render terselesaikan dengan sempurna.
              </p>

              <div>
                <button
                  type="button"
                  onClick={handleCancelExport}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                >
                  Batalkan Ekspor
                </button>
              </div>
            </div>
          ) : (
            /* E. FORM PENGATURAN EXPORT VIDEO (Default View) */
            <>
              {/* 1. Resolution Selection */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-2">
                  Resolution
                </label>
                <div className="space-y-2">
                  {/* Original Option */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      resolution === 'original'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution-option"
                      checked={resolution === 'original'}
                      onChange={() => setResolution('original')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span>Original</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ({sourceWidth} × {sourceHeight})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mengikuti resolusi rekaman asli tanpa upscaling yang tidak perlu.
                      </p>
                    </div>
                  </label>

                  {/* 1080p Option */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      resolution === '1080p'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution-option"
                      checked={resolution === '1080p'}
                      onChange={() => setResolution('1080p')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <span>1080p Full HD</span>
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.2 rounded-md">
                          Rekomendasi
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kualitas tajam untuk Instagram Reels, TikTok, dan YouTube Shorts.
                      </p>
                      {isSource720pOrBelow && (
                        <p className="text-[10px] text-amber-600 mt-0.5 font-medium">
                          Catatan: Sumber video Anda 720p. Disarankan memilih 720p untuk performa terbaik.
                        </p>
                      )}
                    </div>
                  </label>

                  {/* 720p Option */}
                  <label
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      resolution === '720p'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution-option"
                      checked={resolution === '720p'}
                      onChange={() => setResolution('720p')}
                      className="mt-0.5 text-blue-600"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs">720p HD</div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Ukuran file lebih ringan, proses rendering lebih cepat & hemat baterai HP.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* 2. Format Specification */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Format
                </label>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FileVideo className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-800">
                      {formatBadge === 'MP4' ? 'MP4 (H.264 / AAC)' : 'WebM (H.264 / VP9)'}
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Kompatibel Android & Browser
                  </span>
                </div>
              </div>

              {/* 3. Quality Selection */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQuality('standard')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      quality === 'standard'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">Standard</div>
                    <div className="text-[10px] text-slate-400">Bitrate optimal & seimbang</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQuality('high')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      quality === 'high'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold">High Quality</div>
                    <div className="text-[10px] text-slate-400">Ketajaman visual maksimal</div>
                  </button>
                </div>
              </div>

              {/* 4. Estimated Size & Track Summary */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  Estimated Size & Detail
                </label>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                  <div className="flex justify-between">
                    <span>Estimasi Ukuran File:</span>
                    <span className="font-bold text-slate-900">~{estimatedSizeMB} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Rasio Aspek:</span>
                    <span className="font-bold text-slate-900">{aspectRatio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Durasi Video:</span>
                    <span className="font-bold text-slate-900">{formatTime(totalDuration)}</span>
                  </div>

                  {/* Overlays to bake */}
                  {(texts.length > 0 || images.length > 0 || subtitles.length > 0 || audios.length > 0) && (
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1 text-[10px]">
                      {texts.length > 0 && (
                        <span className="bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                          {texts.length} Teks
                        </span>
                      )}
                      {images.length > 0 && (
                        <span className="bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded">
                          {images.length} Logo/Gambar
                        </span>
                      )}
                      {subtitles.length > 0 && (
                        <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                          {subtitles.length} Subtitle
                        </span>
                      )}
                      {audios.length > 0 && (
                        <span className="bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                          Musik Latar Aktif
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer (Sticky) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50/90 flex items-center gap-2 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          {renderResult ? (
            /* Selesai: Tampilkan Preview, Simpan/Download, Export Lagi */
            <div className="w-full flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                id="btn-download-exported-video"
                onClick={handleDownload}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Simpan / Download Video</span>
              </button>

              <button
                type="button"
                onClick={handleReExport}
                className="px-4 py-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Export Lagi
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          ) : !isAccessAllowed ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
            >
              Tutup
            </button>
          ) : isRendering ? (
            <div className="w-full flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-semibold text-blue-600">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Sedang memproses video...
              </span>
              <button
                type="button"
                onClick={handleCancelExport}
                className="text-rose-600 hover:underline font-bold"
              >
                Batalkan
              </button>
            </div>
          ) : (
            /* Default: [ CANCEL ] [ EXPORT VIDEO ] */
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 sm:py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                CANCEL
              </button>

              <button
                type="button"
                id="btn-confirm-start-export"
                onClick={handleStartExport}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>EXPORT VIDEO</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
