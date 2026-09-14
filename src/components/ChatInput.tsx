import React, { useRef, useEffect, useState } from 'react';
import { ArrowUp, Image as ImageIcon, X, Paperclip } from 'lucide-react';
import { ChatImageAttachment } from '../types';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
  placeholder?: string;
  attachedImage?: ChatImageAttachment | null;
  onAttachImage?: (attachment: ChatImageAttachment | null) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  isLoading,
  placeholder = 'Tulis pesan atau unggah gambar/screenshot...',
  attachedImage,
  onAttachImage,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-resize textarea according to text height
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    const scrollHeight = textarea.scrollHeight;
    const maxHeight = 150;
    const newHeight = Math.min(Math.max(scrollHeight, 44), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar (PNG, JPG, WEBP) yang dapat dianalisis.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && onAttachImage) {
        onAttachImage({
          data: dataUrl,
          mimeType: file.type || 'image/jpeg',
          name: file.name,
          sizeBytes: file.size,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input so same file can be chosen again if removed
    e.target.value = '';
  };

  // Support pasting images directly from clipboard (e.g. screenshot tool)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          processImageFile(file);
          break;
        }
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if ((value.trim() || attachedImage) && !isLoading) {
        onSend();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((value.trim() || attachedImage) && !isLoading) {
      onSend();
    }
  };

  const canSend = (Boolean(value.trim()) || Boolean(attachedImage)) && !isLoading;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      id="chat-input-container"
      className="w-full px-3 sm:px-8 pt-2 pb-3 sm:pb-5 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC]/95 to-transparent shrink-0 sticky bottom-0 z-10"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <form
        onSubmit={handleSubmit}
        className={`max-w-3xl mx-auto relative flex flex-col bg-white border rounded-[26px] p-2 pl-3 sm:pl-4 pr-2 sm:pr-2.5 shadow-lg transition-all ${
          isDragging
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
            : 'border-slate-200 shadow-slate-200/60 focus-within:ring-2 focus-within:ring-slate-900/10 focus-within:border-slate-300'
        }`}
      >
        {/* Hidden File Input for Image Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Attached Image Preview Chip */}
        {attachedImage && (
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 pr-3 mb-2 max-w-fit animate-in fade-in duration-200">
            <img
              src={attachedImage.data}
              alt="Preview"
              className="w-10 h-10 object-cover rounded-xl border border-slate-200 bg-white"
            />
            <div className="flex flex-col min-w-0 pr-1">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[240px]">
                {attachedImage.name || 'Screenshot terlampir'}
              </span>
              <span className="text-[10px] text-slate-400">
                {formatFileSize(attachedImage.sizeBytes)} • Siap dianalisis
              </span>
            </div>
            {onAttachImage && (
              <button
                type="button"
                onClick={() => onAttachImage(null)}
                aria-label="Hapus gambar"
                className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2 w-full">
          {/* Upload Image Button */}
          <button
            id="btn-upload-chat-image"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            title="Unggah Gambar atau Screenshot (Gemini Vision)"
            aria-label="Unggah Gambar"
            className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer mb-0.5"
          >
            <ImageIcon className="w-5 h-5 stroke-[1.75]" />
          </button>

          <textarea
            ref={textareaRef}
            id="chat-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              attachedImage
                ? 'Tambahkan instruksi untuk analisis gambar (opsional)...'
                : placeholder
            }
            rows={1}
            disabled={isLoading}
            enterKeyHint="send"
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck={false}
            className="flex-1 w-full resize-none bg-transparent py-2 sm:py-2.5 px-1 text-sm sm:text-base text-slate-800 placeholder:text-slate-400 focus:outline-hidden disabled:opacity-50 max-h-[160px] overflow-y-auto leading-relaxed"
            style={{ minHeight: '40px' }}
          />

          <button
            id="btn-send-message"
            type="submit"
            onMouseDown={(e) => {
              if (canSend) e.preventDefault();
            }}
            disabled={!canSend}
            title="Kirim pesan"
            aria-label="Kirim pesan"
            className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all ${
              canSend
                ? 'bg-slate-900 hover:scale-105 active:scale-95 text-white cursor-pointer shadow-md shadow-slate-900/20'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            <ArrowUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </form>

      <div className="mt-2 sm:mt-2.5 flex flex-wrap justify-center items-center gap-2.5 sm:gap-5 text-[10px] text-slate-400 uppercase tracking-widest text-center">
        <span>Enter kirim</span>
        <span>•</span>
        <span>Shift + Enter baris baru</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">Bisa paste screenshot langsung (Ctrl+V)</span>
      </div>
    </div>
  );
};
