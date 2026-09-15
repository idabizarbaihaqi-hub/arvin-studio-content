import React from 'react';
import {
  OverlayPositionPreset,
  TextOverlayItem,
  ImageOverlayItem,
  SubtitleItem,
  AudioTrackItem,
} from './types';

/**
 * Returns (x, y) in percentage [0..100] for given position preset
 */
export function getPresetCoordinates(preset: OverlayPositionPreset): { x: number; y: number } {
  switch (preset) {
    case 'top-left':
      return { x: 12, y: 12 };
    case 'top-center':
      return { x: 50, y: 12 };
    case 'top-right':
      return { x: 88, y: 12 };
    case 'center':
      return { x: 50, y: 50 };
    case 'bottom-left':
      return { x: 12, y: 86 };
    case 'bottom-center':
      return { x: 50, y: 86 };
    case 'bottom-right':
      return { x: 88, y: 86 };
    case 'custom':
    default:
      return { x: 50, y: 50 };
  }
}

/**
 * Computes live CSS style for a TextOverlayItem at the given global currentTime
 */
export function computeTextStyle(
  item: TextOverlayItem,
  currentTime: number,
  isSelected: boolean = false
): React.CSSProperties | null {
  // Check if item is within its active time window
  if (currentTime < item.startTime || currentTime > item.endTime) {
    return null;
  }

  const duration = Math.max(0.2, item.endTime - item.startTime);
  const elapsed = currentTime - item.startTime;
  const remaining = item.endTime - currentTime;
  const animTime = Math.min(0.4, duration / 3);

  let animOpacity = 1;
  let transformExtra = '';

  const anim = item.animation || 'none';

  switch (anim) {
    case 'fade-in': {
      if (elapsed < animTime) {
        animOpacity = Math.max(0, elapsed / animTime);
      }
      break;
    }
    case 'fade-out': {
      if (remaining < animTime) {
        animOpacity = Math.max(0, remaining / animTime);
      }
      break;
    }
    case 'fade-in-out': {
      if (elapsed < animTime) {
        animOpacity = Math.max(0, elapsed / animTime);
      } else if (remaining < animTime) {
        animOpacity = Math.max(0, remaining / animTime);
      }
      break;
    }
    case 'slide-up': {
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = Math.max(0, p);
        const dy = (1 - p) * 28;
        transformExtra = ` translateY(${dy}px)`;
      }
      break;
    }
    case 'slide-down': {
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = Math.max(0, p);
        const dy = -(1 - p) * 28;
        transformExtra = ` translateY(${dy}px)`;
      }
      break;
    }
    case 'slide-left': {
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = Math.max(0, p);
        const dx = (1 - p) * 36;
        transformExtra = ` translateX(${dx}px)`;
      }
      break;
    }
    case 'slide-right': {
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = Math.max(0, p);
        const dx = -(1 - p) * 36;
        transformExtra = ` translateX(${dx}px)`;
      }
      break;
    }
    case 'pop': {
      if (elapsed < animTime) {
        const p = elapsed / animTime;
        animOpacity = Math.max(0, p);
        // overshoot spring effect
        const scale = 0.4 + 0.6 * Math.sin((p * Math.PI) / 2);
        transformExtra = ` scale(${scale.toFixed(3)})`;
      }
      break;
    }
    case 'none':
    default:
      break;
  }

  // Base opacity calculation
  const totalOpacity = ((item.opacity ?? 100) / 100) * animOpacity;

  // Background styling
  let bgColor = 'transparent';
  if (item.background === 'solid') {
    bgColor = item.backgroundColor || '#000000';
  } else if (item.background === 'semi') {
    const hex = item.backgroundColor || '#000000';
    const bgAlpha = ((item.bgOpacity ?? 60) / 100).toFixed(2);
    // Convert hex to rgba
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    bgColor = `rgba(${r}, ${g}, ${b}, ${bgAlpha})`;
  }

  // Font family mapping
  let fontFamily = 'system-ui, sans-serif';
  if (item.fontFamily === 'serif') {
    fontFamily = 'Georgia, Cambria, serif';
  } else if (item.fontFamily === 'bold') {
    fontFamily = 'Impact, "Arial Black", sans-serif';
  } else if (item.fontFamily === 'mono') {
    fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
  }

  return {
    position: 'absolute',
    left: `${item.x}%`,
    top: `${item.y}%`,
    transform: `translate(-50%, -50%)${transformExtra}`,
    fontSize: `${item.fontSize}px`,
    fontFamily,
    fontWeight: item.fontWeight === 'bold' ? 800 : item.fontWeight === 'medium' ? 600 : 400,
    textAlign: item.alignment,
    color: item.color,
    backgroundColor: bgColor,
    opacity: totalOpacity,
    padding: item.background !== 'none' ? '6px 14px' : '2px 6px',
    borderRadius: item.background !== 'none' ? '8px' : '0px',
    textShadow:
      item.background === 'none'
        ? '0 2px 6px rgba(0, 0, 0, 0.85), 0 1px 2px rgba(0, 0, 0, 0.9)'
        : 'none',
    userSelect: 'none',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    maxWidth: '90%',
    zIndex: 25,
    cursor: 'move',
    outline: isSelected ? '2px solid #3b82f6' : 'none',
    boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.25)' : 'none',
    transition: 'outline 0.15s ease',
  };
}

/**
 * Computes live CSS style for an ImageOverlayItem at the given global currentTime
 */
export function computeImageStyle(
  item: ImageOverlayItem,
  currentTime: number,
  isSelected: boolean = false
): React.CSSProperties | null {
  if (currentTime < item.startTime || currentTime > item.endTime) {
    return null;
  }

  const scale = (item.scale ?? 100) / 100;
  const opacity = (item.opacity ?? 100) / 100;
  const rotation = item.rotation ?? 0;

  return {
    position: 'absolute',
    left: `${item.x}%`,
    top: `${item.y}%`,
    transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotation}deg)`,
    opacity,
    userSelect: 'none',
    zIndex: 20,
    cursor: 'move',
    outline: isSelected ? '2px dashed #3b82f6' : 'none',
    boxShadow: isSelected ? '0 0 0 4px rgba(59, 130, 246, 0.2)' : 'none',
    transition: 'outline 0.15s ease',
    pointerEvents: 'auto',
  };
}

/**
 * Computes live CSS style for a SubtitleItem at the given global currentTime
 */
export function computeSubtitleStyle(
  item: SubtitleItem,
  currentTime: number,
  isSelected: boolean = false
): React.CSSProperties | null {
  if (currentTime < item.startTime || currentTime > item.endTime) {
    return null;
  }

  const preset = item.positionPreset || 'bottom-center';
  const coords = getPresetCoordinates(preset);

  let bgColor = 'rgba(0, 0, 0, 0.75)';
  if (item.background === 'none') {
    bgColor = 'transparent';
  } else if (item.background === 'solid') {
    bgColor = '#000000';
  } else if (item.background === 'semi') {
    const alpha = ((item.bgOpacity ?? 70) / 100).toFixed(2);
    bgColor = `rgba(0, 0, 0, ${alpha})`;
  }

  return {
    position: 'absolute',
    left: `${coords.x}%`,
    top: `${coords.y}%`,
    transform: 'translate(-50%, -50%)',
    fontSize: `${item.fontSize || 18}px`,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: 600,
    textAlign: item.alignment || 'center',
    color: item.color || '#ffffff',
    backgroundColor: bgColor,
    padding: item.background !== 'none' ? '5px 12px' : '2px 4px',
    borderRadius: '6px',
    textShadow:
      item.background === 'none'
        ? '0 2px 4px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)'
        : 'none',
    userSelect: 'none',
    maxWidth: '88%',
    whiteSpace: 'pre-wrap',
    zIndex: 30,
    cursor: 'pointer',
    outline: isSelected ? '2px solid #a855f7' : 'none',
    boxShadow: isSelected ? '0 0 0 4px rgba(168, 85, 247, 0.25)' : 'none',
  };
}

/**
 * Computes dynamic audio track gain/volume factor considering Fade In & Fade Out
 */
export function computeAudioVolumeFactor(
  track: AudioTrackItem,
  currentTime: number
): number {
  if (track.isMuted || track.volume === 0) return 0;
  if (currentTime < track.startTime || currentTime > track.startTime + track.duration) {
    return 0;
  }

  let factor = track.volume / 100;
  const elapsed = currentTime - track.startTime;
  const remaining = track.startTime + track.duration - currentTime;

  if (track.fadeIn && track.fadeIn > 0 && elapsed < track.fadeIn) {
    factor *= Math.max(0, elapsed / track.fadeIn);
  }

  if (track.fadeOut && track.fadeOut > 0 && remaining < track.fadeOut) {
    factor *= Math.max(0, remaining / track.fadeOut);
  }

  return Math.max(0, Math.min(1, factor));
}

/**
 * Factory for creating default TextOverlayItem
 */
export function createDefaultTextOverlay(
  startTime: number,
  duration: number = 3,
  index: number = 0
): TextOverlayItem {
  const yOffsets = [50, 25, 75, 40, 60];
  const y = yOffsets[index % yOffsets.length];

  return {
    id: `text-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text: 'Teks Keren',
    startTime,
    endTime: startTime + duration,
    x: 50,
    y,
    fontSize: 32,
    fontFamily: 'sans',
    fontWeight: 'bold',
    alignment: 'center',
    color: '#ffffff',
    background: 'semi',
    backgroundColor: '#000000',
    bgOpacity: 40,
    opacity: 100,
    animation: 'fade-in',
    positionPreset: 'center',
  };
}

/**
 * Factory for creating default ImageOverlayItem
 */
export function createDefaultImageOverlay(
  url: string,
  name: string,
  startTime: number,
  duration: number = 5
): ImageOverlayItem {
  return {
    id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    url,
    name,
    startTime,
    endTime: startTime + duration,
    x: 85,
    y: 15,
    scale: 80,
    opacity: 100,
    positionPreset: 'top-right',
  };
}

/**
 * Factory for creating default AudioTrackItem
 */
export function createDefaultAudioTrack(
  url: string,
  name: string,
  duration: number,
  startTime: number = 0
): AudioTrackItem {
  return {
    id: `audio-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    url,
    name,
    originalDuration: duration,
    duration,
    startTime,
    volume: 80,
    isMuted: false,
    trimStart: 0,
    trimEnd: duration,
    fadeIn: 1,
    fadeOut: 1,
  };
}

/**
 * Factory for creating default SubtitleItem
 */
export function createDefaultSubtitle(
  startTime: number,
  duration: number = 2.5,
  text: string = 'Teks subtitle baru'
): SubtitleItem {
  return {
    id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    text,
    startTime,
    endTime: startTime + duration,
    fontSize: 20,
    color: '#ffffff',
    background: 'semi',
    bgOpacity: 70,
    alignment: 'center',
    positionPreset: 'bottom-center',
  };
}
