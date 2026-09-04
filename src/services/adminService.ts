import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserProfile,
  SubscriptionRecord,
  CreditTransaction,
  DailyUsageRecord,
  AiHistoryItem,
  AdminActivityLog,
  AdminDashboardMetrics,
} from '../types';
import { PRIMARY_SUPER_ADMIN_EMAIL } from './accessControlService';

/**
 * Validates if the given user is the primary super admin
 */
export function isPrimarySuperAdmin(user?: { email?: string } | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === PRIMARY_SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Log super admin operational action in Firestore
 */
export async function logAdminActivity(payload: {
  adminUser: UserProfile;
  action: string;
  targetUserId?: string | null;
  targetSubscriptionId?: string | null;
  description: string;
}): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const logData: AdminActivityLog = {
    id: logId,
    adminId: payload.adminUser.uid || payload.adminUser.id,
    adminEmail: payload.adminUser.email,
    action: payload.action,
    targetUserId: payload.targetUserId || null,
    targetSubscriptionId: payload.targetSubscriptionId || null,
    description: payload.description,
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'admin_activity_logs', logId), logData);
  } catch (err) {
    console.warn('Failed to record admin activity log in Firestore:', err);
  }
}

/**
 * Fetch real aggregate metrics for Admin Dashboard
 */
export async function getAdminStats(): Promise<AdminDashboardMetrics> {
  try {
    // 1. Users aggregate
    const usersSnap = await getDocs(collection(db, 'users'));
    let totalUsers = 0;
    let freeUsers = 0;
    let premiumUsers = 0;

    usersSnap.forEach((docSnap) => {
      totalUsers++;
      const data = docSnap.data() as UserProfile;
      if (data.plan === 'PREMIUM' && data.subscriptionStatus === 'ACTIVE') {
        premiumUsers++;
      } else {
        freeUsers++;
      }
    });

    // 2. Subscriptions aggregate
    const subsSnap = await getDocs(collection(db, 'subscriptions'));
    let pendingPayments = 0;
    let activeSubscriptions = 0;
    let revenue = 0;

    subsSnap.forEach((docSnap) => {
      const data = docSnap.data() as SubscriptionRecord;
      if (data.status === 'PAYMENT_SUBMITTED' || data.status === 'UNDER_REVIEW' || data.status === 'PENDING_PAYMENT') {
        pendingPayments++;
      }
      if (data.status === 'APPROVED') {
        activeSubscriptions++;
        revenue += typeof data.price === 'number' ? data.price : 0;
      }
    });

    // 3. AI Usage aggregate
    const usageSnap = await getDocs(collection(db, 'ai_usage'));
    let totalAiUsage = 0;
    usageSnap.forEach((docSnap) => {
      const data = docSnap.data() as { count?: number };
      totalAiUsage += typeof data.count === 'number' ? data.count : 1;
    });

    return {
      totalUsers,
      freeUsers,
      premiumUsers,
      pendingPayments,
      totalAiUsage,
      activeSubscriptions,
      revenue,
    };
  } catch (err) {
    console.error('Error fetching admin metrics from Firestore:', err);
    return {
      totalUsers: 0,
      freeUsers: 0,
      premiumUsers: 0,
      pendingPayments: 0,
      totalAiUsage: 0,
      activeSubscriptions: 0,
      revenue: 0,
    };
  }
}

/**
 * Fetch all users with search and filters
 */
export async function getAdminUsers(filters?: {
  search?: string;
  role?: 'ALL' | 'USER' | 'SUPER_ADMIN';
  plan?: 'ALL' | 'FREE' | 'PREMIUM';
  status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
}): Promise<UserProfile[]> {
  const usersSnap = await getDocs(collection(db, 'users'));
  const users: UserProfile[] = [];

  usersSnap.forEach((d) => {
    const data = d.data() as UserProfile;
    users.push({
      ...data,
      id: d.id,
      uid: data.uid || d.id,
    });
  });

  // Apply filters in-memory
  let result = users;

  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    result = result.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }

  if (filters?.role && filters.role !== 'ALL') {
    result = result.filter((u) => u.role === filters.role);
  }

  if (filters?.plan && filters.plan !== 'ALL') {
    result = result.filter((u) => u.plan === filters.plan);
  }

  if (filters?.status && filters.status !== 'ALL') {
    result = result.filter((u) => u.subscriptionStatus === filters.status);
  }

  // Sort: primary super admin first, then newest
  return result.sort((a, b) => {
    if (isPrimarySuperAdmin(a)) return -1;
    if (isPrimarySuperAdmin(b)) return 1;
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

/**
 * Get comprehensive user details for admin drawer/modal
 */
export async function getUserDetailData(userId: string): Promise<{
  profile: UserProfile | null;
  subscriptions: SubscriptionRecord[];
  transactions: CreditTransaction[];
  usageList: DailyUsageRecord[];
  historyList: AiHistoryItem[];
}> {
  // 1. Profile
  const profileDoc = await getDoc(doc(db, 'users', userId));
  const profile = profileDoc.exists() ? (profileDoc.data() as UserProfile) : null;

  // 2. Subscriptions
  const subsSnap = await getDocs(collection(db, 'subscriptions'));
  const subscriptions: SubscriptionRecord[] = [];
  subsSnap.forEach((d) => {
    const data = d.data() as SubscriptionRecord;
    if (data.userId === userId) {
      subscriptions.push(data);
    }
  });
  subscriptions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 3. Transactions
  const txSnap = await getDocs(collection(db, 'credit_transactions'));
  const transactions: CreditTransaction[] = [];
  txSnap.forEach((d) => {
    const data = d.data() as CreditTransaction;
    if (data.userId === userId) {
      transactions.push(data);
    }
  });
  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 4. Daily Usage
  const usageSnap = await getDocs(collection(db, 'ai_usage'));
  const usageList: DailyUsageRecord[] = [];
  usageSnap.forEach((d) => {
    const data = d.data() as DailyUsageRecord;
    if (data.userId === userId) {
      usageList.push(data);
    }
  });
  usageList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 5. Generated History
  const historySnap = await getDocs(collection(db, 'ai_history'));
  const historyList: AiHistoryItem[] = [];
  historySnap.forEach((d) => {
    const data = d.data() as AiHistoryItem;
    if (data.userId === userId) {
      historyList.push(data);
    }
  });
  historyList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    profile,
    subscriptions,
    transactions,
    usageList,
    historyList,
  };
}

/**
 * Fetch all subscriptions with filters
 */
export async function getAdminSubscriptions(filter?: {
  status?: 'ALL' | 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'REJECTED';
  search?: string;
}): Promise<SubscriptionRecord[]> {
  const subsSnap = await getDocs(collection(db, 'subscriptions'));
  const subs: SubscriptionRecord[] = [];

  subsSnap.forEach((d) => {
    subs.push(d.data() as SubscriptionRecord);
  });

  let result = subs;

  if (filter?.status && filter.status !== 'ALL') {
    if (filter.status === 'ACTIVE') {
      result = result.filter((s) => s.status === 'APPROVED');
    } else if (filter.status === 'PENDING') {
      result = result.filter(
        (s) => s.status === 'PAYMENT_SUBMITTED' || s.status === 'UNDER_REVIEW' || s.status === 'PENDING_PAYMENT'
      );
    } else if (filter.status === 'REJECTED') {
      result = result.filter((s) => s.status === 'REJECTED');
    } else if (filter.status === 'EXPIRED') {
      result = result.filter((s) => s.status === 'EXPIRED');
    }
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase();
    result = result.filter((s) => s.userId.toLowerCase().includes(q) || s.plan.toLowerCase().includes(q));
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Fetch pending subscriptions specifically for payment verification
 */
export async function getPendingPayments(): Promise<SubscriptionRecord[]> {
  const subsSnap = await getDocs(collection(db, 'subscriptions'));
  const pending: SubscriptionRecord[] = [];

  subsSnap.forEach((d) => {
    const data = d.data() as SubscriptionRecord;
    if (data.status === 'PAYMENT_SUBMITTED' || data.status === 'UNDER_REVIEW' || data.status === 'PENDING_PAYMENT') {
      pending.push(data);
    }
  });

  return pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Approve subscription payment, activate user premium plan, and log action
 */
export async function approvePayment(
  subscriptionId: string,
  adminUser: UserProfile
): Promise<void> {
  const subDocRef = doc(db, 'subscriptions', subscriptionId);
  const subSnap = await getDoc(subDocRef);

  if (!subSnap.exists()) {
    throw new Error('Data langganan tidak ditemukan.');
  }

  const sub = subSnap.data() as SubscriptionRecord;
  const now = new Date();
  const startDate = now.toISOString();

  // Calculate expiration date based on duration
  const endDate = new Date(now);
  const durLower = (sub.duration || '').toLowerCase();
  const planLower = (sub.plan || '').toLowerCase();

  if (durLower.includes('tahun') || planLower.includes('yearly')) {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else if (durLower.includes('minggu') || planLower.includes('weekly')) {
    endDate.setDate(endDate.getDate() + 7);
  } else {
    // Default 1 month (30 days)
    endDate.setDate(endDate.getDate() + 30);
  }

  const endDateStr = endDate.toISOString();

  // 1. Update subscription document
  await updateDoc(subDocRef, {
    status: 'APPROVED',
    startDate,
    endDate: endDateStr,
    reviewedAt: startDate,
    reviewedBy: adminUser.email || adminUser.fullName || 'Super Admin',
    updatedAt: startDate,
  });

  // 2. Update user profile to activate PREMIUM
  const userDocRef = doc(db, 'users', sub.userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) {
    await updateDoc(userDocRef, {
      plan: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiry: endDateStr,
      updatedAt: startDate,
    });
  }

  // 3. Log into admin_activity_logs
  await logAdminActivity({
    adminUser,
    action: 'SUPER_ADMIN_APPROVED_PAYMENT',
    targetUserId: sub.userId,
    targetSubscriptionId: subscriptionId,
    description: `Menyetujui pembayaran langganan paket ${sub.plan} (${sub.duration}) seharga Rp ${sub.price?.toLocaleString('id-ID')}`,
  });
}

/**
 * Reject subscription payment with required reason
 */
export async function rejectPayment(
  subscriptionId: string,
  adminUser: UserProfile,
  reason: string
): Promise<void> {
  const cleanReason = reason.trim();
  if (!cleanReason) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  const subDocRef = doc(db, 'subscriptions', subscriptionId);
  const subSnap = await getDoc(subDocRef);

  if (!subSnap.exists()) {
    throw new Error('Data langganan tidak ditemukan.');
  }

  const sub = subSnap.data() as SubscriptionRecord;
  const now = new Date().toISOString();

  // 1. Update subscription document
  await updateDoc(subDocRef, {
    status: 'REJECTED',
    rejectionReason: cleanReason,
    reviewedAt: now,
    reviewedBy: adminUser.email || adminUser.fullName || 'Super Admin',
    updatedAt: now,
  });

  // 2. Log activity
  await logAdminActivity({
    adminUser,
    action: 'SUPER_ADMIN_REJECTED_PAYMENT',
    targetUserId: sub.userId,
    targetSubscriptionId: subscriptionId,
    description: `Menolak pembayaran langganan ${sub.plan} untuk user ${sub.userId}. Alasan: ${cleanReason}`,
  });
}

/**
 * Adjust user credits (add or deduct)
 */
export async function adjustUserCredits(
  targetUserId: string,
  amount: number,
  description: string,
  adminUser: UserProfile
): Promise<number> {
  if (amount === 0) {
    throw new Error('Nominal perubahan kredit tidak boleh 0.');
  }

  const userDocRef = doc(db, 'users', targetUserId);
  const userSnap = await getDoc(userDocRef);

  if (!userSnap.exists()) {
    throw new Error('User target tidak ditemukan.');
  }

  const userData = userSnap.data() as UserProfile;
  const currentCredits = userData.credits || 0;
  const newBalance = Math.max(0, currentCredits + amount);
  const now = new Date().toISOString();

  // 1. Update user document
  await updateDoc(userDocRef, {
    credits: newBalance,
    updatedAt: now,
  });

  // 2. Add credit transaction record
  const txId = `tx_adj_${targetUserId}_${Date.now()}`;
  await setDoc(doc(db, 'credit_transactions', txId), {
    id: txId,
    userId: targetUserId,
    type: 'ADJUSTMENT',
    amount: amount,
    feature: 'Super Admin Adjustment',
    description: description.trim() || 'Penyesuaian saldo kredit oleh Super Admin',
    createdAt: now,
  });

  // 3. Log activity
  await logAdminActivity({
    adminUser,
    action: 'SUPER_ADMIN_CREDIT_ADJUSTMENT',
    targetUserId,
    description: `Penyesuaian kredit user ${userData.username || targetUserId}: ${amount > 0 ? '+' : ''}${amount} (${description})`,
  });

  return newBalance;
}

/**
 * Fetch all AI usage logs with optional period filter
 */
export async function getAdminAiUsage(period: 'today' | '7d' | '30d' | 'all' = 'all'): Promise<{
  totalCount: number;
  byFeature: Record<string, number>;
  records: DailyUsageRecord[];
}> {
  const usageSnap = await getDocs(collection(db, 'ai_usage'));
  const records: DailyUsageRecord[] = [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  usageSnap.forEach((d) => {
    records.push(d.data() as DailyUsageRecord);
  });

  let filtered = records;

  if (period === 'today') {
    filtered = filtered.filter((r) => r.date === todayStr);
  } else if (period === '7d') {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 7);
    const limitStr = limitDate.toISOString().split('T')[0];
    filtered = filtered.filter((r) => r.date >= limitStr);
  } else if (period === '30d') {
    const limitDate = new Date();
    limitDate.setDate(limitDate.getDate() - 30);
    const limitStr = limitDate.toISOString().split('T')[0];
    filtered = filtered.filter((r) => r.date >= limitStr);
  }

  const byFeature: Record<string, number> = {
    chat: 0,
    'content-analyzer': 0,
    'content-ideas': 0,
    'caption-maker': 0,
    'hook-generator': 0,
    'script-maker': 0,
    'hashtag-generator': 0,
  };

  let totalCount = 0;
  filtered.forEach((r) => {
    const c = r.count || 1;
    totalCount += c;
    if (byFeature[r.feature] !== undefined) {
      byFeature[r.feature] += c;
    } else {
      byFeature[r.feature] = c;
    }
  });

  filtered.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());

  return {
    totalCount,
    byFeature,
    records: filtered,
  };
}

/**
 * Fetch AI content history across all users
 */
export async function getAdminAiHistory(search?: string, featureFilter?: string): Promise<AiHistoryItem[]> {
  const histSnap = await getDocs(collection(db, 'ai_history'));
  const items: AiHistoryItem[] = [];

  histSnap.forEach((d) => {
    items.push(d.data() as AiHistoryItem);
  });

  let result = items;

  if (featureFilter && featureFilter !== 'ALL') {
    result = result.filter((i) => i.feature?.toLowerCase() === featureFilter.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (i) =>
        i.title?.toLowerCase().includes(q) ||
        i.inputSummary?.toLowerCase().includes(q) ||
        i.result?.toLowerCase().includes(q) ||
        i.userId?.toLowerCase().includes(q)
    );
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Fetch Admin Activity Logs
 */
export async function getAdminActivityLogs(): Promise<AdminActivityLog[]> {
  const logsSnap = await getDocs(collection(db, 'admin_activity_logs'));
  const logs: AdminActivityLog[] = [];

  logsSnap.forEach((d) => {
    logs.push(d.data() as AdminActivityLog);
  });

  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
