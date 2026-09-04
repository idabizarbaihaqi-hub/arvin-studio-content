import {
  ContentPlan,
  ContentPlanStatus,
  AiUsageRecord,
  AiHistoryItem,
  AnalyticsPeriod,
  AnalyticsSummary,
} from '../types';

const STORAGE_KEYS = {
  USER_ID: 'arvin_user_id',
  CONTENT_PLANS: 'arvin_content_plans',
  AI_USAGE: 'arvin_ai_usage',
  AI_HISTORY: 'arvin_ai_history',
};

/**
 * Returns the stable user ID for this browser session.
 * Uses persistent unique user identifier per device / browser.
 */
export function getUserId(): string {
  try {
    let uid = localStorage.getItem(STORAGE_KEYS.USER_ID);
    if (!uid) {
      uid = 'usr_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.USER_ID, uid);
    }
    return uid;
  } catch {
    return 'usr_default_creator';
  }
}

// ----------------------------------------------------
// CONTENT PLANS CRUD
// ----------------------------------------------------

export async function fetchContentPlans(): Promise<ContentPlan[]> {
  const userId = getUserId();
  try {
    const response = await fetch(`/api/content-plans?userId=${encodeURIComponent(userId)}`, {
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error('Data belum dapat dimuat. Silakan coba lagi.');
    }

    const data = await response.json();
    return Array.isArray(data.plans) ? data.plans : [];
  } catch (error) {
    console.warn('Network error fetching content plans, checking local cache:', error);
    // Fallback to local storage
    try {
      const cached = localStorage.getItem(STORAGE_KEYS.CONTENT_PLANS);
      if (cached) {
        const all: ContentPlan[] = JSON.parse(cached);
        return all.filter((p) => p.userId === userId);
      }
    } catch {
      // ignore
    }
    throw new Error('Data belum dapat dimuat. Silakan coba lagi.');
  }
}

export async function createContentPlan(
  data: Omit<ContentPlan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<ContentPlan> {
  const userId = getUserId();
  try {
    const response = await fetch('/api/content-plans', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        ...data,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Data belum berhasil disimpan.');
    }

    const res = await response.json();
    return res.plan;
  } catch (error) {
    console.error('Error creating content plan:', error);
    throw new Error('Data belum berhasil disimpan.');
  }
}

export async function updateContentPlan(
  id: string,
  updates: Partial<ContentPlan>
): Promise<ContentPlan> {
  const userId = getUserId();
  try {
    const response = await fetch(`/api/content-plans/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        ...updates,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error('Data belum berhasil disimpan.');
    }

    const res = await response.json();
    return res.plan;
  } catch (error) {
    console.error('Error updating content plan:', error);
    throw new Error('Data belum berhasil disimpan.');
  }
}

export async function markContentPlanAsPosted(id: string): Promise<ContentPlan> {
  return updateContentPlan(id, { status: 'Diposting' });
}

export async function deleteContentPlan(id: string): Promise<void> {
  const userId = getUserId();
  try {
    const response = await fetch(`/api/content-plans/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error('Data belum berhasil dihapus.');
    }
  } catch (error) {
    console.error('Error deleting content plan:', error);
    throw new Error('Data belum berhasil dihapus.');
  }
}

// ----------------------------------------------------
// ANALYTICS
// ----------------------------------------------------

export async function fetchAnalytics(period: AnalyticsPeriod = 'all'): Promise<AnalyticsSummary> {
  const userId = getUserId();
  try {
    const response = await fetch(
      `/api/analytics?userId=${encodeURIComponent(userId)}&period=${encodeURIComponent(period)}`,
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Data belum dapat dimuat. Silakan coba lagi.');
    }

    const data = await response.json();
    return data.summary;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw new Error('Data belum dapat dimuat. Silakan coba lagi.');
  }
}

// ----------------------------------------------------
// AI USAGE TRACKING
// ----------------------------------------------------

let lastUsageLogTime: Record<string, number> = {};

export async function recordAiUsage(feature: string): Promise<void> {
  const userId = getUserId();
  const now = Date.now();

  // Prevent duplicate records from double clicking within 2 seconds for the same feature
  if (lastUsageLogTime[feature] && now - lastUsageLogTime[feature] < 2000) {
    return;
  }
  lastUsageLogTime[feature] = now;

  try {
    await fetch('/api/ai-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        userId,
        feature,
      }),
    });
  } catch (error) {
    console.warn('Failed to record AI usage:', error);
  }
}

// ----------------------------------------------------
// AI HISTORY
// ----------------------------------------------------

export async function fetchAiHistory(
  category?: string,
  search?: string
): Promise<AiHistoryItem[]> {
  const userId = getUserId();
  try {
    const params = new URLSearchParams({ userId });
    if (category && category !== 'Semua') {
      params.append('category', category);
    }
    if (search && search.trim()) {
      params.append('search', search.trim());
    }

    const response = await fetch(`/api/history?${params.toString()}`, {
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error('Data belum dapat dimuat. Silakan coba lagi.');
    }

    const data = await response.json();
    return Array.isArray(data.history) ? data.history : [];
  } catch (error) {
    console.error('Error fetching history:', error);
    throw new Error('Data belum dapat dimuat. Silakan coba lagi.');
  }
}

export async function saveAiHistory(
  item: Omit<AiHistoryItem, 'id' | 'userId' | 'createdAt'>
): Promise<AiHistoryItem | null> {
  const userId = getUserId();
  try {
    const response = await fetch('/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify({
        ...item,
        userId,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.item;
  } catch (error) {
    console.warn('Could not save to history:', error);
    return null;
  }
}

export async function deleteAiHistory(id: string): Promise<void> {
  const userId = getUserId();
  try {
    const response = await fetch(`/api/history/${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': userId,
      },
    });

    if (!response.ok) {
      throw new Error('Data belum berhasil dihapus.');
    }
  } catch (error) {
    console.error('Error deleting history item:', error);
    throw new Error('Data belum berhasil dihapus.');
  }
}
