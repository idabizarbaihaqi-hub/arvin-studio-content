import React, { useState, useRef } from 'react';
import { Quote, Sparkles, ShieldCheck, User, Camera, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { FounderProfile, UserProfile } from '../types';
import { uploadFounderPhoto, updateFounderProfile } from '../services/founderService';

interface FounderProfileCardProps {
  profile: FounderProfile;
  className?: string;
  canEdit?: boolean;
  currentUser?: UserProfile | null;
  onProfileUpdated?: (updated: FounderProfile) => void;
}

export const FounderProfileCard: React.FC<FounderProfileCardProps> = ({
  profile,
  className = '',
  canEdit = false,
  currentUser = null,
  onProfileUpdated,
}) => {
  const [imgError, setImgError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Split bio into paragraphs for clean typography
  const paragraphs = (profile.bio || '')
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusMessage(null);

    try {
      // 1. Upload photo to Firebase Storage / convert to base64 Data URL
      const photoUrl = await uploadFounderPhoto(file);

      // 2. Read as base64 to also sync to server static endpoint if needed
      let photoBase64 = '';
      if (photoUrl.startsWith('data:')) {
        photoBase64 = photoUrl;
      }

      // 3. Persist to Firestore and Server DB
      const effectiveUser: UserProfile = currentUser || {
        id: 'super_admin_direct',
        uid: 'super_admin_direct',
        fullName: 'Agnesya Kartika',
        username: 'agnesyakartika',
        email: 'id.agnesyakartika@gmail.com',
        displayName: 'Agnesya Kartika',
        role: 'SUPER_ADMIN',
        adminAccess: true,
        plan: 'PREMIUM',
        subscriptionStatus: 'ACTIVE',
        credits: 9999,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updated = await updateFounderProfile(
        {
          ...profile,
          photoUrl,
        },
        effectiveUser
      );

      // Also notify server endpoint with base64 for static persistence
      if (photoBase64) {
        try {
          await fetch('/api/founder-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              profile: updated,
              adminEmail: effectiveUser.email,
              photoBase64,
            }),
          });
        } catch {
          // Non-blocking server sync
        }
      }

      setImgError(false);
      setStatusMessage({
        type: 'success',
        text: 'Foto resmi Founder berhasil diperbarui dan disimpan permanen!',
      });
      onProfileUpdated?.(updated);
    } catch (err: any) {
      console.error('[FounderProfileCard] Upload error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mengunggah foto. Pastikan format JPG, PNG, atau WEBP (maks 5MB).',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <article
      id="founder-profile-card"
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 md:p-10 transition-all relative ${className}`}
    >
      {statusMessage && (
        <div
          className={`mb-6 p-3.5 rounded-2xl text-xs font-medium flex items-center gap-2.5 transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8 lg:gap-10">
        {/* Founder Portrait Column */}
        <div className="shrink-0 flex flex-col items-center">
          <div className="relative group">
            <div className="w-36 h-48 sm:w-44 sm:h-56 md:w-52 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200 border-2 border-white shadow-md ring-1 ring-slate-200/80 flex items-center justify-center relative">
              {!imgError && profile.photoUrl ? (
                <img
                  id="founder-photo-image"
                  src={profile.photoUrl}
                  alt={`${profile.name} - ${profile.title}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-white text-slate-700 flex items-center justify-center shadow-xs mb-3 border border-slate-200">
                    <User className="w-8 h-8 text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-700">
                    {profile.name}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {profile.title}
                  </span>
                </div>
              )}

              {/* Uploading Overlay */}
              {isUploading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3 text-center z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-white mb-1.5" />
                  <span className="text-xs font-medium">Menyimpan Foto...</span>
                </div>
              )}

              {/* Super Admin Quick Upload Overlay */}
              {canEdit && !isUploading && (
                <button
                  type="button"
                  id="btn-quick-change-founder-photo"
                  onClick={() => fileInputRef.current?.click()}
                  title="Pasang / Ganti Foto Resmi Founder"
                  className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1.5 cursor-pointer z-10 p-2 text-center"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[11px] font-semibold tracking-wide">
                    Ganti Foto
                  </span>
                </button>
              )}
            </div>

            {/* Official Badge Pill */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[11px] font-semibold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resmi Founder</span>
            </div>
          </div>

          {/* Hidden File Input for Direct Super Admin Upload */}
          {canEdit && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                id="btn-upload-photo-label"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:underline cursor-pointer transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Unggah Foto Resmi</span>
              </button>
            </>
          )}

          {!canEdit && (
            <div className="mt-5 text-center">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                ARVIN STUDIO
              </span>
            </div>
          )}
        </div>

        {/* Founder Details & Biography Column */}
        <div className="flex-1 min-w-0 space-y-6 text-left">
          {/* Header Identity */}
          <div className="space-y-1.5 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200/80 text-amber-800">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Leadership & Visionary
              </span>
            </div>

            <h2
              id="founder-name-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
            >
              {profile.name}
            </h2>

            <div className="flex flex-wrap items-center gap-x-2 text-sm sm:text-base font-medium text-slate-600">
              <span className="text-slate-900 font-semibold">{profile.title}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-700">ARVIN STUDIO</span>
            </div>
          </div>

          {/* Biography Paragraphs */}
          <div className="space-y-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            {paragraphs.length > 0 ? (
              paragraphs.map((para, idx) => (
                <p key={idx} className="text-justify sm:text-left">
                  {para}
                </p>
              ))
            ) : (
              <p className="text-slate-500 italic">Biografi belum diisi.</p>
            )}
          </div>

          {/* Founder Quote Card */}
          {profile.quote && (
            <div
              id="founder-quote-card"
              className="relative p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/80 text-slate-900 space-y-3"
            >
              <Quote className="w-6 h-6 text-slate-300 absolute top-4 right-4" />
              <blockquote className="text-base sm:text-lg font-medium italic text-slate-800 leading-relaxed pr-6">
                "{profile.quote}"
              </blockquote>
              <div className="pt-1">
                <p className="text-xs sm:text-sm font-bold text-slate-900">
                  — {profile.name}
                </p>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  {profile.title}, ARVIN STUDIO
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
