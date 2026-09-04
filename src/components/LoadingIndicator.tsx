import React from 'react';
import { AsLogo } from './AsLogo';

export const LoadingIndicator: React.FC = () => {
  return (
    <div
      id="chat-loading-indicator"
      className="flex items-center gap-3 my-4 px-3 sm:px-4"
    >
      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-300">
        <AsLogo size={20} variant="light" />
      </div>

      <div className="px-4 py-2.5 bg-slate-900 text-white rounded-full text-xs sm:text-sm font-medium flex items-center gap-2.5 shadow-xl shadow-slate-900/15 border border-slate-800">
        <div className="flex gap-1 items-center">
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:200ms]" />
          <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:400ms]" />
        </div>
        <span className="select-none tracking-tight">ARVIN AI sedang berpikir...</span>
      </div>
    </div>
  );
};
