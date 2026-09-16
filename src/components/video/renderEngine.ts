import {
  VideoClip,
  AspectRatio,
  TextOverlayItem,
  ImageOverlayItem,
  SubtitleItem,
  AudioTrackItem,
} from './types';
import {
  computeVideoFilterStyle,
  computeClipEffectsStyle,
  computeTransitionState,
} from './videoUtils';
import { getPresetCoordinates } from './overlayUtils';

export interface RenderResolutionOption {
  id: 'original' | '1080p' | '720p';
  label: string;
  description: string;
  width: number;
  height: number;
}

export interface RenderOptions {
  clips: VideoClip[];
  texts: TextOverlayItem[];
  images: ImageOverlayItem[];
  subtitles: SubtitleItem[];
  audios: AudioTrackItem[];
  aspectRatio: AspectRatio;
  resolution: 'original' | '1080p' | '720p';
  quality: 'standard' | 'high';
  rotation: number;
  originalAudioVolume: number;
  isOriginalAudioMuted: boolean;
  onProgress: (percent: number, stepText: string) => void;
  signal?: AbortSignal;
}

export interface RenderResult {
  blob: Blob;
  url: string;
  mimeType: string;
  extension: string;
  filename: string;
  width: number;
  height: number;
  duration: number;
  sizeBytes: number;
}

/**
 * Deteksi format video dan codec terbaik yang didukung browser/Android
 */
export function getSupportedVideoMimeType(): { mimeType: string; extension: string } {
  if (typeof MediaRecorder === 'undefined') {
    return { mimeType: '', extension: 'mp4' };
  }

  // Prioritaskan MP4 (AVC1 / H.264) untuk kompatibilitas maksimal Android & Browser
  const candidateTypes: Array<{ type: string; ext: string }> = [
    { type: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
    { type: 'video/mp4;codecs=avc1,mp4a.40.2', ext: 'mp4' },
    { type: 'video/mp4;codecs=h264,aac', ext: 'mp4' },
    { type: 'video/mp4;codecs=h264', ext: 'mp4' },
    { type: 'video/mp4', ext: 'mp4' },
    // WebM fallback jika browser belum mendukung MP4 recorder langsung
    { type: 'video/webm;codecs=h264,opus', ext: 'webm' },
    { type: 'video/webm;codecs=h264', ext: 'webm' },
    { type: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { type: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { type: 'video/webm', ext: 'webm' },
  ];

  for (const candidate of candidateTypes) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.type)) {
        return { mimeType: candidate.type, extension: candidate.ext };
      }
    } catch {
      // Ignore support check errors
    }
  }

  return { mimeType: '', extension: 'mp4' };
}

/**
 * Hitung dimensi kanvas target berdasarkan aspect ratio dan resolusi
 * Memastikan dimensi adalah bilangan genap (w % 2 === 0, h % 2 === 0)
 */
export function calculateTargetDimensions(
  aspectRatio: AspectRatio,
  resolution: 'original' | '1080p' | '720p',
  sourceWidth?: number,
  sourceHeight?: number
): { width: number; height: number } {
  let w = 1080;
  let h = 1920;

  if (aspectRatio === '9:16') {
    if (resolution === '1080p') {
      w = 1080;
      h = 1920;
    } else if (resolution === '720p') {
      w = 720;
      h = 1280;
    } else {
      // Original
      if (sourceWidth && sourceHeight && sourceHeight > sourceWidth) {
        // Source sudah vertikal
        const factor = Math.min(1, 1920 / sourceHeight);
        w = Math.round(sourceWidth * factor);
        h = Math.round(sourceHeight * factor);
      } else {
        // Fallback ke 1080p vertical
        w = 1080;
        h = 1920;
      }
    }
  } else if (aspectRatio === '16:9') {
    if (resolution === '1080p') {
      w = 1920;
      h = 1080;
    } else if (resolution === '720p') {
      w = 1280;
      h = 720;
    } else {
      // Original
      if (sourceWidth && sourceHeight && sourceWidth >= sourceHeight) {
        const factor = Math.min(1, 1920 / sourceWidth);
        w = Math.round(sourceWidth * factor);
        h = Math.round(sourceHeight * factor);
      } else {
        w = 1920;
        h = 1080;
      }
    }
  } else if (aspectRatio === '1:1') {
    if (resolution === '1080p') {
      w = 1080;
      h = 1080;
    } else if (resolution === '720p') {
      w = 720;
      h = 720;
    } else {
      const minDim = Math.min(sourceWidth || 1080, sourceHeight || 1080);
      const size = Math.min(1080, minDim);
      w = size;
      h = size;
    }
  }

  // Enforce even dimensions (wajib untuk video codecs)
  w = w - (w % 2);
  h = h - (h % 2);

  return { width: Math.max(360, w), height: Math.max(360, h) };
}

/**
 * Hitung bitrate video dan audio berdasarkan resolusi & kualitas
 */
export function getBitrateConfig(
  resolution: 'original' | '1080p' | '720p',
  quality: 'standard' | 'high'
): { videoBitrate: number; audioBitrate: number } {
  let videoBitrate = 4_500_000; // 4.5 Mbps default
  const audioBitrate = 128_000; // 128 kbps stereo

  if (resolution === '1080p') {
    videoBitrate = quality === 'high' ? 8_000_000 : 5_000_000;
  } else {
    videoBitrate = quality === 'high' ? 4_500_000 : 2_500_000;
  }

  return { videoBitrate, audioBitrate };
}

/**
 * Hitung estimasi ukuran file secara matematis akurat (dalam Megabytes)
 */
export function calculateEstimatedSizeMB(
  durationSeconds: number,
  resolution: 'original' | '1080p' | '720p',
  quality: 'standard' | 'high'
): number {
  if (durationSeconds <= 0) return 0;
  const { videoBitrate, audioBitrate } = getBitrateConfig(resolution, quality);
  const totalBits = (videoBitrate + audioBitrate) * durationSeconds;
  const megabytes = totalBits / (8 * 1024 * 1024);
  return Math.max(0.1, Number(megabytes.toFixed(1)));
}

/**
 * Helper untuk memuat gambar async ke HTMLImageElement
 */
function preloadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar overlay: ${url}`));
    img.src = url;
  });
}

/**
 * Helper menunggu video seek selesai
 */
function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked);
      resolve();
    };
    video.addEventListener('seeked', onSeeked);
    video.currentTime = Math.max(0, time);
  });
}

/**
 * Eksekusi rendering proyek video secara riil menghasilkan file MP4/WebM final
 */
export async function renderProjectToVideo(options: RenderOptions): Promise<RenderResult> {
  const {
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
    onProgress,
    signal,
  } = options;

  if (clips.length === 0) {
    throw new Error('Tidak ada klip video untuk diekspor.');
  }

  if (typeof MediaRecorder === 'undefined') {
    throw new Error(
      'Browser Anda tidak mendukung MediaRecorder. Harap gunakan browser Chrome, Edge, atau Safari modern.'
    );
  }

  const { mimeType, extension } = getSupportedVideoMimeType();
  if (!mimeType) {
    throw new Error(
      'Perangkat atau browser Anda tidak mendukung format encoding video yang diperlukan.'
    );
  }

  onProgress(2, 'Menghitung durasi & resolusi video...');

  // 1. Hitung total durasi efektif dari semua klip dengan kecepatan masing-masing
  let totalEffectiveDuration = 0;
  const clipRanges: Array<{
    clip: VideoClip;
    globalStart: number;
    globalEnd: number;
    effectiveDuration: number;
  }> = [];

  for (const clip of clips) {
    const speed = Math.max(0.25, clip.speed || 1);
    const clipRawDuration = Math.max(0.1, clip.trimEnd - clip.trimStart);
    const effectiveDuration = clipRawDuration / speed;
    const globalStart = totalEffectiveDuration;
    const globalEnd = globalStart + effectiveDuration;
    clipRanges.push({ clip, globalStart, globalEnd, effectiveDuration });
    totalEffectiveDuration += effectiveDuration;
  }

  if (totalEffectiveDuration <= 0) {
    throw new Error('Total durasi klip video tidak valid.');
  }

  // 2. Hitung resolusi kanvas target
  const primaryClip = clips[0];
  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    aspectRatio,
    resolution,
    primaryClip.width,
    primaryClip.height
  );

  const { videoBitrate, audioBitrate } = getBitrateConfig(resolution, quality);

  onProgress(5, 'Menyiapkan canvas & aset grafis...');

  // 3. Siapkan Offscreen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) {
    throw new Error('Gagal menginisialisasi konteks 2D rendering canvas.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 4. Preload gambar overlay (logo / sticker)
  const loadedImagesMap: { [id: string]: HTMLImageElement } = {};
  for (const imgItem of images) {
    try {
      loadedImagesMap[imgItem.id] = await preloadImage(imgItem.url);
    } catch (e) {
      console.warn('Gagal memuat gambar overlay saat export:', e);
    }
  }

  onProgress(8, 'Menyiapkan sistem audio mixing...');

  // 5. Inisialisasi Web Audio API Context untuk mixing suara video & musik latar
  const AudioCtxClass =
    window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioCtxClass();
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  const audioDest = audioCtx.createMediaStreamDestination();
  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 1.0;
  masterGain.connect(audioDest);

  // Video Element terisolasi untuk rendering klip
  const videoEl = document.createElement('video');
  videoEl.crossOrigin = 'anonymous';
  videoEl.playsInline = true;
  videoEl.muted = false;
  videoEl.volume = 1.0;

  // Sambungkan audio dari video element ke audio mixer
  let videoAudioSource: MediaElementAudioSourceNode | null = null;
  const videoGain = audioCtx.createGain();
  videoGain.gain.value = isOriginalAudioMuted ? 0 : Math.max(0, originalAudioVolume / 100);
  videoGain.connect(masterGain);

  try {
    videoAudioSource = audioCtx.createMediaElementSource(videoEl);
    videoAudioSource.connect(videoGain);
  } catch (err) {
    console.warn('MediaElementSource untuk video element:', err);
  }

  // Sambungkan audio tracks (backsound musik latar)
  interface ActiveAudioSource {
    item: AudioTrackItem;
    audioEl: HTMLAudioElement;
    gainNode: GainNode;
  }
  const audioTrackSources: ActiveAudioSource[] = [];

  for (const track of audios) {
    try {
      const aEl = new Audio();
      aEl.crossOrigin = 'anonymous';
      aEl.src = track.url;
      aEl.preload = 'auto';

      const aSource = audioCtx.createMediaElementSource(aEl);
      const aGain = audioCtx.createGain();
      aGain.gain.value = track.isMuted ? 0 : Math.max(0, (track.volume ?? 100) / 100);
      aSource.connect(aGain);
      aGain.connect(masterGain);

      audioTrackSources.push({ item: track, audioEl: aEl, gainNode: aGain });
    } catch (err) {
      console.warn('Gagal menghubungkan audio track ke mixer:', err);
    }
  }

  // 6. Siapkan MediaRecorder
  const fps = 30;
  const canvasStream = canvas.captureStream(fps);
  const combinedAudioTracks = audioDest.stream.getAudioTracks();

  const tracksToRecord: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
  if (combinedAudioTracks.length > 0) {
    tracksToRecord.push(...combinedAudioTracks);
  }

  const combinedStream = new MediaStream(tracksToRecord);
  const recordedChunks: Blob[] = [];

  const recorderOptions: MediaRecorderOptions = {
    mimeType,
    videoBitsPerSecond: videoBitrate,
  };
  if (combinedAudioTracks.length > 0) {
    recorderOptions.audioBitsPerSecond = audioBitrate;
  }

  const recorder = new MediaRecorder(combinedStream, recorderOptions);
  recorder.ondataavailable = (event: BlobEvent) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  onProgress(10, 'Memulai perekaman video final...');
  recorder.start(100); // Kumpulkan data chunk setiap 100ms

  // Scale factor untuk teks & subtitle berdasarkan tinggi canvas (standar stage ~600px)
  const fontScale = targetHeight / 640;

  // 7. Loop Rendering Klip demi Klip
  try {
    for (let clipIndex = 0; clipIndex < clipRanges.length; clipIndex++) {
      if (signal?.aborted) {
        throw new Error('Proses ekspor video dibatalkan oleh pengguna.');
      }

      const { clip, globalStart, effectiveDuration } = clipRanges[clipIndex];
      const clipSpeed = Math.max(0.25, clip.speed || 1);

      onProgress(
        Math.min(96, Math.round((globalStart / totalEffectiveDuration) * 90) + 10),
        `Memproses klip ${clipIndex + 1} dari ${clips.length} ("${clip.name}")...`
      );

      // Muat URL klip ke video element
      if (videoEl.src !== clip.url) {
        videoEl.src = clip.url;
        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => {
            videoEl.removeEventListener('loadedmetadata', onLoaded);
            videoEl.removeEventListener('error', onError);
            resolve();
          };
          const onError = () => {
            videoEl.removeEventListener('loadedmetadata', onLoaded);
            videoEl.removeEventListener('error', onError);
            reject(new Error(`Gagal memuat file klip "${clip.name}"`));
          };
          videoEl.addEventListener('loadedmetadata', onLoaded);
          videoEl.addEventListener('error', onError);
        });
      }

      // Seek ke titik trimStart
      await seekVideo(videoEl, clip.trimStart);

      // Set kecepatan pemutaran klip
      videoEl.playbackRate = clipSpeed;

      // Jalankan pemutaran klip
      await videoEl.play();

      // Monitor pemutaran klip hingga mencapai trimEnd
      await new Promise<void>((resolve, reject) => {
        let isClipEnded = false;

        const checkEndInterval = setInterval(() => {
          if (signal?.aborted) {
            clearInterval(checkEndInterval);
            videoEl.pause();
            reject(new Error('Proses ekspor video dibatalkan oleh pengguna.'));
            return;
          }

          const currentClipTime = videoEl.currentTime;
          const elapsedInClip = Math.max(0, currentClipTime - clip.trimStart);
          const currentGlobalTime = globalStart + elapsedInClip / clipSpeed;

          // Periksa pemutaran backsound musik latar yang aktif di titik waktu ini
          for (const aSrc of audioTrackSources) {
            const trk = aSrc.item;
            const inRange =
              currentGlobalTime >= trk.startTime &&
              currentGlobalTime <= trk.startTime + trk.duration;
            if (inRange) {
              if (aSrc.audioEl.paused) {
                const trkOffset = Math.max(0, currentGlobalTime - trk.startTime) + (trk.trimStart || 0);
                aSrc.audioEl.currentTime = trkOffset;
                aSrc.audioEl.play().catch(() => {});
              }
            } else {
              if (!aSrc.audioEl.paused) {
                aSrc.audioEl.pause();
              }
            }
          }

          // Render satu frame ke canvas
          renderCanvasFrame({
            ctx,
            canvas,
            targetWidth,
            targetHeight,
            videoEl,
            clip,
            clips,
            currentClipTime,
            currentGlobalTime,
            rotation,
            texts,
            images,
            subtitles,
            loadedImagesMap,
            fontScale,
          });

          // Update Progress
          const currentPercent = Math.min(
            96,
            10 + Math.round((currentGlobalTime / totalEffectiveDuration) * 85)
          );
          onProgress(
            currentPercent,
            `Merender klip ${clipIndex + 1}/${clips.length} (${currentPercent}%)`
          );

          // Cek batas trimEnd klip
          if (videoEl.currentTime >= clip.trimEnd - 0.04 || videoEl.ended) {
            if (!isClipEnded) {
              isClipEnded = true;
              clearInterval(checkEndInterval);
              videoEl.pause();
              resolve();
            }
          }
        }, 1000 / fps);
      });
    }

    // Hentikan semua audio backsound
    for (const aSrc of audioTrackSources) {
      if (!aSrc.audioEl.paused) {
        aSrc.audioEl.pause();
      }
    }

    onProgress(97, 'Menyelesaikan enkripsi & finalisasi video MP4...');

    // Biarkan recorder mengumpulkan frame terakhir selama 200ms
    await new Promise((r) => setTimeout(r, 200));

    // Hentikan perekaman dan kumpulkan Blob
    const finalBlob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        try {
          const completeBlob = new Blob(recordedChunks, { type: mimeType });
          resolve(completeBlob);
        } catch (e) {
          reject(e);
        }
      };
      recorder.onerror = (e) => reject(e);
      recorder.stop();
    });

    onProgress(100, 'Export Video Berhasil!');

    // Format nama file yang rapi & aman
    const dateStr = new Date().toISOString().slice(0, 10);
    const aspectStr = aspectRatio.replace(':', 'x');
    const safeFilename = `arvin-studio-${aspectStr}-${resolution}-${dateStr}.${extension}`;

    const finalUrl = URL.createObjectURL(finalBlob);

    return {
      blob: finalBlob,
      url: finalUrl,
      mimeType,
      extension,
      filename: safeFilename,
      width: targetWidth,
      height: targetHeight,
      duration: totalEffectiveDuration,
      sizeBytes: finalBlob.size,
    };
  } finally {
    // 8. Cleanup Sumber Daya (Mencegah kebocoran memori pada smartphone)
    try {
      videoEl.pause();
      videoEl.src = '';
      videoEl.load();

      for (const aSrc of audioTrackSources) {
        aSrc.audioEl.pause();
        aSrc.audioEl.src = '';
      }

      combinedStream.getTracks().forEach((trk) => trk.stop());
      canvasStream.getTracks().forEach((trk) => trk.stop());

      if (audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Fungsi menggambar satu frame penuh ke canvas:
 * 1. Background
 * 2. Color adjustments & filter presets (ctx.filter)
 * 3. Efek video & transitions (transform, overlayColor)
 * 4. Video frame (object-contain scaling)
 * 5. Text overlays (font, animasi, background box)
 * 6. Image / Logo overlays (position, scale, opacity)
 * 7. Subtitles (background pill, timing, position)
 */
function renderCanvasFrame(params: {
  ctx: CanvasRenderingContext2D;
  canvas: HTMLCanvasElement;
  targetWidth: number;
  targetHeight: number;
  videoEl: HTMLVideoElement;
  clip: VideoClip;
  clips: VideoClip[];
  currentClipTime: number;
  currentGlobalTime: number;
  rotation: number;
  texts: TextOverlayItem[];
  images: ImageOverlayItem[];
  subtitles: SubtitleItem[];
  loadedImagesMap: { [id: string]: HTMLImageElement };
  fontScale: number;
}) {
  const {
    ctx,
    targetWidth,
    targetHeight,
    videoEl,
    clip,
    clips,
    currentClipTime,
    currentGlobalTime,
    rotation,
    texts,
    images,
    subtitles,
    loadedImagesMap,
    fontScale,
  } = params;

  // A. Bersihkan kanvas dengan warna hitam pekat
  ctx.save();
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // B. Hitung filter warna & penyesuaian (Brightness, Contrast, Saturation, Temp, Tint, dll.)
  const colorFilterStyle = computeVideoFilterStyle(clip.adjustments, clip.filter);

  // C. Hitung efek visual klip aktif (Tahap 4)
  const clipLocalTime = Math.max(0, currentClipTime - clip.trimStart);
  const effectStyle = computeClipEffectsStyle(clip, clipLocalTime, true);

  // D. Hitung transisi antar klip (Tahap 4)
  const transitionState = computeTransitionState(clips, currentGlobalTime);

  // Gabungkan CSS filter untuk Canvas 2D
  const activeFilters = [
    colorFilterStyle !== 'none' ? colorFilterStyle : '',
    effectStyle.filter,
    transitionState.isActive ? transitionState.filter : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  ctx.filter = activeFilters || 'none';

  // E. Hitung Transformasi Video (Rotasi + Efek Motion + Transisi)
  ctx.save();
  ctx.translate(targetWidth / 2, targetHeight / 2);

  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  // Terapkan Zoom / Shake dari Effects jika ada
  if (effectStyle.hasActiveEffect && effectStyle.transform) {
    applyCssTransformToCanvas(ctx, effectStyle.transform);
  }

  // Terapkan Transform Transisi jika aktif
  if (transitionState.isActive && transitionState.transform) {
    applyCssTransformToCanvas(ctx, transitionState.transform);
  }

  // F. Gambar frame video dengan kalkulasi `object-contain`
  const vWidth = videoEl.videoWidth || targetWidth;
  const vHeight = videoEl.videoHeight || targetHeight;

  let drawW = targetWidth;
  let drawH = targetHeight;
  const targetAspect = targetWidth / targetHeight;
  const videoAspect = vWidth / vHeight;

  if (videoAspect > targetAspect) {
    drawW = targetWidth;
    drawH = targetWidth / videoAspect;
  } else {
    drawH = targetHeight;
    drawW = targetHeight * videoAspect;
  }

  ctx.drawImage(videoEl, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore(); // Kembalikan koordinat pusat
  ctx.filter = 'none'; // Reset filter agar tidak mempengaruhi teks & overlay

  // G. Terapkan Overlay Warna Efek (misal: Flash putih, Fade hitam)
  if (effectStyle.overlayColor && effectStyle.overlayOpacity && effectStyle.overlayOpacity > 0) {
    ctx.fillStyle = effectStyle.overlayColor;
    ctx.globalAlpha = Math.max(0, Math.min(1, effectStyle.overlayOpacity));
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.globalAlpha = 1.0;
  }

  // Terapkan Overlay Warna Transisi (misal: Fade to black, Flash white, Dissolve)
  if (
    transitionState.isActive &&
    transitionState.overlayColor &&
    transitionState.overlayOpacity &&
    transitionState.overlayOpacity > 0
  ) {
    ctx.fillStyle = transitionState.overlayColor;
    ctx.globalAlpha = Math.max(0, Math.min(1, transitionState.overlayOpacity));
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.globalAlpha = 1.0;
  }

  // H. RENDER IMAGE / LOGO OVERLAYS (Tahap 5)
  for (const imgItem of images) {
    if (currentGlobalTime >= imgItem.startTime && currentGlobalTime <= imgItem.endTime) {
      const imgElement = loadedImagesMap[imgItem.id];
      if (imgElement && imgElement.naturalWidth > 0) {
        ctx.save();
        const posX = (imgItem.x / 100) * targetWidth;
        const posY = (imgItem.y / 100) * targetHeight;
        const scale = (imgItem.scale ?? 100) / 100;
        const opacity = (imgItem.opacity ?? 100) / 100;
        const rot = imgItem.rotation ?? 0;

        ctx.translate(posX, posY);
        if (rot !== 0) {
          ctx.rotate((rot * Math.PI) / 180);
        }
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

        // Gambar proporsional dengan skala kanvas
        const baseWidth = Math.min(targetWidth * 0.35, imgElement.naturalWidth * fontScale * 0.6);
        const aspect = imgElement.naturalWidth / imgElement.naturalHeight;
        const renderW = baseWidth * scale;
        const renderH = (baseWidth / aspect) * scale;

        ctx.drawImage(imgElement, -renderW / 2, -renderH / 2, renderW, renderH);
        ctx.restore();
      }
    }
  }

  // I. RENDER TEXT OVERLAYS (Tahap 5)
  for (const txt of texts) {
    if (currentGlobalTime >= txt.startTime && currentGlobalTime <= txt.endTime) {
      renderTextOverlayOnCanvas(ctx, txt, currentGlobalTime, targetWidth, targetHeight, fontScale);
    }
  }

  // J. RENDER SUBTITLES (Tahap 5)
  for (const sub of subtitles) {
    if (currentGlobalTime >= sub.startTime && currentGlobalTime <= sub.endTime) {
      renderSubtitleOnCanvas(ctx, sub, targetWidth, targetHeight, fontScale);
    }
  }

  ctx.restore();
}

/**
 * Parsing dan penerapan string transform CSS sederhana ke konteks Canvas
 */
function applyCssTransformToCanvas(ctx: CanvasRenderingContext2D, transformStr: string) {
  // Regex mencari scale, rotate, translate
  const scaleMatch = transformStr.match(/scale\(([^)]+)\)/);
  if (scaleMatch) {
    const s = parseFloat(scaleMatch[1]);
    if (!isNaN(s)) ctx.scale(s, s);
  }

  const rotateMatch = transformStr.match(/rotate\(([^)]+)deg\)/);
  if (rotateMatch) {
    const r = parseFloat(rotateMatch[1]);
    if (!isNaN(r)) ctx.rotate((r * Math.PI) / 180);
  }

  const translateMatch = transformStr.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
  if (translateMatch) {
    const tx = parseFloat(translateMatch[1]);
    const ty = parseFloat(translateMatch[2]);
    if (!isNaN(tx) && !isNaN(ty)) ctx.translate(tx, ty);
  }
}

/**
 * Menggambar teks overlay dengan styling font, alignment, background box, dan animasi
 */
function renderTextOverlayOnCanvas(
  ctx: CanvasRenderingContext2D,
  item: TextOverlayItem,
  currentTime: number,
  targetWidth: number,
  targetHeight: number,
  fontScale: number
) {
  const duration = Math.max(0.2, item.endTime - item.startTime);
  const elapsed = currentTime - item.startTime;
  const remaining = duration - elapsed;
  const animTime = Math.min(0.35, duration / 3);

  let animOpacity = 1;
  let animTranslateY = 0;
  let animTranslateX = 0;
  let animScale = 1;

  const anim = item.animation || 'none';
  switch (anim) {
    case 'fade-in':
      if (elapsed < animTime) animOpacity = Math.max(0, elapsed / animTime);
      break;
    case 'fade-out':
      if (remaining < animTime) animOpacity = Math.max(0, remaining / animTime);
      break;
    case 'fade-in-out':
      if (elapsed < animTime) animOpacity = Math.max(0, elapsed / animTime);
      else if (remaining < animTime) animOpacity = Math.max(0, remaining / animTime);
      break;
    case 'slide-up':
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = p;
        animTranslateY = (1 - p) * 35 * fontScale;
      }
      break;
    case 'slide-down':
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = p;
        animTranslateY = -(1 - p) * 35 * fontScale;
      }
      break;
    case 'pop':
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = p;
        animScale = 0.5 + 0.5 * Math.sin((p * Math.PI) / 2);
      }
      break;
  }

  const baseOpacity = (item.opacity ?? 100) / 100;
  const finalOpacity = Math.max(0, Math.min(1, baseOpacity * animOpacity));

  const posX = (item.x / 100) * targetWidth + animTranslateX;
  const posY = (item.y / 100) * targetHeight + animTranslateY;

  // Ukuran font yang proporsional dengan kanvas hasil export
  const scaledFontSize = Math.max(14, Math.round(item.fontSize * fontScale));

  let fontFamily = 'sans-serif';
  if (item.fontFamily === 'serif') fontFamily = 'Georgia, serif';
  else if (item.fontFamily === 'bold') fontFamily = 'Impact, "Arial Black", sans-serif';
  else if (item.fontFamily === 'mono') fontFamily = 'monospace';

  const weightStr = item.fontWeight === 'bold' ? 'bold' : item.fontWeight === 'medium' ? '600' : 'normal';

  ctx.save();
  ctx.translate(posX, posY);
  if (animScale !== 1) {
    ctx.scale(animScale, animScale);
  }
  ctx.globalAlpha = finalOpacity;

  ctx.font = `${weightStr} ${scaledFontSize}px ${fontFamily}`;
  ctx.textBaseline = 'middle';

  const lines = item.text.split('\n');
  const lineHeight = scaledFontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;

  // Hitung lebar maksimal
  let maxLineWidth = 0;
  for (const line of lines) {
    const m = ctx.measureText(line);
    if (m.width > maxLineWidth) maxLineWidth = m.width;
  }

  const padX = item.background !== 'none' ? 16 * fontScale : 4;
  const padY = item.background !== 'none' ? 10 * fontScale : 2;
  const boxW = maxLineWidth + padX * 2;
  const boxH = totalTextHeight + padY * 2;

  // Gambar Background Box jika aktif
  if (item.background === 'solid' || item.background === 'semi') {
    ctx.fillStyle = item.backgroundColor || '#000000';
    if (item.background === 'semi') {
      ctx.globalAlpha = finalOpacity * ((item.bgOpacity ?? 60) / 100);
    }
    const radius = 8 * fontScale;
    drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, radius);
    ctx.fill();
    ctx.globalAlpha = finalOpacity;
  }

  // Tulis teks tiap baris
  ctx.fillStyle = item.color || '#ffffff';
  ctx.textAlign = item.alignment || 'center';

  if (item.background === 'none') {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 6 * fontScale;
    ctx.shadowOffsetY = 2 * fontScale;
  }

  let startY = -totalTextHeight / 2 + lineHeight / 2;
  for (const line of lines) {
    let lineX = 0;
    if (item.alignment === 'left') lineX = -maxLineWidth / 2;
    else if (item.alignment === 'right') lineX = maxLineWidth / 2;

    ctx.fillText(line, lineX, startY);
    startY += lineHeight;
  }

  ctx.restore();
}

/**
 * Menggambar subtitle pada kanvas
 */
function renderSubtitleOnCanvas(
  ctx: CanvasRenderingContext2D,
  sub: SubtitleItem,
  targetWidth: number,
  targetHeight: number,
  fontScale: number
) {
  const preset = sub.positionPreset || 'bottom-center';
  const coords = getPresetCoordinates(preset);

  const posX = (coords.x / 100) * targetWidth;
  const posY = (coords.y / 100) * targetHeight;

  const scaledFontSize = Math.max(16, Math.round((sub.fontSize || 18) * fontScale));

  ctx.save();
  ctx.font = `600 ${scaledFontSize}px system-ui, sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';

  const lines = sub.text.split('\n');
  const lineHeight = scaledFontSize * 1.35;
  const totalTextHeight = lines.length * lineHeight;

  let maxLineWidth = 0;
  for (const line of lines) {
    const m = ctx.measureText(line);
    if (m.width > maxLineWidth) maxLineWidth = m.width;
  }

  const padX = 18 * fontScale;
  const padY = 10 * fontScale;
  const boxW = maxLineWidth + padX * 2;
  const boxH = totalTextHeight + padY * 2;

  ctx.translate(posX, posY);

  // Background pill box
  if (sub.background !== 'none') {
    ctx.fillStyle = sub.background === 'solid' ? '#000000' : 'rgba(0, 0, 0, 0.75)';
    drawRoundedRect(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 10 * fontScale);
    ctx.fill();
  } else {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 8 * fontScale;
    ctx.shadowOffsetY = 2 * fontScale;
  }

  // Teks subtitle
  ctx.fillStyle = sub.color || '#ffffff';
  let startY = -totalTextHeight / 2 + lineHeight / 2;
  for (const line of lines) {
    ctx.fillText(line, 0, startY);
    startY += lineHeight;
  }

  ctx.restore();
}

/**
 * Helper menggambar persegi dengan sudut melengkung (rounded rectangle)
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
