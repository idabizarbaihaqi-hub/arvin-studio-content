import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Upload,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCw,
  Scissors,
  SplitSquareVertical,
  Maximize2,
  Sliders,
  Sparkles,
  Download,
  ArrowLeft,
  RefreshCw,
  Clock,
  Check,
  AlertCircle,
  FileVideo,
  X,
  Smartphone,
  Tv,
  Square,
  ShieldCheck,
  Crown,
  Plus,
  SkipBack,
  SkipForward,
  Trash2,
  Undo2,
  Redo2,
  Film,
  Eye,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { UserProfile } from '../../types';
import {
  VideoClip,
  AspectRatio,
  VideoFilter,
  TimelinePosition,
  VideoAdjustment,
  VideoFilterPreset,
  VideoEffectItem,
  ClipTransition,
  TextOverlayItem,
  ImageOverlayItem,
  AudioTrackItem,
  SubtitleItem,
} from './types';
import {
  formatTime,
  calculateTotalDuration,
  findClipAtTime,
  generateVideoMetadataAndThumbnail,
  getFilterStyle,
  computeVideoFilterStyle,
  DEFAULT_ADJUSTMENTS,
  AUTO_ENHANCE_ADJUSTMENTS,
  FilterPresetItem,
  computeTransitionState,
  computeClipEffectsStyle,
  hasActiveEffects,
  ComputedClipEffect,
} from './videoUtils';
import {
  computeTextStyle,
  computeImageStyle,
  computeSubtitleStyle,
  computeAudioVolumeFactor,
  createDefaultTextOverlay,
  createDefaultImageOverlay,
  createDefaultAudioTrack,
  createDefaultSubtitle,
} from './overlayUtils';
import { Timeline } from './Timeline';
import { ClipToolbar } from './ClipToolbar';
import { TransitionModal } from './TransitionModal';
import { TextPanel } from './TextPanel';
import { ImagePanel } from './ImagePanel';
import { AudioPanel } from './AudioPanel';
import { SubtitlePanel } from './SubtitlePanel';
import { ExportModal } from './ExportModal';

interface VideoEditorProps {
  currentUser?: UserProfile | null;
  onBack: () => void;
  isSuperAdmin?: boolean;
  onNavigateToPremium?: () => void;
  initialVideoUrl?: string;
  initialVideoName?: string;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({
  currentUser,
  onBack,
  isSuperAdmin,
  onNavigateToPremium,
  initialVideoUrl,
  initialVideoName,
}) => {
  const initialVideoLoadedRef = useRef(false);
  // 1. Clips List & History (Multi-Clip Project Session)
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  // Tahap 5: Text, Image, Audio, Subtitle Overlays & Project State
  const [texts, setTexts] = useState<TextOverlayItem[]>([]);
  const [images, setImages] = useState<ImageOverlayItem[]>([]);
  const [audios, setAudios] = useState<AudioTrackItem[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);
  const [originalAudioVolume, setOriginalAudioVolume] = useState<number>(100);
  const [isOriginalAudioMuted, setIsOriginalAudioMuted] = useState<boolean>(false);

  // Selection states
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(null);

  // Active Overlay Modal ('none' | 'text' | 'image' | 'audio' | 'subtitle')
  const [activeOverlayModal, setActiveOverlayModal] = useState<
    'none' | 'text' | 'image' | 'audio' | 'subtitle'
  >('none');

  // Active Clip Tool Panel in ClipToolbar ('none' | 'trim' | 'adjust' | 'filters' | 'effects' | 'info')
  const [activeClipTool, setActiveClipTool] = useState<
    'none' | 'trim' | 'adjust' | 'filters' | 'effects' | 'info'
  >('none');

  // Stage Viewport Ref & Overlay Dragging
  const stageViewportRef = useRef<HTMLDivElement>(null);
  const [draggingOverlay, setDraggingOverlay] = useState<{
    type: 'text' | 'image';
    id: string;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // HTML Audio element refs for background audio tracks
  const audioElementsRef = useRef<{ [trackId: string]: HTMLAudioElement }>({});

  // Comprehensive Project Snapshot for Undo / Redo
  interface ProjectSnapshot {
    clips: VideoClip[];
    texts: TextOverlayItem[];
    images: ImageOverlayItem[];
    audios: AudioTrackItem[];
    subtitles: SubtitleItem[];
    originalAudioVolume: number;
    isOriginalAudioMuted: boolean;
  }

  const [history, setHistory] = useState<ProjectSnapshot[]>([
    {
      clips: [],
      texts: [],
      images: [],
      audios: [],
      subtitles: [],
      originalAudioVolume: 100,
      isOriginalAudioMuted: false,
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Loading / Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 2. Playback State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // Global timeline time in seconds
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Visual Transformations
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [rotation, setRotation] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<VideoFilterPreset>('original');
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [isComparingBefore, setIsComparingBefore] = useState(false); // Before / After toggle

  // Transition Modal State
  const [transitionModal, setTransitionModal] = useState<{
    isOpen: boolean;
    junctionIndex: number;
  } | null>(null);

  // Export Modal State (Tahap 6: Real Video Export)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Ref tracking object URLs to revoke on unmount
  const createdUrlsRef = useRef<Set<string>>(new Set());

  const totalDuration = calculateTotalDuration(clips);

  // Push new state to Project History for Undo / Redo
  const pushProjectSnapshot = useCallback(
    (partial: Partial<ProjectSnapshot>) => {
      setHistory((prev) => {
        const current = prev[historyIndex] || {
          clips,
          texts,
          images,
          audios,
          subtitles,
          originalAudioVolume,
          isOriginalAudioMuted,
        };
        const nextSnapshot: ProjectSnapshot = {
          clips: partial.clips ?? clips,
          texts: partial.texts ?? texts,
          images: partial.images ?? images,
          audios: partial.audios ?? audios,
          subtitles: partial.subtitles ?? subtitles,
          originalAudioVolume: partial.originalAudioVolume ?? originalAudioVolume,
          isOriginalAudioMuted: partial.isOriginalAudioMuted ?? isOriginalAudioMuted,
        };
        const truncated = prev.slice(0, historyIndex + 1);
        return [...truncated, nextSnapshot];
      });
      setHistoryIndex((prev) => prev + 1);

      if (partial.clips !== undefined) setClips(partial.clips);
      if (partial.texts !== undefined) setTexts(partial.texts);
      if (partial.images !== undefined) setImages(partial.images);
      if (partial.audios !== undefined) setAudios(partial.audios);
      if (partial.subtitles !== undefined) setSubtitles(partial.subtitles);
      if (partial.originalAudioVolume !== undefined) setOriginalAudioVolume(partial.originalAudioVolume);
      if (partial.isOriginalAudioMuted !== undefined) setIsOriginalAudioMuted(partial.isOriginalAudioMuted);
    },
    [historyIndex, clips, texts, images, audios, subtitles, originalAudioVolume, isOriginalAudioMuted]
  );

  // Backwards-compatible pushHistory for clips
  const pushHistory = useCallback(
    (newClips: VideoClip[]) => {
      pushProjectSnapshot({ clips: newClips });
    },
    [pushProjectSnapshot]
  );

  // Undo Handler
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevSnap = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setClips(prevSnap.clips);
      setTexts(prevSnap.texts);
      setImages(prevSnap.images);
      setAudios(prevSnap.audios);
      setSubtitles(prevSnap.subtitles);
      setOriginalAudioVolume(prevSnap.originalAudioVolume);
      setIsOriginalAudioMuted(prevSnap.isOriginalAudioMuted);

      if (selectedClipId && !prevSnap.clips.some((c) => c.id === selectedClipId)) {
        setSelectedClipId(prevSnap.clips.length > 0 ? prevSnap.clips[0].id : null);
      }
      if (selectedTextId && !prevSnap.texts.some((t) => t.id === selectedTextId)) {
        setSelectedTextId(prevSnap.texts.length > 0 ? prevSnap.texts[0].id : null);
      }
      if (selectedImageId && !prevSnap.images.some((i) => i.id === selectedImageId)) {
        setSelectedImageId(prevSnap.images.length > 0 ? prevSnap.images[0].id : null);
      }
      if (selectedSubtitleId && !prevSnap.subtitles.some((s) => s.id === selectedSubtitleId)) {
        setSelectedSubtitleId(prevSnap.subtitles.length > 0 ? prevSnap.subtitles[0].id : null);
      }
    }
  }, [history, historyIndex, selectedClipId, selectedTextId, selectedImageId, selectedSubtitleId]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextSnap = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setClips(nextSnap.clips);
      setTexts(nextSnap.texts);
      setImages(nextSnap.images);
      setAudios(nextSnap.audios);
      setSubtitles(nextSnap.subtitles);
      setOriginalAudioVolume(nextSnap.originalAudioVolume);
      setIsOriginalAudioMuted(nextSnap.isOriginalAudioMuted);

      if (selectedClipId && !nextSnap.clips.some((c) => c.id === selectedClipId)) {
        setSelectedClipId(nextSnap.clips.length > 0 ? nextSnap.clips[0].id : null);
      }
      if (selectedTextId && !nextSnap.texts.some((t) => t.id === selectedTextId)) {
        setSelectedTextId(nextSnap.texts.length > 0 ? nextSnap.texts[0].id : null);
      }
      if (selectedImageId && !nextSnap.images.some((i) => i.id === selectedImageId)) {
        setSelectedImageId(nextSnap.images.length > 0 ? nextSnap.images[0].id : null);
      }
      if (selectedSubtitleId && !nextSnap.subtitles.some((s) => s.id === selectedSubtitleId)) {
        setSelectedSubtitleId(nextSnap.subtitles.length > 0 ? nextSnap.subtitles[0].id : null);
      }
    }
  }, [history, historyIndex, selectedClipId, selectedTextId, selectedImageId, selectedSubtitleId]);

  // Cleanup all created URLs on unmount
  useEffect(() => {
    const urls = createdUrlsRef.current;
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // 3. Current Clip Position calculation
  const activePosition: TimelinePosition | null = findClipAtTime(clips, currentTime);
  const activeClip: VideoClip | null = activePosition ? activePosition.clip : null;
  const currentLocalTime: number = activePosition ? activePosition.localTime : 0;

  // Selected Clip object & index
  const selectedClipIndex = clips.findIndex((c) => c.id === selectedClipId);
  const selectedClip = selectedClipIndex !== -1 ? clips[selectedClipIndex] : null;

  // Selected Text & Image (Tahap 5)
  const selectedText = texts.find((t) => t.id === selectedTextId) || (texts.length > 0 ? texts[0] : null);
  const selectedImage = images.find((i) => i.id === selectedImageId) || (images.length > 0 ? images[0] : null);

  // Computed filter CSS style for current active playing clip (or selected clip when idle)
  const activeClipFilterStyle = useMemo(() => {
    const clipToStyle = activeClip || selectedClip;
    if (!clipToStyle || isComparingBefore) return '';
    return computeVideoFilterStyle(clipToStyle.adjustments, clipToStyle.filter);
  }, [activeClip, selectedClip, isComparingBefore]);

  // Real-time Transition Visual State during playback
  const activeTransitionState = useMemo(() => {
    return computeTransitionState(clips, currentTime);
  }, [clips, currentTime]);

  // Real-time Clip Visual Effects Style (transforms, blurs, shakes, etc.)
  const activeEffectStyle = useMemo<ComputedClipEffect>(() => {
    const clipToStyle = activeClip || selectedClip;
    if (!clipToStyle || isComparingBefore) {
      return {
        transform: '',
        filter: '',
        overlayColor: undefined,
        overlayOpacity: 0,
        hasActiveEffect: false,
      };
    }
    return computeClipEffectsStyle(clipToStyle, currentLocalTime, isPlaying);
  }, [activeClip, selectedClip, currentLocalTime, isPlaying, isComparingBefore]);

  // Real-time 60fps animation frame loop for video playback & dynamic effects
  useEffect(() => {
    if (!isPlaying) return;
    let animFrameId: number;

    const tick = () => {
      const video = videoRef.current;
      if (video && activePosition) {
        const currentVidTime = video.currentTime;
        const clip = activePosition.clip;

        if (currentVidTime >= clip.trimEnd - 0.05) {
          const nextIndex = activePosition.clipIndex + 1;
          if (nextIndex < clips.length) {
            const nextClip = clips[nextIndex];
            const nextGlobalTime = activePosition.clipStartTime + clip.duration;
            setCurrentTime(nextGlobalTime);

            video.src = nextClip.url;
            video.currentTime = nextClip.trimStart;
            video.play().catch(() => {});
          } else {
            setIsPlaying(false);
            video.pause();
            setCurrentTime(totalDuration);
            return;
          }
        } else {
          const offset = Math.max(0, currentVidTime - clip.trimStart);
          const newGlobalTime = Math.min(
            totalDuration,
            activePosition.clipStartTime + offset
          );
          setCurrentTime(newGlobalTime);
        }
      }
      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, activePosition, clips, totalDuration]);

  // Sync HTML5 Video Element with Active Clip and its Local Time
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeClip) return;

    // If source needs to change to active clip URL
    if (video.src !== activeClip.url && !video.src.endsWith(activeClip.url)) {
      video.src = activeClip.url;
      video.currentTime = currentLocalTime;
      if (isPlaying) {
        video.play().catch(() => {});
      }
    } else {
      // If same clip, check if time has drifted significantly (> 0.35s)
      const diff = Math.abs(video.currentTime - currentLocalTime);
      if (diff > 0.35) {
        video.currentTime = currentLocalTime;
      }
    }
  }, [activeClip, currentLocalTime, isPlaying]);

  // Handle native video timeupdate event
  const handleVideoTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !activePosition || !isPlaying) return;

    const currentVidTime = video.currentTime;
    const clip = activePosition.clip;

    // Check if reached trimEnd
    if (currentVidTime >= clip.trimEnd - 0.05) {
      // Advance to next clip if available
      const nextIndex = activePosition.clipIndex + 1;
      if (nextIndex < clips.length) {
        const nextClip = clips[nextIndex];
        const nextGlobalTime = activePosition.clipStartTime + clip.duration;
        setCurrentTime(nextGlobalTime);

        // Switch video source
        video.src = nextClip.url;
        video.currentTime = nextClip.trimStart;
        video.play().catch(() => {});
      } else {
        // End of entire timeline
        setIsPlaying(false);
        video.pause();
        setCurrentTime(totalDuration);
      }
    } else {
      // Calculate global time
      const offset = Math.max(0, currentVidTime - clip.trimStart);
      const newGlobalTime = Math.min(
        totalDuration,
        activePosition.clipStartTime + offset
      );
      setCurrentTime(newGlobalTime);
    }
  };

  // Video Loaded Metadata
  const handleLoadedMetadata = () => {
    if (videoRef.current && activePosition) {
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  };

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!videoRef.current || clips.length === 0) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      // Pause all background audio tracks
      audios.forEach((track) => {
        const audioEl = audioElementsRef.current[track.id];
        if (audioEl && !audioEl.paused) {
          audioEl.pause();
        }
      });
    } else {
      // If at the very end of timeline, wrap to beginning
      if (currentTime >= totalDuration - 0.1) {
        handleSeek(0);
      }
      videoRef.current.play().catch((err) => {
        console.warn('Gagal memutar video:', err);
      });
      setIsPlaying(true);
    }
  };

  // Seek Timeline to a Global Time
  const handleSeek = (globalTime: number) => {
    const clamped = Math.max(0, Math.min(totalDuration, globalTime));
    setCurrentTime(clamped);

    const pos = findClipAtTime(clips, clamped);
    if (pos && videoRef.current) {
      if (videoRef.current.src !== pos.clip.url && !videoRef.current.src.endsWith(pos.clip.url)) {
        videoRef.current.src = pos.clip.url;
      }
      videoRef.current.currentTime = pos.localTime;
    }

    // Sync background audio tracks to seek time
    audios.forEach((track) => {
      const audioEl = audioElementsRef.current[track.id];
      if (audioEl) {
        const isInRange = clamped >= track.startTime && clamped < track.startTime + track.duration;
        if (isInRange) {
          const trackLocal = (clamped - track.startTime) + track.trimStart;
          audioEl.currentTime = trackLocal;
        } else if (!audioEl.paused) {
          audioEl.pause();
        }
      }
    });
  };

  // Skip to Previous Clip
  const handleSkipPrevious = () => {
    if (!activePosition) return;
    // If more than 1s into current clip, seek to start of current clip
    const currentOffset = currentTime - activePosition.clipStartTime;
    if (currentOffset > 1) {
      handleSeek(activePosition.clipStartTime);
    } else if (activePosition.clipIndex > 0) {
      // Seek to start of previous clip
      const prevClip = clips[activePosition.clipIndex - 1];
      let prevStart = 0;
      for (let i = 0; i < activePosition.clipIndex - 1; i++) {
        prevStart += clips[i].duration;
      }
      handleSeek(prevStart);
      setSelectedClipId(prevClip.id);
    } else {
      handleSeek(0);
    }
  };

  // Skip to Next Clip
  const handleSkipNext = () => {
    if (!activePosition) return;
    const nextIndex = activePosition.clipIndex + 1;
    if (nextIndex < clips.length) {
      const nextStart = activePosition.clipStartTime + activePosition.clip.duration;
      handleSeek(nextStart);
      setSelectedClipId(clips[nextIndex].id);
    }
  };

  // Mute Toggle
  const toggleMute = () => {
    if (!videoRef.current) return;
    const newMuted = !isMuted;
    videoRef.current.muted = newMuted;
    setIsMuted(newMuted);
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = newVol;
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
      videoRef.current.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      videoRef.current.muted = false;
    }
  };

  // Playback Speed Change
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
  };

  // ----------------------------------------------------
  // Audio Synchronization Effect (Tahap 5)
  // ----------------------------------------------------
  useEffect(() => {
    // 1. Original Video Volume / Mute
    if (videoRef.current) {
      const origMultiplier = isOriginalAudioMuted ? 0 : originalAudioVolume / 100;
      const effectiveVol = isMuted ? 0 : Math.max(0, Math.min(1, volume * origMultiplier));
      videoRef.current.volume = effectiveVol;
      videoRef.current.muted = isMuted || isOriginalAudioMuted || effectiveVol === 0;
    }

    // 2. Background Audio Tracks
    audios.forEach((track) => {
      const audioEl = audioElementsRef.current[track.id];
      if (!audioEl) return;

      const isInRange =
        currentTime >= track.startTime &&
        currentTime < track.startTime + track.duration;

      if (isInRange) {
        const trackLocalTime = (currentTime - track.startTime) + track.trimStart;
        const volumeFactor = computeAudioVolumeFactor(track, currentTime);
        const effectiveTrackVol = isMuted ? 0 : Math.max(0, Math.min(1, volume * volumeFactor));

        audioEl.volume = effectiveTrackVol;
        audioEl.muted = isMuted || effectiveTrackVol === 0;

        if (isPlaying) {
          if (audioEl.paused) {
            audioEl.currentTime = trackLocalTime;
            audioEl.play().catch(() => {});
          } else if (Math.abs(audioEl.currentTime - trackLocalTime) > 0.35) {
            audioEl.currentTime = trackLocalTime;
          }
        } else {
          if (!audioEl.paused) audioEl.pause();
          audioEl.currentTime = trackLocalTime;
        }
      } else {
        if (!audioEl.paused) audioEl.pause();
      }
    });
  }, [
    isPlaying,
    currentTime,
    volume,
    isMuted,
    audios,
    originalAudioVolume,
    isOriginalAudioMuted,
  ]);

  // ----------------------------------------------------
  // Drag & Drop Text/Image Position Handlers (Tahap 5)
  // ----------------------------------------------------
  const handleStartDragText = (e: React.PointerEvent, textId: string) => {
    e.stopPropagation();
    setSelectedTextId(textId);
    const target = texts.find((t) => t.id === textId);
    if (!target) return;
    setDraggingOverlay({
      type: 'text',
      id: textId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: target.x,
      initialY: target.y,
    });
  };

  const handleStartDragImage = (e: React.PointerEvent, imageId: string) => {
    e.stopPropagation();
    setSelectedImageId(imageId);
    const target = images.find((i) => i.id === imageId);
    if (!target) return;
    setDraggingOverlay({
      type: 'image',
      id: imageId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: target.x,
      initialY: target.y,
    });
  };

  useEffect(() => {
    if (!draggingOverlay) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!stageViewportRef.current) return;
      const rect = stageViewportRef.current.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const deltaXPct = ((e.clientX - draggingOverlay.startX) / rect.width) * 100;
      const deltaYPct = ((e.clientY - draggingOverlay.startY) / rect.height) * 100;

      const newX = Math.max(5, Math.min(95, Math.round(draggingOverlay.initialX + deltaXPct)));
      const newY = Math.max(5, Math.min(95, Math.round(draggingOverlay.initialY + deltaYPct)));

      if (draggingOverlay.type === 'text') {
        setTexts((prev) =>
          prev.map((t) =>
            t.id === draggingOverlay.id ? { ...t, x: newX, y: newY, positionPreset: 'custom' } : t
          )
        );
      } else {
        setImages((prev) =>
          prev.map((img) =>
            img.id === draggingOverlay.id ? { ...img, x: newX, y: newY, positionPreset: 'custom' } : img
          )
        );
      }
    };

    const handlePointerUp = () => {
      if (draggingOverlay.type === 'text') {
        pushProjectSnapshot({ texts });
      } else {
        pushProjectSnapshot({ images });
      }
      setDraggingOverlay(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingOverlay, texts, images, pushProjectSnapshot]);

  // ----------------------------------------------------
  // Tahap 5: Text Overlay CRUD Operations
  // ----------------------------------------------------
  const handleAddText = useCallback((customStart?: number, customDuration?: number) => {
    const start = customStart ?? currentTime;
    const dur = customDuration ?? 3;
    const newText = createDefaultTextOverlay(start, dur, texts.length);
    const updated = [...texts, newText];
    setTexts(updated);
    setSelectedTextId(newText.id);
    setActiveOverlayModal('text');
    pushProjectSnapshot({ texts: updated });
  }, [currentTime, texts, pushProjectSnapshot]);

  const handleUpdateText = useCallback((id: string, updates: Partial<TextOverlayItem>) => {
    setTexts((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      pushProjectSnapshot({ texts: updated });
      return updated;
    });
  }, [pushProjectSnapshot]);

  const handleDeleteText = useCallback((id: string) => {
    setTexts((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      pushProjectSnapshot({ texts: updated });
      return updated;
    });
    setSelectedTextId((prev) => (prev === id ? null : prev));
  }, [pushProjectSnapshot]);

  // ----------------------------------------------------
  // Tahap 5: Image / Sticker CRUD Operations
  // ----------------------------------------------------
  const handleAddImage = useCallback((file: File, customStart?: number, customDuration?: number) => {
    const url = URL.createObjectURL(file);
    createdUrlsRef.current.add(url);
    const start = customStart ?? currentTime;
    const dur = customDuration ?? 5;
    const newImg = createDefaultImageOverlay(url, file.name, start, dur);
    const updated = [...images, newImg];
    setImages(updated);
    setSelectedImageId(newImg.id);
    setActiveOverlayModal('image');
    pushProjectSnapshot({ images: updated });
  }, [currentTime, images, pushProjectSnapshot]);

  const handleUpdateImage = useCallback((id: string, updates: Partial<ImageOverlayItem>) => {
    setImages((prev) => {
      const updated = prev.map((img) => (img.id === id ? { ...img, ...updates } : img));
      pushProjectSnapshot({ images: updated });
      return updated;
    });
  }, [pushProjectSnapshot]);

  const handleDeleteImage = useCallback((id: string) => {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      pushProjectSnapshot({ images: updated });
      return updated;
    });
    setSelectedImageId((prev) => (prev === id ? null : prev));
  }, [pushProjectSnapshot]);

  // ----------------------------------------------------
  // Tahap 5: Audio Operations
  // ----------------------------------------------------
  const handleUploadAudio = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    createdUrlsRef.current.add(url);

    const temp = new Audio();
    temp.src = url;
    temp.onloadedmetadata = () => {
      const duration = isFinite(temp.duration) && temp.duration > 0 ? temp.duration : (totalDuration || 10);
      const newTrack = createDefaultAudioTrack(url, file.name, duration, 0);
      const updated = [newTrack];
      setAudios(updated);
      setSelectedAudioId(newTrack.id);
      setActiveOverlayModal('audio');
      pushProjectSnapshot({ audios: updated });
    };
  }, [totalDuration, pushProjectSnapshot]);

  const handleUpdateAudio = useCallback((updates: Partial<AudioTrackItem>) => {
    setAudios((prev) => {
      if (prev.length === 0) return prev;
      const updated = prev.map((a, idx) => (idx === 0 ? { ...a, ...updates } : a));
      pushProjectSnapshot({ audios: updated });
      return updated;
    });
  }, [pushProjectSnapshot]);

  const handleDeleteAudio = useCallback(() => {
    setAudios([]);
    setSelectedAudioId(null);
    pushProjectSnapshot({ audios: [] });
  }, [pushProjectSnapshot]);

  const handleUpdateOriginalAudio = useCallback((vol: number, muted: boolean) => {
    setOriginalAudioVolume(vol);
    setIsOriginalAudioMuted(muted);
    pushProjectSnapshot({ originalAudioVolume: vol, isOriginalAudioMuted: muted });
  }, [pushProjectSnapshot]);

  // ----------------------------------------------------
  // Tahap 5: Subtitle CRUD Operations
  // ----------------------------------------------------
  const handleAddSubtitle = useCallback((customStart?: number, customDuration?: number) => {
    const start = customStart ?? currentTime;
    const dur = customDuration ?? 2.5;
    const newSub = createDefaultSubtitle(start, dur, 'Teks subtitle baru');
    const updated = [...subtitles, newSub].sort((a, b) => a.startTime - b.startTime);
    setSubtitles(updated);
    setSelectedSubtitleId(newSub.id);
    setActiveOverlayModal('subtitle');
    pushProjectSnapshot({ subtitles: updated });
  }, [currentTime, subtitles, pushProjectSnapshot]);

  const handleUpdateSubtitle = useCallback((id: string, updates: Partial<SubtitleItem>) => {
    setSubtitles((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s)).sort((a, b) => a.startTime - b.startTime);
      pushProjectSnapshot({ subtitles: updated });
      return updated;
    });
  }, [pushProjectSnapshot]);

  const handleDeleteSubtitle = useCallback((id: string) => {
    setSubtitles((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      pushProjectSnapshot({ subtitles: updated });
      return updated;
    });
    setSelectedSubtitleId((prev) => (prev === id ? null : prev));
  }, [pushProjectSnapshot]);

  // 4. File Upload & Addition Handler (Multiple Files or Single File)
  const handleFilesUpload = async (filesList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(filesList);
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingMessage('Menyiapkan preview klip video...');

    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v'];
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB
    const newClipsToAdd: VideoClip[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const isSupportedExtension = ['mp4', 'mov', 'webm', 'm4v'].includes(extension || '');

      if (!validTypes.includes(file.type) && !isSupportedExtension) {
        setErrorMessage(
          `File "${file.name}" tidak didukung. Harap gunakan format MP4, MOV, atau WEBM.`
        );
        continue;
      }

      if (file.size > MAX_SIZE) {
        setErrorMessage(
          `File "${file.name}" terlalu besar (melebihi batas maksimal 500 MB).`
        );
        continue;
      }

      setProcessingMessage(`Membaca metadata: ${file.name} (${i + 1}/${files.length})...`);

      try {
        const url = URL.createObjectURL(file);
        createdUrlsRef.current.add(url);

        const meta = await generateVideoMetadataAndThumbnail(file);
        const clipDuration = meta.duration > 0 ? meta.duration : 5;

        const newClip: VideoClip = {
          id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          url,
          name: file.name.replace(/\.[^/.]+$/, ''), // Clean name without extension
          originalDuration: clipDuration,
          trimStart: 0,
          trimEnd: clipDuration,
          duration: clipDuration,
          width: meta.width,
          height: meta.height,
          size: file.size,
          thumbnail: meta.thumbnail,
        };

        newClipsToAdd.push(newClip);
      } catch (err) {
        console.error('Gagal memproses file video:', err);
      }
    }

    if (newClipsToAdd.length > 0) {
      const updatedClips = [...clips, ...newClipsToAdd];
      pushHistory(updatedClips);

      // If this was first upload, select first clip and start at 0
      if (clips.length === 0) {
        setSelectedClipId(newClipsToAdd[0].id);
        setCurrentTime(0);
      }
    }

    setIsProcessing(false);
    setProcessingMessage('');
  };

  // Otomatis muat klip video jika dikirim melalui initialVideoUrl
  useEffect(() => {
    if (initialVideoUrl && !initialVideoLoadedRef.current && clips.length === 0) {
      initialVideoLoadedRef.current = true;
      setIsProcessing(true);
      setProcessingMessage('Memuat video ke editor...');
      fetch(initialVideoUrl)
        .then((res) => res.blob())
        .then(async (blob) => {
          const fileName = initialVideoName || 'video_project.mp4';
          const file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
          await handleFilesUpload([file]);
        })
        .catch((err) => {
          console.warn('Gagal memuat video awal ke editor:', err);
          setErrorMessage('Gagal memuat video ke editor.');
        })
        .finally(() => {
          setIsProcessing(false);
          setProcessingMessage('');
        });
    }
  }, [initialVideoUrl, initialVideoName, clips.length]);

  // Drop File Handler
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // 5. Clip Editing Operations (Trim, Split, Delete, Reorder)
  // ✂ Trim Clip
  const handleTrimChange = (clipId: string, start: number, end: number) => {
    const updated = clips.map((c) => {
      if (c.id === clipId) {
        const safeStart = Math.max(0, Math.min(start, end - 0.2));
        const safeEnd = Math.min(c.originalDuration, Math.max(end, safeStart + 0.2));
        return {
          ...c,
          trimStart: safeStart,
          trimEnd: safeEnd,
          duration: safeEnd - safeStart,
        };
      }
      return c;
    });

    pushHistory(updated);
  };

  // ✂ Split Clip at Playhead
  const handleSplitClip = (clipId: string, splitLocalTime: number) => {
    const index = clips.findIndex((c) => c.id === clipId);
    if (index === -1) return;

    const target = clips[index];
    // Pastikan titik split berada di antara trimStart dan trimEnd
    if (
      splitLocalTime <= target.trimStart + 0.2 ||
      splitLocalTime >= target.trimEnd - 0.2
    ) {
      return;
    }

    // Buat Klip A (Bagian 1)
    const clipA: VideoClip = {
      ...target,
      id: `clip-${Date.now()}-part1`,
      name: `${target.name} (Part 1)`,
      trimStart: target.trimStart,
      trimEnd: splitLocalTime,
      duration: splitLocalTime - target.trimStart,
    };

    // Buat Klip B (Bagian 2)
    const clipB: VideoClip = {
      ...target,
      id: `clip-${Date.now()}-part2`,
      name: `${target.name} (Part 2)`,
      trimStart: splitLocalTime,
      trimEnd: target.trimEnd,
      duration: target.trimEnd - splitLocalTime,
    };

    const newClips = [...clips];
    newClips.splice(index, 1, clipA, clipB);

    pushHistory(newClips);
    setSelectedClipId(clipB.id);
  };

  // 🗑 Delete Clip
  const handleDeleteClip = (clipId: string) => {
    const updated = clips.filter((c) => c.id !== clipId);
    pushHistory(updated);

    if (selectedClipId === clipId) {
      setSelectedClipId(updated.length > 0 ? updated[0].id : null);
    }
  };

  // ⬅ Move Clip Left (Reorder)
  const handleMoveClipLeft = (clipId: string) => {
    const index = clips.findIndex((c) => c.id === clipId);
    if (index <= 0) return;

    const newClips = [...clips];
    const temp = newClips[index];
    newClips[index] = newClips[index - 1];
    newClips[index - 1] = temp;

    pushHistory(newClips);
  };

  // ➡ Move Clip Right (Reorder)
  const handleMoveClipRight = (clipId: string) => {
    const index = clips.findIndex((c) => c.id === clipId);
    if (index === -1 || index >= clips.length - 1) return;

    const newClips = [...clips];
    const temp = newClips[index];
    newClips[index] = newClips[index + 1];
    newClips[index + 1] = temp;

    pushHistory(newClips);
  };

  // Select Clip from Timeline
  const handleSelectClip = (clipId: string) => {
    setSelectedClipId(clipId);
    // Find clip global start time and seek there
    let acc = 0;
    for (const c of clips) {
      if (c.id === clipId) {
        handleSeek(acc);
        break;
      }
      acc += c.duration;
    }
  };

  // 6. Video Enhance & Color Adjustment Handlers
  const handleAdjustmentsChange = (
    clipId: string,
    newAdjustments: VideoAdjustment,
    applyToAll?: boolean
  ) => {
    const updated = clips.map((c) => {
      if (applyToAll || c.id === clipId) {
        return {
          ...c,
          adjustments: { ...newAdjustments },
        };
      }
      return c;
    });
    pushHistory(updated);
  };

  const handleAutoEnhance = (clipId: string, applyToAll?: boolean) => {
    const updated = clips.map((c) => {
      if (applyToAll || c.id === clipId) {
        return {
          ...c,
          adjustments: { ...AUTO_ENHANCE_ADJUSTMENTS },
          filter: (c.filter === 'original' || !c.filter ? 'natural' : c.filter) as VideoFilterPreset,
        };
      }
      return c;
    });
    pushHistory(updated);
  };

  const handleSelectFilter = (
    clipId: string,
    preset: FilterPresetItem,
    applyToAll?: boolean
  ) => {
    const updated = clips.map((c) => {
      if (applyToAll || c.id === clipId) {
        return {
          ...c,
          filter: preset.id,
          adjustments: { ...preset.adjustments },
        };
      }
      return c;
    });
    pushHistory(updated);
  };

  const handleResetAdjustments = (clipId: string, resetAllClips?: boolean) => {
    const updated = clips.map((c) => {
      if (resetAllClips || c.id === clipId) {
        return {
          ...c,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
        };
      }
      return c;
    });
    pushHistory(updated);
  };

  const handleResetFilters = (clipId: string, resetAllClips?: boolean) => {
    const updated = clips.map((c) => {
      if (resetAllClips || c.id === clipId) {
        return {
          ...c,
          filter: 'original' as VideoFilterPreset,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
        };
      }
      return c;
    });
    pushHistory(updated);
  };

  // 7. Transition Handlers (Tahap 4)
  const handleSaveTransition = (
    junctionIndex: number,
    transition: ClipTransition,
    applyToAll?: boolean
  ) => {
    const updated = clips.map((clip, idx) => {
      if (applyToAll) {
        if (idx < clips.length - 1) {
          return {
            ...clip,
            transitionAfter: { ...transition },
          };
        }
        return clip;
      }
      if (idx === junctionIndex) {
        return {
          ...clip,
          transitionAfter: { ...transition },
        };
      }
      return clip;
    });
    pushHistory(updated);
  };

  const handleRemoveTransition = (junctionIndex: number, applyToAll?: boolean) => {
    const updated = clips.map((clip, idx) => {
      if (applyToAll) {
        const { transitionAfter, ...rest } = clip;
        return rest as VideoClip;
      }
      if (idx === junctionIndex) {
        const { transitionAfter, ...rest } = clip;
        return rest as VideoClip;
      }
      return clip;
    });
    pushHistory(updated);
  };

  // 8. Video Effects Handlers (Tahap 4)
  const handleApplyEffect = (clipId: string, effect: VideoEffectItem) => {
    const updated = clips.map((clip) => {
      if (clip.id === clipId) {
        if (effect.type === 'none') {
          const { effects, ...rest } = clip;
          return rest as VideoClip;
        }
        const existing = clip.effects || [];
        const idx = existing.findIndex((eff) => eff.id === effect.id || eff.type === effect.type);
        if (idx !== -1) {
          const next = [...existing];
          next[idx] = effect;
          return { ...clip, effects: next };
        }
        return {
          ...clip,
          effects: [...existing, effect],
        };
      }
      return clip;
    });
    pushHistory(updated);
  };

  const handleUpdateEffect = (
    clipId: string,
    effectId: string,
    updates: Partial<VideoEffectItem>
  ) => {
    const updated = clips.map((clip) => {
      if (clip.id === clipId) {
        const existing = clip.effects || [];
        return {
          ...clip,
          effects: existing.map((eff) =>
            eff.id === effectId ? { ...eff, ...updates } : eff
          ),
        };
      }
      return clip;
    });
    pushHistory(updated);
  };

  const handleRemoveEffect = (clipId: string, effectId: string) => {
    const updated = clips.map((clip) => {
      if (clip.id === clipId) {
        const existing = clip.effects || [];
        return {
          ...clip,
          effects: existing.filter((eff) => eff.id !== effectId),
        };
      }
      return clip;
    });
    pushHistory(updated);
  };

  const handleResetEffects = (clipId: string) => {
    const updated = clips.map((clip) => {
      if (clip.id === clipId) {
        const { effects, ...rest } = clip;
        return rest as VideoClip;
      }
      return clip;
    });
    pushHistory(updated);
  };

  // Aspect Ratio CSS
  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] h-full max-h-full max-w-full object-contain';
      case '16:9':
        return 'aspect-[16/9] w-full max-h-full max-w-2xl object-contain';
      case '1:1':
        return 'aspect-square h-full max-h-full max-w-full object-contain';
      default:
        return 'aspect-[9/16] h-full max-h-full max-w-full object-contain';
    }
  };

  return (
    <div
      id="arvin-video-editor-root"
      className="flex-1 flex flex-col h-full bg-[#F8FAFC] text-slate-900 overflow-hidden select-none"
    >
      {/* 1. Top Header Navbar */}
      <header
        id="video-editor-top-nav"
        className="shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between z-30"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-video-back-home"
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title="Kembali ke Dashboard Utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                Studio Edit Video
              </h1>
              {isSuperAdmin ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  Admin
                </span>
              ) : (
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Crown className="w-2.5 h-2.5 fill-white" />
                  PRO
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden sm:block">
              Multi-clip editor video kreasi konten
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Undo & Redo in Header */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Undo (Urungkan)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Redo (Ulangi)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* "+ Tambah Video" Header Button */}
          <label
            htmlFor="header-video-picker"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Tambah video ke timeline"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">+ Tambah Video</span>
            <span className="sm:hidden">+ Video</span>
            <input
              id="header-video-picker"
              type="file"
              multiple
              accept="video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesUpload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>

          {/* Export Button */}
          {clips.length > 0 && (
            <button
              id="btn-video-export-open"
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3.5 rounded-xl shadow-sm shadow-blue-600/20 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Processing Overlay */}
      {isProcessing && (
        <div
          id="video-processing-indicator"
          className="bg-blue-600 text-white px-4 py-2 text-xs flex items-center justify-center gap-2 shadow-sm shrink-0 z-20 animate-fade-in"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="font-semibold">{processingMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2 text-xs flex items-center justify-between gap-2 shrink-0 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-rose-100 rounded text-rose-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      {clips.length === 0 ? (
        /* Empty State: Belum Ada Video */
        <main
          id="video-editor-empty-state"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
        >
          <div
            className={`w-full max-w-md bg-white border-2 border-dashed rounded-3xl p-8 sm:p-10 shadow-sm transition-all duration-200 ${
              isDragging
                ? 'border-blue-600 bg-blue-50/40 scale-102'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Clapperboard / Film Icon */}
            <div className="w-20 h-20 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Film className="w-10 h-10 animate-pulse" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1.5">
              Belum ada video
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 max-w-xs mx-auto leading-relaxed">
              Tambahkan video untuk mulai mengedit. Anda dapat memilih satu atau beberapa video sekaligus.
            </p>

            <label
              htmlFor="video-file-picker-empty"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3.5 px-6 rounded-2xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tambah Video</span>
              <input
                id="video-file-picker-empty"
                type="file"
                multiple
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesUpload(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">✓ MP4, MOV, WEBM</span>
              <span className="inline-flex items-center gap-1">✓ Multi-Clip Video</span>
              <span className="inline-flex items-center gap-1">✓ Privasi di Perangkat</span>
            </div>
          </div>
        </main>
      ) : (
        /* Video Loaded Active Editor Studio */
        <main
          id="video-editor-active-canvas"
          className="flex-1 flex flex-col overflow-hidden relative"
        >
          {/* ======================================================== */}
          {/* 1. VIDEO PREVIEW AREA (Stage + Player Controls)           */}
          {/* ======================================================== */}
          <div
            id="video-preview-area"
            className="flex-1 min-h-[160px] sm:min-h-[200px] flex flex-col overflow-hidden bg-slate-900/5 relative"
          >
            {/* Top Video Stage Preview Area */}
            <section
              id="video-preview-stage"
              className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 sm:p-3 relative overflow-hidden"
            >
              {/* Aspect Ratio & Transform Toolbar on top of stage */}
              <div className="shrink-0 mb-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-2xs text-xs">
                {(['9:16', '16:9', '1:1'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {ratio === '9:16' && <Smartphone className="w-3 h-3" />}
                    {ratio === '16:9' && <Tv className="w-3 h-3" />}
                    {ratio === '1:1' && <Square className="w-3 h-3" />}
                    <span>{ratio}</span>
                  </button>
                ))}

                <div className="w-px h-4 bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-1 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  title="Putar video 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* The Video Container Framing according to selected Aspect Ratio */}
              <div
                id="aspect-ratio-viewport"
                ref={stageViewportRef}
                className={`relative bg-black rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center transition-all duration-200 ${getAspectRatioClasses()}`}
              >
                {/* HTML5 Native Video Tag with Real-time GPU Filter */}
                <video
                  ref={videoRef}
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleVideoTimeUpdate}
                  onClick={togglePlay}
                  playsInline
                  className="w-full h-full object-contain cursor-pointer"
                  style={{
                    transform: `rotate(${rotation}deg) ${activeEffectStyle.transform} ${activeTransitionState.transform}`.trim(),
                    filter: `${activeClipFilterStyle} ${activeEffectStyle.filter} ${activeTransitionState.filter}`.trim(),
                  }}
                />

                {/* Hidden HTML5 Audio elements for background audio tracks (Tahap 5) */}
                {audios.map((track) => (
                  <audio
                    key={track.id}
                    ref={(el) => {
                      if (el) audioElementsRef.current[track.id] = el;
                      else delete audioElementsRef.current[track.id];
                    }}
                    src={track.url}
                    preload="auto"
                  />
                ))}

                {/* Real-time Transition Color / Flash Overlay */}
                {activeTransitionState.overlayColor && (activeTransitionState.overlayOpacity ?? 0) > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      backgroundColor: activeTransitionState.overlayColor,
                      opacity: activeTransitionState.overlayOpacity,
                    }}
                  />
                )}

                {/* Real-time Effect Color / Flash Overlay */}
                {activeEffectStyle.overlayColor && (activeEffectStyle.overlayOpacity ?? 0) > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none z-10"
                    style={{
                      backgroundColor: activeEffectStyle.overlayColor,
                      opacity: activeEffectStyle.overlayOpacity,
                    }}
                  />
                )}

                {/* ---------------------------------------------------- */}
                {/* TAHAP 5: Image / Sticker / Logo Overlays              */}
                {/* ---------------------------------------------------- */}
                {images.map((img) => {
                  const isVisible = currentTime >= img.startTime && currentTime <= img.endTime;
                  if (!isVisible) return null;
                  const isSelected = selectedImageId === img.id;
                  const style = computeImageStyle(img, currentTime, isSelected);

                  return (
                    <div
                      key={img.id}
                      id={`overlay-image-${img.id}`}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageId(img.id);
                        setActiveClipTool('none');
                        setTransitionModal(null);
                        setActiveOverlayModal('image');
                      }}
                      onPointerDown={(e) => handleStartDragImage(e, img.id)}
                      className={`group cursor-move transition-shadow z-20 ${
                        isSelected ? 'ring-2 ring-emerald-500 rounded-lg shadow-lg' : 'hover:ring-1 hover:ring-white/60'
                      }`}
                      title={`${img.name} (Klik untuk edit, seret untuk memindahkan)`}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-full object-contain pointer-events-none select-none"
                        draggable={false}
                      />
                      {isSelected && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none z-30">
                          {img.name}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ---------------------------------------------------- */}
                {/* TAHAP 5: Text Overlays                               */}
                {/* ---------------------------------------------------- */}
                {texts.map((txt) => {
                  const isVisible = currentTime >= txt.startTime && currentTime <= txt.endTime;
                  if (!isVisible) return null;
                  const isSelected = selectedTextId === txt.id;
                  const style = computeTextStyle(txt, currentTime, isSelected);

                  return (
                    <div
                      key={txt.id}
                      id={`overlay-text-${txt.id}`}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTextId(txt.id);
                        setActiveClipTool('none');
                        setTransitionModal(null);
                        setActiveOverlayModal('text');
                      }}
                      onPointerDown={(e) => handleStartDragText(e, txt.id)}
                      className={`group cursor-move select-none transition-shadow z-20 ${
                        isSelected ? 'ring-2 ring-blue-500 rounded-lg shadow-lg' : 'hover:ring-1 hover:ring-white/60'
                      }`}
                      title={`${txt.text} (Klik untuk edit, seret untuk memindahkan)`}
                    >
                      <span className="pointer-events-none block whitespace-pre-wrap leading-tight">
                        {txt.text}
                      </span>
                      {isSelected && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none z-30">
                          Teks (Geser / Edit)
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ---------------------------------------------------- */}
                {/* TAHAP 5: Subtitle Overlays                           */}
                {/* ---------------------------------------------------- */}
                {subtitles.map((sub) => {
                  const isVisible = currentTime >= sub.startTime && currentTime <= sub.endTime;
                  if (!isVisible) return null;
                  const isSelected = selectedSubtitleId === sub.id;
                  const style = computeSubtitleStyle(sub, currentTime, isSelected);

                  return (
                    <div
                      key={sub.id}
                      id={`overlay-subtitle-${sub.id}`}
                      style={style}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSubtitleId(sub.id);
                        setActiveClipTool('none');
                        setTransitionModal(null);
                        setActiveOverlayModal('subtitle');
                      }}
                      className={`group cursor-pointer select-none max-w-[90%] transition-all z-20 ${
                        isSelected ? 'ring-2 ring-purple-500 scale-102' : 'hover:brightness-110'
                      }`}
                      title={`Subtitle: "${sub.text}" (Klik untuk edit)`}
                    >
                      <span className="block whitespace-pre-wrap leading-snug">
                        {sub.text}
                      </span>
                    </div>
                  );
                })}

                {/* Big Center Play/Pause indicator overlay when paused */}
                {!isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/35 transition-colors cursor-pointer group z-10"
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform pl-0.5">
                      <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-slate-900" />
                    </div>
                  </button>
                )}

                {/* Top-Left Clip Name & Status Watermark Badges in Stage */}
                {activeClip && (
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10 flex-wrap max-w-[80%]">
                    <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold pointer-events-none flex items-center gap-1">
                      <Film className="w-3 h-3 text-blue-400" />
                      <span className="truncate max-w-[120px]">{activeClip.name}</span>
                    </div>

                    {/* Active Filter Preset Indicator */}
                    {activeClip.filter && activeClip.filter !== 'original' && (
                      <div className="px-2 py-0.5 rounded-lg bg-indigo-600/85 backdrop-blur-xs text-white text-[10px] font-black pointer-events-none flex items-center gap-1">
                        <span>{activeClip.filter === 'nature' ? '🌿 Nature' : activeClip.filter}</span>
                      </div>
                    )}

                    {/* Active Transition indicator badge */}
                    {activeTransitionState.isActive && (
                      <div className="px-2 py-0.5 rounded-lg bg-blue-600/90 backdrop-blur-xs text-white text-[10px] font-black pointer-events-none flex items-center gap-1 shadow-sm animate-pulse">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span className="capitalize">Transisi: {activeTransitionState.type}</span>
                      </div>
                    )}

                    {/* Active Effects count badge */}
                    {hasActiveEffects(activeClip) && (
                      <div className="px-2 py-0.5 rounded-lg bg-purple-600/90 backdrop-blur-xs text-white text-[10px] font-black pointer-events-none flex items-center gap-1 shadow-sm">
                        <Sparkles className="w-3 h-3 text-white" />
                        <span>{activeClip.effects!.filter((e) => e.type !== 'none').length} Efek</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Top-Right Before / After Compare Button */}
                <button
                  id="btn-viewport-compare-before"
                  type="button"
                  onClick={() => setIsComparingBefore((v) => !v)}
                  className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md z-10 cursor-pointer ${
                    isComparingBefore
                      ? 'bg-amber-500 text-white ring-2 ring-white scale-105'
                      : 'bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs'
                  }`}
                  title="Bandingkan visual sebelum vs sesudah filter & adjustment"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {isComparingBefore ? 'Melihat: Asli' : 'Before / After'}
                  </span>
                  <span className="sm:hidden">{isComparingBefore ? 'Asli' : 'B/A'}</span>
                </button>

                {/* Bottom Center Indicator when Comparing Before */}
                {isComparingBefore && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-amber-500/95 backdrop-blur-xs text-white px-3.5 py-1 rounded-full text-[11px] font-black shadow-lg animate-pulse flex items-center gap-1.5 pointer-events-none z-10">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Mode Asli (Original Tanpa Filter)</span>
                  </div>
                )}
              </div>
            </section>

            {/* Player Controls Bar */}
            <div
              id="video-player-controls-bar"
              className="shrink-0 bg-white border-t border-slate-200 px-3 sm:px-6 py-1.5 sm:py-2 flex items-center justify-between gap-2 sm:gap-3 text-xs"
            >
              <div className="flex items-center gap-2">
                {/* Previous Clip Button */}
                <button
                  id="btn-player-skip-prev"
                  type="button"
                  onClick={handleSkipPrevious}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Klip Sebelumnya (⏮)"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play / Pause Toggle */}
                <button
                  id="btn-player-toggle-play"
                  type="button"
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause (⏸)' : 'Play (▶)'}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                {/* Next Clip Button */}
                <button
                  id="btn-player-skip-next"
                  type="button"
                  onClick={handleSkipNext}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  title="Klip Berikutnya (⏭)"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Mute Toggle */}
                <button
                  id="btn-player-toggle-mute"
                  type="button"
                  onClick={toggleMute}
                  className="w-8 h-8 rounded-xl hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-600" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                {/* Volume Slider on desktop */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="hidden sm:inline-block w-16 h-1.5 bg-slate-200 rounded-lg accent-blue-600 cursor-pointer"
                  title="Volume"
                />

                {/* Current Time / Total Duration Display */}
                <div className="font-mono text-[11px] sm:text-xs font-bold text-slate-800 ml-1">
                  <span className="text-blue-600">{formatTime(currentTime)}</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-500">{formatTime(totalDuration)}</span>
                </div>
              </div>

              {/* Quick Playback Speed Selector */}
              <div className="flex items-center gap-1">
                {[0.5, 1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                      playbackSpeed === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. EDITING TOOLS AREA (Scrollable, Docked In-Flow)       */}
          {/* ======================================================== */}
          <section
            id="editing-tools-area"
            className="shrink-0 flex flex-col bg-white border-t border-slate-200 z-20 shadow-2xs"
          >
            {/* Dedicated Clip Toolbar (Trim, Split, Delete, Move, Adjust, Filters, Effects, Text, Image, Audio, Subtitle) */}
            <ClipToolbar
              selectedClip={selectedClip}
              selectedClipIndex={selectedClipIndex}
              totalClips={clips.length}
              currentLocalTime={currentLocalTime}
              canUndo={historyIndex > 0}
              canRedo={historyIndex < history.length - 1}
              isComparingBefore={isComparingBefore}
              onToggleCompareBefore={() => setIsComparingBefore((v) => !v)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onTrimChange={handleTrimChange}
              onSplitClip={handleSplitClip}
              onDeleteClip={handleDeleteClip}
              onMoveLeft={handleMoveClipLeft}
              onMoveRight={handleMoveClipRight}
              onAdjustmentsChange={handleAdjustmentsChange}
              onAutoEnhance={handleAutoEnhance}
              onSelectFilter={handleSelectFilter}
              onResetAdjustments={handleResetAdjustments}
              onResetFilters={handleResetFilters}
              onApplyEffect={handleApplyEffect}
              onUpdateEffect={handleUpdateEffect}
              onRemoveEffect={handleRemoveEffect}
              onResetEffects={handleResetEffects}
              activePanel={activeClipTool}
              onActivePanelChange={(panel) => {
                setActiveClipTool(panel);
                if (panel !== 'none') {
                  setActiveOverlayModal('none');
                  setTransitionModal(null);
                }
              }}
              activeOverlayModal={activeOverlayModal}
              isTransitionActive={Boolean(transitionModal && transitionModal.isOpen)}
              onOpenTransitionModal={(junctionIndex) => {
                setActiveClipTool('none');
                setActiveOverlayModal('none');
                setTransitionModal({ isOpen: true, junctionIndex });
              }}
              onOpenTextPanel={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                if (activeOverlayModal === 'text') {
                  setActiveOverlayModal('none');
                } else {
                  setActiveOverlayModal('text');
                  if (texts.length === 0) handleAddText();
                }
              }}
              onOpenImagePanel={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                if (activeOverlayModal === 'image') {
                  setActiveOverlayModal('none');
                } else {
                  setActiveOverlayModal('image');
                }
              }}
              onOpenAudioPanel={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                if (activeOverlayModal === 'audio') {
                  setActiveOverlayModal('none');
                } else {
                  setActiveOverlayModal('audio');
                }
              }}
              onOpenSubtitlePanel={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                if (activeOverlayModal === 'subtitle') {
                  setActiveOverlayModal('none');
                } else {
                  setActiveOverlayModal('subtitle');
                  if (subtitles.length === 0) handleAddSubtitle();
                }
              }}
              textCount={texts.length}
              imageCount={images.length}
              hasAudio={audios.length > 0}
              subtitleCount={subtitles.length}
            />

            {/* Docked Overlay & Transition Panels (Text, Image, Audio, Subtitle, Transition) */}
            {(activeOverlayModal !== 'none' || (transitionModal && transitionModal.isOpen)) && (
              <div
                id="docked-overlay-tool-panel"
                className="h-[250px] sm:h-[280px] md:h-[305px] max-h-[38vh] flex flex-col overflow-hidden border-t border-slate-200 bg-white"
              >
                {/* Transition Settings Panel */}
                {transitionModal && transitionModal.isOpen && (
                  <TransitionModal
                    isOpen={transitionModal.isOpen}
                    onClose={() => setTransitionModal(null)}
                    fromClip={clips[transitionModal.junctionIndex] || null}
                    toClip={clips[transitionModal.junctionIndex + 1] || null}
                    transitionIndex={transitionModal.junctionIndex}
                    totalTransitions={clips.length - 1}
                    currentTransition={clips[transitionModal.junctionIndex]?.transitionAfter}
                    onSaveTransition={handleSaveTransition}
                    onRemoveTransition={handleRemoveTransition}
                  />
                )}

                {/* Text Settings Panel */}
                {activeOverlayModal === 'text' && selectedText && (
                  <TextPanel
                    textItem={selectedText}
                    totalDuration={totalDuration}
                    currentGlobalTime={currentTime}
                    onUpdate={(updates) => handleUpdateText(selectedText.id, updates)}
                    onDelete={() => {
                      handleDeleteText(selectedText.id);
                      setActiveOverlayModal('none');
                    }}
                    onDuplicate={() => {
                      const copy: TextOverlayItem = {
                        ...selectedText,
                        id: `text-${Date.now()}`,
                        text: `${selectedText.text} (Salin)`,
                        y: Math.min(90, selectedText.y + 10),
                      };
                      const updated = [...texts, copy];
                      setTexts(updated);
                      setSelectedTextId(copy.id);
                      pushProjectSnapshot({ texts: updated });
                    }}
                    onClose={() => setActiveOverlayModal('none')}
                  />
                )}

                {/* Image / Sticker / Logo Panel */}
                {activeOverlayModal === 'image' && selectedImage && (
                  <ImagePanel
                    imageItem={selectedImage}
                    totalDuration={totalDuration}
                    currentGlobalTime={currentTime}
                    onUpdate={(updates) => handleUpdateImage(selectedImage.id, updates)}
                    onReplaceFile={(file) => {
                      const newUrl = URL.createObjectURL(file);
                      createdUrlsRef.current.add(newUrl);
                      handleUpdateImage(selectedImage.id, { url: newUrl, name: file.name });
                    }}
                    onDelete={() => {
                      handleDeleteImage(selectedImage.id);
                      setActiveOverlayModal('none');
                    }}
                    onClose={() => setActiveOverlayModal('none')}
                  />
                )}

                {/* Upload image fallback if no image is currently selected */}
                {activeOverlayModal === 'image' && !selectedImage && (
                  <div
                    id="docked-image-upload-fallback"
                    className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 text-center bg-slate-50/50"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 shadow-2xs">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Unggah Gambar atau Logo</h3>
                    <p className="text-[11px] text-slate-500 mb-3 max-w-xs leading-relaxed">
                      Pilih file PNG, JPG, WebP, atau GIF transparan untuk dijadikan overlay di video.
                    </p>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih File Gambar</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleAddImage(e.target.files[0]);
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveOverlayModal('none')}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl hover:bg-slate-200 cursor-pointer transition-colors"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                )}

                {/* Background Audio Panel */}
                {activeOverlayModal === 'audio' && (
                  <AudioPanel
                    audioTrack={audios.length > 0 ? audios[0] : null}
                    totalDuration={totalDuration}
                    currentGlobalTime={currentTime}
                    originalAudioVolume={originalAudioVolume}
                    isOriginalAudioMuted={isOriginalAudioMuted}
                    onUpdateTrack={(updates) => handleUpdateAudio(updates)}
                    onUploadNewAudio={(file) => handleUploadAudio(file)}
                    onDeleteTrack={() => handleDeleteAudio()}
                    onUpdateOriginalAudio={(vol, muted) => handleUpdateOriginalAudio(vol, muted)}
                    onClose={() => setActiveOverlayModal('none')}
                  />
                )}

                {/* Subtitle Panel */}
                {activeOverlayModal === 'subtitle' && (
                  <SubtitlePanel
                    subtitles={subtitles}
                    selectedSubtitleId={selectedSubtitleId}
                    totalDuration={totalDuration}
                    currentGlobalTime={currentTime}
                    onAddSubtitle={(startTime, duration) => handleAddSubtitle(startTime, duration)}
                    onUpdateSubtitle={(id, updates) => handleUpdateSubtitle(id, updates)}
                    onDeleteSubtitle={(id) => handleDeleteSubtitle(id)}
                    onSelectSubtitle={(id) => setSelectedSubtitleId(id)}
                    onClose={() => setActiveOverlayModal('none')}
                  />
                )}
              </div>
            )}
          </section>

          {/* ======================================================== */}
          {/* 3. TIMELINE AREA                                          */}
          {/* ======================================================== */}
          <div id="timeline-dock-area" className="shrink-0">
            <Timeline
              clips={clips}
              selectedClipId={selectedClipId}
              currentTime={currentTime}
              totalDuration={totalDuration}
              timelineZoom={timelineZoom}
              onSelectClip={handleSelectClip}
              onSeek={handleSeek}
              onAddVideoClick={() => {
                document.getElementById('header-video-picker')?.click();
              }}
              onMoveClipLeft={handleMoveClipLeft}
              onMoveClipRight={handleMoveClipRight}
              onDeleteClip={handleDeleteClip}
              onOpenTransitionModal={(junctionIndex) => {
                setActiveClipTool('none');
                setActiveOverlayModal('none');
                setTransitionModal({ isOpen: true, junctionIndex });
              }}
              onZoomIn={() => setTimelineZoom((z) => Math.min(2.5, z + 0.25))}
              onZoomOut={() => setTimelineZoom((z) => Math.max(0.5, z - 0.25))}
              texts={texts}
              selectedTextId={selectedTextId}
              onSelectText={(id) => {
                setActiveClipTool('none');
                setTransitionModal(null);
                setSelectedTextId(id);
                setActiveOverlayModal('text');
              }}
              onAddTextClick={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                handleAddText();
              }}
              images={images}
              selectedImageId={selectedImageId}
              onSelectImage={(id) => {
                setActiveClipTool('none');
                setTransitionModal(null);
                setSelectedImageId(id);
                setActiveOverlayModal('image');
              }}
              onAddImageClick={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                setActiveOverlayModal('image');
              }}
              audios={audios}
              selectedAudioId={selectedAudioId}
              onSelectAudio={(id) => {
                setActiveClipTool('none');
                setTransitionModal(null);
                setSelectedAudioId(id);
                setActiveOverlayModal('audio');
              }}
              onAddAudioClick={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                setActiveOverlayModal('audio');
              }}
              subtitles={subtitles}
              selectedSubtitleId={selectedSubtitleId}
              onSelectSubtitle={(id) => {
                setActiveClipTool('none');
                setTransitionModal(null);
                setSelectedSubtitleId(id);
                setActiveOverlayModal('subtitle');
              }}
              onAddSubtitleClick={() => {
                setActiveClipTool('none');
                setTransitionModal(null);
                handleAddSubtitle();
              }}
            />
          </div>
        </main>
      )}

      {/* 7. Real Video Export Modal (Tahap 6) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        clips={clips}
        texts={texts}
        images={images}
        subtitles={subtitles}
        audios={audios}
        aspectRatio={aspectRatio}
        rotation={rotation}
        originalAudioVolume={originalAudioVolume}
        isOriginalAudioMuted={isOriginalAudioMuted}
        currentUser={currentUser}
        isSuperAdmin={isSuperAdmin}
        onNavigateToPremium={onNavigateToPremium}
      />
    </div>
  );
};

export default VideoEditor;
