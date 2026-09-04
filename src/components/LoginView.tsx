import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { AsLogo } from './AsLogo';
import { loginWithEmail } from '../services/accessControlService';
import { UserProfile } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Silakan lengkapi email dan password Anda.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = await loginWithEmail(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      let msg = 'Gagal masuk. Periksa kembali email dan password Anda.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Email atau password yang Anda masukkan salah.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Terlalu banyak percobaan gagal. Silakan tunggu beberapa menit.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-view" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <AsLogo className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
            ARVIN STUDIO
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Masuk ke AI Workspace Kreator Konten Anda
          </p>
        </div>

        {/* Error alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="login-email"
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
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <button
                type="button"
                id="link-forgot-password"
                onClick={onNavigateToForgotPassword}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Lupa password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-colors"
              />
            </div>
          </div>

          <button
            id="btn-submit-login"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Masuk</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Belum punya akun?{' '}
            <button
              id="link-go-to-register"
              type="button"
              onClick={onNavigateToRegister}
              className="font-bold text-slate-900 hover:underline cursor-pointer"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>

        {/* Firebase Authentication Security Footer */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Autentikasi Firebase Email & Password Terlindungi</span>
        </div>
      </div>
    </div>
  );
};
