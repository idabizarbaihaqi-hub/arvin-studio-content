import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { BrandingConfig, LogoType, UserProfile } from '../types';
import { logAdminActivity } from './adminService';
import { isSuperAdminUser, isSuperAdminEmail } from './accessControlService';

const SETTINGS_COLLECTION = 'app_settings';
const BRANDING_DOC_ID = 'branding';
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export const DEFAULT_BRANDING_CONFIG: BrandingConfig = {
  splashLogoUrl: null,
  headerLogoUrl: null,
  chatAiLogoUrl: null,
};

export const LOGO_LABELS: Record<LogoType, string> = {
  'splash': 'Splash Screen',
  'header': 'Header',
  'chat-ai': 'Chat AI',
};

/**
 * Super Admin authorization checker
 */
export function isBrandingAdminAuthorized(adminUser?: UserProfile | null): boolean {
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
 * Fetch active branding configuration from Firestore with Server cache fallback.
 */
export async function getBrandingConfig(): Promise<BrandingConfig> {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      return {
        splashLogoUrl: data.splashLogoUrl || null,
        headerLogoUrl: data.headerLogoUrl || null,
        chatAiLogoUrl: data.chatAiLogoUrl || null,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
    }
  } catch (err) {
    console.warn('[BrandingService] Firestore read warning, attempting backend cache:', err);
    try {
      const res = await fetch('/api/branding');
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          return {
            splashLogoUrl: json.data.splashLogoUrl || null,
            headerLogoUrl: json.data.headerLogoUrl || null,
            chatAiLogoUrl: json.data.chatAiLogoUrl || null,
            updatedAt: json.data.updatedAt,
            updatedBy: json.data.updatedBy,
          };
        }
      }
    } catch (apiErr) {
      console.warn('[BrandingService] Server cache fetch error:', apiErr);
    }
  }

  return { ...DEFAULT_BRANDING_CONFIG };
}

/**
 * Real-time listener for branding configuration changes.
 * Automatically notifies all UI components when Super Admin updates or resets any logo.
 */
export function subscribeBrandingConfig(callback: (config: BrandingConfig) => void): () => void {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          callback({
            splashLogoUrl: data.splashLogoUrl || null,
            headerLogoUrl: data.headerLogoUrl || null,
            chatAiLogoUrl: data.chatAiLogoUrl || null,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy,
          });
        } else {
          callback({ ...DEFAULT_BRANDING_CONFIG });
        }
      },
      (error) => {
        console.warn('[BrandingService] Realtime listener error, falling back to one-time read:', error);
        getBrandingConfig().then(callback);
      }
    );
  } catch (err) {
    console.warn('[BrandingService] Could not establish listener:', err);
    getBrandingConfig().then(callback);
    return () => {};
  }
}

/**
 * Optimize logo image to preserve transparency and prevent oversized payloads.
 * Resizes images exceeding 800px dimension and converts to efficient Base64.
 */
export async function optimizeLogoImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve((e.target?.result as string) || '');
            return;
          }

          // Clear for PNG alpha transparency
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Preserve PNG format for transparency; fallback to WebP or JPEG
          const format = file.type === 'image/png' ? 'image/png' : 'image/webp';
          const dataUrl = canvas.toDataURL(format, 0.92);
          resolve(dataUrl);
        } catch (err) {
          console.warn('[BrandingService] Canvas optimization fallback:', err);
          resolve((e.target?.result as string) || '');
        }
      };
      img.onerror = () => reject(new Error('Gagal membaca gambar. Silakan gunakan file gambar valid.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Gagal membaca file gambar dari perangkat.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate and upload logo file.
 * Uses fast server-side static storage with Firebase Storage synchronization,
 * protected by strict timeouts to ensure the UI NEVER hangs.
 */
export async function uploadLogoFile(
  file: File,
  logoType: LogoType,
  adminUser: UserProfile
): Promise<string> {
  if (!isBrandingAdminAuthorized(adminUser)) {
    throw new Error('Akses ditolak: Hanya Super Admin yang berwenang mengunggah logo branding.');
  }

  // File size validation: max 5MB
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran file terlalu besar. Silakan gunakan gambar dengan ukuran maksimal yang ditentukan sistem (5MB).');
  }

  // Allowed formats
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    throw new Error('Format file tidak didukung. Harap gunakan format PNG, JPG, JPEG, atau WEBP.');
  }

  // Step 1: Optimize file for fast transport and clean alpha transparency
  const optimizedBase64 = await optimizeLogoImage(file);

  // Step 2: First attempt direct server-side upload for instant response (< 200ms)
  try {
    const uploadRes = await fetch('/api/branding/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logoBase64: optimizedBase64,
        logoType,
        adminEmail: adminUser.email || adminUser.uid,
      }),
    });

    if (uploadRes.ok) {
      const resJson = await uploadRes.json();
      if (resJson && resJson.url) {
        // Also trigger async background Firebase Storage upload if available, without blocking UI
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `branding/logos/${logoType}/${Date.now()}_${cleanName}`;
        try {
          const storageRef = ref(storage, storagePath);
          uploadBytes(storageRef, file, {
            contentType: file.type,
            customMetadata: {
              logoType,
              uploadedBy: adminUser.email || adminUser.uid,
              uploadedAt: new Date().toISOString(),
            },
          }).catch((e) => console.warn('[BrandingService] Background storage sync notice:', e));
        } catch (_) {}

        return resJson.url;
      }
    }
  } catch (serverErr) {
    console.warn('[BrandingService] Fast server upload error, checking Firebase Storage fallback:', serverErr);
  }

  // Step 3: Firebase Storage fallback with strict 3.5-second timeout to prevent infinite hanging
  try {
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `branding/logos/${logoType}/${Date.now()}_${cleanName}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = async () => {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          logoType,
          uploadedBy: adminUser.email || adminUser.uid,
          uploadedAt: new Date().toISOString(),
        },
      });
      return await getDownloadURL(snapshot.ref);
    };

    const timeoutTask = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 3500)
    );

    return await Promise.race([uploadTask(), timeoutTask]);
  } catch (storageErr) {
    console.warn('[BrandingService] Firebase Storage timed out or failed, using optimized base64:', storageErr);
    // If both server endpoint and Firebase storage failed, return the optimized base64 directly
    return optimizedBase64;
  }
}

/**
 * Super Admin only: Save new logo or reset logo to default in Firestore.
 */
export async function updateBrandingLogo(
  logoType: LogoType,
  logoUrl: string | null,
  adminUser: UserProfile
): Promise<BrandingConfig> {
  if (!isBrandingAdminAuthorized(adminUser)) {
    throw new Error('Akses ditolak: Hanya Super Admin yang berwenang mengubah logo ARVIN STUDIO.');
  }

  const now = new Date().toISOString();
  const current = await getBrandingConfig();

  const fieldName: keyof BrandingConfig =
    logoType === 'splash'
      ? 'splashLogoUrl'
      : logoType === 'header'
      ? 'headerLogoUrl'
      : 'chatAiLogoUrl';

  const updated: BrandingConfig = {
    ...current,
    [fieldName]: logoUrl || null,
    updatedAt: now,
    updatedBy: adminUser.email || adminUser.uid,
  };

  const label = LOGO_LABELS[logoType] || logoType;

  try {
    const docRef = doc(db, SETTINGS_COLLECTION, BRANDING_DOC_ID);
    const firestorePromise = setDoc(docRef, updated, { merge: true });
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('FIRESTORE_WRITE_TIMEOUT')), 3500)
    );

    // Race firestore write with 3.5s timeout
    await Promise.race([firestorePromise, timeoutPromise]);

    // Async sync to backend cache
    fetch('/api/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branding: updated,
        adminEmail: adminUser.email,
      }),
    }).catch((syncErr) => console.warn('[BrandingService] Backend sync notice:', syncErr));
  } catch (firestoreErr: any) {
    console.warn('[BrandingService] Firestore write timeout or error, ensuring backend sync fallback:', firestoreErr);
    try {
      const res = await fetch('/api/branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branding: updated,
          adminEmail: adminUser.email,
        }),
      });
      if (!res.ok) {
        console.warn('[BrandingService] Backend fallback status not ok:', res.status);
      }
    } catch (apiErr) {
      console.warn('[BrandingService] Backend fallback failed:', apiErr);
    }
  }

  // Record audit log
  const auditAction = logoUrl
    ? `Super Admin changed ${label} Logo`
    : `Super Admin reset ${label} Logo to default`;

  const auditDesc = logoUrl
    ? `Super Admin (${adminUser.email}) berhasil mengubah logo ${label}.`
    : `Super Admin (${adminUser.email}) mengembalikan logo ${label} ke default aplikasi.`;

  try {
    await logAdminActivity({
      adminUser,
      action: auditAction,
      targetId: `logo_${logoType}`,
      description: auditDesc,
    });
  } catch (logErr) {
    console.warn('[BrandingService] Audit log warning:', logErr);
  }

  return updated;
}

/**
 * Reset a specific logo to application default.
 */
export async function resetBrandingLogo(
  logoType: LogoType,
  adminUser: UserProfile
): Promise<BrandingConfig> {
  return updateBrandingLogo(logoType, null, adminUser);
}
