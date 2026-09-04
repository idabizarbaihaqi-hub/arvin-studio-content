import React, { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Tulis pesan...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea according to text height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height momentarily to get correct scrollHeight
    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    // Cap maximum expansion at 150px
    const maxHeight = 150;
    const newHeight = Math.min(Math.max(scrollHeight, 44), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift, except on IME composition
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading) {
      onSend();
    }
  };

  const canSend = Boolean(value.trim()) && !isLoading;

  return (
    <div
      id="chat-input-container"
      className="w-full px-3 sm:px-8 pt-2 pb-3 sm:pb-5 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent shrink-0 sticky bottom-0 z-10"
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-3xl mx-auto relative flex items-end gap-2 bg-white border border-slate-200 rounded-[24px] p-1.5 sm:p-2 pl-4 sm:pl-6 pr-2 sm:pr-2.5 shadow-lg shadow-slate-200/60 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300 transition-all"
      >
        <textarea
          ref={textareaRef}
          id="chat-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={isLoading}
          enterKeyHint="send"
          autoCapitalize="sentences"
          autoCorrect="on"
          spellCheck={false}
          className="flex-1 w-full resize-none bg-transparent py-2.5 sm:py-3 px-1 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50 max-h-[160px] overflow-y-auto leading-relaxed"
          style={{ minHeight: '42px' }}
        />

        <button
          id="btn-send-message"
          type="submit"
          onMouseDown={(e) => {
            // Prevent loss of focus on touch/click before submit triggers
            if (canSend) e.preventDefault();
          }}
          disabled={!canSend}
          title="Kirim pesan"
          aria-label="Kirim pesan"
          className={`shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all ${
            canSend
              ? 'bg-slate-900 hover:scale-105 active:scale-95 text-white cursor-pointer shadow-lg shadow-slate-900/20'
              : 'bg-slate-100 text-slate-300 cursor-not-allowed'
          }`}
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>

      <div className="mt-2 sm:mt-2.5 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-[10px] text-slate-400 uppercase tracking-widest text-center">
        <span>Tekan Enter untuk kirim</span>
        <span className="hidden sm:inline">•</span>
        <span>Shift + Enter untuk baris baru</span>
      </div>
    </div>
  );
};
