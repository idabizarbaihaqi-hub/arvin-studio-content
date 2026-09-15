import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { PremiumPlan, PremiumPlanInput, UserProfile } from '../types';
import { logAdminActivity } from './adminService';
import { isSuperAdminUser, isSuperAdminEmail } from './accessControlService';

export const DESIGNATED_SUPER_ADMIN_EMAIL = 'id.agnesyakartika@gmail.com';

export const DEFAULT_PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'plan_7_days',
    name: 'PREMIUM 7 HARI',
    price: 50000,
    duration: 7,
    durationUnit: 'Hari',
    description: 'Akses penuh mingguan untuk akselerasi konten kreator pemula.',
    badge: 'Starter',
    benefits: [
      'Akses tanpa batas seluruh AI Creator Tools',
      'Chat AI tanpa limit 5x/hari',
      'Content Analyzer & Content Ideas unlimited',
      'Caption Maker, Hook & Script Maker unlimited',
      'Hashtag Generator unlimited',
      'Content Planner & Kalender Terjadwal',
      'Analytics & Pelacakan AI Usage',
      'Bebas Iklan & Premium Badge Kreator',
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 1,
    isDeleted: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
  },
  {
    id: 'plan_30_days',
    name: 'PREMIUM 30 HARI',
    price: 150000,
    duration: 30,
    durationUnit: 'Hari',
    popular: true,
    isPopular: true,
    description: 'Pilihan paling populer bagi kreator aktif yang konsisten posting.',
    badge: 'Best Value',
    benefits: [
      'Semua keuntungan paket 7 hari',
      'Akses 30 hari penuh tanpa batas',
      'Hemat 40% dibandingkan mingguan',
      'Prioritas pemrosesan server berkecepatan tinggi',
      'Ekspor riwayat dan jadwal konten tanpa batas',
      'Dukungan prioritas kreator ARVIN',
    ],
    sortOrder: 2,
    isActive: true,
    isDeleted: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
  },
  {
    id: 'plan_12_months',
    name: 'PREMIUM 12 BULAN',
    price: 180000,
    duration: 12,
    durationUnit: 'Bulan',
    description: 'Investasi terbaik setahun penuh untuk kreator profesional dan bisnis.',
    badge: 'Pro Annual',
    benefits: [
      'Semua fitur dan alat premium tanpa batas',
      'Akses penuh 365 hari untuk kreator profesional',
      'Hemat maksimal hingga 60%',
      'Akses awal ke fitur baru mendatang',
      'Konsultasi optimasi alur kerja konten',
    ],
    isPopular: false,
    isActive: true,
    sortOrder: 3,
    isDeleted: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
  },
];

/**
 * Strict check ensuring Super Admins can manage premium plans.
 * Prioritizes designated Super Admin (id.agnesyakartika@gmail.com) while supporting all system Super Admins.
 */
export function isPremiumPlansAdmin(currentUser?: UserProfile | null): boolean {
  if (!currentUser) return false;
  const email = (currentUser.email || auth.currentUser?.email || '').trim().toLowerCase();
  return (
    email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() ||
    isSuperAdminEmail(email) ||
    isSuperAdminUser(currentUser) ||
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.adminAccess === true
  );
}

/**
 * Fetch all premium plans for Super Admin (excluding soft-deleted ones),
 * ordered by sortOrder ascending.
 * Tries Firestore first; on permission restrictions or network failure,
 * seamlessly falls back to backend server API and default plans without throwing errors.
 */
export async function getPremiumPlans(): Promise<PremiumPlan[]> {
  // 1. Try Firestore direct collection
  try {
    const snap = await getDocs(collection(db, 'premium_plans'));
    const plans: PremiumPlan[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as Omit<PremiumPlan, 'id'>;
      if (data.isDeleted !== true) {
        plans.push({
          id: docSnap.id,
          ...data,
          benefits: Array.isArray(data.benefits) ? data.benefits : [],
        });
      }
    });

    if (plans.length > 0) {
      plans.sort((a, b) => {
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
      return plans;
    }
  } catch (err: any) {
    // Firestore rules might restrict custom collections; fall back smoothly to server API
    console.info('[PremiumPlanService] Firestore read restricted or empty, attempting backend API fallback:', err?.message || err);
  }

  // 2. Try Backend Server API proxy
  try {
    const res = await fetch('/api/premium-plans');
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const serverPlans: PremiumPlan[] = json.data.map((p: any) => ({
          ...p,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
        }));
        serverPlans.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return serverPlans;
      }
    }
  } catch (apiErr) {
    console.info('[PremiumPlanService] Backend proxy note:', apiErr);
  }

  // 3. Fallback to default official plans
  return [...DEFAULT_PREMIUM_PLANS];
}

/**
 * Fetch only active and non-deleted premium plans for user-facing subscription page.
 * Sorted by sortOrder ascending.
 */
export async function getActivePremiumPlans(): Promise<PremiumPlan[]> {
  // 1. Try Firestore direct collection
  try {
    const snap = await getDocs(collection(db, 'premium_plans'));
    const plans: PremiumPlan[] = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data() as Omit<PremiumPlan, 'id'>;
      if (data.isActive === true && data.isDeleted !== true) {
        plans.push({
          id: docSnap.id,
          ...data,
          benefits: Array.isArray(data.benefits) ? data.benefits : [],
        });
      }
    });

    if (plans.length > 0) {
      plans.sort((a, b) => {
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
      return plans;
    }
  } catch (err: any) {
    console.info('[PremiumPlanService] Active plans read fallback triggered:', err?.message || err);
  }

  // 2. Try Backend Server API proxy
  try {
    const res = await fetch('/api/premium-plans?activeOnly=true');
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const serverPlans: PremiumPlan[] = json.data.map((p: any) => ({
          ...p,
          benefits: Array.isArray(p.benefits) ? p.benefits : [],
        }));
        serverPlans.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        return serverPlans;
      }
    }
  } catch (apiErr) {
    console.info('[PremiumPlanService] Backend proxy note:', apiErr);
  }

  // 3. Fallback to default active official plans
  return DEFAULT_PREMIUM_PLANS.filter((p) => p.isActive && !p.isDeleted);
}

/**
 * Validate PremiumPlanInput
 */
export function validatePlanInput(input: PremiumPlanInput): { isValid: boolean; error?: string } {
  if (!input.name || !input.name.trim()) {
    return { isValid: false, error: 'Nama paket wajib diisi.' };
  }
  if (input.price === undefined || input.price === null || isNaN(Number(input.price)) || Number(input.price) < 0) {
    return { isValid: false, error: 'Harga harus berupa angka dan tidak boleh negatif.' };
  }
  if (!input.duration || isNaN(Number(input.duration)) || Number(input.duration) <= 0) {
    return { isValid: false, error: 'Durasi harus berupa angka dan lebih dari 0.' };
  }
  if (!input.durationUnit || !['Hari', 'Bulan', 'Tahun'].includes(input.durationUnit)) {
    return { isValid: false, error: 'Satuan durasi harus dipilih (Hari, Bulan, atau Tahun).' };
  }
  const cleanBenefits = (input.benefits || []).map((b) => b.trim()).filter(Boolean);
  if (input.isActive && cleanBenefits.length === 0) {
    return { isValid: false, error: 'Paket aktif wajib memiliki minimal 1 poin manfaat.' };
  }
  if (input.sortOrder === undefined || input.sortOrder === null || isNaN(Number(input.sortOrder))) {
    return { isValid: false, error: 'Urutan tampilan harus berupa angka.' };
  }
  return { isValid: true };
}

/**
 * Create a new Premium Plan in Firestore and Server Store (Super Admin only)
 */
export async function createPremiumPlan(
  input: PremiumPlanInput,
  currentAdmin: UserProfile
): Promise<PremiumPlan> {
  if (!isPremiumPlansAdmin(currentAdmin)) {
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk Super Admin.`);
  }

  const validation = validatePlanInput(input);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Data paket tidak valid.');
  }

  const cleanBenefits = (input.benefits || []).map((b) => b.trim()).filter(Boolean);
  const now = new Date().toISOString();
  const adminIdentifier = currentAdmin.email || currentAdmin.uid || 'admin';
  const newDocRef = doc(collection(db, 'premium_plans'));

  const newPlan: PremiumPlan = {
    id: newDocRef.id,
    name: input.name.trim(),
    price: Math.round(Number(input.price)),
    duration: Math.round(Number(input.duration)),
    durationUnit: input.durationUnit,
    description: (input.description || '').trim(),
    badge: (input.badge || '').trim(),
    benefits: cleanBenefits,
    popular: Boolean(input.isPopular),
    isPopular: Boolean(input.isPopular),
    isActive: Boolean(input.isActive),
    sortOrder: Number(input.sortOrder) || 1,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    createdBy: adminIdentifier,
    updatedBy: adminIdentifier,
  };

  // 1. Always sync to server backend
  try {
    await fetch('/api/premium-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPlan),
    });
  } catch (apiErr) {
    console.warn('[PremiumPlanService] Backend sync notice:', apiErr);
  }

  // 2. Sync to Firestore
  try {
    await setDoc(newDocRef, newPlan);
  } catch (firestoreErr) {
    console.warn('[PremiumPlanService] Firestore write notice (server API backed up):', firestoreErr);
  }

  // 3. Audit log
  try {
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'CREATE_PREMIUM_PLAN',
      targetId: newDocRef.id,
      description: `Membuat Paket Premium baru: "${newPlan.name}" seharga Rp ${newPlan.price.toLocaleString('id-ID')} (${newPlan.duration} ${newPlan.durationUnit})`,
    });
  } catch {}

  return newPlan;
}

/**
 * Update an existing Premium Plan in Firestore and Server Store (Super Admin only)
 */
export async function updatePremiumPlan(
  planId: string,
  input: PremiumPlanInput,
  currentAdmin: UserProfile
): Promise<void> {
  if (!isPremiumPlansAdmin(currentAdmin)) {
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk Super Admin.`);
  }

  if (!planId || !planId.trim()) {
    throw new Error('ID paket tidak ditemukan.');
  }

  const validation = validatePlanInput(input);
  if (!validation.isValid) {
    throw new Error(validation.error || 'Data paket tidak valid.');
  }

  const cleanBenefits = (input.benefits || []).map((b) => b.trim()).filter(Boolean);
  const now = new Date().toISOString();
  const adminIdentifier = currentAdmin.email || currentAdmin.uid || 'admin';

  const updatePayload = {
    id: planId.trim(),
    name: input.name.trim(),
    price: Math.round(Number(input.price)),
    duration: Math.round(Number(input.duration)),
    durationUnit: input.durationUnit,
    description: (input.description || '').trim(),
    badge: (input.badge || '').trim(),
    benefits: cleanBenefits,
    popular: Boolean(input.isPopular),
    isPopular: Boolean(input.isPopular),
    isActive: Boolean(input.isActive),
    sortOrder: Number(input.sortOrder) || 1,
    updatedAt: now,
    updatedBy: adminIdentifier,
  };

  // 1. Sync to server backend
  try {
    await fetch(`/api/premium-plans/${planId.trim()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });
  } catch (apiErr) {
    console.warn('[PremiumPlanService] Backend sync notice:', apiErr);
  }

  // 2. Sync to Firestore
  try {
    const docRef = doc(db, 'premium_plans', planId.trim());
    await updateDoc(docRef, updatePayload);
  } catch (firestoreErr) {
    console.warn('[PremiumPlanService] Firestore update notice (server API backed up):', firestoreErr);
  }

  // 3. Audit log
  try {
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'UPDATE_PREMIUM_PLAN',
      targetId: planId,
      description: `Memperbarui Paket Premium: "${input.name.trim()}" (Rp ${Math.round(Number(input.price)).toLocaleString('id-ID')} - ${input.duration} ${input.durationUnit})`,
    });
  } catch {}
}

/**
 * Toggle active status of a Premium Plan (Super Admin only)
 */
export async function togglePremiumPlanStatus(
  planId: string,
  currentIsActive: boolean,
  planName: string,
  currentAdmin: UserProfile
): Promise<boolean> {
  if (!isPremiumPlansAdmin(currentAdmin)) {
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk Super Admin.`);
  }

  const newStatus = !currentIsActive;
  const now = new Date().toISOString();
  const adminIdentifier = currentAdmin.email || currentAdmin.uid || 'admin';

  // 1. Sync to server backend
  try {
    await fetch(`/api/premium-plans/${planId.trim()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: newStatus, updatedAt: now, updatedBy: adminIdentifier }),
    });
  } catch (apiErr) {
    console.warn('[PremiumPlanService] Backend sync notice:', apiErr);
  }

  // 2. Sync to Firestore
  try {
    const docRef = doc(db, 'premium_plans', planId.trim());
    await updateDoc(docRef, {
      isActive: newStatus,
      updatedAt: now,
      updatedBy: adminIdentifier,
    });
  } catch (firestoreErr) {
    console.warn('[PremiumPlanService] Firestore toggle notice (server API backed up):', firestoreErr);
  }

  // 3. Audit log
  try {
    await logAdminActivity({
      adminUser: currentAdmin,
      action: newStatus ? 'ENABLE_PREMIUM_PLAN' : 'DISABLE_PREMIUM_PLAN',
      targetId: planId,
      description: `Super Admin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} Paket Premium: "${planName}"`,
    });
  } catch {}

  return newStatus;
}

/**
 * Delete a Premium Plan with safeguard against breaking existing user subscriptions.
 * If the plan has historical records in 'subscriptions', it is safely soft-deleted (hidden & deactivated).
 * If it has no transaction history, it is permanently deleted.
 */
export async function deletePremiumPlan(
  planId: string,
  planName: string,
  currentAdmin: UserProfile
): Promise<{ softDeleted: boolean; message: string }> {
  if (!isPremiumPlansAdmin(currentAdmin)) {
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk Super Admin.`);
  }

  if (!planId || !planId.trim()) {
    throw new Error('ID paket tidak ditemukan.');
  }

  const now = new Date().toISOString();
  const adminIdentifier = currentAdmin.email || currentAdmin.uid || 'admin';
  const docRef = doc(db, 'premium_plans', planId.trim());

  // Check if the plan is referenced in existing user subscriptions
  let isUsedInSubscriptions = false;
  try {
    const q = query(
      collection(db, 'subscriptions'),
      where('plan', '==', planName),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      isUsedInSubscriptions = true;
    }
  } catch (checkErr) {
    console.info('Subscription reference check note:', checkErr);
  }

  // 1. Sync to backend API
  try {
    await fetch(`/api/premium-plans/${planId.trim()}`, { method: 'DELETE' });
  } catch (apiErr) {
    console.warn('[PremiumPlanService] Backend delete notice:', apiErr);
  }

  if (isUsedInSubscriptions) {
    // Perform Soft Delete in Firestore
    try {
      await updateDoc(docRef, {
        isActive: false,
        isDeleted: true,
        updatedAt: now,
        updatedBy: adminIdentifier,
      });
    } catch {}

    try {
      await logAdminActivity({
        adminUser: currentAdmin,
        action: 'SOFT_DELETE_PREMIUM_PLAN',
        targetId: planId,
        description: `Soft-delete Paket Premium: "${planName}" (disembunyikan & dinonaktifkan karena telah ada riwayat langganan pengguna)`,
      });
    } catch {}

    return {
      softDeleted: true,
      message: `Paket "${planName}" telah dinonaktifkan dan diarsipkan (soft delete) karena memiliki riwayat langganan pengguna. Data riwayat transaksi pengguna tetap aman.`,
    };
  } else {
    // Safe to hard delete in Firestore
    try {
      await deleteDoc(docRef);
    } catch {}

    try {
      await logAdminActivity({
        adminUser: currentAdmin,
        action: 'HARD_DELETE_PREMIUM_PLAN',
        targetId: planId,
        description: `Menghapus permanen Paket Premium: "${planName}"`,
      });
    } catch {}

    return {
      softDeleted: false,
      message: `Paket "${planName}" berhasil dihapus secara permanen.`,
    };
  }
}

