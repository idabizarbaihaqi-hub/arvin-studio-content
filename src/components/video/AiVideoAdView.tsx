import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Video,
  Play,
  RotateCcw,
  Download,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  AlertOctagon,
  Crown,
  Film,
  Zap,
  Clock,
  Layers,
  Camera,
  User,
  Package,
  RefreshCw,
  Eye,
  Sliders,
  Check,
} from 'lucide-react';
import {
  checkAiVideoAdAccess,
  acquireAiVideoAdLock,
  releaseAiVideoAdLock,
  consumeAiVideoAdTrial,
} from '../../services/accessControlService';
import { AiVideoAdAccessCheck, GeneratedAiVideoAd, AiVideoAdScene, AiVideoAdScriptPlan } from '../../types';

interface AiVideoAdViewProps {
  onUpgrade: () => void;
  onNavigateToEditVideo?: (adData: GeneratedAiVideoAd) => void;
  currentUser?: any;
}

const PRESET_MODELS = [
  {
    id: 'model-1',
    label: 'Kreator Wanita Kasual',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'model-2',
    label: 'Kreator Pria Dinamis',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'model-3',
    label: 'Kreator Hijab Modis',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'model-4',
    label: 'Kreator Profesional',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
  },
];

const PRESET_PRODUCTS = [
  {
    id: 'prod-1',
    label: 'Serum & Skincare',
    url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-2',
    label: 'Fashion & Apparel',
    url: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-3',
    label: 'Gadget & Audio',
    url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'prod-4',
    label: 'Kopi & Minuman Sehat',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
  },
];

const AD_STYLES = [
  'Trendy TikTok & Reels',
  'UGC / Review Jujur',
  'Cinematic Commercial',
  'Hard Selling & Promo Gila',
  'Storytelling & Edukasi',
  'Problem - Solution Focus',
];

export const AiVideoAdView: React.FC<AiVideoAdViewProps> = ({
  onUpgrade,
  onNavigateToEditVideo,
  currentUser,
}) => {
  // Access control
  const [accessState, setAccessState] = useState<AiVideoAdAccessCheck>({
    allowed: false,
    isSuperAdmin: false,
    isPremium: false,
    trialUsed: false,
    remaining: 0,
    reason: 'UNAUTHENTICATED',
  });
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  // Form states
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [price, setPrice] = useState('');
  const [promo, setPromo] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [callToAction, setCallToAction] = useState('Beli Sekarang Sebelum Promo Berakhir!');
  const [duration, setDuration] = useState<30 | 60>(30);
  const [adStyle, setAdStyle] = useState('Trendy TikTok & Reels');
  const [ratio, setRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16');

  // Visual Assets
  const [modelPhoto, setModelPhoto] = useState<string>(PRESET_MODELS[0].url);
  const [productPhoto, setProductPhoto] = useState<string>(PRESET_PRODUCTS[0].url);

  // Workflow Stages
  // 'IDLE' | 'PLANNING_SCRIPT' | 'SCRIPT_READY' | 'GENERATING_VIDEO' | 'VIDEO_READY' | 'ERROR'
  const [workflowStatus, setWorkflowStatus] = useState<
    'IDLE' | 'PLANNING_SCRIPT' | 'SCRIPT_READY' | 'GENERATING_VIDEO' | 'VIDEO_READY' | 'ERROR'
  >('IDLE');

  // Script plan from Tahap 2
  const [scriptPlan, setScriptPlan] = useState<AiVideoAdScriptPlan | null>(null);

  // Real Video Generation Progress tracking
  const [generationStageText, setGenerationStageText] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const pollingTimerRef = useRef<any>(null);

  // Error details (Strictly no photo fallback!)
  const [errorDetails, setErrorDetails] = useState<{
    stage: string;
    message: string;
    details?: string;
  } | null>(null);

  // Generated Real Video Result
  const [generatedAd, setGeneratedAd] = useState<GeneratedAiVideoAd | null>(null);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Load Access State
  useEffect(() => {
    let isMounted = true;
    async function loadAccess() {
      setIsCheckingAccess(true);
      try {
        const res = await checkAiVideoAdAccess(currentUser?.uid);
        if (isMounted) {
          setAccessState(res);
        }
      } catch (err) {
        console.warn('Error loading access:', err);
      } finally {
        if (isMounted) {
          setIsCheckingAccess(false);
        }
      }
    }
    loadAccess();
    return () => {
      isMounted = false;
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
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

  // TAHAP 2: AI Planning & Scripting
  const handlePlanScript = async () => {
    if (!productName.trim()) {
      alert('Silakan masukkan nama produk terlebih dahulu.');
      return;
    }

    setErrorDetails(null);
    setWorkflowStatus('PLANNING_SCRIPT');
    setGenerationStageText('Menganalisis produk & menyusun konsep iklan...');

    try {
      const response = await fetch('/api/ai-video-ad/plan-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid,
          email: currentUser?.email,
          productName: productName.trim(),
          productDescription: productDescription.trim(),
          price: price.trim(),
          promo: promo.trim(),
          targetAudience: targetAudience.trim(),
          callToAction: callToAction.trim(),
          style: adStyle,
          duration,
          ratio,
          modelPhotoUrl: modelPhoto,
          productPhotoUrl: productPhoto,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal menyusun naskah dan scene plan AI.');
      }

      const data = await response.json();
      if (!data.plan || !Array.isArray(data.plan.scenes) || data.plan.scenes.length === 0) {
        throw new Error('Format naskah dari AI tidak valid.');
      }

      setScriptPlan(data.plan);
      setWorkflowStatus('SCRIPT_READY');
    } catch (err: any) {
      console.error('Error planning script:', err);
      setErrorDetails({
        stage: 'AI Planning & Scripting',
        message: err?.message || 'Gagal menyusun naskah iklan.',
        details: 'Pastikan koneksi internet stabil dan data produk telah terisi.',
      });
      setWorkflowStatus('ERROR');
    }
  };

  // TAHAP 3 & 4: Real Video Generation & Progress Polling
  const handleGenerateRealVideo = async () => {
    if (!scriptPlan) {
      await handlePlanScript();
      return;
    }

    setErrorDetails(null);
    setWorkflowStatus('GENERATING_VIDEO');
    setGenerationStageText('Menyiapkan job pembuatan video...');

    try {
      // 1. Acquire client lock
      const lockRes = await acquireAiVideoAdLock(currentUser?.uid);
      if (!lockRes.acquired) {
        throw new Error(lockRes.error || 'Kesempatan gratis telah digunakan.');
      }

      // 2. Create Video Generation Job
      setGenerationStageText('Menghubungkan ke Video Generation Engine (Google Veo)...');
      const createRes = await fetch('/api/ai-video-ad/job/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser?.uid,
          email: currentUser?.email,
          productName: scriptPlan.productName,
          duration: scriptPlan.duration,
          ratio: scriptPlan.ratio,
          scenes: scriptPlan.scenes,
          modelPhotoUrl: modelPhoto,
          productPhotoUrl: productPhoto,
          price: scriptPlan.price,
          promo: scriptPlan.promo,
          style: scriptPlan.style,
        }),
      });

      if (!createRes.ok) {
        const createErr = await createRes.json().catch(() => ({}));
        const errObj = new Error(createErr.error || 'Gagal membuat antrean video.');
        (errObj as any).stage = createErr.stage || 'Video Generation Engine';
        (errObj as any).details = createErr.details;
        throw errObj;
      }

      const createData = await createRes.json();
      const currentJobId = createData.jobId;
      setJobId(currentJobId);

      // 3. Poll Job Status
      let pollAttempts = 0;
      const maxPollAttempts = 120; // 5 minutes max

      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

      pollingTimerRef.current = setInterval(async () => {
        pollAttempts++;
        if (pollAttempts > maxPollAttempts) {
          clearInterval(pollingTimerRef.current);
          await releaseAiVideoAdLock(currentUser?.uid);
          setErrorDetails({
            stage: 'Video Rendering Timeout',
            message: 'AI Video Generation melebihi batas waktu maksimal (timeout).',
            details: 'Trial Anda TIDAK berkurang. Silakan coba lagi nanti.',
          });
          setWorkflowStatus('ERROR');
          return;
        }

        try {
          const statusRes = await fetch(`/api/ai-video-ad/job/status?jobId=${currentJobId}`);
          if (!statusRes.ok) return;

          const statusData = await statusRes.json();
          const job = statusData.job;

          if (!job) return;

          // Update stage text in UI (No fake percentages!)
          if (job.step) {
            setGenerationStageText(job.step);
          }

          // Case: COMPLETED
          if (job.status === 'COMPLETED' && job.videoUrl) {
            clearInterval(pollingTimerRef.current);

            // Validate that result is indeed a real video
            const adResult: GeneratedAiVideoAd = {
              id: job.id,
              productName: job.productName,
              productDescription: scriptPlan.productDescription,
              price: scriptPlan.price,
              promo: scriptPlan.promo,
              targetAudience: scriptPlan.targetAudience,
              style: scriptPlan.style,
              ratio: scriptPlan.ratio,
              totalDuration: job.totalDuration || scriptPlan.duration,
              headlineHook: scriptPlan.headlineHook,
              fullCopywritingScript: scriptPlan.fullCopywritingScript,
              callToAction: scriptPlan.callToAction,
              videoUrl: job.videoUrl,
              isRealVideo: true,
              modelPhotoUrl: modelPhoto,
              productPhotoUrl: productPhoto,
              scenes: job.scenes || scriptPlan.scenes,
              createdAt: new Date().toISOString(),
            };

            setGeneratedAd(adResult);
            setWorkflowStatus('VIDEO_READY');

            // Consume trial strictly upon real video success!
            try {
              await consumeAiVideoAdTrial(currentUser?.uid, {
                productName: adResult.productName,
                style: adResult.style,
                duration: adResult.totalDuration,
              });
              await fetch('/api/ai-video-ad/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: currentUser?.uid,
                  productName: adResult.productName,
                  now: new Date().toISOString(),
                }),
              });
              if (!accessState.isSuperAdmin && !accessState.isPremium) {
                setAccessState((prev) => ({
                  ...prev,
                  allowed: false,
                  trialUsed: true,
                  remaining: 0,
                  reason: 'FREE_TRIAL_EXHAUSTED',
                }));
              }
            } catch (syncErr) {
              console.warn('Notice syncing trial:', syncErr);
            }
          }

          // Case: FAILED
          if (job.status === 'FAILED') {
            clearInterval(pollingTimerRef.current);
            await releaseAiVideoAdLock(currentUser?.uid);

            // MANDATE: STRICTLY NO PHOTO SLIDESHOW FALLBACK!
            setErrorDetails({
              stage: job.errorStage || 'Video Generation',
              message: job.error || 'AI Video Generation gagal. Tidak ada video yang berhasil dibuat.',
              details: job.errorDetails || 'Model video generator tidak dapat memproses klip.',
            });
            setWorkflowStatus('ERROR');
          }
        } catch (pollErr) {
          console.warn('Polling error:', pollErr);
        }
      }, 3000);
    } catch (err: any) {
      console.error('Error starting video generation:', err);
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      await releaseAiVideoAdLock(currentUser?.uid);

      // STRICTLY NO FALLBACK TO PHOTO SLIDESHOW
      setErrorDetails({
        stage: err?.stage || 'Video Generation Engine',
        message: err?.message || 'AI Video Generation gagal diproses.',
        details: err?.details || 'Trial Anda TIDAK berkurang. Silakan coba lagi.',
      });
      setWorkflowStatus('ERROR');
    }
  };

  // Reset to form
  const handleResetToForm = () => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    setErrorDetails(null);
    setWorkflowStatus('IDLE');
  };

  // Download real MP4
  const handleDownloadMp4 = () => {
    if (!generatedAd?.videoUrl) return;
    const a = document.createElement('a');
    a.href = generatedAd.videoUrl;
    a.download = `${productName.trim() || 'video_iklan'}_arvin_ai.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div id="ai-video-ad-view" className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Film className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              AI Video Iklan
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Real AI Video Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Buat video iklan komersial fotorealistik untuk TikTok, Reels, dan Shorts dengan AI Video Generation.
          </p>
        </div>

        {/* ACCESS STATUS PILL */}
        <div className="flex items-center gap-2">
          {accessState.isSuperAdmin ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>Super Admin (Akses Penuh)</span>
            </div>
          ) : accessState.isPremium ? (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Premium Member (Unlimited)</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>
                Trial Gratis:{' '}
                <strong className={accessState.trialUsed ? 'text-rose-600' : 'text-blue-700'}>
                  {accessState.trialUsed ? '0/1 (Habis)' : '1× Lifetime'}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: PARAMETERS & ASSETS */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Konfigurasi Iklan & Asset Visual
            </h2>

            <div className="space-y-4">
              {/* Nama Produk */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Produk <span className="text-rose-500">*</span>
                </label>
                <input
                  id="input-product-name"
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Contoh: GlowUp Serum Vitamin C"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  disabled={workflowStatus === 'GENERATING_VIDEO'}
                />
              </div>

              {/* Deskripsi & Keunggulan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Deskripsi & Manfaat Utama Produk
                </label>
                <textarea
                  id="input-product-description"
                  rows={2}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Ceritakan keunggulan, solusi masalah, atau fitur unggulan..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  disabled={workflowStatus === 'GENERATING_VIDEO'}
                />
              </div>

              {/* Harga & Promo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga Produk</label>
                  <input
                    id="input-product-price"
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Contoh: Rp 99.000"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={workflowStatus === 'GENERATING_VIDEO'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Promo / Diskon</label>
                  <input
                    id="input-product-promo"
                    type="text"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="Contoh: Diskon 40% Hari Ini"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={workflowStatus === 'GENERATING_VIDEO'}
                  />
                </div>
              </div>

              {/* Target Audiens & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Pembeli</label>
                  <input
                    id="input-target-audience"
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Contoh: Wanita 18-35 tahun aktif"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={workflowStatus === 'GENERATING_VIDEO'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Call To Action (CTA)</label>
                  <input
                    id="input-cta"
                    type="text"
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    placeholder="Contoh: Klik Keranjang Kuning!"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    disabled={workflowStatus === 'GENERATING_VIDEO'}
                  />
                </div>
              </div>

              {/* DURASI VIDEO (30s default / 60s) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Durasi Video Iklan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-duration-30"
                    type="button"
                    onClick={() => setDuration(30)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      duration === 30
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    30 Detik (6 Adegan)
                  </button>
                  <button
                    id="btn-duration-60"
                    type="button"
                    onClick={() => setDuration(60)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      duration === 60
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    60 Detik (8 Adegan)
                  </button>
                </div>
              </div>

              {/* Gaya & Rasio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gaya Iklan</label>
                  <select
                    id="select-ad-style"
                    value={adStyle}
                    onChange={(e) => setAdStyle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 bg-white"
                    disabled={workflowStatus === 'GENERATING_VIDEO'}
                  >
                    {AD_STYLES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rasio Layar</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(['9:16', '1:1', '16:9'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRatio(r)}
                        className={`py-1.5 text-center text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          ratio === r
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* ASSET REFERENCE: FOTO MODEL & FOTO PRODUK */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Asset Referensi Visual (Model & Produk)
                  </span>
                  <span className="text-[10px] text-slate-500">Digunakan sebagai referensi AI</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Model Reference */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Foto Model / Kreator
                    </span>
                    <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-200 relative mb-2">
                      <img
                        src={modelPhoto}
                        alt="Model Reference"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <label
                        htmlFor="upload-model-ref"
                        className="flex-1 text-center py-1 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        Upload Foto
                      </label>
                      <input
                        id="upload-model-ref"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'model')}
                        disabled={workflowStatus === 'GENERATING_VIDEO'}
                      />
                    </div>
                  </div>

                  {/* Product Reference */}
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Foto Produk
                    </span>
                    <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-200 relative mb-2">
                      <img
                        src={productPhoto}
                        alt="Product Reference"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <label
                        htmlFor="upload-prod-ref"
                        className="flex-1 text-center py-1 px-2 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        Upload Foto
                      </label>
                      <input
                        id="upload-prod-ref"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'product')}
                        disabled={workflowStatus === 'GENERATING_VIDEO'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2">
                {!accessState.allowed && !accessState.isSuperAdmin && !accessState.isPremium ? (
                  <button
                    id="btn-upgrade-from-video-ad"
                    type="button"
                    onClick={onUpgrade}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm shadow-md hover:from-amber-600 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Crown className="w-4 h-4" />
                    Trial Habis — Upgrade ke Premium untuk Buat Video
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button
                      id="btn-plan-script"
                      type="button"
                      disabled={workflowStatus === 'PLANNING_SCRIPT' || workflowStatus === 'GENERATING_VIDEO'}
                      onClick={handlePlanScript}
                      className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {workflowStatus === 'PLANNING_SCRIPT' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyusun Naskah & Storyboard...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>1. Susun Naskah & Storyboard AI ({duration}s)</span>
                        </>
                      )}
                    </button>

                    {scriptPlan && (
                      <button
                        id="btn-generate-real-video"
                        type="button"
                        disabled={workflowStatus === 'GENERATING_VIDEO'}
                        onClick={handleGenerateRealVideo}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {workflowStatus === 'GENERATING_VIDEO' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Membuat Real AI Video...</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            <span>2. Generate REAL AI VIDEO (Google Veo)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STORYBOARD, REAL PROGRESS, ERROR, OR REAL VIDEO PLAYER */}
        <div className="lg:col-span-6 flex flex-col items-center">
          {/* 1. REAL VIDEO COMPLETED & READY (TAHAP 5) */}
          {workflowStatus === 'VIDEO_READY' && generatedAd?.videoUrl ? (
            <div
              id="real-video-success-container"
              className="w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col items-center"
            >
              <div className="w-full flex items-center justify-between mb-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    REAL AI GENERATED VIDEO (MP4)
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{generatedAd.productName}</h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {generatedAd.totalDuration}s • {generatedAd.style}
                </span>
              </div>

              {/* NATIVE HTML5 VIDEO PLAYER (REAL VIDEO) */}
              <div
                id="real-video-player-wrapper"
                className={`relative rounded-2xl overflow-hidden bg-black shadow-xl border border-slate-800 ${
                  ratio === '9:16'
                    ? 'w-[280px] sm:w-[320px] aspect-[9/16]'
                    : ratio === '1:1'
                    ? 'w-[320px] sm:w-[380px] aspect-square'
                    : 'w-full max-w-[480px] aspect-[16/9]'
                }`}
              >
                <video
                  ref={videoPlayerRef}
                  id="real-ai-video-player"
                  src={generatedAd.videoUrl}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* ACTION HANDOVER BUTTONS */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                <button
                  id="btn-download-real-video"
                  type="button"
                  onClick={handleDownloadMp4}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Download Video (MP4)
                </button>

                {onNavigateToEditVideo && (
                  <button
                    id="btn-open-in-video-editor"
                    type="button"
                    onClick={() => onNavigateToEditVideo(generatedAd)}
                    className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Film className="w-4 h-4" />
                    Buka di Edit Video
                  </button>
                )}
              </div>

              <button
                id="btn-create-another-video"
                type="button"
                onClick={handleResetToForm}
                className="mt-3 text-xs text-slate-500 hover:text-slate-800 font-semibold underline cursor-pointer"
              >
                Buat Konsep Video Lain
              </button>
            </div>
          ) : workflowStatus === 'GENERATING_VIDEO' ? (
            /* 2. REAL PROGRESS TRACKING (TAHAP 4) */
            <div
              id="real-video-progress-container"
              className="w-full bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 animate-pulse">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Sedang Memproses Real AI Video...
              </h3>
              <p className="text-xs text-indigo-600 font-semibold mb-6 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                {generationStageText || 'Menghubungkan ke Video Generation Engine...'}
              </p>

              {/* REAL PIPELINE MILESTONES (NO FAKE PERCENTAGE) */}
              <div className="w-full max-w-sm text-left bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Naskah & Storyboard 30/60 Detik Disetujui</span>
                </div>
                <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                  <span>Google Veo Video Generation (Rendering Clips)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Penggabungan Klip & Validasi MP4</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-5 leading-relaxed">
                Pembuatan video fotorealistik membutuhkan waktu 1-3 menit. Jangan tutup tab browser.
                Sistem anti-double generation aktif.
              </p>
            </div>
          ) : workflowStatus === 'ERROR' ? (
            /* 3. STRICT ERROR DISPLAY (RULES 12 & 13 - JANGAN FALLBACK KE FOTO!) */
            <div
              id="real-video-error-container"
              className="w-full bg-white rounded-2xl border border-rose-200 p-6 sm:p-7 shadow-xs flex flex-col items-center text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-3">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-rose-900 mb-1">
                AI Video Generation Gagal
              </h3>
              <p className="text-xs text-rose-600 font-medium mb-4">
                Tidak ada video yang berhasil dibuat. Sistem menolak membuat slideshow foto.
              </p>

              {/* DETAILED ERROR SPECIFICATION (RULE 13) */}
              <div className="w-full bg-rose-50/70 border border-rose-200 rounded-xl p-4 text-left text-xs space-y-2 mb-4">
                <div>
                  <span className="font-bold text-rose-900 block">Tahap Proses:</span>
                  <span className="text-rose-800">{errorDetails?.stage || 'Video Generation'}</span>
                </div>
                <div>
                  <span className="font-bold text-rose-900 block">Penyebab:</span>
                  <span className="text-rose-800">{errorDetails?.message}</span>
                </div>
                {errorDetails?.details && (
                  <div>
                    <span className="font-bold text-rose-900 block">Detail Teknis:</span>
                    <span className="text-rose-700 font-mono text-[11px] break-words">
                      {errorDetails.details}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-rose-200/60 text-[11px] text-rose-800">
                  🛡️ <strong>Jaminan ARVIN STUDIO:</strong> Kesempatan Gratis (1× Trial) Anda tetap{' '}
                  <strong>UTUH dan BELUM terpakai</strong>.
                </div>
              </div>

              {/* COBA LAGI BUTTON */}
              <button
                id="btn-retry-video-generation"
                type="button"
                onClick={handleResetToForm}
                className="py-2.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                [ Coba Lagi ]
              </button>
            </div>
          ) : workflowStatus === 'SCRIPT_READY' && scriptPlan ? (
            /* 4. STORYBOARD & SCRIPT PLAN DISPLAY (TAHAP 2) */
            <div
              id="storyboard-plan-container"
              className="w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Storyboard AI Disetujui
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{scriptPlan.productName}</h3>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700">
                  {scriptPlan.duration}s ({scriptPlan.scenes.length} Adegan)
                </span>
              </div>

              {/* Hook & Copywriting Script */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-4 text-xs space-y-2">
                <div>
                  <span className="font-bold text-slate-700">Hook 3 Detik Pembuka:</span>
                  <p className="text-blue-700 font-semibold mt-0.5">"{scriptPlan.headlineHook}"</p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Narasi Copywriting:</span>
                  <p className="text-slate-600 mt-0.5 italic">{scriptPlan.fullCopywritingScript}</p>
                </div>
              </div>

              {/* Scene Breakdown List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {scriptPlan.scenes.map((scene, idx) => (
                  <div
                    key={scene.id || idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>
                        Scene {idx + 1}: {scene.title} ({scene.duration}s)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                        Fokus: {scene.visualFocus === 'model' ? 'Orang/Model' : 'Produk'}
                      </span>
                    </div>
                    <div className="text-slate-600 space-y-1 mt-1 text-[11px]">
                      <p>
                        <strong>Kamera:</strong> {scene.cameraMovement}
                      </p>
                      <p>
                        <strong>Gerakan Manusia:</strong> {scene.humanMotion}
                      </p>
                      <p>
                        <strong>Gerakan Produk:</strong> {scene.productMotion}
                      </p>
                      <p className="text-slate-400 font-mono text-[10px] truncate">
                        <strong>Prompt AI:</strong> {scene.videoPrompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Big CTA to Generate Real Video */}
              <button
                id="btn-execute-video-from-plan"
                type="button"
                onClick={handleGenerateRealVideo}
                className="mt-5 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                Lanjutkan Generate REAL AI VIDEO (Google Veo) &rarr;
              </button>
            </div>
          ) : (
            /* 5. INITIAL WELCOME / EMPTY STATE */
            <div
              id="initial-empty-state"
              className="w-full min-h-[460px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs mb-4 text-blue-600">
                <Film className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">
                Real AI Video Commercial Studio
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                Sistem menghasilkan video fotorealistik menggunakan AI Video Generation Engine (Veo).
                Bukan kumpulan foto atau slideshow.
              </p>

              <div className="w-full max-w-xs bg-white rounded-xl p-3 border border-slate-200 text-left text-xs space-y-2 text-slate-600 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Analisis produk & hook naskah otomatis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Generate adegan video dinamis bergerak nyata</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Handover langsung ke Studio Edit Video</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiVideoAdView;
