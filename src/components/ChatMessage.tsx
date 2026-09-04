import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types';
import { AsLogo } from './AsLogo';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
  isLast?: boolean;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  isLast,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formattedTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(message.timestamp));

  if (isUser) {
    return (
      <div
        id={`message-user-${message.id}`}
        className="flex justify-end mb-4 sm:mb-5 px-3 sm:px-4"
      >
        <div className="max-w-[85%] sm:max-w-[78%] flex flex-col items-end">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl rounded-br-xs shadow-md shadow-slate-900/10 text-sm sm:text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {message.text}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 px-1">
            {formattedTime}
          </span>
        </div>
      </div>
    );
  }

  // Model / AI Response
  return (
    <div
      id={`message-ai-${message.id}`}
      className="flex items-start gap-2.5 sm:gap-3 mb-5 sm:mb-6 px-3 sm:px-4"
    >
      {/* Avatar Badge with AS Monogram */}
      <div className="shrink-0 w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-md shadow-slate-300 mt-0.5">
        <AsLogo size={20} variant="light" />
      </div>

      <div className="flex-1 min-w-0 max-w-[92%] sm:max-w-[85%]">
        {message.isError ? (
          <div className="bg-red-50/90 border border-red-200 rounded-2xl rounded-tl-xs p-4 text-red-900 shadow-sm shadow-red-100">
            <div className="flex items-center gap-2 mb-2 text-red-700 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Koneksi AI Terputus</span>
            </div>
            <p className="text-sm text-red-800 leading-relaxed mb-3">
              {message.text}
            </p>
            {onRetry && isLast && (
              <button
                id="btn-retry-chat"
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Lagi</span>
              </button>
            )}
          </div>
        ) : (
          <div className="group relative bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-4 sm:p-5 shadow-sm shadow-slate-200/50">
            {/* Markdown rendered output */}
            <div className="markdown-content text-sm sm:text-[15px] text-slate-800 leading-relaxed break-words">
              <Markdown
                components={{
                  h1: ({ ...props }) => (
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0" {...props} />
                  ),
                  h2: ({ ...props }) => (
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-3.5 mb-1.5 first:mt-0" {...props} />
                  ),
                  h3: ({ ...props }) => (
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 mt-3 mb-1" {...props} />
                  ),
                  p: ({ ...props }) => (
                    <p className="mb-3 last:mb-0" {...props} />
                  ),
                  ul: ({ ...props }) => (
                    <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700" {...props} />
                  ),
                  ol: ({ ...props }) => (
                    <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700" {...props} />
                  ),
                  li: ({ ...props }) => (
                    <li className="pl-1" {...props} />
                  ),
                  strong: ({ ...props }) => (
                    <strong className="font-semibold text-slate-900" {...props} />
                  ),
                  blockquote: ({ ...props }) => (
                    <blockquote className="border-l-3 border-slate-300 pl-3 italic text-slate-600 my-2" {...props} />
                  ),
                  code: ({ ...props }) => (
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-slate-800" {...props} />
                  ),
                  pre: ({ ...props }) => (
                    <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto text-xs font-mono my-2.5 shadow-sm" {...props} />
                  ),
                }}
              >
                {message.text}
              </Markdown>
            </div>

            {/* Message Action Footer */}
            <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
              <span className="font-medium text-slate-500">ARVIN AI</span>
              <div className="flex items-center gap-2">
                <span>{formattedTime}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  title="Salin jawaban"
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                  aria-label="Salin teks respon"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
