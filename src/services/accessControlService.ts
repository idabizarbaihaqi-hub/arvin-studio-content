import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import {
  AccountSummary,
  AiFeatureKey,
  CreditTransaction,
  FeatureUsageStatus,
  SubscriptionRecord,
  UsageLimitCheckResult,
  UserProfile,
  UserSubscription,
  AiVideoAdAccessCheck,
} from '../types';

export const AI_FEATURE_LABELS: Record<AiFeatureKey, string> = {
  chat: 'Chat AI',
  'content-analyzer': 'Content Analyzer',
  'content-ideas': 'Content Ideas',
  'caption-maker': 'Caption Maker',
  'hook-generator': 'Hook Generator',
  'script-maker': 'Script Maker',
  'hashtag-generator': 'Hashtag Generator',
};

export const SUPER_ADMIN_EMAILS = [
  'id.abizarbaihaqi@gmail.com',
  'id.sangabizar@gmail.com',
  'id.agnesyakartika@gmail.com',
];
export const PRIMARY_SUPER_ADMIN_EMAIL = 'id.abizarbaihaqi@gmail.com';

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export function isSuperAdminUser(user?: UserProfile | null): boolean {
  if (!user) return false;
  return (
    user.role === 'SUPER_ADMIN' ||
    user.adminAccess === true ||
    isSuperAdminEmail(user.email)
  );
}

// ----------------------------------------------------
// AUTHENTICATION (FIREBASE AUTH)
// ----------------------------------------------------

export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithEmail(email: string, password: string): Promise<UserProfile> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const uid = credential.user.uid;
  const profile = await getUserProfile(uid);
  return profile;
}

export async function registerWithEmail(
  fullName: string,
  username: string,
  email: string,
  password: string
): Promise<UserProfile> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
  const cleanFullName = fullName.trim();

  // Create account with Firebase Auth
  const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const uid = credential.user.uid;
  const now = new Date().toISOString();

  const isSuperAdmin = isSuperAdminEmail(cleanEmail);

  // Initial user document according to strict requirements:
  // Super Admin is automatically set to SUPER_ADMIN with adminAccess = true
  // Regular users MUST be role = USER, plan = FREE, subscriptionStatus = INACTIVE
  const initialProfile: UserProfile = {
    id: uid,
    uid: uid,
    fullName: cleanFullName,
    username: cleanUsername || (isSuperAdmin ? 'superadmin' : `creator_${uid.slice(0, 5)}`),
    email: cleanEmail,
    photoURL: '',
    bio: isSuperAdmin ? 'Super Administrator ARVIN STUDIO' : 'Kreator Konten ARVIN STUDIO',
    role: isSuperAdmin ? 'SUPER_ADMIN' : 'USER',
    adminAccess: isSuperAdmin ? true : false,
    plan: isSuperAdmin ? 'PREMIUM' : 'FREE',
    subscriptionStatus: isSuperAdmin ? 'ACTIVE' : 'INACTIVE',
    subscriptionExpiry: null,
    displayName: cleanFullName,
    credits: isSuperAdmin ? 9999 : 50,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'users', uid), initialProfile);

  // Add welcome bonus credits in Firestore credit_transactions
  try {
    const welcomeTxId = `tx_welcome_${uid}_${Date.now()}`;
    await setDoc(doc(db, 'credit_transactions', welcomeTxId), {
      id: welcomeTxId,
      userId: uid,
      type: 'BONUS',
      amount: isSuperAdmin ? 9999 : 50,
      feature: 'Welcome Bonus',
      description: isSuperAdmin ? 'Alokasi kredit operasional Super Admin' : 'Bonus pendaftaran akun kreator baru',
      createdAt: now,
    });
  } catch (err) {
    console.warn('Could not seed initial credit transaction:', err);
  }

  return initialProfile;
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
  try {
    localStorage.removeItem('arvin_user_id');
    localStorage.removeItem('arvin_current_user');
  } catch (err) {
    console.error('Error clearing storage:', err);
  }
}

// ----------------------------------------------------
// USER PROFILE (FIRESTORE)
// ----------------------------------------------------

export async function getUserProfile(userId?: string): Promise<UserProfile> {
  const uid = userId || auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Pengguna belum login.');
  }

  const userDocRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userDocRef);

  if (userSnap.exists()) {
    const data = userSnap.data() as UserProfile;

    // Check if user is Super Admin and enforce role integrity
    if (
      data.email &&
      isSuperAdminEmail(data.email) &&
      (data.role !== 'SUPER_ADMIN' || !data.adminAccess)
    ) {
      data.role = 'SUPER_ADMIN';
      data.adminAccess = true;
      try {
        await updateDoc(userDocRef, {
          role: 'SUPER_ADMIN',
          adminAccess: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Could not auto-promote super admin in user doc:', e);
      }
    }

    // Check if subscription has expired
    if (data.plan === 'PREMIUM' && data.subscriptionExpiry && data.role !== 'SUPER_ADMIN') {
      const now = new Date().getTime();
      const expiry = new Date(data.subscriptionExpiry).getTime();
      if (now > expiry) {
        // Automatically revert to FREE
        const updatedProfile = {
          ...data,
          plan: 'FREE' as const,
          subscriptionStatus: 'INACTIVE' as const,
          updatedAt: new Date().toISOString(),
        };
        try {
          await updateDoc(userDocRef, {
            plan: 'FREE',
            subscriptionStatus: 'INACTIVE',
            updatedAt: updatedProfile.updatedAt,
          });
        } catch (e) {
          console.warn('Could not auto-update expired user doc:', e);
        }
        return updatedProfile;
      }
    }
    return data;
  }

  // Fallback if doc not created yet (e.g. from existing auth session)
  const isSuperAdminFallback =
    (auth.currentUser?.email || '').toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();

  const fallbackProfile: UserProfile = {
    id: uid,
    uid: uid,
    fullName: auth.currentUser?.displayName || (isSuperAdminFallback ? 'Super Admin' : 'Kreator ARVIN'),
    username: (auth.currentUser?.email?.split('@')[0] || `user_${uid.slice(0, 5)}`).toLowerCase(),
    email: auth.currentUser?.email || '',
    photoURL: auth.currentUser?.photoURL || '',
    bio: isSuperAdminFallback ? 'Primary Super Administrator ARVIN STUDIO' : 'Kreator Konten ARVIN STUDIO',
    role: isSuperAdminFallback ? 'SUPER_ADMIN' : 'USER',
    adminAccess: isSuperAdminFallback ? true : false,
    plan: isSuperAdminFallback ? 'PREMIUM' : 'FREE',
    subscriptionStatus: isSuperAdminFallback ? 'ACTIVE' : 'INACTIVE',
    subscriptionExpiry: null,
    displayName: auth.currentUser?.displayName || (isSuperAdminFallback ? 'Super Admin' : 'Kreator ARVIN'),
    credits: isSuperAdminFallback ? 9999 : 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(userDocRef, fallbackProfile);
  } catch (e) {
    console.warn('Could not write fallback user doc:', e);
  }

  return fallbackProfile;
}

export async function updateProfile(payload: {
  fullName?: string;
  username?: string;
  bio?: string;
  photoURL?: string;
  displayName?: string;
}): Promise<UserProfile> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Pengguna belum terautentikasi.');
  }

  const updates: Record<string, any> = {
    updatedAt: new Date().toISOString(),
  };

  if (payload.fullName !== undefined) {
    updates.fullName = payload.fullName.trim();
    updates.displayName = payload.fullName.trim();
  }
  if (payload.username !== undefined) {
    updates.username = payload.username.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
  }
  if (payload.bio !== undefined) {
    updates.bio = payload.bio.trim();
  }
  if (payload.photoURL !== undefined) {
    updates.photoURL = payload.photoURL;
  }

  await updateDoc(doc(db, 'users', uid), updates);
  return getUserProfile(uid);
}

// ----------------------------------------------------
// SUBSCRIPTION & PREMIUM VERIFICATION
// ----------------------------------------------------

export async function isPremium(): Promise<boolean> {
  const uid = auth.currentUser?.uid;
  if (!uid) return false;

  try {
    const profile = await getUserProfile(uid);
    if (profile.plan === 'PREMIUM' && profile.subscriptionStatus === 'ACTIVE') {
      if (profile.subscriptionExpiry) {
        return new Date().getTime() <= new Date(profile.subscriptionExpiry).getTime();
      }
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error checking isPremium:', err);
    return false;
  }
}

export async function isFree(): Promise<boolean> {
  const premium = await isPremium();
  return !premium;
}

export async function fetchUserSubscription(): Promise<UserSubscription> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return {
      id: 'sub_guest',
      userId: '',
      plan: 'FREE',
      status: 'FREE',
      startDate: new Date().toISOString(),
      endDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const profile = await getUserProfile(uid);
  return {
    id: `sub_${uid}`,
    userId: uid,
    plan: profile.plan === 'PREMIUM' ? 'MONTHLY' : 'FREE',
    status: profile.plan === 'PREMIUM' ? 'PREMIUM_ACTIVE' : 'FREE',
    startDate: profile.createdAt,
    endDate: profile.subscriptionExpiry || null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function fetchUserSubscriptions(): Promise<SubscriptionRecord[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SubscriptionRecord);
  } catch (err) {
    console.warn('Error fetching subscriptions with ordering, falling back without order:', err);
    const qFallback = query(collection(db, 'subscriptions'), where('userId', '==', uid));
    const snap = await getDocs(qFallback);
    const list = snap.docs.map((d) => d.data() as SubscriptionRecord);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function createSubscriptionOrder(params: {
  plan: string;
  price: number;
  duration: string;
}): Promise<SubscriptionRecord> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Silakan login terlebih dahulu.');

  const subId = `sub_${uid}_${Date.now()}`;
  const now = new Date().toISOString();

  // Rule: status starts as PENDING_PAYMENT, Premium is NOT ACTIVE yet!
  const record: SubscriptionRecord = {
    id: subId,
    userId: uid,
    plan: params.plan,
    price: params.price,
    duration: params.duration,
    status: 'PENDING_PAYMENT',
    paymentProofUrl: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
    startDate: null,
    endDate: null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'subscriptions', subId), record);
  return record;
}

/**
 * Validates payment proof file format and size
 */
export function validatePaymentProofFile(file: File): { isValid: boolean; error?: string } {
  if (!file) {
    return { isValid: false, error: 'Silakan pilih file bukti transfer.' };
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp', 'pdf'].includes(ext);
  const isAllowedType = allowedMimeTypes.includes(file.type) || isAllowedExt;

  if (!isAllowedType) {
    return { isValid: false, error: 'Bukti transfer harus berupa JPG, PNG, WEBP, atau PDF.' };
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSizeBytes) {
    return { isValid: false, error: 'Bukti transfer maksimal 5 MB.' };
  }

  return { isValid: true };
}

/**
 * Optimizes a payment proof image using HTML5 Canvas:
 * Resizes to max 1280x1280 and converts to JPEG 0.78 quality.
 * Returns a compact data URL (typically 60KB - 160KB).
 */
export async function optimizePaymentProofImage(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca dokumen PDF bukti transfer.'));
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      if (!dataUri) {
        resolve('');
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUri);
      img.onload = () => {
        try {
          const maxDimension = 1280;
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUri);
            return;
          }

          // Fill white background for PNG transparency before JPEG conversion
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressed = canvas.toDataURL('image/jpeg', 0.78);
          resolve(compressed);
        } catch {
          resolve(dataUri);
        }
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Submit payment proof and save subscription order in Firestore.
 * Strictly follows the required flow:
 * 1. Validate file & auth
 * 2. Upload to Firebase Storage or use optimized Data URL if storage is unavailable/times out
 * 3. Retrieve download URL
 * 4. Save/update subscription record in Firestore with status 'PAYMENT_SUBMITTED' and 'paymentProofUrl'
 */
export async function submitPaymentProofOrder(params: {
  subscriptionId: string;
  plan: string;
  price: number;
  duration: string;
  file: File;
  onStateChange?: (state: 'idle' | 'uploading' | 'processing' | 'success' | 'error', message?: string) => void;
}): Promise<SubscriptionRecord> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    params.onStateChange?.('error', 'Sesi telah berakhir. Silakan login kembali.');
    throw new Error('Sesi telah berakhir. Silakan login kembali.');
  }

  const { subscriptionId, plan, price, duration, file, onStateChange } = params;

  // 1. Validate file
  const validation = validatePaymentProofFile(file);
  if (!validation.isValid) {
    onStateChange?.('error', validation.error);
    throw new Error(validation.error);
  }

  console.log('[1. FILE_SELECTED]', {
    name: file.name,
    size: file.size,
    type: file.type,
    subscriptionId,
    userId: uid,
  });

  onStateChange?.('uploading', 'Mengunggah bukti transfer...');

  // 2. Upload to Firebase Storage with fast fallback
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
  const storagePath = `payment_proofs/${uid}/${subscriptionId}/${uniqueFileName}`;
  console.log('[2. STORAGE_UPLOAD_STARTED]', storagePath);

  const storageRef = ref(storage, storagePath);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let downloadUrl = '';
  try {
    // 3-second timeout for Firebase Storage attempt
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 3000)
    );

    downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
    console.log('[3. STORAGE_UPLOAD_COMPLETED]', downloadUrl.substring(0, 60));
  } catch (storageErr: any) {
    console.warn('[STORAGE_FALLBACK]', storageErr?.message || storageErr);
    // Seamless fallback to optimized data URL: instant, ultra-reliable, never hangs
    downloadUrl = await optimizePaymentProofImage(file);
  }

  if (!downloadUrl) {
    onStateChange?.('error', 'Bukti transfer gagal diunggah. Silakan coba lagi.');
    throw new Error('Bukti transfer gagal diunggah. Silakan coba lagi.');
  }

  // 3. Save / Update in Firestore
  onStateChange?.('processing', 'Menyimpan data pembayaran...');
  console.log('[4. FIRESTORE_UPDATE_STARTED]', subscriptionId);

  const now = new Date().toISOString();
  const subDocRef = doc(db, 'subscriptions', subscriptionId);

  try {
    const existingSnap = await getDoc(subDocRef);
    let finalRecord: SubscriptionRecord;

    if (existingSnap.exists()) {
      const existingData = existingSnap.data() as SubscriptionRecord;
      finalRecord = {
        ...existingData,
        paymentProofUrl: downloadUrl,
        submittedAt: now,
        status: 'PAYMENT_SUBMITTED',
        updatedAt: now,
      };
      await updateDoc(subDocRef, {
        paymentProofUrl: downloadUrl,
        submittedAt: now,
        status: 'PAYMENT_SUBMITTED',
        updatedAt: now,
      });
    } else {
      finalRecord = {
        id: subscriptionId,
        userId: uid,
        plan,
        price,
        duration,
        status: 'PAYMENT_SUBMITTED',
        paymentProofUrl: downloadUrl,
        submittedAt: now,
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        startDate: null,
        endDate: null,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(subDocRef, finalRecord);
    }

    console.log('[5. FIRESTORE_UPDATE_COMPLETED]', finalRecord.id);
    onStateChange?.('success', 'Bukti transfer berhasil dikirim dan sedang menunggu verifikasi Admin.');
    return finalRecord;
  } catch (firestoreErr: any) {
    console.error('[FIRESTORE_UPDATE_FAILED]', firestoreErr);
    onStateChange?.('error', 'Gagal menyimpan data pembayaran ke database. Silakan coba lagi.');
    throw new Error('Gagal menyimpan data pembayaran. Silakan coba lagi.');
  }
}

export async function uploadPaymentProof(
  subscriptionId: string,
  file: File,
  planDetails?: { plan: string; price: number; duration: string }
): Promise<SubscriptionRecord> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Silakan login terlebih dahulu.');

  // Validate file
  const validation = validatePaymentProofFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  console.log('[1. FILE_SELECTED]', { name: file.name, size: file.size, type: file.type, subscriptionId });

  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueFileName = `${Date.now()}_${sanitizedFileName}`;
  const storagePath = `payment_proofs/${uid}/${subscriptionId}/${uniqueFileName}`;
  console.log('[2. STORAGE_UPLOAD_STARTED]', storagePath);

  const storageRef = ref(storage, storagePath);
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let downloadUrl = '';
  try {
    const uploadPromise = (async () => {
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || (ext === 'pdf' ? 'application/pdf' : 'image/jpeg'),
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 3000)
    );

    downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
  } catch (storageErr: any) {
    console.warn('[STORAGE_FALLBACK]', storageErr?.message || storageErr);
    downloadUrl = await optimizePaymentProofImage(file);
  }

  if (!downloadUrl) {
    throw new Error('Bukti transfer gagal diunggah. Silakan coba lagi.');
  }

  console.log('[3. FIRESTORE_UPDATE_STARTED]', subscriptionId);
  const now = new Date().toISOString();
  const subDocRef = doc(db, 'subscriptions', subscriptionId);

  const existingSnap = await getDoc(subDocRef);
  let result: SubscriptionRecord;

  if (existingSnap.exists()) {
    await updateDoc(subDocRef, {
      paymentProofUrl: downloadUrl,
      submittedAt: now,
      status: 'PAYMENT_SUBMITTED',
      updatedAt: now,
    });
    const updatedSnap = await getDoc(subDocRef);
    result = updatedSnap.data() as SubscriptionRecord;
  } else {
    result = {
      id: subscriptionId,
      userId: uid,
      plan: planDetails?.plan || 'PREMIUM',
      price: planDetails?.price || 0,
      duration: planDetails?.duration || '-',
      status: 'PAYMENT_SUBMITTED',
      paymentProofUrl: downloadUrl,
      submittedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      rejectionReason: null,
      startDate: null,
      endDate: null,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(subDocRef, result);
  }

  console.log('[4. FIRESTORE_UPDATE_COMPLETED]', result.id);
  return result;
}

// ----------------------------------------------------
// ----------------------------------------------------
// ATURAN FREE CREDIT & TRIAL ARVIN STUDIO
// A. CHAT AI (Halaman Awal/Dashboard): 3 Free Credit setiap hari (reset harian).
// B. SEMUA FITUR AI LAINNYA: 1x Kesempatan Trial Gratis seumur hidup akun per fitur (tidak reset).
// Premium & Super Admin: Bebas/Unlimited tanpa batas.
// ----------------------------------------------------

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Checks if current user can use a given feature.
 * - Chat AI: 3 free uses per day for FREE users, resets daily.
 * - Other AI features: 1 free trial lifetime per feature per account.
 * - Premium & Super Admin: always allowed (unlimited).
 */
export async function canUseFeature(feature: AiFeatureKey): Promise<UsageLimitCheckResult> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return {
      allowed: false,
      feature,
      count: feature === 'chat' ? 3 : 1,
      limit: feature === 'chat' ? 3 : 1,
      remaining: 0,
      isPremium: false,
      isLifetimeTrial: feature !== 'chat',
      trialUsed: feature !== 'chat',
      reason: feature === 'chat' ? 'DAILY_LIMIT_REACHED' : 'TRIAL_ALREADY_USED',
    };
  }

  // 1. Check Super Admin (Super Admin bypasses all quotas)
  try {
    const profile = await getUserProfile(uid);
    if (isSuperAdminUser(profile)) {
      return {
        allowed: true,
        feature,
        count: 0,
        limit: 9999,
        remaining: 9999,
        isPremium: true,
        isLifetimeTrial: feature !== 'chat',
        trialUsed: false,
        reason: 'ALLOWED',
      };
    }
  } catch (err) {
    console.warn('[Quota Check] Could not verify superadmin profile:', err);
  }

  // 2. Check active Premium subscription (Premium has unlimited access)
  const premiumActive = await isPremium();
  if (premiumActive) {
    return {
      allowed: true,
      feature,
      count: 0,
      limit: 9999,
      remaining: 9999,
      isPremium: true,
      isLifetimeTrial: feature !== 'chat',
      trialUsed: false,
      reason: 'ALLOWED',
    };
  }

  // 3. User is FREE account
  const now = new Date().toISOString();
  const dateStr = getTodayDateString();

  // === KATEGORI A: CHAT AI DI HALAMAN AWAL (3x per hari, reset harian) ===
  if (feature === 'chat') {
    const CHAT_DAILY_LIMIT = 3;
    let todayChatCount = 0;

    try {
      // Check user document directly
      const userDocRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData?.chatAiUsage?.date === dateStr) {
          todayChatCount = Number(uData.chatAiUsage.count || 0);
        }
      }

      // Secondary check in ai_daily_usage collection
      if (todayChatCount === 0) {
        const dailyDocRef = doc(db, 'ai_daily_usage', `${uid}_${dateStr}`);
        const dailySnap = await getDoc(dailyDocRef);
        if (dailySnap.exists()) {
          todayChatCount = Number(dailySnap.data()?.chatUsage || 0);
        }
      }
    } catch (err) {
      console.warn('[Quota Check] Error checking Chat AI usage:', err);
    }

    const remaining = Math.max(0, CHAT_DAILY_LIMIT - todayChatCount);
    const isExceeded = todayChatCount >= CHAT_DAILY_LIMIT;

    return {
      allowed: !isExceeded,
      feature: 'chat',
      count: todayChatCount,
      limit: CHAT_DAILY_LIMIT,
      remaining,
      isPremium: false,
      isLifetimeTrial: false,
      trialUsed: false,
      reason: isExceeded ? 'DAILY_LIMIT_REACHED' : 'ALLOWED',
    };
  }

  // === KATEGORI B: SEMUA FITUR AI LAINNYA (1x seumur hidup akun, TIDAK reset) ===
  const FEATURE_LIFETIME_LIMIT = 1;
  let isTrialUsed = false;

  try {
    // 1. Check user profile field `featureTrials`
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      const uData = userSnap.data();
      if (uData?.featureTrials?.[feature] === true) {
        isTrialUsed = true;
      }
    }

    // 2. Check dedicated feature_trials collection
    if (!isTrialUsed) {
      const trialDocRef = doc(db, 'feature_trials', uid);
      const trialSnap = await getDoc(trialDocRef);
      if (trialSnap.exists()) {
        const tData = trialSnap.data();
        if (tData?.[feature]?.used === true || tData?.[feature] === true) {
          isTrialUsed = true;
        }
      }
    }

    // 3. Fallback check: check historical ai_usage collection
    if (!isTrialUsed) {
      const q = query(
        collection(db, 'ai_usage'),
        where('userId', '==', uid),
        where('feature', '==', feature)
      );
      const usageSnap = await getDocs(q);
      if (!usageSnap.empty) {
        isTrialUsed = true;
      }
    }
  } catch (err) {
    console.warn(`[Quota Check] Error checking trial for ${feature}:`, err);
  }

  const count = isTrialUsed ? 1 : 0;
  const remaining = isTrialUsed ? 0 : 1;

  return {
    allowed: !isTrialUsed,
    feature,
    count,
    limit: FEATURE_LIFETIME_LIMIT,
    remaining,
    isPremium: false,
    isLifetimeTrial: true,
    trialUsed: isTrialUsed,
    reason: isTrialUsed ? 'TRIAL_ALREADY_USED' : 'ALLOWED',
  };
}

/**
 * Consumes credit/trial for a given feature.
 * ONLY called after AI generation genuinely succeeds.
 * - Chat AI: increments daily count (0 -> 1 -> 2 -> 3) tied to today's date.
 * - Other AI features: marks trial permanently used (lifetime) for this UID.
 */
export async function consumeFeatureUsage(
  feature: AiFeatureKey
): Promise<{ success: boolean; remaining: number }> {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false, remaining: 0 };

  // Premium & Super Admin are not limited
  try {
    const profile = await getUserProfile(uid);
    if (isSuperAdminUser(profile)) {
      return { success: true, remaining: 9999 };
    }
  } catch {}

  const premium = await isPremium();
  if (premium) {
    return { success: true, remaining: 9999 };
  }

  const dateStr = getTodayDateString();
  const now = new Date().toISOString();

  // === CASE 1: CHAT AI (Halaman Awal) - 3x per hari ===
  if (feature === 'chat') {
    const userDocRef = doc(db, 'users', uid);
    const dailyDocRef = doc(db, 'ai_daily_usage', `${uid}_${dateStr}`);

    try {
      // Determine current chat count for today
      let currentCount = 0;
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData?.chatAiUsage?.date === dateStr) {
          currentCount = Number(uData.chatAiUsage.count || 0);
        }
      }

      if (currentCount === 0) {
        const dailySnap = await getDoc(dailyDocRef);
        if (dailySnap.exists()) {
          currentCount = Number(dailySnap.data()?.chatUsage || 0);
        }
      }

      const newCount = currentCount + 1;

      // 1. Update user document
      await setDoc(
        userDocRef,
        {
          chatAiUsage: {
            date: dateStr,
            count: newCount,
            lastUsedAt: now,
          },
          updatedAt: now,
        },
        { merge: true }
      );

      // 2. Update ai_daily_usage collection
      await setDoc(
        dailyDocRef,
        {
          id: `${uid}_${dateStr}`,
          userId: uid,
          date: dateStr,
          chatUsage: newCount,
          lastFeature: 'chat',
          updatedAt: now,
        },
        { merge: true }
      );

      const remaining = Math.max(0, 3 - newCount);
      console.log(`[Chat AI Credit] UID ${uid}: count = ${newCount}/3, remaining = ${remaining}`);
      return { success: true, remaining };
    } catch (err) {
      console.error('[Chat AI Credit] Error updating Chat AI usage:', err);
      return { success: false, remaining: 0 };
    }
  }

  // === CASE 2: FITUR AI LAINNYA (1x seumur hidup akun, permanen) ===
  const userDocRef = doc(db, 'users', uid);
  const trialDocRef = doc(db, 'feature_trials', uid);
  const usageHistoryRef = doc(db, 'ai_usage', `${uid}_${feature}_${Date.now()}`);

  try {
    // 1. Mark feature trial used on user profile document
    const userSnap = await getDoc(userDocRef);
    const existingTrials = userSnap.exists() ? userSnap.data()?.featureTrials || {} : {};
    const updatedTrials = {
      ...existingTrials,
      [feature]: true,
    };

    await setDoc(
      userDocRef,
      {
        featureTrials: updatedTrials,
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Persist in feature_trials collection
    await setDoc(
      trialDocRef,
      {
        id: uid,
        userId: uid,
        [feature]: {
          used: true,
          usedAt: now,
        },
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Record in ai_usage collection for audit / tracking
    await setDoc(
      usageHistoryRef,
      {
        userId: uid,
        feature,
        usedAt: now,
        type: 'FREE_TRIAL_1X',
      },
      { merge: true }
    );

    console.log(`[Feature Trial] UID ${uid} consumed 1x lifetime trial for ${feature}`);
    return { success: true, remaining: 0 };
  } catch (err) {
    console.error(`[Feature Trial] Error consuming trial for ${feature}:`, err);
    return { success: false, remaining: 0 };
  }
}

/**
 * Returns the Chat AI daily usage status for current user.
 */
export async function getChatDailyUsage(): Promise<{
  count: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
}> {
  const check = await canUseFeature('chat');
  return {
    count: check.count,
    limit: check.limit,
    remaining: check.remaining,
    isPremium: check.isPremium,
  };
}

/**
 * Returns the trial status for a specific AI feature.
 */
export async function getFeatureTrialStatus(feature: AiFeatureKey): Promise<{
  used: boolean;
  remaining: number;
  isPremium: boolean;
}> {
  const check = await canUseFeature(feature);
  return {
    used: Boolean(check.trialUsed),
    remaining: check.remaining,
    isPremium: check.isPremium,
  };
}

/**
 * Returns trial statuses for all non-chat AI features.
 */
export async function getAllFeatureTrialStatuses(): Promise<
  Record<AiFeatureKey, { used: boolean; remaining: number; isPremium: boolean }>
> {
  const allFeatures: AiFeatureKey[] = [
    'chat',
    'content-analyzer',
    'content-ideas',
    'caption-maker',
    'hook-generator',
    'script-maker',
    'hashtag-generator',
  ];

  const results: any = {};
  for (const feat of allFeatures) {
    const status = await canUseFeature(feat);
    results[feat] = {
      used: feat === 'chat' ? status.count >= status.limit : Boolean(status.trialUsed),
      remaining: status.remaining,
      isPremium: status.isPremium,
    };
  }
  return results;
}

export async function getRemainingDailyUsage(
  feature: AiFeatureKey
): Promise<{ count: number; limit: number; remaining: number }> {
  const check = await canUseFeature(feature);
  return {
    count: check.count,
    limit: check.limit,
    remaining: check.remaining,
  };
}

// ----------------------------------------------------
// CREDITS LEDGER (REAL FIRESTORE COLLECTION)
// ----------------------------------------------------

export async function fetchCredits(): Promise<{
  balance: number;
  used: number;
  transactions: CreditTransaction[];
}> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return { balance: 0, used: 0, transactions: [] };
  }

  try {
    const q = query(
      collection(db, 'credit_transactions'),
      where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    const transactions: CreditTransaction[] = snap.docs.map((d) => d.data() as CreditTransaction);

    // Sort descending by createdAt
    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    let balance = 0;
    let used = 0;

    for (const tx of transactions) {
      if (tx.type === 'EARN' || tx.type === 'BONUS' || tx.type === 'REFUND') {
        balance += Math.abs(tx.amount);
      } else if (tx.type === 'USE') {
        balance -= Math.abs(tx.amount);
        used += Math.abs(tx.amount);
      } else if (tx.type === 'ADJUSTMENT') {
        balance += tx.amount;
      }
    }

    return {
      balance: Math.max(0, balance),
      used,
      transactions,
    };
  } catch (err) {
    console.error('Error fetching credits from Firestore:', err);
    return { balance: 0, used: 0, transactions: [] };
  }
}

// ----------------------------------------------------
// ACCOUNT SUMMARY
// ----------------------------------------------------

export async function getAccountSummary(): Promise<AccountSummary> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('User tidak terautentikasi.');
  }

  const profile = await getUserProfile(uid);
  const premium = await isPremium();
  const creditsData = await fetchCredits();

  const allFeatures: AiFeatureKey[] = [
    'chat',
    'content-analyzer',
    'content-ideas',
    'caption-maker',
    'hook-generator',
    'script-maker',
    'hashtag-generator',
  ];

  const dateStr = getTodayDateString();
  const dailyUsageMap: Record<AiFeatureKey, FeatureUsageStatus> = {} as any;

  // Determine chat usage for today
  let chatCount = 0;
  if (profile.chatAiUsage && profile.chatAiUsage.date === dateStr) {
    chatCount = Number(profile.chatAiUsage.count || 0);
  } else {
    try {
      const dailySnap = await getDoc(doc(db, 'ai_daily_usage', `${uid}_${dateStr}`));
      if (dailySnap.exists()) {
        chatCount = Number(dailySnap.data()?.chatUsage || 0);
      }
    } catch {}
  }

  // Determine feature trials
  const trialsMap = profile.featureTrials || {};

  for (const feat of allFeatures) {
    if (feat === 'chat') {
      const limit = premium ? 999 : 3;
      const remaining = premium ? 999 : Math.max(0, 3 - chatCount);
      dailyUsageMap[feat] = {
        feature: feat,
        featureLabel: AI_FEATURE_LABELS[feat] || feat,
        count: chatCount,
        limit,
        remaining,
        isExceeded: !premium && chatCount >= 3,
        isLifetimeTrial: false,
        trialUsed: false,
      };
    } else {
      let isTrialUsed = Boolean(trialsMap[feat]);
      if (!isTrialUsed) {
        try {
          const tSnap = await getDoc(doc(db, 'feature_trials', uid));
          if (tSnap.exists()) {
            const data = tSnap.data();
            if (data?.[feat]?.used === true || data?.[feat] === true) {
              isTrialUsed = true;
            }
          }
        } catch {}
      }

      const limit = premium ? 999 : 1;
      const remaining = premium ? 999 : (isTrialUsed ? 0 : 1);
      dailyUsageMap[feat] = {
        feature: feat,
        featureLabel: AI_FEATURE_LABELS[feat] || feat,
        count: isTrialUsed ? 1 : 0,
        limit,
        remaining,
        isExceeded: !premium && isTrialUsed,
        isLifetimeTrial: true,
        trialUsed: isTrialUsed,
      };
    }
  }

  const subscription: UserSubscription = {
    id: `sub_${uid}`,
    userId: uid,
    plan: profile.plan === 'PREMIUM' ? 'MONTHLY' : 'FREE',
    status: profile.plan === 'PREMIUM' ? 'PREMIUM_ACTIVE' : 'FREE',
    startDate: profile.createdAt,
    endDate: profile.subscriptionExpiry || null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };

  return {
    user: profile,
    subscription,
    creditsBalance: creditsData.balance,
    creditsUsed: creditsData.used,
    dailyUsage: dailyUsageMap,
    isPremium: premium,
  };
}

// ----------------------------------------------------
// VERIFIKASI AKSES EDIT VIDEO (TAHAP 1 - PREMIUM ONLY)
// ----------------------------------------------------

export interface VideoEditorAccessResult {
  allowed: boolean;
  isSuperAdmin: boolean;
  isPremium: boolean;
  reason: 'SUPER_ADMIN' | 'PREMIUM' | 'FREE_LOCKED' | 'NOT_AUTHENTICATED';
  userEmail?: string | null;
}

/**
 * Memverifikasi hak akses fitur Edit Video secara komprehensif.
 * ATURAN MUTLAK ARVIN STUDIO:
 * - Free User: 0 penggunaan, tidak ada trial, tidak memakan quota AI, terkunci (FREE_LOCKED).
 * - Premium User: Akses penuh selama status langganan ACTIVE dan belum kadaluarsa.
 * - Super Admin: Akses penuh (id.agnesyakartika@gmail.com / role SUPER_ADMIN) untuk testing & administrasi.
 */
export async function verifyVideoEditorAccess(
  cachedProfile?: UserProfile | null
): Promise<VideoEditorAccessResult> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return {
      allowed: false,
      isSuperAdmin: false,
      isPremium: false,
      reason: 'NOT_AUTHENTICATED',
      userEmail: null,
    };
  }

  const email = firebaseUser.email || cachedProfile?.email || null;

  // 1. Verifikasi Super Admin (Prioritas Tertinggi)
  if (isSuperAdminEmail(email)) {
    return {
      allowed: true,
      isSuperAdmin: true,
      isPremium: true,
      reason: 'SUPER_ADMIN',
      userEmail: email,
    };
  }

  // 2. Dapatkan profil pengguna terkini dari Firestore
  let profile = cachedProfile;
  try {
    if (!profile || profile.id !== firebaseUser.uid) {
      profile = await getUserProfile(firebaseUser.uid);
    }
  } catch (err) {
    console.warn('[VideoEditorAccess] Gagal memuat profil terbaru:', err);
  }

  if (profile && isSuperAdminUser(profile)) {
    return {
      allowed: true,
      isSuperAdmin: true,
      isPremium: true,
      reason: 'SUPER_ADMIN',
      userEmail: email,
    };
  }

  // 3. Verifikasi Status Langganan Premium Aktif di Firestore
  if (profile && profile.plan === 'PREMIUM' && profile.subscriptionStatus === 'ACTIVE') {
    if (profile.subscriptionExpiry) {
      const isNotExpired = new Date().getTime() <= new Date(profile.subscriptionExpiry).getTime();
      if (isNotExpired) {
        return {
          allowed: true,
          isSuperAdmin: false,
          isPremium: true,
          reason: 'PREMIUM',
          userEmail: email,
        };
      }
    } else {
      // Paket Premium aktif tanpa tanggal expiry
      return {
        allowed: true,
        isSuperAdmin: false,
        isPremium: true,
        reason: 'PREMIUM',
        userEmail: email,
      };
    }
  }

  // 4. Double check via isPremium()
  const premiumActive = await isPremium();
  if (premiumActive) {
    return {
      allowed: true,
      isSuperAdmin: false,
      isPremium: true,
      reason: 'PREMIUM',
      userEmail: email,
    };
  }

  // 5. Akun FREE -> Terkunci Total (Tidak ada trial)
  return {
    allowed: false,
    isSuperAdmin: false,
    isPremium: false,
    reason: 'FREE_LOCKED',
    userEmail: email,
  };
}

// ============================================================================
// AI VIDEO IKLAN: 1x SEUMUR HIDUP LIFETIME TRIAL SYSTEM (FIREBASE PERSISTENCE)
// ============================================================================

/**
 * Memeriksa hak akses untuk generate AI Video Iklan.
 * Urutan Prioritas Pengecekan:
 * 1. Super Admin -> Boleh Generate (Bypass)
 * 2. Premium Aktif -> Boleh Generate (Akses Premium)
 * 3. Free + Trial Belum Digunakan -> Boleh Generate 1x
 * 4. Free + Trial Sudah Digunakan -> Blokir Generate + Upgrade Premium
 */
export async function checkAiVideoAdAccess(
  targetUserId?: string
): Promise<AiVideoAdAccessCheck> {
  const uid = targetUserId || auth.currentUser?.uid;
  if (!uid) {
    return {
      allowed: false,
      isSuperAdmin: false,
      isPremium: false,
      trialUsed: false,
      remaining: 0,
      reason: 'UNAUTHENTICATED',
    };
  }

  let profile: UserProfile | null = null;
  try {
    profile = await getUserProfile(uid);
  } catch (err) {
    console.warn('[AI Video Ad] Gagal membaca user profile dari Firestore:', err);
  }

  const currentUserAuth = auth.currentUser;
  const userEmail = profile?.email || currentUserAuth?.email || '';

  // 1. PRIORITAS 1: SUPER ADMIN (Bypass total kuota/trial)
  // Super Admin: "id.agnesyakartika@gmail.com", "id.abizarbaihaqi@gmail.com", "id.sangabizar@gmail.com"
  if (
    isSuperAdminUser(profile) ||
    isSuperAdminEmail(userEmail) ||
    (currentUserAuth && isSuperAdminEmail(currentUserAuth.email))
  ) {
    return {
      allowed: true,
      isSuperAdmin: true,
      isPremium: true,
      trialUsed: false,
      remaining: 9999,
      reason: 'SUPER_ADMIN',
    };
  }

  // 2. PRIORITAS 2: PREMIUM AKTIF (Akses sesuai status Premium ARVIN STUDIO)
  if (profile && profile.plan === 'PREMIUM' && profile.subscriptionStatus === 'ACTIVE') {
    let notExpired = true;
    if (profile.subscriptionExpiry) {
      notExpired = new Date().getTime() <= new Date(profile.subscriptionExpiry).getTime();
    }
    if (notExpired) {
      return {
        allowed: true,
        isSuperAdmin: false,
        isPremium: true,
        trialUsed: false,
        remaining: 9999,
        reason: 'PREMIUM',
      };
    }
  }

  // Double-check via subscription collection
  try {
    const premiumActive = await isPremium();
    if (premiumActive) {
      return {
        allowed: true,
        isSuperAdmin: false,
        isPremium: true,
        trialUsed: false,
        remaining: 9999,
        reason: 'PREMIUM',
      };
    }
  } catch (err) {
    console.warn('[AI Video Ad] Error checking isPremium:', err);
  }

  // 3. PRIORITAS 3: FREE USER (1x Seumur Hidup per Akun di Firestore)
  // Status trial disimpan di Firestore users/{uid}.aiVideoAdTrial dan feature_trials/{uid}
  // Tidak pernah reset saat logout, clear cache, clear localStorage, refresh browser, ganti device
  let isTrialUsed = false;
  let isLockedGenerating = false;

  // Cek pada user profile document
  if (profile?.aiVideoAdTrial?.used === true) {
    isTrialUsed = true;
  }

  // Cek atomic lock (mencegah double generate)
  if (profile?.aiVideoAdTrial?.isGenerating === true) {
    const lockExpiresAt = profile.aiVideoAdTrial.lockExpiresAt || 0;
    if (Date.now() < lockExpiresAt) {
      isLockedGenerating = true;
    }
  }

  // Cross-check langsung ke Firestore feature_trials/{uid} untuk integritas data
  if (!isTrialUsed) {
    try {
      const trialDocRef = doc(db, 'feature_trials', uid);
      const trialSnap = await getDoc(trialDocRef);
      if (trialSnap.exists()) {
        const tData = trialSnap.data();
        if (tData?.ai_video_ad?.used === true || tData?.aiVideoAdTrial?.used === true) {
          isTrialUsed = true;
        }
      }
    } catch (err) {
      console.warn('[AI Video Ad] Cross-check feature_trials failed:', err);
    }
  }

  // Jika trial sudah digunakan -> Blokir total (0x tersisa)
  if (isTrialUsed) {
    return {
      allowed: false,
      isSuperAdmin: false,
      isPremium: false,
      trialUsed: true,
      remaining: 0,
      reason: 'FREE_TRIAL_EXHAUSTED',
    };
  }

  // Jika sedang terkunci generate bersamaan
  if (isLockedGenerating) {
    return {
      allowed: false,
      isSuperAdmin: false,
      isPremium: false,
      trialUsed: false,
      remaining: 1,
      isGenerating: true,
      reason: 'LOCKED_GENERATING',
    };
  }

  // Jika Free dan belum pernah generate -> Berikan kesempatan 1x
  return {
    allowed: true,
    isSuperAdmin: false,
    isPremium: false,
    trialUsed: false,
    remaining: 1,
    reason: 'FREE_TRIAL_AVAILABLE',
  };
}

/**
 * Mengunci akun saat proses generate dimulai untuk mencegah double-generate / race condition.
 */
export async function acquireAiVideoAdLock(
  targetUserId?: string
): Promise<{ acquired: boolean; error?: string }> {
  const uid = targetUserId || auth.currentUser?.uid;
  if (!uid) return { acquired: false, error: 'User tidak terautentikasi' };

  try {
    const access = await checkAiVideoAdAccess(uid);
    if (!access.allowed) {
      if (access.trialUsed) {
        return { acquired: false, error: 'Kesempatan Gratis Anda Telah Digunakan' };
      }
      if (access.isGenerating) {
        return { acquired: false, error: 'Proses generate sedang berlangsung' };
      }
      return { acquired: false, error: 'Akses tidak diizinkan' };
    }

    // Super admin & premium tidak perlu lock atomic trial
    if (access.isSuperAdmin || access.isPremium) {
      return { acquired: true };
    }

    // Pasang lock pada Firestore dengan timeout 120 detik
    const userDocRef = doc(db, 'users', uid);
    const lockExpiresAt = Date.now() + 120000;

    await setDoc(
      userDocRef,
      {
        aiVideoAdTrial: {
          used: false,
          isGenerating: true,
          lockExpiresAt,
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return { acquired: true };
  } catch (err: any) {
    console.error('[AI Video Ad] Gagal acquire lock:', err);
    return { acquired: false, error: err?.message || 'Gagal memproses lock' };
  }
}

/**
 * Melepas kunci jika terjadi error, timeout, pembatalan, atau validasi gagal.
 * Trial TIDAK berkurang!
 */
export async function releaseAiVideoAdLock(targetUserId?: string): Promise<void> {
  const uid = targetUserId || auth.currentUser?.uid;
  if (!uid) return;

  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      const data = snap.data();
      // Pastikan hanya reset flag generating jika trial belum used
      if (data?.aiVideoAdTrial?.used !== true) {
        await updateDoc(userDocRef, {
          'aiVideoAdTrial.isGenerating': false,
          'aiVideoAdTrial.lockExpiresAt': null,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('[AI Video Ad] Gagal release lock:', err);
  }
}

/**
 * Mengurangi kesempatan trial HANYA SETELAH AI Video Iklan BERHASIL DIGENERATE dan dapat diputar.
 * Menandai status trial used = true di Firestore (users/{uid} dan feature_trials/{uid}).
 */
export async function consumeAiVideoAdTrial(
  targetUserId?: string,
  videoMeta?: {
    productName?: string;
    style?: string;
    duration?: number;
  }
): Promise<{ success: boolean; remaining: number }> {
  const uid = targetUserId || auth.currentUser?.uid;
  if (!uid) return { success: false, remaining: 0 };

  try {
    const access = await checkAiVideoAdAccess(uid);

    // Super Admin & Premium tidak berkurang kuotanya
    if (access.isSuperAdmin || access.isPremium) {
      return { success: true, remaining: 9999 };
    }

    const now = new Date().toISOString();
    const userDocRef = doc(db, 'users', uid);
    const trialDocRef = doc(db, 'feature_trials', uid);
    const auditDocRef = doc(db, 'ai_usage', `${uid}_ai_video_ad_${Date.now()}`);

    // 1. Update persisten pada users/{uid}
    await setDoc(
      userDocRef,
      {
        aiVideoAdTrial: {
          used: true,
          usedAt: now,
          isGenerating: false,
          lockExpiresAt: null,
          lastProduct: videoMeta?.productName || null,
        },
        updatedAt: now,
      },
      { merge: true }
    );

    // 2. Simpan juga di feature_trials/{uid} sebagai perlindungan ganda permanen
    await setDoc(
      trialDocRef,
      {
        id: uid,
        userId: uid,
        ai_video_ad: {
          used: true,
          usedAt: now,
          productName: videoMeta?.productName || '',
        },
        updatedAt: now,
      },
      { merge: true }
    );

    // 3. Catat di ai_usage untuk audit trail
    await setDoc(
      auditDocRef,
      {
        userId: uid,
        feature: 'ai_video_ad',
        type: 'ONE_TIME_LIFETIME_TRIAL',
        productName: videoMeta?.productName || '',
        style: videoMeta?.style || '',
        duration: videoMeta?.duration || 15,
        createdAt: now,
      },
      { merge: true }
    );

    // 4. Beri tahu backend server agar in-memory cache / DB server juga tersinkronisasi
    try {
      await fetch('/api/ai-video-ad/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: uid,
          productName: videoMeta?.productName,
          now,
        }),
      });
    } catch (apiErr) {
      console.warn('[AI Video Ad] Server sync notice failed:', apiErr);
    }

    return { success: true, remaining: 0 };
  } catch (err) {
    console.error('[AI Video Ad] Gagal consume trial:', err);
    return { success: false, remaining: 0 };
  }
}


