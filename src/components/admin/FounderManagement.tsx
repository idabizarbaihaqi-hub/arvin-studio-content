import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Save,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Eye,
  User,
} from 'lucide-react';
import { UserProfile, FounderProfile } from '../../types';
import {
  getFounderProfile,
  updateFounderProfile,
  uploadFounderPhoto,
  DEFAULT_FOUNDER_PROFILE,
} from '../../services/founderService';
import { FounderProfileCard } from '../FounderProfileCard';

interface FounderManagementProps {
  currentUser: UserProfile | null;
}

export const FounderManagement: React.FC<FounderManagementProps> = ({ currentUser }) => {
  const [profile, setProfile] = useState<FounderProfile>(DEFAULT_FOUNDER_PROFILE);
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formQuote, setFormQuote] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getFounderProfile();
      setProfile(data);
      setFormName(data.name);
      setFormTitle(data.title);
      setFormPhotoUrl(data.photoUrl);
      setFormBio(data.bio);
      setFormQuote(data.quote);
    } catch (err: any) {
      console.error('Error loading founder profile in admin:', err);
      setNotice({ type: 'error', text: 'Gagal memuat profil Founder dari database.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!currentUser) {
      setNotice({ type: 'error', text: 'Sesi Super Admin tidak ditemukan. Silakan login kembali.' });
      return;
    }

    if (!formName.trim() || !formTitle.trim() || !formBio.trim() || !formQuote.trim()) {
      setNotice({ type: 'error', text: 'Nama, Jabatan, Biografi, dan Quote wajib diisi.' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateFounderProfile(
        {
          name: formName.trim(),
          title: formTitle.trim(),
          photoUrl: formPhotoUrl.trim(),
          bio: formBio.trim(),
          quote: formQuote.trim(),
        },
        currentUser
      );

      setProfile(updated);
      setNotice({
        type: 'success',
        text: 'Profil Founder & Owner berhasil diperbarui di Firestore dan aktif di halaman About!',
      });
    } catch (err: any) {
      console.error('Error updating founder profile:', err);
      setNotice({ type: 'error', text: err.message || 'Gagal menyimpan perubahan profil.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setNotice(null);

    try {
      const downloadUrl = await uploadFounderPhoto(file);
      setFormPhotoUrl(downloadUrl);
      setNotice({
        type: 'success',
        text: 'Foto berhasil diunggah! Klik "Simpan Perubahan" untuk menerapkan permanen.',
      });
    } catch (err: any) {
      console.error('Error uploading founder photo:', err);
      setNotice({ type: 'error', text: err.message || 'Gagal mengunggah foto.' });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetToDefault = () => {
    if (
      !window.confirm(
        'Kembalikan ke data resmi default Arvin Erlangga (Founder & Owner ARVIN STUDIO)?'
      )
    ) {
      return;
    }
    setFormName(DEFAULT_FOUNDER_PROFILE.name);
    setFormTitle(DEFAULT_FOUNDER_PROFILE.title);
    setFormPhotoUrl(DEFAULT_FOUNDER_PROFILE.photoUrl);
    setFormBio(DEFAULT_FOUNDER_PROFILE.bio);
    setFormQuote(DEFAULT_FOUNDER_PROFILE.quote);
    setNotice({
      type: 'success',
      text: 'Nilai form direset ke default. Klik "Simpan Perubahan" untuk menyimpan ke Firestore.',
    });
  };

  // Construct draft object for live preview
  const previewProfile: FounderProfile = {
    name: formName || DEFAULT_FOUNDER_PROFILE.name,
    title: formTitle || DEFAULT_FOUNDER_PROFILE.title,
    photoUrl: formPhotoUrl || DEFAULT_FOUNDER_PROFILE.photoUrl,
    bio: formBio || DEFAULT_FOUNDER_PROFILE.bio,
    quote: formQuote || DEFAULT_FOUNDER_PROFILE.quote,
  };

  return (
    <div id="admin-founder-management" className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
              OFFICIAL APP IDENTITY
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Founder & Owner Profile Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola profil resmi Arvin Erlangga yang ditampilkan pada halaman About ARVIN STUDIO
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Muat Ulang</span>
        </button>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Grid: Editor Form & Live Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Editor Form Column */}
        <div className="xl:col-span-6 space-y-6">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-600" />
                <span>Form Edit Profil Resmi</span>
              </h2>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                title="Reset nilai ke teks resmi default"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Default</span>
              </button>
            </div>

            {/* Photo Management */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Foto Founder (Photo URL / Upload)
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <input
                  type="text"
                  value={formPhotoUrl}
                  onChange={(e) => setFormPhotoUrl(e.target.value)}
                  placeholder="/founder_photo.jpg atau https://..."
                  className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  {isUploadingPhoto ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{isUploadingPhoto ? 'Mengunggah...' : 'Unggah File'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Gunakan foto asli beresolusi tinggi. Format JPG, PNG, atau WEBP (maks. 5MB).
              </p>
            </div>

            {/* Name & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Nama Founder
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Arvin Erlangga"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Founder & Owner"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>
            </div>

            {/* Quote */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Quote / Visi Founder
              </label>
              <input
                type="text"
                required
                value={formQuote}
                onChange={(e) => setFormQuote(e.target.value)}
                placeholder="Building technology that turns ideas into possibilities."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm italic text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            {/* Biography */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Biografi Lengkap
                </label>
                <span className="text-[11px] text-slate-400">Pisahkan paragraf dengan baris baru</span>
              </div>
              <textarea
                required
                rows={9}
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                placeholder="Biografi lengkap Founder..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed font-sans"
              />
            </div>

            {/* Save Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[11px] text-slate-500">
                {profile.updatedAt && (
                  <span>
                    Terakhir diubah: {new Date(profile.updatedAt).toLocaleString('id-ID')}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Menyimpan ke Firestore...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="xl:col-span-6 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Pratinjau Langsung (Halaman About)</span>
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Sesuai tampilan pengguna publik
            </span>
          </div>

          <div className="bg-slate-100/70 p-4 sm:p-6 rounded-3xl border border-slate-200/80">
            <FounderProfileCard profile={previewProfile} />
          </div>
        </div>
      </div>
    </div>
  );
};
