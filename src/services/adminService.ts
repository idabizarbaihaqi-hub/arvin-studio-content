import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  runTransaction,
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
  targetId?: string | null;
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
    targetId: payload.targetId || null,
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

    // 4. Payment Accounts count
    let totalPaymentAccounts = 0;
    let activePaymentAccounts = 0;
    try {
      const paymentAccountsSnap = await getDocs(collection(db, 'payment_accounts'));
      paymentAccountsSnap.forEach((docSnap) => {
        totalPaymentAccounts++;
        if (docSnap.data().isActive === true) {
          activePaymentAccounts++;
        }
      });
    } catch {
      // Non-critical if user doesn't have permissions yet
    }

    return {
      totalUsers,
      freeUsers,
      premiumUsers,
      pendingPayments,
      totalAiUsage,
      activeSubscriptions,
      revenue,
      totalPaymentAccounts,
      activePaymentAccounts,
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
      totalPaymentAccounts: 0,
      activePaymentAccounts: 0,
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
 * Helper to calculate plan expiration date based on duration or plan name
 * "7_DAYS" -> startDate + 7 days
 * "30_DAYS" -> startDate + 30 days
 * "12_MONTHS" -> startDate + 12 months (or 365 days)
 */
export function calculatePlanEndDate(
  planName?: string,
  durationStr?: string,
  startDate: Date = new Date()
): string {
  const p = (planName || '').toUpperCase();
  const d = (durationStr || '').toUpperCase();
  const end = new Date(startDate.getTime());

  if (
    p.includes('12_MONTHS') ||
    p.includes('12 BULAN') ||
    p.includes('YEAR') ||
    p.includes('1 TAHUN') ||
    d.includes('12 BULAN') ||
    d.includes('TAHUN')
  ) {
    // 12 Months
    end.setFullYear(end.getFullYear() + 1);
  } else if (
    p.includes('7_DAYS') ||
    p.includes('7 HARI') ||
    p.includes('WEEK') ||
    d.includes('7 HARI') ||
    d.includes('MINGGU')
  ) {
    // 7 Days
    end.setDate(end.getDate() + 7);
  } else {
    // Default 30 Days (30_DAYS / 30 HARI / MONTH)
    end.setDate(end.getDate() + 30);
  }

  return end.toISOString();
}

/**
 * Approve subscription payment atomically via Firestore transaction,
 * activates user PREMIUM plan, and records admin activity log.
 */
export async function approvePayment(
  subscriptionId: string,
  adminUser: UserProfile
): Promise<void> {
  if (!subscriptionId || !subscriptionId.trim()) {
    throw new Error('ID pembayaran tidak ditemukan.');
  }

  if (
    !adminUser ||
    (!isPrimarySuperAdmin(adminUser) &&
      adminUser.role !== 'SUPER_ADMIN' &&
      adminUser.adminAccess !== true)
  ) {
    throw new Error('Akses ditolak. Hanya Super Admin yang berwenang menyetujui pembayaran.');
  }

  const subDocRef = doc(db, 'subscriptions', subscriptionId.trim());

  let targetUserId = '';
  let subPlan = '';
  let subDuration = '';
  let subPrice = 0;
  let calculatedEndDateStr = '';

  // Atomic transaction to ensure consistency between subscriptions and users collections
  await runTransaction(db, async (transaction) => {
    const subSnap = await transaction.get(subDocRef);
    if (!subSnap.exists()) {
      throw new Error('ID pembayaran tidak ditemukan di database.');
    }

    const sub = subSnap.data() as SubscriptionRecord;

    if (!sub.userId || !sub.userId.trim()) {
      throw new Error('Data user pada pembayaran tidak ditemukan.');
    }

    // Status checks
    if (sub.status === 'APPROVED') {
      throw new Error('Pembayaran ini sudah disetujui.');
    }
    if (sub.status === 'REJECTED') {
      throw new Error('Pembayaran ini telah ditolak sebelumnya.');
    }
    if (sub.status === 'EXPIRED') {
      throw new Error('Pembayaran ini sudah kedaluwarsa.');
    }
    const approvableStatuses = ['PAYMENT_SUBMITTED', 'UNDER_REVIEW', 'PENDING_PAYMENT'];
    if (!approvableStatuses.includes(sub.status)) {
      throw new Error(`Status pembayaran tidak valid untuk disetujui (${sub.status}).`);
    }

    targetUserId = sub.userId.trim();
    subPlan = sub.plan || 'PREMIUM';
    subDuration = sub.duration || '-';
    subPrice = sub.price || 0;

    const userDocRef = doc(db, 'users', targetUserId);
    const userSnap = await transaction.get(userDocRef);
    if (!userSnap.exists()) {
      throw new Error('Data profil user pemesan tidak ditemukan di sistem.');
    }

    const now = new Date();
    const startDateStr = now.toISOString();
    calculatedEndDateStr = calculatePlanEndDate(sub.plan, sub.duration, now);
    const adminIdentifier = adminUser.email || adminUser.uid || 'Super Admin';

    // 1. Atomic update subscription document
    transaction.update(subDocRef, {
      status: 'APPROVED',
      startDate: startDateStr,
      endDate: calculatedEndDateStr,
      reviewedAt: startDateStr,
      reviewedBy: adminIdentifier,
      updatedAt: startDateStr,
    });

    // 2. Atomic update user profile to PREMIUM ACTIVE
    transaction.update(userDocRef, {
      plan: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      subscriptionExpiry: calculatedEndDateStr,
      updatedAt: startDateStr,
    });
  });

  // 3. Record Admin Activity Log
  try {
    await logAdminActivity({
      adminUser,
      action: 'APPROVE_PAYMENT',
      targetUserId,
      targetSubscriptionId: subscriptionId,
      description: `Menyetujui pembayaran langganan paket ${subPlan} (${subDuration}) seharga Rp ${subPrice.toLocaleString('id-ID')}. Akun user aktif hingga ${new Date(calculatedEndDateStr).toLocaleDateString('id-ID')}.`,
    });
  } catch (logErr) {
    console.warn('Gagal mencatat log aktivitas admin:', logErr);
  }
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
  if (!subscriptionId || !subscriptionId.trim()) {
    throw new Error('ID pembayaran tidak ditemukan.');
  }
  if (!cleanReason) {
    throw new Error('Alasan penolakan wajib diisi.');
  }

  if (
    !adminUser ||
    (!isPrimarySuperAdmin(adminUser) &&
      adminUser.role !== 'SUPER_ADMIN' &&
      adminUser.adminAccess !== true)
  ) {
    throw new Error('Akses ditolak. Hanya Super Admin yang berwenang menolak pembayaran.');
  }

  const subDocRef = doc(db, 'subscriptions', subscriptionId.trim());
  let targetUserId = '';
  let subPlan = '';

  await runTransaction(db, async (transaction) => {
    const subSnap = await transaction.get(subDocRef);
    if (!subSnap.exists()) {
      throw new Error('ID pembayaran tidak ditemukan.');
    }

    const sub = subSnap.data() as SubscriptionRecord;
    if (sub.status === 'APPROVED') {
      throw new Error('Pembayaran ini sudah disetujui dan tidak dapat ditolak.');
    }

    targetUserId = sub.userId || '';
    subPlan = sub.plan || 'PREMIUM';

    const now = new Date().toISOString();
    const adminIdentifier = adminUser.email || adminUser.uid || 'Super Admin';

    transaction.update(subDocRef, {
      status: 'REJECTED',
      rejectionReason: cleanReason,
      reviewedAt: now,
      reviewedBy: adminIdentifier,
      updatedAt: now,
    });
  });

  // Record activity log
  try {
    await logAdminActivity({
      adminUser,
      action: 'REJECT_PAYMENT',
      targetUserId,
      targetSubscriptionId: subscriptionId,
      description: `Menolak pembayaran langganan ${subPlan} untuk user ${targetUserId}. Alasan: ${cleanReason}`,
    });
  } catch (logErr) {
    console.warn('Gagal mencatat log aktivitas admin:', logErr);
  }
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
