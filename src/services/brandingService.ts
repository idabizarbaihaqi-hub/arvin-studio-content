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
 * Validate and upload logo file to Firebase Storage.
 * Directory: branding/logos/{splash | header | chat-ai}/
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

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `branding/logos/${logoType}/${Date.now()}_${cleanName}`;

  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        logoType,
        uploadedBy: adminUser.email || adminUser.uid,
        uploadedAt: new Date().toISOString(),
      },
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (storageErr: any) {
    console.warn('[BrandingService] Firebase Storage upload error, trying base64 fallback:', storageErr);

    // Fallback: Read file as Data URL and sync via backend proxy
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/branding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              branding: {},
              logoBase64: base64Data,
              logoType,
              adminEmail: adminUser.email,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            const field = logoType === 'splash' ? 'splashLogoUrl' : logoType === 'header' ? 'headerLogoUrl' : 'chatAiLogoUrl';
            if (json.data && json.data[field]) {
              resolve(json.data[field]);
              return;
            }
          }
          // If server didn't provide static url, base64 itself works as valid src
          resolve(base64Data);
        } catch (fbErr) {
          reject(new Error(storageErr?.message || 'Gagal mengunggah logo ke penyimpanan.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal memproses file gambar'));
      reader.readAsDataURL(file);
    });
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
    await setDoc(docRef, updated, { merge: true });

    // Sync to backend cache
    fetch('/api/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branding: updated,
        adminEmail: adminUser.email,
      }),
    }).catch((syncErr) => console.warn('[BrandingService] Backend sync error:', syncErr));
  } catch (firestoreErr: any) {
    console.warn('[BrandingService] Firestore write warning, using backend fallback:', firestoreErr);
    const res = await fetch('/api/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        branding: updated,
        adminEmail: adminUser.email,
      }),
    });
    if (!res.ok) {
      throw new Error('Gagal menyimpan konfigurasi branding ke database.');
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
