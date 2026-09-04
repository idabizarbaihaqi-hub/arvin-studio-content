import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  ContentPlan,
  AiHistoryItem,
  AnalyticsPeriod,
  AnalyticsSummary,
  PlatformDistribution,
} from '../types';

export function getUserId(): string {
  return auth.currentUser?.uid || '';
}

// ----------------------------------------------------
// CONTENT PLANS CRUD (FIRESTORE)
// ----------------------------------------------------

export async function fetchContentPlans(): Promise<ContentPlan[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const q = query(
      collection(db, 'content_plans'),
      where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    const list: ContentPlan[] = snap.docs.map((d) => d.data() as ContentPlan);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching content plans from Firestore:', error);
    return [];
  }
}

export async function createContentPlan(
  data: Omit<ContentPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ContentPlan> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Pengguna belum login.');

  const planId = `plan_${uid}_${Date.now()}`;
  const now = new Date().toISOString();

  const newPlan: ContentPlan = {
    ...data,
    id: planId,
    userId: uid,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'content_plans', planId), newPlan);
  return newPlan;
}

export async function updateContentPlan(
  id: string,
  updates: Partial<ContentPlan>
): Promise<ContentPlan> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Pengguna belum login.');

  const planRef = doc(db, 'content_plans', id);
  const now = new Date().toISOString();

  await updateDoc(planRef, {
    ...updates,
    updatedAt: now,
  });

  const updatedPlan: ContentPlan = {
    ...(updates as any),
    id,
    userId: uid,
    updatedAt: now,
  };
  return updatedPlan;
}

export async function markContentPlanAsPosted(id: string): Promise<ContentPlan> {
  return updateContentPlan(id, { status: 'Diposting' });
}

export async function deleteContentPlan(id: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Pengguna belum login.');
  await deleteDoc(doc(db, 'content_plans', id));
}

// ----------------------------------------------------
// ANALYTICS (FIRESTORE AGGREGATION)
// ----------------------------------------------------

export async function fetchAnalytics(period: AnalyticsPeriod = 'all'): Promise<AnalyticsSummary> {
  const uid = auth.currentUser?.uid;
  const defaultEmptySummary: AnalyticsSummary = {
    period,
    totalContent: 0,
    scheduled: 0,
    published: 0,
    draft: 0,
    cancelled: 0,
    platformDistribution: {
      Facebook: 0,
      Instagram: 0,
      TikTok: 0,
      YouTube: 0,
      X: 0,
      Other: 0,
    },
    totalAiGenerations: 0,
    aiFeatureBreakdown: {},
    dailyActivity: [],
    totalGenerated: 0,
    totalContentPlans: 0,
    plansByStatus: { Draft: 0, Scheduled: 0, Published: 0, Cancelled: 0 },
    toolUsageStats: [],
    dailyUsageTrend: [],
  };

  if (!uid) {
    return defaultEmptySummary;
  }

  try {
    // 1. Fetch content plans
    const plansSnap = await getDocs(query(collection(db, 'content_plans'), where('userId', '==', uid)));
    const plans = plansSnap.docs.map((d) => d.data() as ContentPlan);

    // 2. Fetch history
    const historySnap = await getDocs(query(collection(db, 'ai_history'), where('userId', '==', uid)));
    const history = historySnap.docs.map((d) => d.data() as AiHistoryItem);

    // Filter by period
    const now = new Date();
    let cutoff = 0;
    if (period === '7d') {
      cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else if (period === '30d') {
      cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    } else if (period === '90d') {
      cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000;
    }

    const filteredPlans = cutoff > 0 ? plans.filter((p) => new Date(p.createdAt).getTime() >= cutoff) : plans;
    const filteredHistory = cutoff > 0 ? history.filter((h) => new Date(h.createdAt).getTime() >= cutoff) : history;

    // Plans by status
    const plansByStatus = {
      Draft: 0,
      Scheduled: 0,
      Published: 0,
      Cancelled: 0,
    };

    const platformDistribution: PlatformDistribution = {
      Facebook: 0,
      Instagram: 0,
      TikTok: 0,
      YouTube: 0,
      X: 0,
      Other: 0,
    };

    for (const p of filteredPlans) {
      if (p.status === 'Diposting' || p.status === 'Published') plansByStatus.Published++;
      else if (p.status === 'Siap Diposting' || p.status === 'Scheduled') plansByStatus.Scheduled++;
      else if (p.status === 'Ditunda' || p.status === 'Cancelled') plansByStatus.Cancelled++;
      else plansByStatus.Draft++;

      if (p.platform in platformDistribution) {
        platformDistribution[p.platform as keyof PlatformDistribution]++;
      } else {
        platformDistribution.Other++;
      }
    }

    // Tool usage stats
    const usageCounts: Record<string, number> = {};
    for (const h of filteredHistory) {
      const tool = h.feature || 'Lainnya';
      usageCounts[tool] = (usageCounts[tool] || 0) + 1;
    }

    const toolUsageStats = Object.entries(usageCounts).map(([feature, count]) => ({
      feature,
      count,
      percentage: filteredHistory.length > 0 ? Math.round((count / filteredHistory.length) * 100) : 0,
    }));

    // Daily trend
    const dateCounts: Record<string, { plans: number; ai: number }> = {};
    for (const p of filteredPlans) {
      const d = p.createdAt ? p.createdAt.split('T')[0] : '';
      if (d) {
        if (!dateCounts[d]) dateCounts[d] = { plans: 0, ai: 0 };
        dateCounts[d].plans++;
      }
    }
    for (const h of filteredHistory) {
      const d = h.createdAt ? h.createdAt.split('T')[0] : '';
      if (d) {
        if (!dateCounts[d]) dateCounts[d] = { plans: 0, ai: 0 };
        dateCounts[d].ai++;
      }
    }

    const dailyActivity = Object.entries(dateCounts)
      .map(([date, val]) => ({ date, plans: val.plans, ai: val.ai }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    const dailyUsageTrend = Object.entries(dateCounts)
      .map(([date, val]) => ({ date, count: val.ai }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);

    return {
      period,
      totalContent: filteredPlans.length,
      scheduled: plansByStatus.Scheduled,
      published: plansByStatus.Published,
      draft: plansByStatus.Draft,
      cancelled: plansByStatus.Cancelled,
      platformDistribution,
      totalAiGenerations: filteredHistory.length,
      aiFeatureBreakdown: usageCounts,
      dailyActivity,
      totalGenerated: filteredHistory.length,
      totalContentPlans: filteredPlans.length,
      plansByStatus,
      toolUsageStats,
      dailyUsageTrend,
    };
  } catch (error) {
    console.error('Error fetching analytics from Firestore:', error);
    return defaultEmptySummary;
  }
}

// ----------------------------------------------------
// AI USAGE TRACKING & HISTORY (FIRESTORE)
// ----------------------------------------------------

let lastUsageLogTime: Record<string, number> = {};

export async function recordAiUsage(feature: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const now = Date.now();
  if (lastUsageLogTime[feature] && now - lastUsageLogTime[feature] < 2000) {
    return;
  }
  lastUsageLogTime[feature] = now;

  try {
    const usageId = `usage_${uid}_${Date.now()}`;
    await setDoc(doc(db, 'ai_usage_logs', usageId), {
      id: usageId,
      userId: uid,
      feature,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Non-blocking log
  }
}

export async function fetchAiHistory(
  category?: string,
  search?: string
): Promise<AiHistoryItem[]> {
  const uid = auth.currentUser?.uid;
  if (!uid) return [];

  try {
    const q = query(
      collection(db, 'ai_history'),
      where('userId', '==', uid)
    );
    const snap = await getDocs(q);
    let list: AiHistoryItem[] = snap.docs.map((d) => d.data() as AiHistoryItem);

    if (category && category !== 'Semua') {
      list = list.filter((item) => item.feature.toLowerCase() === category.toLowerCase());
    }

    if (search && search.trim()) {
      const lower = search.toLowerCase();
      list = list.filter(
        (item) =>
          item.title.toLowerCase().includes(lower) ||
          item.inputSummary.toLowerCase().includes(lower) ||
          item.result.toLowerCase().includes(lower)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching AI history from Firestore:', error);
    return [];
  }
}

export async function saveAiHistory(
  item: Omit<AiHistoryItem, 'id' | 'userId' | 'createdAt'>
): Promise<AiHistoryItem | null> {
  const uid = auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const historyId = `hist_${uid}_${Date.now()}`;
    const now = new Date().toISOString();
    const fullItem: AiHistoryItem = {
      ...item,
      id: historyId,
      userId: uid,
      createdAt: now,
    };

    await setDoc(doc(db, 'ai_history', historyId), fullItem);
    return fullItem;
  } catch (error) {
    console.warn('Could not save AI history to Firestore:', error);
    return null;
  }
}

export async function deleteAiHistory(id: string): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Pengguna belum login.');
  await deleteDoc(doc(db, 'ai_history', id));
}
