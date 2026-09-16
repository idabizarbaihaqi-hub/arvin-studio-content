export interface VideoAdjustment {
  brightness: number; // -100 to +100
  contrast: number; // -100 to +100
  saturation: number; // -100 to +100
  exposure: number; // -100 to +100
  highlights: number; // -100 to +100
  shadows: number; // -100 to +100
  temperature: number; // -100 to +100 (Cool <-> Warm)
  tint: number; // -100 to +100 (Green <-> Magenta)
  sharpness: number; // -100 to +100 (Clarity / Sharpness)
}

export type VideoFilterPreset =
  | 'original'
  | 'natural'
  | 'vivid'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'bright'
  | 'nature';

export type TransitionType =
  | 'none'
  | 'fade'
  | 'dissolve'
  | 'crossfade'
  | 'slide-left'
  | 'slide-right'
  | 'slide-up'
  | 'slide-down'
  | 'zoom-in'
  | 'zoom-out'
  | 'blur'
  | 'flash';

export interface ClipTransition {
  type: TransitionType;
  duration: number; // 0.25, 0.5, 0.75, 1, 1.5, 2
}

export type EffectType =
  | 'none'
  | 'zoom-in'
  | 'zoom-out'
  | 'shake'
  | 'pulse'
  | 'flash'
  | 'blur'
  | 'fade-in'
  | 'fade-out'
  | 'slow-zoom'
  | 'ken-burns';

export interface VideoEffectItem {
  id: string;
  type: EffectType;
  intensity: number; // 0 - 100, default 50
  startTime: number; // relative to clip's local playback (0 to clip.duration)
  endTime: number; // relative to clip's local playback (0 to clip.duration)
}

export interface VideoClip {
  id: string;
  file: File;
  url: string;
  name: string;
  originalDuration: number;
  trimStart: number;
  trimEnd: number;
  duration: number; // trimEnd - trimStart
  width?: number;
  height?: number;
  size?: number; // bytes
  thumbnail?: string; // base64 data url or generated frame preview
  adjustments?: VideoAdjustment;
  filter?: VideoFilterPreset;
  transitionAfter?: ClipTransition; // Transition from this clip to the next clip
  effects?: VideoEffectItem[]; // List of effects applied to this clip
  speed?: number; // 0.25 to 2.0 (e.g. 0.5x, 1x, 1.5x, 2x)
}

export type AspectRatio = '9:16' | '16:9' | '1:1';

export type VideoFilter = VideoFilterPreset;

export interface TimelinePosition {
  clipIndex: number;
  clip: VideoClip;
  clipStartTime: number;
  localTime: number;
}

// ==========================================
// TAHAP 5 — OVERLAY & MEDIA TRACK TYPES
// ==========================================

export type OverlayPositionPreset =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'custom';

export type TextAnimation =
  | 'none'
  | 'fade-in'
  | 'fade-out'
  | 'fade-in-out'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'pop';

export interface TextOverlayItem {
  id: string;
  text: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  positionPreset?: OverlayPositionPreset;
  fontSize: number; // px e.g. 14 - 72
  fontFamily: 'sans' | 'serif' | 'bold' | 'mono';
  fontWeight: 'normal' | 'medium' | 'bold';
  alignment: 'left' | 'center' | 'right';
  color: string; // Hex color e.g. '#ffffff'
  background: 'none' | 'solid' | 'semi';
  backgroundColor?: string;
  bgOpacity?: number; // 0 - 100
  opacity: number; // 0 - 100
  startTime: number; // Global timeline seconds
  endTime: number; // Global timeline seconds
  duration?: number; // Optional duration cache
  animation?: TextAnimation;
}

export interface ImageOverlayItem {
  id: string;
  file?: File;
  url: string;
  name: string;
  x: number; // 0 - 100 percentage
  y: number; // 0 - 100 percentage
  positionPreset?: OverlayPositionPreset;
  scale: number; // 10 - 200 percentage
  opacity: number; // 0 - 100
  rotation?: number; // 0 - 360 degrees
  startTime: number; // Global timeline seconds
  endTime: number; // Global timeline seconds
}

export interface AudioTrackItem {
  id: string;
  file?: File;
  url: string;
  name: string;
  originalDuration: number;
  trimStart: number;
  trimEnd: number;
  startTime: number; // Timeline insertion offset
  duration: number; // trimEnd - trimStart
  volume: number; // 0 - 100
  isMuted: boolean;
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
}

export interface SubtitleItem {
  id: string;
  text: string;
  startTime: number; // Global timeline seconds
  endTime: number; // Global timeline seconds
  fontSize?: number; // px e.g. 14 - 36
  color?: string; // hex
  background?: 'none' | 'solid' | 'semi';
  bgOpacity?: number; // 0 - 100
  alignment?: 'left' | 'center' | 'right';
  positionPreset?: 'bottom-center' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface VideoProjectState {
  clips: VideoClip[];
  texts: TextOverlayItem[];
  images: ImageOverlayItem[];
  audios: AudioTrackItem[];
  subtitles: SubtitleItem[];
  originalAudioVolume?: number; // 0 - 100
  isOriginalAudioMuted?: boolean;
}

