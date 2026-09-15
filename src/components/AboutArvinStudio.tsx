import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
  FileText,
  Mail,
  ExternalLink,
  ChevronRight,
  Layers,
  Code2,
  Calendar,
  X,
  Settings as SettingsIcon,
} from 'lucide-react';
import { AsLogo } from './AsLogo';
import { FounderProfileCard } from './FounderProfileCard';
import { FounderProfile, UserProfile } from '../types';
import { getFounderProfile, DEFAULT_FOUNDER_PROFILE } from '../services/founderService';
import { isSuperAdminEmail, isSuperAdminUser } from '../services/accessControlService';

interface AboutArvinStudioProps {
  onBack: () => void;
  userEmail?: string;
  currentUser?: UserProfile | null;
  onNavigate?: (view: any) => void;
}

export const AboutArvinStudio: React.FC<AboutArvinStudioProps> = ({
  onBack,
  userEmail,
  currentUser,
  onNavigate,
}) => {
  const [profile, setProfile] = useState<FounderProfile>(DEFAULT_FOUNDER_PROFILE);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);

  const canEdit = isSuperAdminEmail(userEmail) || isSuperAdminUser(currentUser);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const data = await getFounderProfile();
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        console.error('[AboutArvinStudio] Error loading founder profile:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      id="about-arvin-studio-view"
      className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="btn-back-to-settings"
              type="button"
              onClick={onBack}
              aria-label="Kembali ke Pengaturan"
              className="w-10 h-10 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100/80 flex items-center justify-center text-slate-700 shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span>Pengaturan</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-900 font-semibold">About ARVIN STUDIO</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                About ARVIN STUDIO
              </h1>
            </div>
          </div>
        </div>

        {/* 1. PRODUCT & BRAND HERO */}
        <section
          id="about-brand-section"
          className="relative bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md shrink-0">
                <AsLogo className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    ARVIN STUDIO
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    v1.0.0
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">
                  AI Creator Workspace
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                  Ekosistem terintegrasi untuk pembuatan ide konten, perumusan hook viral, naskah video pendek, perencanaan editorial kalender, dan analisis performa media sosial.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Production Ready
              </span>
            </div>
          </div>
        </section>

        {/* 2. OFFICIAL FOUNDER PROFILE SECTION */}
        <section id="about-founder-section" className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                FOUNDER & OWNER
              </h2>
              <p className="text-sm font-semibold text-slate-900">
                Kepemimpinan & Visi Resmi ARVIN STUDIO
              </p>
            </div>

            {canEdit && onNavigate && (
              <button
                type="button"
                id="btn-admin-manage-founder-shortcut"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-slate-300" />
                <span>Kelola di Admin Panel</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 flex items-center justify-center min-h-[300px]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Memuat profil resmi Founder...</p>
              </div>
            </div>
          ) : (
            <FounderProfileCard
              profile={profile}
              canEdit={canEdit}
              currentUser={currentUser}
              onProfileUpdated={(updated) => setProfile(updated)}
            />
          )}
        </section>

        {/* 3. PLATFORM & SYSTEM METADATA SECTION */}
        <section id="about-metadata-section" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            ABOUT ARVIN STUDIO
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Version</h3>
                  <p className="text-xs text-slate-500">Versi rilis stabil saat ini</p>
                </div>
              </div>
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                1.0.0
              </span>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Build</h3>
                  <p className="text-xs text-slate-500">Kompilasi produksi platform</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-600 font-medium">
                2026.09-PROD (Enterprise)
              </span>
            </div>

            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Developer</h3>
                  <p className="text-xs text-slate-500">Pengembang resmi dan arsitektur sistem</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-800">
                ARVIN STUDIO Engineering Team
              </span>
            </div>
          </div>
        </section>

        {/* 4. TERMS, PRIVACY & CONTACT SUPPORT */}
        <section id="about-legal-section" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            LEGAL & SUPPORT
          </h2>

          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Terms & Conditions */}
            <button
              id="btn-about-terms"
              type="button"
              onClick={() => setActiveLegalModal('terms')}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Terms & Conditions</h3>
                  <p className="text-xs text-slate-500">
                    Ketentuan hak penggunaan layanan, kuota AI, dan lisensi konten
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Privacy Policy */}
            <button
              id="btn-about-privacy"
              type="button"
              onClick={() => setActiveLegalModal('privacy')}
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Privacy Policy</h3>
                  <p className="text-xs text-slate-500">
                    Kebijakan privasi data pengguna dan isolasi Cloud Firestore
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Contact Support */}
            <a
              id="link-about-support"
              href="mailto:support@arvinstudio.id?subject=Bantuan%20ARVIN%20STUDIO"
              className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Contact Support</h3>
                  <p className="text-xs text-slate-500">
                    Layanan bantuan pelanggan resmi: support@arvinstudio.id
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center pt-4 pb-8 text-xs text-slate-400 space-y-1">
          <p>© {new Date().getFullYear()} ARVIN STUDIO. All rights reserved.</p>
          <p>Didesain dan dikembangkan dengan standar teknologi modern.</p>
        </div>

        {/* Modals for Terms & Privacy */}
        {activeLegalModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setActiveLegalModal(null)}
          >
            <div
              className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 relative text-slate-900 max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveLegalModal(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center">
                  {activeLegalModal === 'terms' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeLegalModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy'}
                  </h2>
                  <p className="text-xs text-slate-500">ARVIN STUDIO Official Policy</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed py-2">
                {activeLegalModal === 'terms' ? (
                  <>
                    <p>
                      <strong>1. Ketentuan Penggunaan Layanan:</strong> ARVIN STUDIO menyediakan platform generator ide konten, penulisan skrip, analisis hashtag, dan kalender konten bertenaga AI. Pengguna wajib mematuhi etika pembuatan konten digital yang bertanggung jawab.
                    </p>
                    <p>
                      <strong>2. Kuota & Aksesibilitas:</strong> Pengguna dengan akun paket Free berhak atas kuota harian 5× total pemakaian untuk seluruh fitur AI setiap harinya. Pengguna dengan paket langganan Premium aktif berhak menikmati akses tak terbatas ke seluruh modul kreatif.
                    </p>
                    <p>
                      <strong>3. Hak Cipta Konten:</strong> Seluruh output konten yang dihasilkan oleh pengguna menggunakan ARVIN STUDIO sepenuhnya menjadi milik dan tanggung jawab pengguna.
                    </p>
                    <p>
                      <strong>4. Integritas Sistem:</strong> Segala upaya eksploitasi, bypass batasan kuota, modifikasi tanpa izin pada arsitektur data, atau penggunaan otomatis ilegal dilarang keras.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>1. Kebijakan Privasi Pengguna:</strong> ARVIN STUDIO berkomitmen menjaga kerahasiaan dan privasi data setiap kreator. Kami tidak pernah menjual data pribadi kepada pihak ketiga untuk tujuan pemasaran komersial.
                    </p>
                    <p>
                      <strong>2. Keamanan Penyimpanan Data:</strong> Seluruh rencana konten, riwayat generasi AI, dan transaksi kredit diisolasi ketat di Cloud Firestore menggunakan aturan keamanan berbasis UID pengguna.
                    </p>
                    <p>
                      <strong>3. Akses Data Founder:</strong> Data profil Founder & Owner ARVIN STUDIO merupakan entitas resmi aplikasi yang dilindungi dengan izin khusus berjenjang dan hanya dapat diperbarui oleh Super Administrator.
                    </p>
                    <p>
                      <strong>4. Penghapusan Data:</strong> Pengguna memiliki kendali penuh untuk menghapus data riwayat pembuatan konten secara mandiri melalui menu Riwayat AI kapan saja.
                    </p>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setActiveLegalModal(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
