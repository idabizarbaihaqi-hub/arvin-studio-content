import React, { useState, useEffect, lazy, Suspense } from 'react';
import { RefreshCw, Lock, ShieldCheck } from 'lucide-react';
import { ActiveView, UserProfile } from '../../types';
import {
  verifyVideoEditorAccess,
  VideoEditorAccessResult,
} from '../../services/accessControlService';
import { VideoPremiumLock } from './VideoPremiumLock';

// Code-splitting / Lazy loading:
// Free User TIDAK akan men-download ataupun mengeksekusi chunk Video Editor!
const VideoEditorLazy = lazy(() => import('./VideoEditor'));

interface EditVideoContainerProps {
  currentUser?: UserProfile | null;
  onNavigate: (view: ActiveView) => void;
  initialVideoUrl?: string;
  initialVideoName?: string;
}

export const EditVideoContainer: React.FC<EditVideoContainerProps> = ({
  currentUser,
  onNavigate,
  initialVideoUrl,
  initialVideoName,
}) => {
  const [checking, setChecking] = useState(true);
  const [access, setAccess] = useState<VideoEditorAccessResult | null>(null);

  // Verifikasi status Premium / Super Admin secara otentik
  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      setChecking(true);
      try {
        const result = await verifyVideoEditorAccess(currentUser);
        if (isMounted) {
          setAccess(result);
        }
      } catch (err) {
        console.error('Gagal memverifikasi akses Edit Video:', err);
        if (isMounted) {
          setAccess({
            allowed: false,
            isSuperAdmin: false,
            isPremium: false,
            reason: 'FREE_LOCKED',
          });
        }
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // 1. Loading State saat proses verifikasi akses
  if (checking) {
    return (
      <main
        id="video-access-checking-view"
        className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8FAFC] text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center mb-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Memverifikasi Akses Edit Video...
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Memeriksa lisensi akun dan status keanggotaan Premium ARVIN STUDIO.
        </p>
      </main>
    );
  }

  // 2. Jika akun Free / Tidak diizinkan -> Tampilkan Halaman Pengunci Premium
  // (Video Editor BUKAN di-load, menjaga perangkat tetap ringan)
  if (!access || !access.allowed) {
    return (
      <VideoPremiumLock
        onUpgrade={() => onNavigate('premium')}
        onBack={() => onNavigate('home')}
        userEmail={currentUser?.email}
      />
    );
  }

  // 3. Jika Premium / Super Admin -> Baru load Video Editor secara lazy
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-semibold text-slate-600">
            Menyiapkan Studio Video...
          </p>
        </div>
      }
    >
      <VideoEditorLazy
        currentUser={currentUser}
        onBack={() => onNavigate('home')}
        onNavigateToPremium={() => onNavigate('premium')}
        isSuperAdmin={access.isSuperAdmin}
        initialVideoUrl={initialVideoUrl}
        initialVideoName={initialVideoName}
      />
    </Suspense>
  );
};

export default EditVideoContainer;
