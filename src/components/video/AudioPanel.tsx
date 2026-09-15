import React, { useRef } from 'react';
import {
  Music,
  X,
  Trash2,
  Upload,
  Volume2,
  VolumeX,
  Clock,
  Scissors,
  Sparkles,
  Sliders,
  Video,
  ChevronDown,
} from 'lucide-react';
import { AudioTrackItem } from './types';
import { formatTime } from './videoUtils';

interface AudioPanelProps {
  audioTrack: AudioTrackItem | null;
  totalDuration: number;
  currentGlobalTime: number;
  originalAudioVolume: number;
  isOriginalAudioMuted: boolean;
  onUpdateTrack: (updates: Partial<AudioTrackItem>) => void;
  onUploadNewAudio: (file: File) => void;
  onDeleteTrack: () => void;
  onUpdateOriginalAudio: (volume: number, isMuted: boolean) => void;
  onClose: () => void;
}

export const AudioPanel: React.FC<AudioPanelProps> = ({
  audioTrack,
  totalDuration,
  currentGlobalTime,
  originalAudioVolume,
  isOriginalAudioMuted,
  onUpdateTrack,
  onUploadNewAudio,
  onDeleteTrack,
  onUpdateOriginalAudio,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadNewAudio(file);
    }
  };

  return (
    <div
      id="video-audio-panel"
      className="w-full bg-white flex flex-col h-full overflow-hidden"
    >
      {/* 1. Header (Sticky) */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Music className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
              Audio & Musik Latar (BGM)
            </h4>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px] sm:max-w-xs">
              {audioTrack ? audioTrack.name : 'Tambahkan musik / rekaman suara'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {audioTrack && (
            <button
              id="btn-delete-audio"
              type="button"
              onClick={onDeleteTrack}
              className="p-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
              title="Hapus Track Audio Ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            id="btn-close-audio-panel"
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
            title="Tutup / Sembunyikan Panel"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Tutup</span>
          </button>
        </div>
      </div>

        {/* 2. Scrollable Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 sm:p-5 space-y-4">
          {/* File Picker or Track Card */}
          {!audioTrack ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-amber-300 bg-amber-50/40 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50/70 transition-colors group"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md mb-2.5 group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <h5 className="text-sm font-bold text-slate-900">
                Pilih File Audio dari Perangkat
              </h5>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Mendukung file MP3, WAV, M4A, atau AAC untuk musik latar atau narasi
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Music className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 block truncate">
                    {audioTrack.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Durasi Asli: {formatTime(audioTrack.originalDuration)} • Digunakan:{' '}
                    {formatTime(audioTrack.duration)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Ganti</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Track Controls if active */}
          {audioTrack && (
            <>
              {/* Music Volume & Mute */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-600" />
                    <span>Volume Musik Tambahan</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateTrack({ isMuted: !audioTrack.isMuted })}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                        audioTrack.isMuted
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {audioTrack.isMuted ? (
                        <>
                          <VolumeX className="w-3 h-3 text-rose-600" />
                          <span>Muted</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3 text-emerald-600" />
                          <span>Aktif</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs font-mono font-bold text-amber-600 w-9 text-right">
                      {audioTrack.isMuted ? '0%' : `${audioTrack.volume}%`}
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  disabled={audioTrack.isMuted}
                  value={audioTrack.volume}
                  onChange={(e) => onUpdateTrack({ volume: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500 disabled:opacity-40"
                />
              </div>

              {/* Timeline Start Time */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Posisi Mulai Musik di Timeline Video</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {formatTime(audioTrack.startTime)}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={Math.max(0, totalDuration - 0.5)}
                  step={0.1}
                  value={audioTrack.startTime}
                  onChange={(e) => onUpdateTrack({ startTime: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onUpdateTrack({ startTime: 0 })}
                    className="flex-1 py-1 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    Mulai dari Awal (00:00)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateTrack({ startTime: currentGlobalTime })}
                    className="flex-1 py-1 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                  >
                    Mulai di Playhead ({formatTime(currentGlobalTime)})
                  </button>
                </div>
              </div>

              {/* Audio Trim (Potong Bagian Lagu yang Diinginkan) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-amber-600" />
                    <span>Potong Bagian Audio (Trim)</span>
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-700">
                    {formatTime(audioTrack.trimStart)} - {formatTime(audioTrack.trimEnd)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                      Awal Lagu: {formatTime(audioTrack.trimStart)}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={Math.max(0, audioTrack.trimEnd - 0.5)}
                      step={0.5}
                      value={audioTrack.trimStart}
                      onChange={(e) => {
                        const start = Number(e.target.value);
                        onUpdateTrack({
                          trimStart: start,
                          duration: Math.max(0.5, audioTrack.trimEnd - start),
                        });
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-1">
                      Akhir Lagu: {formatTime(audioTrack.trimEnd)}
                    </span>
                    <input
                      type="range"
                      min={audioTrack.trimStart + 0.5}
                      max={audioTrack.originalDuration}
                      step={0.5}
                      value={audioTrack.trimEnd}
                      onChange={(e) => {
                        const end = Number(e.target.value);
                        onUpdateTrack({
                          trimEnd: end,
                          duration: Math.max(0.5, end - audioTrack.trimStart),
                        });
                      }}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500">
                  Durasi segmen yang dimainkan: {(audioTrack.duration).toFixed(1)} detik
                </p>
              </div>

              {/* Audio Fade In / Fade Out */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Fade In & Fade Out Musik</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Fade In</span>
                      <span className="font-mono text-amber-600">
                        {audioTrack.fadeIn ?? 0.5}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.25}
                      value={audioTrack.fadeIn ?? 0.5}
                      onChange={(e) => onUpdateTrack({ fadeIn: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                      <span>Fade Out</span>
                      <span className="font-mono text-amber-600">
                        {audioTrack.fadeOut ?? 1}s
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={0.25}
                      value={audioTrack.fadeOut ?? 1}
                      onChange={(e) => onUpdateTrack({ fadeOut: Number(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Original Video Audio Section */}
          <div className="p-3.5 rounded-2xl bg-slate-100/80 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-blue-600" />
                <span>Audio Asli Video (Original Audio)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onUpdateOriginalAudio(originalAudioVolume, !isOriginalAudioMuted)
                  }
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1 ${
                    isOriginalAudioMuted
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {isOriginalAudioMuted ? (
                    <>
                      <VolumeX className="w-3 h-3 text-rose-600" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3 h-3 text-emerald-600" />
                      <span>Aktif</span>
                    </>
                  )}
                </button>
                <span className="text-xs font-mono font-bold text-blue-600 w-9 text-right">
                  {isOriginalAudioMuted ? '0%' : `${originalAudioVolume}%`}
                </span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={1}
              disabled={isOriginalAudioMuted}
              value={originalAudioVolume}
              onChange={(e) =>
                onUpdateOriginalAudio(Number(e.target.value), isOriginalAudioMuted)
              }
              className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600 disabled:opacity-40"
            />
            <p className="text-[10px] text-slate-500">
              Sesuaikan proporsi antara suara asli rekaman video dengan musik latar.
            </p>
          </div>
        </div>

        {/* 3. Sticky Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-100 bg-slate-50/90 flex items-center justify-between gap-2 shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
          <span className="text-xs text-slate-500">
            Sinkronisasi otomatis dengan video player
          </span>
          <button
            id="btn-done-audio"
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
          >
            Selesai
          </button>
        </div>
      </div>
  );
};
