import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AsLogo } from './AsLogo';
import { sendResetPassword } from '../services/accessControlService';

interface ForgotPasswordViewProps {
  onNavigateToLogin: () => void;
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({ onNavigateToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Silakan masukkan alamat email akun Anda.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await sendResetPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      let msg = 'Gagal mengirim email reset password. Periksa kembali email Anda.';
      if (err.code === 'auth/user-not-found') {
        msg = 'Alamat email tidak terdaftar di ARVIN STUDIO.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Format alamat email tidak valid.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="forgot-password-view" className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8 space-y-6 text-slate-900 animate-in fade-in zoom-in-95 duration-200">
        {/* Logo & Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
            <AsLogo className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 pt-1">
            Lupa Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Masukkan email terdaftar untuk menerima petunjuk reset password
          </p>
        </div>

        {/* Success notification */}
        {success ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Email Terkirim!</span>
              </div>
              <p className="text-xs leading-relaxed text-emerald-700">
                Kami telah mengirimkan tautan pemulihan kata sandi ke <strong>{email}</strong>. Silakan periksa kotak masuk atau folder spam Anda.
              </p>
            </div>
            <button
              type="button"
              id="btn-back-to-login"
              onClick={onNavigateToLogin}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Halaman Masuk</span>
            </button>
          </div>
        ) : (
          <>
            {/* Error notification */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-email"
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

              <button
                id="btn-submit-reset"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Tautan Reset Password</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                id="btn-return-login"
                type="button"
                onClick={onNavigateToLogin}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Halaman Masuk</span>
              </button>
            </div>
          </>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Keamanan Terenkripsi Firebase Auth</span>
        </div>
      </div>
    </div>
  );
};
