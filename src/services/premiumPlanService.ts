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

export const DESIGNATED_SUPER_ADMIN_EMAIL = 'id.agnesyakartika@gmail.com';

/**
 * Strict check ensuring only the designated Super Admin (id.agnesyakartika@gmail.com) can manage premium plans.
 */
export function isPremiumPlansAdmin(currentUser?: UserProfile | null): boolean {
  if (!currentUser) return false;
  const email = (currentUser.email || auth.currentUser?.email || '').trim().toLowerCase();
  return email === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase();
}

/**
 * Fetch all premium plans for Super Admin (excluding soft-deleted ones),
 * ordered by sortOrder ascending.
 */
export async function getPremiumPlans(): Promise<PremiumPlan[]> {
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

    // Sort ascending by sortOrder, then by createdAt
    plans.sort((a, b) => {
      if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      }
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    return plans;
  } catch (err: any) {
    console.error('Error fetching premium plans:', err);
    throw new Error(err.message || 'Gagal memuat daftar Paket Premium.');
  }
}

/**
 * Fetch only active and non-deleted premium plans for user-facing subscription page.
 * Sorted by sortOrder ascending.
 */
export async function getActivePremiumPlans(): Promise<PremiumPlan[]> {
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

    plans.sort((a, b) => {
      if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
        return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
      }
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    return plans;
  } catch (err: any) {
    console.warn('Could not fetch active premium plans from Firestore:', err);
    return [];
  }
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
 * Create a new Premium Plan in Firestore (Super Admin only)
 */
export async function createPremiumPlan(
  input: PremiumPlanInput,
  currentAdmin: UserProfile
): Promise<PremiumPlan> {
  if (!isPremiumPlansAdmin(currentAdmin)) {
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk ${DESIGNATED_SUPER_ADMIN_EMAIL}.`);
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
    isPopular: Boolean(input.isPopular),
    isActive: Boolean(input.isActive),
    sortOrder: Number(input.sortOrder) || 1,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    createdBy: adminIdentifier,
    updatedBy: adminIdentifier,
  };

  try {
    await setDoc(newDocRef, newPlan);

    // Audit log
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'CREATE_PREMIUM_PLAN',
      targetId: newDocRef.id,
      description: `Membuat Paket Premium baru: "${newPlan.name}" seharga Rp ${newPlan.price.toLocaleString('id-ID')} (${newPlan.duration} ${newPlan.durationUnit})`,
    });

    return newPlan;
  } catch (err: any) {
    console.error('Error creating premium plan in Firestore:', err);
    throw new Error(err.message || 'Gagal menyimpan Paket Premium baru ke Firestore.');
  }
}

/**
 * Update an existing Premium Plan in Firestore (Super Admin only)
 */
export async function updatePremiumPlan(
  planId: string,
  input: PremiumPlanInput,
  currentAdmin: UserProfile
): Promise<void> {
  if (!isPremiumPlansAdmin(currentAdmin)) {
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk ${DESIGNATED_SUPER_ADMIN_EMAIL}.`);
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

  try {
    const docRef = doc(db, 'premium_plans', planId.trim());
    await updateDoc(docRef, {
      name: input.name.trim(),
      price: Math.round(Number(input.price)),
      duration: Math.round(Number(input.duration)),
      durationUnit: input.durationUnit,
      description: (input.description || '').trim(),
      badge: (input.badge || '').trim(),
      benefits: cleanBenefits,
      isPopular: Boolean(input.isPopular),
      isActive: Boolean(input.isActive),
      sortOrder: Number(input.sortOrder) || 1,
      updatedAt: now,
      updatedBy: adminIdentifier,
    });

    // Audit log
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'UPDATE_PREMIUM_PLAN',
      targetId: planId,
      description: `Memperbarui Paket Premium: "${input.name.trim()}" (Rp ${Math.round(Number(input.price)).toLocaleString('id-ID')} - ${input.duration} ${input.durationUnit})`,
    });
  } catch (err: any) {
    console.error('Error updating premium plan:', err);
    throw new Error(err.message || 'Gagal memperbarui Paket Premium.');
  }
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
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk ${DESIGNATED_SUPER_ADMIN_EMAIL}.`);
  }

  const newStatus = !currentIsActive;
  const now = new Date().toISOString();
  const adminIdentifier = currentAdmin.email || currentAdmin.uid || 'admin';

  try {
    const docRef = doc(db, 'premium_plans', planId.trim());
    await updateDoc(docRef, {
      isActive: newStatus,
      updatedAt: now,
      updatedBy: adminIdentifier,
    });

    // Audit log
    await logAdminActivity({
      adminUser: currentAdmin,
      action: newStatus ? 'ENABLE_PREMIUM_PLAN' : 'DISABLE_PREMIUM_PLAN',
      targetId: planId,
      description: `Super Admin ${newStatus ? 'mengaktifkan' : 'menonaktifkan'} Paket Premium: "${planName}"`,
    });

    return newStatus;
  } catch (err: any) {
    console.error('Error toggling premium plan status:', err);
    throw new Error(err.message || 'Gagal mengubah status keaktifan Paket Premium.');
  }
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
    throw new Error(`Akses ditolak. Pengelolaan Paket Premium hanya diizinkan untuk ${DESIGNATED_SUPER_ADMIN_EMAIL}.`);
  }

  if (!planId || !planId.trim()) {
    throw new Error('ID paket tidak ditemukan.');
  }

  const now = new Date().toISOString();
  const adminIdentifier = currentAdmin.email || currentAdmin.uid || 'admin';
  const docRef = doc(db, 'premium_plans', planId.trim());

  try {
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
      console.warn('Could not check subscriptions collection:', checkErr);
    }

    if (isUsedInSubscriptions) {
      // Perform Soft Delete
      await updateDoc(docRef, {
        isActive: false,
        isDeleted: true,
        updatedAt: now,
        updatedBy: adminIdentifier,
      });

      await logAdminActivity({
        adminUser: currentAdmin,
        action: 'SOFT_DELETE_PREMIUM_PLAN',
        targetId: planId,
        description: `Soft-delete Paket Premium: "${planName}" (disembunyikan & dinonaktifkan karena telah ada riwayat langganan pengguna)`,
      });

      return {
        softDeleted: true,
        message: `Paket "${planName}" telah dinonaktifkan dan diarsipkan (soft delete) karena memiliki riwayat langganan pengguna. Data riwayat transaksi pengguna tetap aman.`,
      };
    } else {
      // Safe to hard delete
      await deleteDoc(docRef);

      await logAdminActivity({
        adminUser: currentAdmin,
        action: 'HARD_DELETE_PREMIUM_PLAN',
        targetId: planId,
        description: `Menghapus permanen Paket Premium: "${planName}"`,
      });

      return {
        softDeleted: false,
        message: `Paket "${planName}" berhasil dihapus secara permanen.`,
      };
    }
  } catch (err: any) {
    console.error('Error deleting premium plan:', err);
    throw new Error(err.message || 'Gagal menghapus Paket Premium.');
  }
}
