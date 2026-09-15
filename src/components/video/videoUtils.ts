import {
  VideoClip,
  TimelinePosition,
  VideoAdjustment,
  VideoFilterPreset,
  TransitionType,
  ClipTransition,
  EffectType,
  VideoEffectItem,
} from './types';

export const DEFAULT_ADJUSTMENTS: VideoAdjustment = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  temperature: 0,
  tint: 0,
  sharpness: 0,
};

export const AUTO_ENHANCE_ADJUSTMENTS: VideoAdjustment = {
  brightness: 8,
  contrast: 14,
  saturation: 16,
  exposure: 6,
  highlights: -8,
  shadows: 12,
  temperature: 4,
  tint: 0,
  sharpness: 18,
};

export interface FilterPresetItem {
  id: VideoFilterPreset;
  name: string;
  badge?: string;
  description: string;
  previewColor: string;
  adjustments: VideoAdjustment;
}

export const FILTER_PRESET_ITEMS: FilterPresetItem[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'Warna asli rekaman tanpa efek',
    previewColor: 'from-slate-400 to-slate-600',
    adjustments: { ...DEFAULT_ADJUSTMENTS },
  },
  {
    id: 'natural',
    name: 'Natural',
    description: 'Pencahayaan seimbang & tone kulit alami',
    previewColor: 'from-amber-400 to-orange-400',
    adjustments: {
      brightness: 5,
      contrast: 8,
      saturation: 14,
      exposure: 4,
      highlights: -6,
      shadows: 8,
      temperature: 2,
      tint: 0,
      sharpness: 10,
    },
  },
  {
    id: 'vivid',
    name: 'Vivid',
    description: 'Warna kaya, tajam dan memikat',
    previewColor: 'from-rose-500 to-purple-600',
    adjustments: {
      brightness: 4,
      contrast: 20,
      saturation: 36,
      exposure: 6,
      highlights: -8,
      shadows: 8,
      temperature: 0,
      tint: 0,
      sharpness: 18,
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Tone film layar lebar dengan kontras dramatis',
    previewColor: 'from-teal-600 to-amber-700',
    adjustments: {
      brightness: -2,
      contrast: 25,
      saturation: -6,
      exposure: -4,
      highlights: -14,
      shadows: -8,
      temperature: -6,
      tint: 4,
      sharpness: 14,
    },
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Nuansa hangat keemasan ala Golden Hour',
    previewColor: 'from-amber-500 to-yellow-400',
    adjustments: {
      brightness: 6,
      contrast: 10,
      saturation: 16,
      exposure: 4,
      highlights: -6,
      shadows: 6,
      temperature: 34,
      tint: 6,
      sharpness: 8,
    },
  },
  {
    id: 'cool',
    name: 'Cool',
    description: 'Nuansa sejuk, bersih dan modern',
    previewColor: 'from-sky-400 to-indigo-600',
    adjustments: {
      brightness: 4,
      contrast: 12,
      saturation: 8,
      exposure: 2,
      highlights: -4,
      shadows: 4,
      temperature: -30,
      tint: -4,
      sharpness: 12,
    },
  },
  {
    id: 'bright',
    name: 'Bright',
    description: 'Pencahayaan tinggi & bersih untuk media sosial',
    previewColor: 'from-blue-300 to-emerald-300',
    adjustments: {
      brightness: 16,
      contrast: -4,
      saturation: 12,
      exposure: 18,
      highlights: -12,
      shadows: 20,
      temperature: 2,
      tint: 0,
      sharpness: 12,
    },
  },
  {
    id: 'nature',
    name: 'Nature 🌿',
    badge: 'Populer',
    description: 'Daun pucat jadi hijau segar & hidup alami',
    previewColor: 'from-emerald-500 to-green-600',
    adjustments: {
      brightness: 5,
      contrast: 15,
      saturation: 26,
      exposure: 5,
      highlights: -10,
      shadows: 10,
      temperature: 4,
      tint: -14, // Green tone boost (shifts color balance toward verdant foliage)
      sharpness: 18, // Leaf texture clarity
    },
  },
];


/**
 * Format detik ke format mm:ss (e.g., 00:07, 01:32)
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const padMin = String(mins).padStart(2, '0');
  const padSec = String(secs).padStart(2, '0');
  return `${padMin}:${padSec}`;
}

/**
 * Format ukuran file ke format KB / MB
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

/**
 * Ekstraksi metadata & thumbnail ringan (resolusi 120x80) dari file video.
 * Didesain efisien untuk smartphone tanpa membebani memori.
 */
export function generateVideoMetadataAndThumbnail(
  file: File
): Promise<{ duration: number; width: number; height: number; thumbnail?: string }> {
  return new Promise((resolve) => {
    // Validasi lingkungan browser
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      resolve({ duration: 0, width: 0, height: 0 });
      return;
    }

    const tempUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    let hasResolved = false;

    const cleanup = () => {
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(tempUrl);
    };

    // Safety timeout: jika perangkat lambat merender thumbnail, tetap kembalikan data dasar
    const timeoutId = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        const dur = video.duration && !isNaN(video.duration) ? video.duration : 5;
        const w = video.videoWidth || 1080;
        const h = video.videoHeight || 1920;
        cleanup();
        resolve({ duration: dur, width: w, height: h });
      }
    }, 4000);

    video.onloadedmetadata = () => {
      const dur = video.duration && !isNaN(video.duration) ? video.duration : 5;
      const w = video.videoWidth || 1080;
      const h = video.videoHeight || 1920;

      // Ambil frame pada detik ke-0.5 atau 10% durasi untuk thumbnail
      const targetSeek = Math.min(Math.max(0.2, dur * 0.1), dur > 1 ? dur - 0.5 : 0.1);
      video.currentTime = targetSeek;
    };

    video.onseeked = () => {
      if (hasResolved) return;
      hasResolved = true;
      clearTimeout(timeoutId);

      const dur = video.duration && !isNaN(video.duration) ? video.duration : 5;
      const w = video.videoWidth || 1080;
      const h = video.videoHeight || 1920;

      let thumbnailDataUrl: string | undefined;

      try {
        const canvas = document.createElement('canvas');
        // Ukuran thumbnail hemat memori: 120 x 80 px
        canvas.width = 120;
        canvas.height = Math.round((h / (w || 1)) * 120) || 80;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.55);
        }
      } catch (err) {
        console.warn('Gagal merender thumbnail frame:', err);
      }

      cleanup();
      resolve({
        duration: dur,
        width: w,
        height: h,
        thumbnail: thumbnailDataUrl,
      });
    };

    video.onerror = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeoutId);
        cleanup();
        resolve({ duration: 5, width: 1080, height: 1920 });
      }
    };

    video.src = tempUrl;
  });
}

/**
 * Hitung total durasi timeline dari seluruh klip gabungan
 */
export function calculateTotalDuration(clips: VideoClip[]): number {
  return clips.reduce((acc, c) => acc + Math.max(0, c.duration), 0);
}

/**
 * Mencari klip mana yang aktif pada posisi waktu global timeline
 */
export function findClipAtTime(
  clips: VideoClip[],
  globalTime: number
): TimelinePosition | null {
  if (clips.length === 0) return null;

  let accumulated = 0;
  const clampedTime = Math.max(0, globalTime);

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const clipEnd = accumulated + clip.duration;

    if (clampedTime >= accumulated && clampedTime < clipEnd) {
      const offset = clampedTime - accumulated;
      return {
        clipIndex: i,
        clip,
        clipStartTime: accumulated,
        localTime: clip.trimStart + offset,
      };
    }

    accumulated = clipEnd;
  }

  // Jika waktu berada di paling akhir timeline, pilih klip terakhir pada trimEnd-nya
  const lastIndex = clips.length - 1;
  const lastClip = clips[lastIndex];
  const lastClipStart = accumulated - lastClip.duration;
  return {
    clipIndex: lastIndex,
    clip: lastClip,
    clipStartTime: Math.max(0, lastClipStart),
    localTime: lastClip.trimEnd,
  };
}

/**
 * Menghasilkan filter CSS untuk preview visual video (kompatibilitas filter lama)
 */
export function getFilterStyle(filter: string): string {
  switch (filter) {
    case 'vibrant':
      return 'saturate(1.45) contrast(1.1)';
    case 'warm':
      return 'sepia(0.2) saturate(1.2) hue-rotate(-8deg)';
    case 'cool':
      return 'hue-rotate(15deg) saturate(1.1) brightness(1.03)';
    case 'cinematic':
      return 'contrast(1.22) saturate(0.88) brightness(0.96)';
    case 'bw':
      return 'grayscale(1) contrast(1.15)';
    case 'vintage':
      return 'sepia(0.4) contrast(0.95) brightness(1.05)';
    default:
      return 'none';
  }
}

/**
 * Menghitung CSS filter gabungan secara optimal untuk hardware acceleration GPU
 */
export function computeVideoFilterStyle(
  adj?: Partial<VideoAdjustment>,
  filter?: VideoFilterPreset
): string {
  const current: VideoAdjustment = {
    ...DEFAULT_ADJUSTMENTS,
    ...(adj || {}),
  };

  const {
    brightness,
    contrast,
    saturation,
    exposure,
    highlights,
    shadows,
    temperature,
    tint,
    sharpness,
  } = current;

  // Jika semua parameter 0 dan tanpa preset khusus, kembalikan 'none'
  const isDefault =
    brightness === 0 &&
    contrast === 0 &&
    saturation === 0 &&
    exposure === 0 &&
    highlights === 0 &&
    shadows === 0 &&
    temperature === 0 &&
    tint === 0 &&
    sharpness === 0 &&
    (!filter || filter === 'original');

  if (isDefault) {
    return 'none';
  }

  // 1. Brightness, Exposure, Shadows & Highlights
  const baseBrightness =
    1 +
    (brightness / 100) * 0.45 +
    (exposure / 100) * 0.4 +
    (shadows / 100) * 0.18 -
    (highlights / 100) * 0.08;
  const clampedBrightness = Math.max(0.1, Math.min(2.5, baseBrightness));

  // 2. Contrast & Sharpness/Clarity
  const baseContrast =
    1 +
    (contrast / 100) * 0.55 +
    (sharpness / 100) * 0.18;
  const clampedContrast = Math.max(0.2, Math.min(2.5, baseContrast));

  // 3. Saturation
  const baseSaturation = 1 + (saturation / 100) * 1.1;
  const clampedSaturation = Math.max(0, Math.min(3.0, baseSaturation));

  const filterParts: string[] = [
    `brightness(${clampedBrightness.toFixed(3)})`,
    `contrast(${clampedContrast.toFixed(3)})`,
    `saturate(${clampedSaturation.toFixed(3)})`,
  ];

  // 4. Temperature (Warm / Cool)
  if (temperature > 0) {
    const sepiaVal = Math.min(0.35, (temperature / 100) * 0.3);
    const warmHue = -(temperature / 100) * 12;
    filterParts.push(`sepia(${sepiaVal.toFixed(3)})`);
    filterParts.push(`hue-rotate(${warmHue.toFixed(1)}deg)`);
  } else if (temperature < 0) {
    const coolHue = (Math.abs(temperature) / 100) * 14;
    filterParts.push(`hue-rotate(${coolHue.toFixed(1)}deg)`);
  }

  // 5. Tint (-100 Hijau alami s.d. +100 Magenta)
  if (tint !== 0) {
    const tintShift = (tint / 100) * 18;
    filterParts.push(`hue-rotate(${tintShift.toFixed(1)}deg)`);
  }

  return filterParts.join(' ');
}

/**
 * Cek apakah klip memiliki adjustment atau filter aktif
 */
export function hasActiveAdjustments(
  adj?: Partial<VideoAdjustment>,
  filter?: VideoFilterPreset
): boolean {
  if (filter && filter !== 'original') return true;
  if (!adj) return false;
  return (
    adj.brightness !== 0 ||
    adj.contrast !== 0 ||
    adj.saturation !== 0 ||
    adj.exposure !== 0 ||
    adj.highlights !== 0 ||
    adj.shadows !== 0 ||
    adj.temperature !== 0 ||
    adj.tint !== 0 ||
    adj.sharpness !== 0
  );
}

// ==========================================
// TAHAP 4: TRANSITIONS & VIDEO EFFECTS
// ==========================================

export const TRANSITION_DURATION_OPTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2] as const;

export interface TransitionItem {
  id: TransitionType;
  name: string;
  badge?: string;
  description: string;
  category: 'basic' | 'motion' | 'zoom' | 'fx';
}

export const TRANSITION_ITEMS: TransitionItem[] = [
  {
    id: 'none',
    name: 'None',
    description: 'Potongan langsung (cut) tanpa animasi transisi',
    category: 'basic',
  },
  {
    id: 'fade',
    name: 'Fade to Black',
    badge: 'Populer',
    description: 'Memudar halus ke gelap lalu membuka klip baru',
    category: 'basic',
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    badge: 'Smooth',
    description: 'Peleburan bertahap antar dua gambar video',
    category: 'basic',
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    description: 'Pencampuran halus dua klip secara bersamaan',
    category: 'basic',
  },
  {
    id: 'slide-left',
    name: 'Slide Left',
    badge: 'Dinamis',
    description: 'Klip baru bergeser masuk dari arah kanan ke kiri',
    category: 'motion',
  },
  {
    id: 'slide-right',
    name: 'Slide Right',
    description: 'Klip baru bergeser masuk dari arah kiri ke kanan',
    category: 'motion',
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    description: 'Klip baru meluncur masuk dari arah bawah ke atas',
    category: 'motion',
  },
  {
    id: 'slide-down',
    name: 'Slide Down',
    description: 'Klip baru meluncur masuk dari arah atas ke bawah',
    category: 'motion',
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    badge: 'Punchy',
    description: 'Kamera zoom mendalam masuk ke klip berikutnya',
    category: 'zoom',
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    description: 'Kamera mundur membuka klip berikutnya',
    category: 'zoom',
  },
  {
    id: 'blur',
    name: 'Blur Motion',
    description: 'Efek kabur fokus dinamis saat perpindahan klip',
    category: 'fx',
  },
  {
    id: 'flash',
    name: 'White Flash',
    badge: 'Energetik',
    description: 'Kilatan cahaya putih dramatis & berenergi tinggi',
    category: 'fx',
  },
];

/**
 * Validasi dan batasi durasi transisi agar tidak melebihi durasi kedua klip yang berdekatan.
 */
export function getSafeTransitionDuration(
  clipA: { duration: number },
  clipB: { duration: number },
  desiredDuration: number
): number {
  const minClipDuration = Math.min(clipA.duration, clipB.duration);
  // Transisi maksimum tidak boleh melebihi 75% dari klip terpendek
  const maxSafe = Math.max(0.25, minClipDuration * 0.75);
  if (desiredDuration <= maxSafe) {
    return desiredDuration;
  }
  const valid = TRANSITION_DURATION_OPTIONS.filter((d) => d <= maxSafe);
  return valid.length > 0 ? valid[valid.length - 1] : 0.25;
}

// ==========================================
// VIDEO EFFECTS CATALOG & UTILS
// ==========================================

export interface EffectCatalogItem {
  id: EffectType;
  name: string;
  badge?: string;
  description: string;
  category: 'motion' | 'zoom' | 'cinematic' | 'stylize';
  defaultIntensity: number;
  supportsIntensity: boolean;
}

export const EFFECT_CATALOG_ITEMS: EffectCatalogItem[] = [
  {
    id: 'none',
    name: 'None',
    badge: 'Normal',
    description: 'Tanpa efek visual, video kembali ke tampilan standar',
    category: 'motion',
    defaultIntensity: 0,
    supportsIntensity: false,
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    badge: 'Fokus',
    description: 'Pergerakan zoom masuk dinamis ke arah subjek video',
    category: 'zoom',
    defaultIntensity: 50,
    supportsIntensity: true,
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    description: 'Pergerakan mundur perlahan membuka perspektif visual',
    category: 'zoom',
    defaultIntensity: 50,
    supportsIntensity: true,
  },
  {
    id: 'slow-zoom',
    name: 'Slow Zoom',
    badge: 'Sinematik',
    description: 'Push-in halus sinematik khas video dokumenter & vlog',
    category: 'cinematic',
    defaultIntensity: 45,
    supportsIntensity: true,
  },
  {
    id: 'ken-burns',
    name: 'Ken Burns',
    badge: 'Dokumenter',
    description: 'Pergerakan pan & zoom elegan menyusuri frame secara bertahap',
    category: 'cinematic',
    defaultIntensity: 50,
    supportsIntensity: true,
  },
  {
    id: 'shake',
    name: 'Camera Shake',
    badge: 'Aksi',
    description: 'Getaran kamera realistis menambah dinamisme & intensitas',
    category: 'motion',
    defaultIntensity: 40,
    supportsIntensity: true,
  },
  {
    id: 'pulse',
    name: 'Beat Pulse',
    description: 'Denyutan visual ritmis yang bergetar selaras irama',
    category: 'motion',
    defaultIntensity: 50,
    supportsIntensity: true,
  },
  {
    id: 'flash',
    name: 'Strobe Flash',
    description: 'Kilatan cahaya strobe berenergi tinggi untuk momen punchy',
    category: 'stylize',
    defaultIntensity: 60,
    supportsIntensity: true,
  },
  {
    id: 'blur',
    name: 'Dream Blur',
    description: 'Sentuhan blur lembut untuk nuansa impian atau fokus lembut',
    category: 'stylize',
    defaultIntensity: 50,
    supportsIntensity: true,
  },
  {
    id: 'fade-in',
    name: 'Fade In',
    badge: 'Awal',
    description: 'Pencahayaan bertahap dari gelap di awal pemutaran klip',
    category: 'cinematic',
    defaultIntensity: 100,
    supportsIntensity: true,
  },
  {
    id: 'fade-out',
    name: 'Fade Out',
    badge: 'Akhir',
    description: 'Penurunan pencahayaan bertahap ke gelap di akhir klip',
    category: 'cinematic',
    defaultIntensity: 100,
    supportsIntensity: true,
  },
];

/**
 * Cek apakah sebuah klip memiliki minimal satu efek aktif
 */
export function hasActiveEffects(clip?: VideoClip | null): boolean {
  if (!clip || !clip.effects) return false;
  return clip.effects.some((e) => e.type !== 'none');
}

export interface ComputedClipEffect {
  transform: string;
  filter: string;
  overlayColor?: string;
  overlayOpacity?: number;
  hasActiveEffect: boolean;
}

/**
 * Hitung efek visual CSS transform, filter & overlay untuk klip pada waktu lokal tertentu
 */
export function computeClipEffectsStyle(
  clip: VideoClip | null,
  localTime: number,
  isPlaying: boolean = false
): ComputedClipEffect {
  if (!clip || !clip.effects || clip.effects.length === 0) {
    return {
      transform: '',
      filter: '',
      hasActiveEffect: false,
    };
  }

  // Normalisasi waktu lokal ke offset relatif klip (0 sampai clip.duration)
  let relTime = localTime;
  if (clip.trimStart && relTime >= clip.trimStart) {
    relTime = relTime - clip.trimStart;
  }
  relTime = Math.max(0, Math.min(clip.duration, relTime));

  let totalScale = 1.0;
  let translateX = 0;
  let translateY = 0;
  let rotate = 0;
  const extraFilters: string[] = [];
  let overlayColor: string | undefined;
  let overlayOpacity: number | undefined;
  let activeCount = 0;

  for (const effect of clip.effects) {
    if (effect.type === 'none') continue;

    // Pastikan berada di dalam rentang waktu efek
    const start = Math.max(0, effect.startTime || 0);
    const end = Math.min(clip.duration, effect.endTime || clip.duration);
    if (relTime < start || relTime > end) continue;

    activeCount++;
    const span = Math.max(0.1, end - start);
    const progress = Math.max(0, Math.min(1, (relTime - start) / span));
    const k = Math.max(0.05, (effect.intensity ?? 50) / 100);

    switch (effect.type) {
      case 'zoom-in': {
        const zoomRate = 0.2 + 0.65 * k;
        const zoomProg = isPlaying ? progress : Math.max(0.4, progress);
        const factor = 1 + zoomRate * zoomProg;
        totalScale *= factor;
        break;
      }
      case 'zoom-out': {
        const zoomRate = 0.2 + 0.65 * k;
        const zoomProg = isPlaying ? (1 - progress) : Math.max(0.35, 1 - progress);
        const factor = 1 + zoomRate * zoomProg;
        totalScale *= factor;
        break;
      }
      case 'slow-zoom': {
        const zoomRate = 0.1 + 0.35 * k;
        const zoomProg = isPlaying ? progress : Math.max(0.45, progress);
        const factor = 1 + zoomRate * zoomProg;
        totalScale *= factor;
        break;
      }
      case 'ken-burns': {
        const zoomRate = 0.12 + 0.38 * k;
        const p = isPlaying ? progress : 0.65;
        totalScale *= 1 + zoomRate * (0.4 + 0.6 * p);
        translateX += (p - 0.5) * 44 * k;
        translateY += (p - 0.5) * 24 * k;
        break;
      }
      case 'shake': {
        if (isPlaying) {
          const t = relTime;
          const dx = (Math.sin(t * 34) + Math.sin(t * 52) * 0.4) * (8 * k);
          const dy = (Math.cos(t * 38) + Math.cos(t * 48) * 0.4) * (6 * k);
          const r = Math.sin(t * 24) * (2.8 * k);
          translateX += dx;
          translateY += dy;
          rotate += r;
          totalScale *= 1 + 0.08 * k;
        } else {
          translateX += 5 * k;
          translateY += -3.5 * k;
          rotate += 1.8 * k;
          totalScale *= 1 + 0.07 * k;
        }
        break;
      }
      case 'pulse': {
        if (isPlaying) {
          const osc = Math.abs(Math.sin(relTime * 8));
          totalScale *= 1 + osc * (0.16 * k);
          const bright = 1 + osc * (0.22 * k);
          extraFilters.push(`brightness(${bright.toFixed(2)})`);
        } else {
          totalScale *= 1 + 0.1 * k;
          extraFilters.push(`brightness(${(1 + 0.15 * k).toFixed(2)})`);
        }
        break;
      }
      case 'flash': {
        if (isPlaying) {
          const flashVal = Math.pow(Math.max(0, Math.sin(relTime * 11)), 3) * k;
          extraFilters.push(
            `brightness(${(1 + flashVal * 2.4).toFixed(2)}) contrast(${(1 + flashVal * 0.4).toFixed(2)})`
          );
          overlayColor = '#ffffff';
          overlayOpacity = Math.min(0.8, flashVal * 0.7);
        } else {
          extraFilters.push(
            `brightness(${(1 + 0.5 * k).toFixed(2)}) contrast(${(1 + 0.2 * k).toFixed(2)})`
          );
          overlayColor = '#ffffff';
          overlayOpacity = Math.min(0.5, 0.22 * k);
        }
        break;
      }
      case 'blur': {
        const blurPx = Math.max(0.5, k * 18);
        extraFilters.push(`blur(${blurPx.toFixed(1)}px)`);
        break;
      }
      case 'fade-in': {
        const fadeProgress = Math.max(0, Math.min(1, progress));
        overlayColor = '#000000';
        overlayOpacity = Math.max(0, 1 - fadeProgress);
        break;
      }
      case 'fade-out': {
        const fadeProgress = Math.max(0, Math.min(1, progress));
        overlayColor = '#000000';
        overlayOpacity = fadeProgress;
        break;
      }
    }
  }

  const transformParts: string[] = [];
  if (translateX !== 0 || translateY !== 0) {
    transformParts.push(`translate(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px)`);
  }
  if (rotate !== 0) {
    transformParts.push(`rotate(${rotate.toFixed(1)}deg)`);
  }
  if (totalScale !== 1.0) {
    transformParts.push(`scale(${totalScale.toFixed(3)})`);
  }

  return {
    transform: transformParts.join(' '),
    filter: extraFilters.join(' '),
    overlayColor,
    overlayOpacity,
    hasActiveEffect: activeCount > 0,
  };
}

// ==========================================
// RUNTIME TRANSITION COMPUTATION
// ==========================================

export interface ActiveTransitionState {
  isActive: boolean;
  type: TransitionType;
  duration: number;
  progress: number; // 0 to 1
  fromClipIndex: number;
  toClipIndex: number;
  transform: string;
  filter: string;
  overlayColor?: string;
  overlayOpacity?: number;
}

/**
 * Hitung apakah saat ini (globalTime) berada di dalam jendela transisi antar dua klip.
 */
export function computeTransitionState(
  clips: VideoClip[],
  globalTime: number
): ActiveTransitionState {
  const defaultState: ActiveTransitionState = {
    isActive: false,
    type: 'none',
    duration: 0,
    progress: 0,
    fromClipIndex: -1,
    toClipIndex: -1,
    transform: '',
    filter: '',
  };

  if (clips.length < 2) return defaultState;

  let currentStart = 0;
  for (let i = 0; i < clips.length - 1; i++) {
    const clipA = clips[i];
    const clipB = clips[i + 1];
    const boundaryTime = currentStart + clipA.duration;

    if (clipA.transitionAfter && clipA.transitionAfter.type !== 'none') {
      const trans = clipA.transitionAfter;
      const safeDuration = getSafeTransitionDuration(clipA, clipB, trans.duration);
      const half = safeDuration / 2;
      const startTime = boundaryTime - half;
      const endTime = boundaryTime + half;

      if (globalTime >= startTime && globalTime <= endTime) {
        const progress = Math.max(0, Math.min(1, (globalTime - startTime) / safeDuration));
        let transform = '';
        let filter = '';
        let overlayColor: string | undefined;
        let overlayOpacity: number | undefined;

        // Hitung efek transisi visual
        switch (trans.type) {
          case 'fade': {
            overlayColor = '#000000';
            // Puncak gelap (1.0) di progress 0.5 tepat di boundary
            overlayOpacity = 1 - Math.abs(progress - 0.5) * 2;
            break;
          }
          case 'flash': {
            overlayColor = '#ffffff';
            overlayOpacity = 1 - Math.abs(progress - 0.5) * 2;
            break;
          }
          case 'blur': {
            const blurPx = (16 * (1 - Math.abs(progress - 0.5) * 2)).toFixed(1);
            filter = `blur(${blurPx}px)`;
            break;
          }
          case 'zoom-in': {
            // Zoom mendalam ke 1.35 lalu kembali halus
            const factor = 1 + (1 - Math.abs(progress - 0.5) * 2) * 0.35;
            transform = `scale(${factor.toFixed(3)})`;
            break;
          }
          case 'zoom-out': {
            const factor = 1 - (1 - Math.abs(progress - 0.5) * 2) * 0.22;
            transform = `scale(${factor.toFixed(3)})`;
            break;
          }
          case 'slide-left': {
            // Jika sebelum boundary (klip A): geser ke kiri (0 -> -100%)
            // Jika sesudah boundary (klip B): masuk dari kanan (+100% -> 0)
            if (progress < 0.5) {
              const p = progress * 2;
              transform = `translateX(${(-p * 100).toFixed(1)}%)`;
            } else {
              const p = (progress - 0.5) * 2;
              transform = `translateX(${((1 - p) * 100).toFixed(1)}%)`;
            }
            break;
          }
          case 'slide-right': {
            if (progress < 0.5) {
              const p = progress * 2;
              transform = `translateX(${(p * 100).toFixed(1)}%)`;
            } else {
              const p = (progress - 0.5) * 2;
              transform = `translateX(${(-(1 - p) * 100).toFixed(1)}%)`;
            }
            break;
          }
          case 'slide-up': {
            if (progress < 0.5) {
              const p = progress * 2;
              transform = `translateY(${(-p * 100).toFixed(1)}%)`;
            } else {
              const p = (progress - 0.5) * 2;
              transform = `translateY(${((1 - p) * 100).toFixed(1)}%)`;
            }
            break;
          }
          case 'slide-down': {
            if (progress < 0.5) {
              const p = progress * 2;
              transform = `translateY(${(p * 100).toFixed(1)}%)`;
            } else {
              const p = (progress - 0.5) * 2;
              transform = `translateY(${(-(1 - p) * 100).toFixed(1)}%)`;
            }
            break;
          }
          case 'dissolve':
          case 'crossfade': {
            overlayColor = '#1e293b';
            overlayOpacity = (1 - Math.abs(progress - 0.5) * 2) * 0.65;
            break;
          }
        }

        return {
          isActive: true,
          type: trans.type,
          duration: safeDuration,
          progress,
          fromClipIndex: i,
          toClipIndex: i + 1,
          transform,
          filter,
          overlayColor,
          overlayOpacity,
        };
      }
    }

    currentStart += clipA.duration;
  }

  return defaultState;
}

