import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Video,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Crown,
  ShieldCheck,
  ChevronRight,
  Sliders,
  Volume2,
  VolumeX,
  Share2,
  Lock,
  ArrowRight,
  Film,
  Zap,
} from 'lucide-react';
import {
  checkAiVideoAdAccess,
  acquireAiVideoAdLock,
  releaseAiVideoAdLock,
  consumeAiVideoAdTrial,
} from '../../services/accessControlService';
import { AiVideoAdAccessCheck, GeneratedAiVideoAd, AiVideoAdScene } from '../../types';

interface AiVideoAdViewProps {
  onUpgrade: () => void;
  onNavigateToEditVideo?: (adData: GeneratedAiVideoAd) => void;
  currentUser?: any;
}

const DEFAULT_MODEL_PHOTO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
const DEFAULT_PRODUCT_PHOTO =
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80';

export const AiVideoAdView: React.FC<AiVideoAdViewProps> = ({
  onUpgrade,
  onNavigateToEditVideo,
  currentUser,
}) => {
  // Access state
  const [accessState, setAccessState] = useState<AiVideoAdAccessCheck>({
    allowed: false,
    isSuperAdmin: false,
    isPremium: false,
    trialUsed: false,
    remaining: 0,
    reason: 'UNAUTHENTICATED',
  });
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Form inputs
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [adStyle, setAdStyle] = useState('Trendy TikTok & Reels');
  const [ratio, setRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [duration, setDuration] = useState<number>(15);

  // Photos
  const [modelPhoto, setModelPhoto] = useState<string>(DEFAULT_MODEL_PHOTO);
  const [productPhoto, setProductPhoto] = useState<string>(DEFAULT_PRODUCT_PHOTO);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Generated ad result
  const [generatedAd, setGeneratedAd] = useState<GeneratedAiVideoAd | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Audio Context ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioTimerRef = useRef<any>(null);
  const playbackIntervalRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Check access on mount
  useEffect(() => {
    let isMounted = true;

    async function loadAccess() {
      setIsCheckingAccess(true);
      try {
        const result = await checkAiVideoAdAccess(currentUser?.uid);
        if (isMounted) {
          setAccessState(result);
        }
      } catch (err) {
        console.warn('Error loading AI video ad access:', err);
      } finally {
        if (isMounted) {
          setIsCheckingAccess(false);
        }
      }
    }

    loadAccess();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid]);

  // Handle Photo Upload
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'model' | 'product'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (target === 'model') {
        setModelPhoto(result);
      } else {
        setProductPhoto(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Generate AI Video Ad
  const handleGenerate = async () => {
    if (!productName.trim()) {
      setGenerationError('Silakan masukkan nama produk terlebih dahulu.');
      return;
    }

    // 1. Check access and lock
    setGenerationError(null);
    setIsGenerating(true);
    setGenerationStep('Memeriksa hak akses & kuota...');

    try {
      const lockRes = await acquireAiVideoAdLock(currentUser?.uid);
      if (!lockRes.acquired) {
        setIsGenerating(false);
        setGenerationError(
          lockRes.error ||
            'Kesempatan Gratis Anda Telah Digunakan. Silakan upgrade ke Premium.'
        );
        return;
      }

      setGenerationStep('Menganalisis profil produk & audiens sasaran...');
      await new Promise((r) => setTimeout(r, 600));

      setGenerationStep('Menyusun hook 3 detik & narasi copywriting...');
      await new Promise((r) => setTimeout(r, 800));

      setGenerationStep('Merangkai visual foto model & produk ke dalam scene...');

      const response = await fetch('/api/ai-video-ad/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid,
          email: currentUser?.email,
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          targetAudience: targetAudience.trim(),
          style: adStyle,
          duration,
          ratio,
          modelPhotoUrl: modelPhoto,
          productPhotoUrl: productPhoto,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            'Gagal membuat video iklan. Trial Anda TIDAK berkurang. Silakan coba lagi.'
        );
      }

      const data = await response.json();
      if (!data.ad || !Array.isArray(data.ad.scenes) || data.ad.scenes.length === 0) {
        throw new Error('Respons format video iklan tidak valid.');
      }

      setGenerationStep('Menyiapkan pemutar video dan audio musik...');
      await new Promise((r) => setTimeout(r, 500));

      const newAd: GeneratedAiVideoAd = {
        ...data.ad,
        modelPhotoUrl: modelPhoto,
        productPhotoUrl: productPhoto,
      };

      setGeneratedAd(newAd);
      setCurrentSceneIndex(0);
      setPlaybackProgress(0);

      // KONSUMSI TRIAL: Hanya jika video sudah BERHASIL DIGENERATE dan siap diputar!
      try {
        await consumeAiVideoAdTrial(currentUser?.uid, {
          productName: newAd.productName,
          style: newAd.style,
          duration: newAd.totalDuration,
        });
        // Perbarui status akses lokal menjadi trialUsed = true
        if (!accessState.isSuperAdmin && !accessState.isPremium) {
          setAccessState((prev) => ({
            ...prev,
            allowed: false,
            trialUsed: true,
            remaining: 0,
            reason: 'FREE_TRIAL_EXHAUSTED',
          }));
        }
      } catch (consumeErr) {
        console.warn('Notice: Trial consumption sync error:', consumeErr);
      }

      setIsGenerating(false);
      setIsPlaying(true);
    } catch (err: any) {
      console.error('Error generating AI video ad:', err);
      // Trial TIDAK berkurang jika gagal! Release lock
      await releaseAiVideoAdLock(currentUser?.uid);
      setIsGenerating(false);
      setGenerationError(
        err?.message ||
          'Terjadi kendala saat generate video iklan. Trial Anda TIDAK berkurang. Silakan coba lagi.'
      );
    }
  };

  // Play commercial synth audio via Web Audio API
  const startSynthBgm = () => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Upbeat commercial arpeggio chords
      const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99];
      let step = 0;

      const playBeep = () => {
        if (!isPlaying || isMuted || !audioCtxRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const freq = notes[step % notes.length];
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        step++;
        audioTimerRef.current = setTimeout(playBeep, 240);
      };

      playBeep();
    } catch (e) {
      console.warn('Audio synthesis disabled or blocked:', e);
    }
  };

  const stopSynthBgm = () => {
    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }
  };

  // Player timer loop
  useEffect(() => {
    if (!isPlaying || !generatedAd || generatedAd.scenes.length === 0) {
      stopSynthBgm();
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      return;
    }

    startSynthBgm();

    const totalSeconds = generatedAd.totalDuration || 15;
    const intervalMs = 100;
    const progressStep = (intervalMs / (totalSeconds * 1000)) * 100;

    playbackIntervalRef.current = setInterval(() => {
      setPlaybackProgress((prev) => {
        const nextProgress = prev + progressStep;
        if (nextProgress >= 100) {
          // Loop back to start
          setCurrentSceneIndex(0);
          return 0;
        }

        // Calculate active scene
        const currentTime = (nextProgress / 100) * totalSeconds;
        let accum = 0;
        for (let i = 0; i < generatedAd.scenes.length; i++) {
          accum += generatedAd.scenes[i].duration;
          if (currentTime <= accum) {
            setCurrentSceneIndex(i);
            break;
          }
        }

        return nextProgress;
      });
    }, intervalMs);

    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      stopSynthBgm();
    };
  }, [isPlaying, generatedAd, isMuted]);

  // Export video via HTML5 Canvas + MediaRecorder
  const handleExport = async () => {
    if (!generatedAd) return;
    setIsExporting(true);
    setExportProgress(0);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context tidak tersedia');

      const width = ratio === '9:16' ? 720 : ratio === '1:1' ? 720 : 1280;
      const height = ratio === '9:16' ? 1280 : ratio === '1:1' ? 720 : 720;
      canvas.width = width;
      canvas.height = height;

      // Preload images
      const loadImg = (src: string) =>
        new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = () => resolve(img);
          img.src = src;
        });

      const modelImg = await loadImg(generatedAd.modelPhotoUrl || DEFAULT_MODEL_PHOTO);
      const prodImg = await loadImg(generatedAd.productPhotoUrl || DEFAULT_PRODUCT_PHOTO);

      const stream = canvas.captureStream(30);

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' });
      } catch {
        recorder = new MediaRecorder(stream);
      }

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arvin_iklan_${generatedAd.productName.toLowerCase().replace(/\s+/g, '_')}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setExportProgress(100);
      };

      recorder.start();

      const totalDurationSec = generatedAd.totalDuration || 15;
      const totalFrames = totalDurationSec * 30;
      let frame = 0;

      const renderFrame = () => {
        if (frame >= totalFrames) {
          recorder.stop();
          return;
        }

        const currentTimeSec = (frame / totalFrames) * totalDurationSec;
        let activeIdx = 0;
        let accumTime = 0;
        for (let i = 0; i < generatedAd.scenes.length; i++) {
          accumTime += generatedAd.scenes[i].duration;
          if (currentTimeSec <= accumTime) {
            activeIdx = i;
            break;
          }
        }
        const activeScene = generatedAd.scenes[activeIdx] || generatedAd.scenes[0];

        // Draw background gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw main media
        const currentImg = activeScene.visualFocus === 'model' ? modelImg : prodImg;
        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
          const imgAspect = currentImg.naturalWidth / currentImg.naturalHeight;
          const canvasAspect = width / height;
          let drawW = width;
          let drawH = height;
          let offX = 0;
          let offY = 0;

          if (imgAspect > canvasAspect) {
            drawW = height * imgAspect;
            offX = (width - drawW) / 2;
          } else {
            drawH = width / imgAspect;
            offY = (height - drawH) / 2;
          }
          ctx.drawImage(currentImg, offX, offY, drawW, drawH);
        }

        // Dark gradient overlay for text readability
        const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
        grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
        grad.addColorStop(0.7, 'rgba(15, 23, 42, 0.85)');
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // Draw Badge
        if (activeScene.badgeText) {
          ctx.fillStyle = activeScene.badgeColor || '#ef4444';
          ctx.beginPath();
          ctx.roundRect(40, 50, 220, 48, 24);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(activeScene.badgeText.toUpperCase(), 150, 82);
        }

        // Draw Headline
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(activeScene.headline || generatedAd.headlineHook, 40, height - 160);

        // Draw Subheadline / Voiceover
        ctx.fillStyle = '#94a3b8';
        ctx.font = '22px sans-serif';
        ctx.fillText(activeScene.subheadline || activeScene.voiceoverScript, 40, height - 110);

        // Draw Brand Tag
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`ARVIN STUDIO • ${generatedAd.productName}`, 40, height - 50);

        frame++;
        setExportProgress(Math.round((frame / totalFrames) * 100));
        setTimeout(renderFrame, 1000 / 30);
      };

      renderFrame();
    } catch (err: any) {
      console.error('Export failed:', err);
      setIsExporting(false);
      alert('Gagal mengekspor video iklan: ' + err?.message);
    }
  };

  const activeScene: AiVideoAdScene | undefined =
    generatedAd?.scenes[currentSceneIndex] || generatedAd?.scenes[0];

  return (
    <div id="ai-video-ad-container" className="w-full max-w-7xl mx-auto px-4 py-6 sm:py-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
              <Video className="w-6 h-6" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              AI Video Iklan
            </h1>
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Rancang video promosi komersial dengan foto model & produk berkualitas tinggi, hook
            pembuka 3 detik, naskah suara viral, dan susunan scene berkonversi tinggi.
          </p>
        </div>

        {/* ACCESS BADGE */}
        <div className="flex items-center gap-3">
          {accessState.isSuperAdmin ? (
            <div
              id="badge-superadmin"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-100 border border-purple-300 text-purple-800 text-xs font-bold"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              SUPER ADMIN BYPASS (Akses Penuh)
            </div>
          ) : accessState.isPremium ? (
            <div
              id="badge-premium"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold"
            >
              <Crown className="w-4 h-4 text-amber-600" />
              PREMIUM AKTIF (Tanpa Batas)
            </div>
          ) : accessState.trialUsed ? (
            <div
              id="badge-free-exhausted"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold"
            >
              <Lock className="w-4 h-4 text-rose-600" />
              Trial Seumur Hidup: 0× Tersisa
            </div>
          ) : (
            <div
              id="badge-free-available"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Kesempatan Gratis 1× SEUMUR HIDUP
            </div>
          )}
        </div>
      </div>

      {/* BANNER 1: FREE TRIAL EXHAUSTED BANNER (MANDATORY REQUIREMENT) */}
      {!accessState.isSuperAdmin && !accessState.isPremium && accessState.trialUsed && (
        <div
          id="trial-exhausted-lock-card"
          className="mt-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 border-2 border-rose-200 shadow-lg text-center flex flex-col items-center"
        >
          <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-md mb-4">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Kesempatan Gratis Anda Telah Digunakan
          </h2>

          <p className="text-slate-700 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">
            Anda telah menggunakan 1× kesempatan gratis seumur hidup akun Anda untuk membuat AI Video
            Iklan. Upgrade ke akun <strong>Premium</strong> untuk mendapatkan akses tanpa batas ke
            semua fitur AI Video Iklan dan ekspor tanpa watermark.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              id="btn-upgrade-premium-trial-exhausted"
              type="button"
              onClick={onUpgrade}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 hover:from-amber-600 hover:to-orange-700 transition-all flex items-center gap-2 cursor-pointer text-base"
            >
              <Crown className="w-5 h-5" />
              Upgrade Premium
            </button>
          </div>
        </div>
      )}

      {/* BANNER 2: FREE TRIAL AVAILABLE NOTICE */}
      {!accessState.isSuperAdmin && !accessState.isPremium && !accessState.trialUsed && (
        <div
          id="trial-available-banner"
          className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start sm:items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="flex-1 text-sm text-blue-900">
            <strong className="font-bold">Kesempatan Gratis 1× Seumur Hidup:</strong> Anda memiliki{' '}
            <strong>1 kali generate gratis</strong> untuk mencoba kualitas video iklan AI komersial
            ARVIN STUDIO. Kuota hanya akan berkurang setelah video berhasil dibuat.
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* LEFT COLUMN: FORM & SETTINGS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              Pengaturan Video Iklan
            </h2>

            {/* Nama Produk */}
            <div className="mb-4">
              <label
                htmlFor="input-product-name"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Nama Produk / Jasa <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-product-name"
                type="text"
                disabled={!accessState.allowed || isGenerating}
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Contoh: Glowing Serum Vit C ARVIN, Kopi Robusta Premium..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Deskripsi & Keunggulan */}
            <div className="mb-4">
              <label
                htmlFor="input-product-desc"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Keunggulan Produk / Promo Diskon
              </label>
              <textarea
                id="input-product-desc"
                rows={3}
                disabled={!accessState.allowed || isGenerating}
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Contoh: Mencerahkan kulit dalam 7 hari, bahan alami organik, diskon 50% untuk 100 pembeli pertama..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400 resize-none"
              />
            </div>

            {/* Target Audiens */}
            <div className="mb-4">
              <label
                htmlFor="input-target-audience"
                className="block text-sm font-semibold text-slate-800 mb-1.5"
              >
                Target Audiens
              </label>
              <input
                id="input-target-audience"
                type="text"
                disabled={!accessState.allowed || isGenerating}
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Contoh: Wanita 18-35 tahun, pecinta skincare alami, UMKM..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>

            {/* Gaya Iklan & Durasi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="select-ad-style"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Gaya Video Iklan
                </label>
                <select
                  id="select-ad-style"
                  disabled={!accessState.allowed || isGenerating}
                  value={adStyle}
                  onChange={(e) => setAdStyle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 disabled:bg-slate-50"
                >
                  <option value="Trendy TikTok & Reels">Trendy TikTok & Reels</option>
                  <option value="Hard Selling Promo Heboh">Hard Selling Promo Heboh</option>
                  <option value="Storytelling & Edukasi">Storytelling & Edukasi</option>
                  <option value="Luxury & Aesthetic">Luxury & Aesthetic</option>
                  <option value="Review Jujur Relatable">Review Jujur Relatable</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="select-ad-duration"
                  className="block text-sm font-semibold text-slate-800 mb-1.5"
                >
                  Durasi Video
                </label>
                <select
                  id="select-ad-duration"
                  disabled={!accessState.allowed || isGenerating}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-800 disabled:bg-slate-50"
                >
                  <option value={15}>15 Detik (3 Scenes)</option>
                  <option value={30}>30 Detik (5 Scenes)</option>
                </select>
              </div>
            </div>

            {/* Rasio Video */}
            <div className="mb-6">
              <span className="block text-sm font-semibold text-slate-800 mb-2">
                Rasio Video
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '9:16', label: '9:16 (Reels/TikTok)' },
                  { id: '1:1', label: '1:1 (Persegi Feed)' },
                  { id: '16:9', label: '16:9 (Landscape)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    id={`btn-ratio-${item.id.replace(':', '-')}`}
                    type="button"
                    disabled={!accessState.allowed || isGenerating}
                    onClick={() => setRatio(item.id as any)}
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                      ratio === item.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FOTO MODEL & PRODUK */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Asset Foto Model & Produk
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Foto Model */}
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Foto Model / Kreator
                  </span>
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-200 relative group mb-2">
                    <img
                      src={modelPhoto}
                      alt="Model"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="upload-model-photo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ganti Foto Model
                  </label>
                  <input
                    id="upload-model-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'model')}
                    disabled={!accessState.allowed || isGenerating}
                  />
                </div>

                {/* Upload Foto Produk */}
                <div className="border border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 block mb-2">Foto Produk</span>
                  <div className="w-full h-32 rounded-lg overflow-hidden bg-slate-200 relative group mb-2">
                    <img
                      src={productPhoto}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <label
                    htmlFor="upload-product-photo"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ganti Foto Produk
                  </label>
                  <input
                    id="upload-product-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'product')}
                    disabled={!accessState.allowed || isGenerating}
                  />
                </div>
              </div>
            </div>

            {/* ERROR NOTIFICATION */}
            {generationError && (
              <div
                id="generation-error-box"
                className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{generationError}</div>
              </div>
            )}

            {/* GENERATE BUTTON */}
            <div className="mt-6">
              {!accessState.allowed ? (
                <button
                  id="btn-generate-disabled"
                  type="button"
                  onClick={onUpgrade}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-md hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade Premium untuk Generate Video Iklan
                </button>
              ) : (
                <button
                  id="btn-generate-ai-video-ad"
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerate}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{generationStep || 'Memproses AI Video Iklan...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        Generate AI Video Iklan{' '}
                        {!accessState.isSuperAdmin && !accessState.isPremium
                          ? '(1× Gratis)'
                          : ''}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE PREVIEW & RESULT */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {generatedAd ? (
            <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {generatedAd.productName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {generatedAd.scenes.length} Scenes • {generatedAd.totalDuration} detik •{' '}
                    {generatedAd.style}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="btn-mute-toggle"
                    type="button"
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                    title={isMuted ? 'Nyalakan Audio' : 'Matikan Audio'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* VIDEO PLAYER SCREEN */}
              <div
                id="video-player-screen"
                className={`relative rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-slate-800 flex flex-col justify-between ${
                  ratio === '9:16'
                    ? 'w-[280px] sm:w-[320px] aspect-[9/16]'
                    : ratio === '1:1'
                    ? 'w-[320px] sm:w-[380px] aspect-square'
                    : 'w-full max-w-[480px] aspect-[16/9]'
                }`}
              >
                {/* Visual Media Background */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={
                      activeScene?.visualFocus === 'model'
                        ? generatedAd.modelPhotoUrl || DEFAULT_MODEL_PHOTO
                        : generatedAd.productPhotoUrl || DEFAULT_PRODUCT_PHOTO
                    }
                    alt="Active Visual"
                    className="w-full h-full object-cover transition-all duration-700 scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                </div>

                {/* Top Badge Overlay */}
                <div className="relative z-10 p-4 flex items-center justify-between">
                  {activeScene?.badgeText && (
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-black text-white shadow-md tracking-wider uppercase"
                      style={{ backgroundColor: activeScene.badgeColor || '#e11d48' }}
                    >
                      {activeScene.badgeText}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/50 backdrop-blur-xs text-white">
                    Scene {currentSceneIndex + 1}/{generatedAd.scenes.length}
                  </span>
                </div>

                {/* Center Play/Pause Overlay Indicator */}
                {!isPlaying && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
                    <button
                      id="btn-center-play"
                      type="button"
                      onClick={() => setIsPlaying(true)}
                      className="w-16 h-16 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-2xl hover:scale-105 transition-all cursor-pointer"
                    >
                      <Play className="w-8 h-8 ml-1" />
                    </button>
                  </div>
                )}

                {/* Bottom Content / Overlay Text */}
                <div className="relative z-10 p-4 text-white">
                  <h4 className="text-base sm:text-lg font-black leading-tight drop-shadow-md">
                    {activeScene?.headline || generatedAd.headlineHook}
                  </h4>
                  <p className="text-xs text-slate-200 mt-1 drop-shadow-sm line-clamp-2">
                    {activeScene?.subheadline || activeScene?.voiceoverScript}
                  </p>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                      ARVIN STUDIO AI
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Fokus: {activeScene?.visualFocus === 'model' ? 'Model' : 'Produk'}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className="bg-blue-500 h-full transition-all duration-100"
                      style={{ width: `${playbackProgress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* CONTROLS */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  id="btn-play-pause"
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all cursor-pointer shadow-md"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <button
                  id="btn-replay"
                  type="button"
                  onClick={() => {
                    setCurrentSceneIndex(0);
                    setPlaybackProgress(0);
                    setIsPlaying(true);
                  }}
                  className="p-3 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                  title="Putar Ulang"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* ACTION BUTTONS: EXPORT & OPEN IN VIDEO EDITOR */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                <button
                  id="btn-export-video-ad"
                  type="button"
                  disabled={isExporting}
                  onClick={handleExport}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? `Mengekspor ${exportProgress}%...` : 'Export File Video (WebM)'}
                </button>

                {onNavigateToEditVideo && (
                  <button
                    id="btn-open-in-editor"
                    type="button"
                    onClick={() => onNavigateToEditVideo(generatedAd)}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Film className="w-4 h-4" />
                    Buka di Edit Video
                  </button>
                )}
              </div>

              {/* SCENE BREAKDOWN LIST */}
              <div className="w-full mt-6 pt-5 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Urutan Scene Naskah Iklan
                </h4>
                <div className="space-y-2">
                  {generatedAd.scenes.map((scene, idx) => (
                    <div
                      key={scene.id || idx}
                      onClick={() => {
                        setCurrentSceneIndex(idx);
                        setPlaybackProgress(
                          (idx / generatedAd.scenes.length) * 100
                        );
                      }}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        currentSceneIndex === idx
                          ? 'border-blue-500 bg-blue-50/50'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>
                          {scene.title || `Scene ${idx + 1}`} ({scene.duration}s)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {scene.visualFocus === 'model' ? 'Foto Model' : 'Foto Produk'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">{scene.voiceoverScript}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full min-h-[420px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs mb-4 text-blue-500">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-base mb-1">
                Preview Video Iklan Komersial
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Isi form nama produk dan asset foto di sebelah kiri, lalu klik{' '}
                <strong>"Generate AI Video Iklan"</strong> untuk melihat hasil visual interaktif.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
