import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Globe,
  Bell,
  Lock,
  Database,
  HelpCircle,
  AlertCircle,
  Info,
  FileText,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  X,
} from 'lucide-react';
import { ActiveView } from '../types';
import { logoutUser } from '../services/accessControlService';

interface SettingsProps {
  onBack: () => void;
  onNavigate: (view: ActiveView) => void;
  onLogout: () => void;
  userEmail?: string;
}

export const Settings: React.FC<SettingsProps> = ({
  onBack,
  onNavigate,
  onLogout,
  userEmail,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await logoutUser();
    onLogout();
  };

  return (
    <div id="settings-view" className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Kembali"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Pengaturan (Settings)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Preferensi akun, keamanan, privasi data, dan bantuan ARVIN STUDIO
            </p>
          </div>
        </div>

        {/* SECTION 1: ACCOUNT */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            ACCOUNT
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Profile */}
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Profile</h3>
                  <p className="text-xs text-slate-500">Nama lengkap, username, dan bio kreator</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Email */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Email</h3>
                  <p className="text-xs text-slate-500 font-mono">{userEmail || 'id.agnesyakartika@gmail.com'}</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Terverifikasi
              </span>
            </div>

            {/* Password */}
            <button
              type="button"
              onClick={() => setActiveModal('Password')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Password</h3>
                  <p className="text-xs text-slate-500">Kelola kata sandi akun autentikasi</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Security */}
            <button
              type="button"
              onClick={() => setActiveModal('Security')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Security</h3>
                  <p className="text-xs text-slate-500">Proteksi sesi aktif dan isolasi Firestore</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                Tinggi
              </span>
            </button>

            {/* AI Engine - Terpusat & Otomatis */}
            <div className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm text-slate-900">Google Gemini AI Engine</h3>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                      OTOMATIS
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Dikelola oleh Super Admin — siap digunakan langsung tanpa perlu input API key</p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Tersedia
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2: PREFERENCES */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            PREFERENCES
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Language */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Language</h3>
                  <p className="text-xs text-slate-500">Bahasa antarmuka aplikasi</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                Indonesia (Default)
              </span>
            </div>

            {/* Notifications (Status Segera Hadir as mandated) */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
                  <p className="text-xs text-slate-500">Notifikasi jadwal posting dan pengingat konten</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Segera Hadir
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: PRIVACY */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            PRIVACY
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Privacy Settings */}
            <button
              type="button"
              onClick={() => setActiveModal('Privacy Settings')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Privacy Settings</h3>
                  <p className="text-xs text-slate-500">Kontrol visibilitas dan hak akses data</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Data Preferences */}
            <button
              type="button"
              onClick={() => setActiveModal('Data Preferences')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Data Preferences</h3>
                  <p className="text-xs text-slate-500">Pengelolaan penyimpanan histori dan rencana konten</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* SECTION 4: SUPPORT */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            SUPPORT
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* Help & Support */}
            <button
              type="button"
              onClick={() => setActiveModal('Help & Support')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Help & Support</h3>
                  <p className="text-xs text-slate-500">Panduan penggunaan AI tools dan troubleshooting</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Report a Problem */}
            <button
              type="button"
              onClick={() => setActiveModal('Report a Problem')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Report a Problem</h3>
                  <p className="text-xs text-slate-500">Laporkan kendala teknis atau kirimkan masukan</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* SECTION 5: ABOUT */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            ABOUT
          </h2>
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
            {/* About ARVIN STUDIO */}
            <button
              type="button"
              onClick={() => setActiveModal('About ARVIN STUDIO')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">About ARVIN STUDIO</h3>
                  <p className="text-xs text-slate-500">Versi 1.0 • Platform AI Creator Workspace</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Terms & Conditions */}
            <button
              type="button"
              onClick={() => setActiveModal('Terms & Conditions')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Terms & Conditions</h3>
                  <p className="text-xs text-slate-500">Ketentuan penggunaan layanan dan kuota AI</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* Privacy Policy */}
            <button
              type="button"
              onClick={() => setActiveModal('Privacy Policy')}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">Privacy Policy</h3>
                  <p className="text-xs text-slate-500">Kebijakan privasi dan perlindungan data pengguna</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* SECTION 6: ACCOUNT ACTION (LOGOUT) as mandated in Section H */}
        <div className="space-y-2 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            ACCOUNT ACTION
          </h2>
          <div className="bg-white rounded-3xl border border-rose-100 shadow-xs overflow-hidden">
            <button
              id="btn-settings-logout"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full p-4 flex items-center justify-between hover:bg-rose-50/50 transition-colors text-left text-rose-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-rose-600">Logout</h3>
                  <p className="text-xs text-rose-400">Keluar dari sesi akun ini dengan aman</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-300" />
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setShowLogoutConfirm(false)}
          >
            <div
              className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <LogOut className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Konfirmasi Logout
              </h2>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Apakah Anda yakin ingin keluar? Sesi lokal akan dibersihkan dan Anda akan diarahkan ke layar Login. Data Firestore Anda tetap tersimpan dengan aman.
              </p>

              <div className="flex gap-2.5">
                <button
                  id="btn-confirm-logout-yes"
                  type="button"
                  onClick={handleConfirmLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm transition-colors"
                >
                  Ya, Logout
                </button>
                <button
                  id="btn-confirm-logout-cancel"
                  type="button"
                  onClick={() => setShowLogoutConfirm(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Informational Dialog for Subsections */}
        {activeModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setActiveModal(null)}
          >
            <div
              className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 relative text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-lg font-bold text-slate-900 mb-2">
                {activeModal}
              </h2>

              <div className="text-xs text-slate-600 space-y-3 leading-relaxed py-2">
                {activeModal === 'Password' && (
                  <p>
                    Pengelolaan kata sandi dikelola langsung melalui provider autentikasi Firebase. Jika Anda memerlukan pengaturan ulang kata sandi, tautan verifikasi akan dikirimkan ke alamat email terdaftar Anda ({userEmail || 'email Anda'}).
                  </p>
                )}
                {activeModal === 'Security' && (
                  <p>
                    Data pengguna ARVIN STUDIO diisolasi secara ketat pada level dokumen Firestore berdasarkan User ID (UID). Akses lintas pengguna diblokir sepenuhnya oleh Master Gate Security Rules.
                  </p>
                )}
                {activeModal === 'Privacy Settings' && (
                  <p>
                    Konten yang Anda rencanakan di Content Planner, hasil analisis, serta riwayat generasi AI bersifat privat dan hanya dapat diakses oleh akun Anda sendiri.
                  </p>
                )}
                {activeModal === 'Data Preferences' && (
                  <p>
                    Semua riwayat pemakaian dan arsip AI dapat Anda hapus sewaktu-waktu secara mandiri melalui menu Riwayat AI (History).
                  </p>
                )}
                {activeModal === 'Help & Support' && (
                  <p>
                    Pusat Bantuan ARVIN STUDIO siap membantu Anda memaksimalkan pembuatan konten, penyusunan strategi hook, naskah video pendek, dan hashtag. Silakan hubungi tim kami di support@arvinstudio.id.
                  </p>
                )}
                {activeModal === 'Report a Problem' && (
                  <p>
                    Menemukan kendala atau bug pada salah satu fitur AI? Sampaikan laporan Anda ke tim pengembang untuk perbaikan cepat pada pembaruan berkala.
                  </p>
                )}
                {activeModal === 'About ARVIN STUDIO' && (
                  <p>
                    ARVIN STUDIO adalah AI-Powered Workspace modern untuk content creator, social media strategist, dan kreator digital independen. Dibangun dengan arsitektur full-stack React 19, TypeScript, Tailwind CSS, Express, dan Cloud Firestore.
                  </p>
                )}
                {activeModal === 'Terms & Conditions' && (
                  <p>
                    Layanan ARVIN STUDIO menyediakan kuota harian gratis 5× per fitur AI untuk pengguna akun Free, dan akses tak terbatas bagi akun dengan langganan Premium aktif. Pengguna bertanggung jawab penuh atas materi yang dipublikasikan.
                  </p>
                )}
                {activeModal === 'Privacy Policy' && (
                  <p>
                    Kami menghormati privasi Anda sepenuhnya. Data pribadi dan prompt Anda tidak pernah dijual ke pihak ketiga dan diamankan dengan enkripsi standar industri.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
