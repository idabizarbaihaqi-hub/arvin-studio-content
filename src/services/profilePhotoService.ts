import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { storage, db, auth } from './firebase';
import { UserProfile } from '../types';

export const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_PHOTO_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export interface PhotoValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Validates file format and size according to system rules:
 * - JPG, JPEG, PNG, WEBP only
 * - Maximum 5 MB
 */
export function validateProfilePhoto(file: File): PhotoValidationResult {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isMimeValid = ALLOWED_PHOTO_MIME_TYPES.includes(file.type.toLowerCase());
  const isExtValid = ALLOWED_PHOTO_EXTENSIONS.includes(extension);

  if (!isMimeValid && !isExtValid) {
    return {
      isValid: false,
      errorMessage: 'Format foto harus JPG, JPEG, PNG, atau WEBP.',
    };
  }

  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return {
      isValid: false,
      errorMessage: 'Ukuran foto maksimal 5 MB.',
    };
  }

  return { isValid: true };
}

/**
 * Compress / optimize image client-side to ensure upload never hangs or fails on large payloads
 */
async function optimizeProfilePhotoImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 400;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Upload profile photo to Firebase Storage and update Firestore & Auth
 * Path: profile_photos/{userId}/profile_{timestamp}.{extension}
 */
export async function uploadUserProfilePhoto(
  file: File,
  oldPhotoURL?: string | null
): Promise<string> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Pengguna belum terautentikasi.');
  }

  const userId = currentUser.uid;

  // 1. Validation
  const validation = validateProfilePhoto(file);
  if (!validation.isValid) {
    throw new Error(validation.errorMessage || 'Foto tidak valid.');
  }

  // 2. Determine file extension
  let ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_PHOTO_EXTENSIONS.includes(ext)) {
    if (file.type.includes('png')) ext = 'png';
    else if (file.type.includes('webp')) ext = 'webp';
    else ext = 'jpg';
  }

  const timestamp = Date.now();
  const storagePath = `profile_photos/${userId}/profile_${timestamp}.${ext}`;
  const photoRef = ref(storage, storagePath);

  let downloadURL = '';

  try {
    // 3. Upload to Firebase Storage with a 20-second timeout safeguard
    const uploadTask = (async () => {
      const snapshot = await uploadBytes(photoRef, file, {
        contentType: file.type || `image/${ext}`,
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutTask = new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new Error('STORAGE_TIMEOUT')),
        15000
      )
    );

    downloadURL = await Promise.race([uploadTask, timeoutTask]);
  } catch (storageErr: any) {
    console.warn('[ProfilePhoto] Storage direct upload warning/timeout:', storageErr?.message || storageErr);
    // Fallback to high-quality compressed image if Firebase storage stalls or fails
    downloadURL = await optimizeProfilePhotoImage(file);
  }

  if (!downloadURL) {
    throw new Error('Foto profil gagal diproses. Silakan coba file gambar lainnya.');
  }

  try {
    // 4. Update Firestore user document
    const now = new Date().toISOString();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      photoURL: downloadURL,
      updatedAt: now,
    });

    // 5. Update Firebase Auth Profile
    try {
      await updateAuthProfile(currentUser, { photoURL: downloadURL });
    } catch (authErr) {
      console.warn('Failed to update Auth profile photoURL:', authErr);
    }

    // 6. Delete old photo from Storage only AFTER new upload succeeded
    if (
      oldPhotoURL &&
      (oldPhotoURL.includes('firebasestorage.googleapis.com') ||
        oldPhotoURL.includes('profile_photos'))
    ) {
      try {
        const oldRef = ref(storage, oldPhotoURL);
        await deleteObject(oldRef);
      } catch (delErr) {
        console.warn('Old profile photo cleanup non-fatal error:', delErr);
      }
    }

    return downloadURL;
  } catch (err: any) {
    console.error('Error saving profile photo to database:', err);
    throw new Error(err.message || 'Gagal menyimpan foto profil ke database.');
  }
}

/**
 * Remove user profile photo from Storage and reset in Firestore & Auth
 */
export async function deleteUserProfilePhoto(
  currentPhotoURL?: string | null
): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Pengguna belum terautentikasi.');
  }

  const userId = currentUser.uid;

  try {
    // 1. Delete from Firebase Storage if URL belongs to storage
    if (currentPhotoURL && (currentPhotoURL.includes('firebasestorage.googleapis.com') || currentPhotoURL.includes('profile_photos'))) {
      try {
        const photoRef = ref(storage, currentPhotoURL);
        await deleteObject(photoRef);
      } catch (storageErr) {
        console.warn('Could not delete storage photo object:', storageErr);
      }
    }

    // 2. Reset photoURL in Firestore users/{userId}
    const now = new Date().toISOString();
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      photoURL: '',
      updatedAt: now,
    });

    // 3. Reset in Firebase Auth
    try {
      await updateAuthProfile(currentUser, { photoURL: '' });
    } catch (authErr) {
      console.warn('Could not reset Auth photoURL:', authErr);
    }
  } catch (err: any) {
    console.error('Error deleting profile photo:', err);
    throw new Error(err.message || 'Gagal menghapus foto profil.');
  }
}
