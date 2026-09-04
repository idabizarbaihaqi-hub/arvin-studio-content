import React, { useEffect, useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Camera,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, ActiveView } from '../types';
import { getAccountSummary, updateProfile } from '../services/accessControlService';

interface ProfileProps {
  onBack: () => void;
  onNavigate?: (view: ActiveView) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const summary = await getAccountSummary();
      setUser(summary.user);
      setDisplayName(summary.user.displayName || '');
      setUsername(summary.user.username || '');
      setBio(summary.user.bio || '');
      setPhotoURL(summary.user.photoURL || '');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal memuat profil' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleCancel = () => {
    if (user) {
      setDisplayName(user.displayName || '');
      setUsername(user.username || '');
      setBio(user.bio || '');
      setPhotoURL(user.photoURL || '');
    }
    setIsEditing(false);
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Nama lengkap tidak boleh kosong.' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);
      const updated = await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      });
      setUser(updated);
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profil berhasil diperbarui dan disimpan ke Firestore.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan perubahan profil.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-slate-600 mb-2" />
        <span className="text-sm">Memuat profil kreator...</span>
      </div>
    );
  }

  return (
    <div id="profile-view" className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
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
                Profil Pengguna
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Kelola identitas dan informasi akun kreator ARVIN STUDIO
              </p>
            </div>
          </div>

          {!isEditing && (
            <button
              id="btn-edit-profile"
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
            >
              Edit Profile
            </button>
          )}
        </div>

        {/* Status Notification */}
        {message && (
          <div
            className={`p-4 rounded-2xl border text-sm flex items-start gap-2.5 animate-in fade-in duration-150 ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {/* Profile Card Form */}
        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
            <div className="relative">
              {photoURL.trim() ? (
                <img
                  src={photoURL}
                  alt={displayName || 'Avatar'}
                  className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-200 shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-slate-900 text-white font-bold text-3xl flex items-center justify-center shadow-md">
                  {displayName ? displayName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1 flex-1">
              <h2 className="font-bold text-lg text-slate-900">
                {displayName || 'Kreator ARVIN'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                @{username || 'user'} • UID: <span className="text-slate-700">{user?.id?.slice(0, 10)}...</span>
              </p>
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Akun Terverifikasi Firebase</span>
              </div>
            </div>
          </div>

          {/* Account & Membership Information (Firestore direct sync) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Informasi Keanggotaan & Akun (Firestore)
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Role */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Role
                </span>
                <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                  user?.role === 'ADMIN' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {user?.role || 'USER'}
                </span>
              </div>

              {/* Membership Status */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Membership
                </span>
                <span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                  user?.plan === 'PREMIUM'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {user?.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE'}
                </span>
              </div>

              {/* Sisa Credit */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sisa Credit
                </span>
                <span className="text-sm font-extrabold text-slate-900 block mt-0.5">
                  {user?.credits ?? 0} <span className="text-[10px] font-normal text-slate-500">Kredit</span>
                </span>
              </div>

              {/* Tanggal Bergabung */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Bergabung Sejak
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-0.5">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Profile Photo URL (Only visible in edit mode) */}
          {isEditing && (
            <div>
              <label htmlFor="input-photo-url" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                URL Foto Profil
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Camera className="w-4 h-4" />
                </div>
                <input
                  id="input-photo-url"
                  type="url"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Masukkan tautan gambar publik untuk avatar profil Anda.
              </p>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label htmlFor="input-display-name" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Nama Lengkap
            </label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-display-name"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Agnesya Kartika"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-800">
                {user?.displayName || '-'}
              </div>
            )}
          </div>

          {/* Username */}
          <div>
            <label htmlFor="input-username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Username
            </label>
            {isEditing ? (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-mono text-sm">
                  @
                </div>
                <input
                  id="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username_kreator"
                  className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
                />
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-medium text-slate-700">
                @{user?.username || '-'}
              </div>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="input-bio" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Bio Kreator
            </label>
            {isEditing ? (
              <textarea
                id="input-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tuliskan ringkasan profil atau fokus konten Anda..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors resize-none"
              />
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 leading-relaxed min-h-12">
                {user?.bio || 'Belum ada bio'}
              </div>
            )}
          </div>

          {/* Email (Read-Only from Firebase Auth as mandated in Section B) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Alamat Email (Firebase Auth)
              </label>
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Terkunci Autentikasi
              </span>
            </div>
            <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-xl text-sm font-mono text-slate-600 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email || 'email@example.com'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 uppercase">
                Auth Source
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Email terverifikasi oleh Firebase Authentication dan tidak dapat diubah dari form profil biasa untuk alasan keamanan.
            </p>
          </div>

          {/* Action Buttons (Section B: Edit Profile, Save Changes, Cancel) */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                id="btn-cancel-profile"
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>

              <button
                id="btn-save-profile"
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Changes</span>
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
