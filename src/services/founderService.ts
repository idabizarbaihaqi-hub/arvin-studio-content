import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { FounderProfile, UserProfile } from '../types';
import { logAdminActivity } from './adminService';
import { isSuperAdminUser, isSuperAdminEmail } from './accessControlService';

export const DEFAULT_FOUNDER_BIO = `Arvin Erlangga adalah founder dan visionary di balik ARVIN STUDIO, sebuah platform teknologi berbasis AI yang dibangun untuk menghadirkan pengalaman kreatif digital yang lebih cerdas, sederhana, dan terintegrasi.

Dengan ketertarikan pada teknologi, kreativitas, dan inovasi digital, Arvin membangun ARVIN STUDIO dengan satu visi: membuat teknologi AI yang powerful terasa lebih dekat dan mudah digunakan oleh siapa pun.

ARVIN STUDIO dikembangkan sebagai ruang kerja digital bagi para creator dan pengguna modern untuk menciptakan ide, mengembangkan konten, menganalisis performa, serta merencanakan strategi secara lebih efektif dalam satu ekosistem.

Bagi Arvin, teknologi bukan sekadar tentang kecanggihan, tetapi tentang bagaimana sebuah inovasi dapat memberikan nilai, kesempatan, dan dampak nyata bagi penggunanya.`;

export const DEFAULT_FOUNDER_QUOTE = 'Building technology that turns ideas into possibilities.';

export const DEFAULT_FOUNDER_PROFILE: FounderProfile = {
  name: 'Arvin Erlangga',
  title: 'Founder & Owner',
  photoUrl: 'Screenshot_2026-09-14-20-06-59-55_680d03679600f7af0b4c700c6b270fe7.jpg',
  bio: DEFAULT_FOUNDER_BIO,
  quote: DEFAULT_FOUNDER_QUOTE,
};

const SETTINGS_COLLECTION = 'app_settings';
const FOUNDER_DOC_ID = 'founder_profile';

/**
 * Fetch official Founder & Owner profile.
 * Standard users have read-only access.
 * Separated completely from regular user profiles.
 */
export async function getFounderProfile(): Promise<FounderProfile> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FOUNDER_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        name: data.name || DEFAULT_FOUNDER_PROFILE.name,
        title: data.title || DEFAULT_FOUNDER_PROFILE.title,
        photoUrl: data.photoUrl || DEFAULT_FOUNDER_PROFILE.photoUrl,
        bio: data.bio || DEFAULT_FOUNDER_PROFILE.bio,
        quote: data.quote || DEFAULT_FOUNDER_PROFILE.quote,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
    }
  } catch (err) {
    console.warn('[FounderService] Unable to read from Firestore directly, trying backend proxy:', err);
    try {
      const res = await fetch('/api/founder-profile');
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          return json.data;
        }
      }
    } catch (apiErr) {
      console.warn('[FounderService] Backend proxy fallback error:', apiErr);
    }
  }

  return { ...DEFAULT_FOUNDER_PROFILE };
}

export function isFounderAdminAuthorized(adminUser?: UserProfile | null): boolean {
  if (!adminUser) return false;
  return (
    isSuperAdminUser(adminUser) ||
    isSuperAdminEmail(adminUser.email) ||
    adminUser.role === 'SUPER_ADMIN' ||
    adminUser.role === 'ADMIN' ||
    adminUser.adminAccess === true
  );
}

/**
 * Super Admin only: Update official Founder & Owner profile in Firestore.
 */
export async function updateFounderProfile(
  updates: Partial<FounderProfile>,
  adminUser: UserProfile
): Promise<FounderProfile> {
  if (!isFounderAdminAuthorized(adminUser)) {
    throw new Error('Akses ditolak: Hanya Super Admin yang berwenang mengubah profil Founder & Owner.');
  }

  const now = new Date().toISOString();
  const current = await getFounderProfile();

  const merged: FounderProfile = {
    ...current,
    ...updates,
    name: (updates.name !== undefined ? updates.name : current.name).trim() || DEFAULT_FOUNDER_PROFILE.name,
    title: (updates.title !== undefined ? updates.title : current.title).trim() || DEFAULT_FOUNDER_PROFILE.title,
    bio: (updates.bio !== undefined ? updates.bio : current.bio).trim() || DEFAULT_FOUNDER_PROFILE.bio,
    quote: (updates.quote !== undefined ? updates.quote : current.quote).trim() || DEFAULT_FOUNDER_PROFILE.quote,
    photoUrl: updates.photoUrl !== undefined ? updates.photoUrl.trim() : current.photoUrl,
    updatedAt: now,
    updatedBy: adminUser.email || adminUser.uid,
  };

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, FOUNDER_DOC_ID);
    await setDoc(docRef, merged, { merge: true });

    // Also notify server backend cache asynchronously
    fetch('/api/founder-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: merged,
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
      }),
    }).catch((syncErr) => console.warn('[FounderService] Server sync warning:', syncErr));
  } catch (firestoreErr: any) {
    console.warn('[FounderService] Firestore write warning, attempting API write:', firestoreErr);
    const res = await fetch('/api/founder-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: merged,
        adminUid: adminUser.uid,
        adminEmail: adminUser.email,
      }),
    });
    if (!res.ok) {
      throw new Error('Gagal menyimpan profil Founder ke database Firestore.');
    }
  }

  // Record audit log for security compliance
  try {
    await logAdminActivity({
      adminUser,
      action: 'SUPER_ADMIN_UPDATED_FOUNDER_PROFILE',
      description: `Super Admin memperbarui data resmi Founder & Owner (${merged.name})`,
      targetId: FOUNDER_DOC_ID,
    });
  } catch (logErr) {
    console.warn('[FounderService] Failed to record admin activity log:', logErr);
  }

  return merged;
}

/**
 * Upload founder official photo to Firebase Storage
 */
export async function uploadFounderPhoto(file: File): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowed.includes(file.type.toLowerCase())) {
    throw new Error('Format gambar harus JPG, PNG, atau WEBP.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran foto maksimal 5 MB.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const timestamp = Date.now();
  const storagePath = `founder_profile/founder_photo_${timestamp}.${ext}`;
  const photoRef = ref(storage, storagePath);

  try {
    const uploadTask = async () => {
      const snap = await uploadBytes(photoRef, file, { contentType: file.type });
      return await getDownloadURL(snap.ref);
    };

    const timeoutTask = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), 15000)
    );

    return await Promise.race([uploadTask(), timeoutTask]);
  } catch (storageErr) {
    console.warn('[FounderService] Firebase Storage direct upload failed/timeout, falling back to optimized base64:', storageErr);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
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
            resolve(canvas.toDataURL('image/jpeg', 0.9));
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
}
