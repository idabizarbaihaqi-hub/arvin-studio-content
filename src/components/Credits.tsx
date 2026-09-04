import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  RefreshCw,
  PlusCircle,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { CreditTransaction } from '../types';
import { fetchCredits } from '../services/accessControlService';
import { getUserId } from '../services/storageService';

interface CreditsProps {
  onBack: () => void;
}

export const Credits: React.FC<CreditsProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number>(0);
  const [used, setUsed] = useState<number>(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const loadCreditData = async () => {
    try {
      setLoading(true);
      const data = await fetchCredits();
      setBalance(data.balance);
      setUsed(data.used);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to load credits:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCreditData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadCreditData();
  };

  const handleClaimBonus = async () => {
    try {
      setClaiming(true);
      const userId = getUserId();
      const res = await fetch('/api/credits/transact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'BONUS',
          amount: 5,
          feature: 'Bonus Harian Kreator',
          description: 'Kredit apresiasi harian kreator ARVIN STUDIO',
        }),
      });

      if (res.ok) {
        setClaimSuccess(true);
        setTimeout(() => setClaimSuccess(false), 4000);
        await loadCreditData();
      }
    } catch (err) {
      console.error('Claim bonus error:', err);
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const renderTypeBadge = (type: string) => {
    switch (type) {
      case 'BONUS':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
            BONUS
          </span>
        );
      case 'USAGE':
      case 'USE':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 uppercase">
            USAGE
          </span>
        );
      case 'TOPUP':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
            TOPUP
          </span>
        );
      case 'REFUND':
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
            REFUND
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">
            {type}
          </span>
        );
    }
  };

  return (
    <div id="credits-view" className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header & Back */}
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
                Credits Kreator
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Kelola saldo dan telusuri seluruh riwayat transaksi kredit AI
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </button>
        </div>

        {/* Claim Alert */}
        {claimSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Selamat! +5 Kredit bonus berhasil ditambahkan ke akun Anda di Firestore.
            </span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* 1. Current Credits */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Current Credits
              </span>
              <CreditCard className="w-4 h-4 text-slate-700" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {balance}
              </span>
              <span className="text-xs text-slate-500 font-medium">Kredit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Saldo aktif tersimpan di dokumen pengguna Firestore
            </p>
          </div>

          {/* 2. Credits Used */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Credits Used
              </span>
              <ArrowUpRight className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {used}
              </span>
              <span className="text-xs text-slate-500 font-medium">Terpakai</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Akumulasi pemakaian fitur berbayar
            </p>
          </div>

          {/* 3. Action Bonus Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-slate-300 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">
                  Bonus Kreator
                </span>
                <Gift className="w-4 h-4 text-amber-400" />
              </div>
              <h3 className="font-bold text-sm text-white">
                Klaim +5 Kredit Harian
              </h3>
              <p className="text-[11px] text-slate-300 mt-1">
                Uji coba engine penambahan kredit secara real-time
              </p>
            </div>
            <button
              id="btn-claim-bonus"
              type="button"
              onClick={handleClaimBonus}
              disabled={claiming}
              className="mt-4 py-2 px-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              {claiming ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Klaim Kredit (+5)</span>
            </button>
          </div>
        </div>

        {/* Transactions History as mandated in Section E */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-base text-slate-900">
                Riwayat Transaksi Kredit
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Semua mutasi kredit tercatat dalam collection credit_transactions
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-600">
              {transactions.length} Transaksi
            </span>
          </div>

          {loading && transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Memuat transaksi kredit...
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada riwayat transaksi kredit.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const isPositive = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isPositive
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {tx.feature}
                          </span>
                          {renderTypeBadge(tx.type)}
                        </div>
                        <p className="text-xs text-slate-500">
                          {tx.description}
                        </p>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(tx.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="sm:text-right self-end sm:self-center">
                      <span
                        className={`text-sm font-black font-mono ${
                          isPositive ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {isPositive ? `+${tx.amount}` : tx.amount} Credits
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Credit Engine Architecture Note */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Tentang Credit Engine ARVIN STUDIO</span>
          </div>
          <p className="leading-relaxed">
            Sistem kredit dirancang modular untuk memfasilitasi penggunaan model AI bervolume tinggi, generasi thumbnail terisolasi, atau fitur studio lanjutan. Pengguna Free menikmati kuota harian 5× per fitur terpisah tanpa memotong saldo kredit.
          </p>
        </div>
      </div>
    </div>
  );
};
