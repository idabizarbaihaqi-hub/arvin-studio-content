import React, { useState, useRef } from 'react';
import {
  Camera,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Image as ImageIcon,
} from 'lucide-react';
import {
  validateProfilePhoto,
  uploadUserProfilePhoto,
  deleteUserProfilePhoto,
} from '../services/profilePhotoService';

interface ProfilePhotoUploaderProps {
  currentPhotoURL?: string | null;
  displayName?: string;
  onPhotoUpdated: (newUrl: string) => void;
  onPhotoDeleted: () => void;
  isAdmin?: boolean;
}

export const ProfilePhotoUploader: React.FC<ProfilePhotoUploaderProps> = ({
  currentPhotoURL,
  displayName,
  onPhotoUpdated,
  onPhotoDeleted,
  isAdmin = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Trigger file selection
  const handleSelectFileClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    const validation = validateProfilePhoto(file);
    if (!validation.isValid) {
      setErrorMessage(validation.errorMessage || 'File foto tidak valid.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleCancelPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
  };

  // Confirm and upload
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const downloadURL = await uploadUserProfilePhoto(selectedFile, currentPhotoURL);
      setUploadState('success');
      setSuccessMessage('Foto profile berhasil diperbarui.');
      onPhotoUpdated(downloadURL);
      handleCancelPreview();

      setTimeout(() => {
        setSuccessMessage(null);
        setUploadState('idle');
      }, 4000);
    } catch (err: any) {
      setUploadState('error');
      setErrorMessage(err.message || 'Foto profile gagal diunggah. Silakan coba lagi.');
    } finally {
      // Guaranteed to reset uploading state
      if (uploadState === 'uploading') {
        setUploadState('idle');
      }
    }
  };

  // Delete profile photo
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteUserProfilePhoto(currentPhotoURL);
      onPhotoDeleted();
      setShowDeleteConfirm(false);
      setSuccessMessage('Foto profile berhasil dihapus.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus foto profil.');
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = displayName
    ? displayName.trim().slice(0, 2).toUpperCase()
    : isAdmin
    ? 'SA'
    : 'AS';

  return (
    <div id="profile-photo-uploader-root" className="space-y-4">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Main Avatar & Actions Row */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
        {/* Avatar Display */}
        <div className="relative shrink-0">
          {currentPhotoURL ? (
            <img
              src={currentPhotoURL}
              alt={displayName || 'Avatar'}
              referrerPolicy="no-referrer"
              className={`w-24 h-24 rounded-3xl object-cover border-2 shadow-sm ${
                isAdmin ? 'border-amber-300' : 'border-slate-200'
              }`}
            />
          ) : (
            <div
              className={`w-24 h-24 rounded-3xl font-black text-2xl flex items-center justify-center shadow-xs ${
                isAdmin
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-900 text-white'
              }`}
            >
              {initials}
            </div>
          )}

          {/* Camera Quick Button Badge */}
          <button
            type="button"
            onClick={handleSelectFileClick}
            disabled={uploadState === 'uploading'}
            title="Pilih foto baru dari perangkat"
            className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
          >
            <Camera className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* Controls and Explanations */}
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Foto Profil {isAdmin ? 'Super Administrator' : 'Kreator'}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Format yang didukung: <strong>JPG, JPEG, PNG, WEBP</strong> (Maksimal <strong>5 MB</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
            <button
              id="btn-change-profile-photo"
              type="button"
              onClick={handleSelectFileClick}
              disabled={uploadState === 'uploading'}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
              <span>{currentPhotoURL ? 'Ganti Foto' : 'Unggah Foto'}</span>
            </button>

            {currentPhotoURL && (
              <button
                id="btn-delete-profile-photo"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={uploadState === 'uploading' || isDeleting}
                className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus Foto</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Uploading Status Indicator */}
      {uploadState === 'uploading' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-2.5 text-xs text-blue-800 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
          <span className="font-semibold">Sedang mengunggah foto ke Firebase Storage...</span>
        </div>
      )}

      {/* Success Banner */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs text-rose-800 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Photo Preview & Confirmation Modal */}
      {previewUrl && (
        <div
          id="profile-photo-preview-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={handleCancelPreview}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm text-slate-900">Preview Foto Profil</h3>
              </div>
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={uploadState === 'uploading'}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-36 h-36 rounded-3xl object-cover border-4 border-slate-100 shadow-md"
                />
              </div>
              <div className="mt-3 text-center">
                <p className="text-xs font-semibold text-slate-800 truncate max-w-[240px]">
                  {selectedFile?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : 0} MB
                </p>
              </div>
            </div>

            {/* Error in modal if any */}
            {errorMessage && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleCancelPreview}
                disabled={uploadState === 'uploading'}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-use-photo"
                type="button"
                onClick={handleConfirmUpload}
                disabled={uploadState === 'uploading'}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploadState === 'uploading' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <span>Gunakan Foto</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          id="profile-photo-delete-modal"
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Foto Profil?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Foto profil Anda di Firebase Storage akan dihapus dan avatar Anda akan dikembalikan menggunakan inisial nama.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-photo"
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
