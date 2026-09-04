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

export const PRIMARY_SUPER_ADMIN_EMAIL = 'id.abizarbaihaqi@gmail.com';

export function isSuperAdminUser(user?: UserProfile | null): boolean {
  if (!user) return false;
  return (
    user.role === 'SUPER_ADMIN' ||
    user.adminAccess === true ||
    (user.email ? user.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase() : false)
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

  const isSuperAdmin = cleanEmail === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();

  // Initial user document according to strict requirements:
  // Primary Super Admin is automatically set to SUPER_ADMIN with adminAccess = true
  // Regular users MUST be role = USER, plan = FREE, subscriptionStatus = INACTIVE
  const initialProfile: UserProfile = {
    id: uid,
    uid: uid,
    fullName: cleanFullName,
    username: cleanUsername || (isSuperAdmin ? 'superadmin' : `creator_${uid.slice(0, 5)}`),
    email: cleanEmail,
    photoURL: '',
    bio: isSuperAdmin ? 'Primary Super Administrator ARVIN STUDIO' : 'Kreator Konten ARVIN STUDIO',
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

    // Check if user is Primary Super Admin and enforce role integrity
    if (
      data.email &&
      data.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase() &&
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
// DAILY USAGE LIMIT (5x PER DAY PER TOOL SEPARATELY)
// ----------------------------------------------------

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function canUseFeature(feature: AiFeatureKey): Promise<UsageLimitCheckResult> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    return {
      allowed: false,
      feature,
      count: 5,
      limit: 5,
      remaining: 0,
      isPremium: false,
      reason: 'DAILY_LIMIT_REACHED',
    };
  }

  // 1. Check if user is PREMIUM
  const premiumActive = await isPremium();
  if (premiumActive) {
    return {
      allowed: true,
      feature,
      count: 0,
      limit: 999,
      remaining: 999,
      isPremium: true,
      reason: 'ALLOWED',
    };
  }

  // 2. User is FREE -> check usage for this specific tool for today
  const dateStr = getTodayDateString();
  const usageDocId = `${uid}_${feature}_${dateStr}`;
  const usageDocRef = doc(db, 'ai_usage', usageDocId);

  try {
    const snap = await getDoc(usageDocRef);
    const count = snap.exists() ? Number(snap.data()?.usageCount || 0) : 0;
    const limit = 5;
    const remaining = Math.max(0, limit - count);

    if (count >= limit) {
      return {
        allowed: false,
        feature,
        count,
        limit,
        remaining: 0,
        isPremium: false,
        reason: 'DAILY_LIMIT_REACHED',
      };
    }

    return {
      allowed: true,
      feature,
      count,
      limit,
      remaining,
      isPremium: false,
      reason: 'ALLOWED',
    };
  } catch (err) {
    console.error('Error checking usage limit in Firestore:', err);
    return {
      allowed: true,
      feature,
      count: 0,
      limit: 5,
      remaining: 5,
      isPremium: false,
      reason: 'ALLOWED',
    };
  }
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

/**
 * Increments usageCount only after AI generation successfully finishes.
 */
export async function consumeFeatureUsage(
  feature: AiFeatureKey
): Promise<{ success: boolean; remaining: number }> {
  const uid = auth.currentUser?.uid;
  if (!uid) return { success: false, remaining: 0 };

  const premium = await isPremium();
  if (premium) {
    return { success: true, remaining: 999 };
  }

  const dateStr = getTodayDateString();
  const usageDocId = `${uid}_${feature}_${dateStr}`;
  const usageDocRef = doc(db, 'ai_usage', usageDocId);
  const now = new Date().toISOString();

  try {
    const snap = await getDoc(usageDocRef);
    const currentCount = snap.exists() ? Number(snap.data()?.usageCount || 0) : 0;
    const newCount = currentCount + 1;

    await setDoc(
      usageDocRef,
      {
        id: usageDocId,
        userId: uid,
        feature,
        date: dateStr,
        usageCount: newCount,
        createdAt: (snap.exists() && snap.data()?.createdAt) ? snap.data()?.createdAt : now,
        updatedAt: now,
      },
      { merge: true }
    );

    const remaining = Math.max(0, 5 - newCount);
    return { success: true, remaining };
  } catch (err) {
    console.error('Error incrementing usage count:', err);
    return { success: false, remaining: 0 };
  }
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

  for (const feat of allFeatures) {
    const usageDocId = `${uid}_${feat}_${dateStr}`;
    let count = 0;
    try {
      const snap = await getDoc(doc(db, 'ai_usage', usageDocId));
      if (snap.exists()) {
        count = Number(snap.data()?.usageCount || 0);
      }
    } catch {
      count = 0;
    }

    const limit = premium ? 999 : 5;
    const remaining = premium ? 999 : Math.max(0, 5 - count);

    dailyUsageMap[feat] = {
      feature: feat,
      featureLabel: AI_FEATURE_LABELS[feat] || feat,
      count,
      limit,
      remaining,
      isExceeded: !premium && count >= 5,
    };
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
