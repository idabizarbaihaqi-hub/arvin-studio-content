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

export async function uploadPaymentProof(
  subscriptionId: string,
  file: File
): Promise<SubscriptionRecord> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Silakan login terlebih dahulu.');

  let downloadUrl = '';

  // 1. Try Firebase Storage upload
  try {
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const storageRef = ref(storage, `payment_proofs/${uid}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    downloadUrl = await getDownloadURL(snapshot.ref);
  } catch (storageErr) {
    console.warn('Firebase Storage upload warning, using secure Data URL fallback:', storageErr);
    // Safe Base64 fallback if storage bucket has CORS or permissions limitation
    downloadUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const now = new Date().toISOString();
  const subDocRef = doc(db, 'subscriptions', subscriptionId);

  // Status becomes PAYMENT_SUBMITTED, still NOT approved yet!
  await updateDoc(subDocRef, {
    paymentProofUrl: downloadUrl,
    submittedAt: now,
    status: 'PAYMENT_SUBMITTED',
    updatedAt: now,
  });

  const updatedSnap = await getDoc(subDocRef);
  return updatedSnap.data() as SubscriptionRecord;
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
