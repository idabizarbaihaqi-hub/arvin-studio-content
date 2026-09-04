import React, { useState } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { AsLogo } from './AsLogo';
import { registerWithEmail } from '../services/accessControlService';
import { UserProfile } from '../types';

interface RegisterViewProps {
  onRegisterSuccess: (user: UserProfile) => void;
  onNavigateToLogin: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({
  onRegisterSuccess,
  onNavigateToLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Silakan masukkan Nama Lengkap Anda.');
      return;
    }
    if (!username.trim()) {
      setError('Silakan masukkan Username Anda.');
      return;
    }
    if (!email.trim()) {
      setError('Silakan masukkan Alamat Email Anda.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi Password tidak sesuai dengan Password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await registerWithEmail(fullName, username, email, password);
      onRegisterSuccess(user);
    } catch (err: any) {
      let msg = 'Gagal mendaftar. Silakan coba beberapa saat lagi.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Alamat email ini sudah terdaftar. Silakan gunakan email lain atau masuk.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password terlalu lemah. Gunakan minimal 6 karakter kombinasi.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="register-view" className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <AsLogo className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
            Buat Akun Kreator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Daftar ke ARVIN STUDIO dan mulai berkarya dengan AI
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="reg-fullname" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="reg-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nama Lengkap Anda"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-username" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                id="reg-username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                placeholder="username_kreator"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Password (min. 6 karakter)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reg-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Konfirmasi Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="reg-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          <button
            id="btn-submit-register"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Daftar Akun</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Back to Login */}
        <div className="pt-3 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Sudah memiliki akun?{' '}
            <button
              id="link-go-to-login"
              type="button"
              onClick={onNavigateToLogin}
              className="font-bold text-slate-900 hover:underline cursor-pointer"
            >
              Masuk
            </button>
          </p>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Akun dibuat aman dengan Firebase Auth & Firestore Rules</span>
        </div>
      </div>
    </div>
  );
};
