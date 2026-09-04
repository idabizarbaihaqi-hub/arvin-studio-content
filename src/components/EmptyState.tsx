import React from 'react';
import { AsLogo } from './AsLogo';

export const EmptyState: React.FC = () => {
  return (
    <div
      id="chat-empty-state"
      className="flex-1 flex flex-col items-center justify-center min-h-[55vh] sm:min-h-[60vh] p-6 sm:p-8 text-center select-none"
    >
      <div className="max-w-xl w-full flex flex-col items-center text-center">
        {/* Monogram Icon Container with Professional Polish 2rem radius & 2xl shadow */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-[2rem] shadow-2xl shadow-slate-200/80 flex items-center justify-center mb-8 sm:mb-10 border border-slate-100">
          <AsLogo size={46} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
          Halo, saya ARVIN AI.
        </h1>

        <p className="text-slate-500 text-sm sm:text-lg leading-relaxed max-w-sm sm:max-w-md mb-8">
          Apa yang ingin kamu buat atau analisis hari ini?
        </p>

        {/* Minimalist 3-dot decoration from design */}
        <div className="flex items-center gap-2.5">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-200"></div>
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-200"></div>
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-200"></div>
        </div>
      </div>
    </div>
  );
};
