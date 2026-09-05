import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { PaymentAccount, UserProfile } from '../types';
import { logAdminActivity } from './adminService';

/**
 * Fetch all payment accounts (Super Admin only)
 */
export async function getPaymentAccounts(): Promise<PaymentAccount[]> {
  try {
    const snap = await getDocs(collection(db, 'payment_accounts'));
    const accounts: PaymentAccount[] = [];
    snap.forEach((docSnap) => {
      accounts.push({ id: docSnap.id, ...(docSnap.data() as Omit<PaymentAccount, 'id'>) });
    });
    // Sort descending by createdAt
    accounts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return accounts;
  } catch (err: any) {
    console.error('Error fetching payment accounts:', err);
    throw new Error(err.message || 'Gagal memuat daftar rekening pembayaran.');
  }
}

export const DEFAULT_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: 'default-bca',
    bankName: 'BCA (Bank Central Asia)',
    accountName: 'PT ARVIN DIGITAL KREATIF',
    accountNumber: '8735092114',
    description: 'Akun Utama Transfer',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
  },
  {
    id: 'default-mandiri',
    bankName: 'Bank Mandiri',
    accountName: 'PT ARVIN DIGITAL KREATIF',
    accountNumber: '137002299881',
    description: 'Akun Transfer Alternatif',
    isActive: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    createdBy: 'SYSTEM',
    updatedBy: 'SYSTEM',
  },
];

/**
 * Fetch only active payment accounts (for User checkout/transfer instructions)
 * Falls back to default official accounts if Firestore collection is empty or offline
 */
export async function getActivePaymentAccounts(): Promise<PaymentAccount[]> {
  try {
    const snap = await getDocs(collection(db, 'payment_accounts'));
    const accounts: PaymentAccount[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Omit<PaymentAccount, 'id'>;
      if (data.isActive === true) {
        accounts.push({ id: docSnap.id, ...data });
      }
    });

    if (accounts.length > 0) {
      accounts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return accounts;
    }
    return DEFAULT_PAYMENT_ACCOUNTS;
  } catch (err: any) {
    console.warn('Could not fetch active payment accounts from Firestore, using default fallback:', err);
    return DEFAULT_PAYMENT_ACCOUNTS;
  }
}

/**
 * Fetch payment account metrics (Total & Aktif) directly from Firestore
 */
export async function getPaymentAccountStats(): Promise<{ total: number; active: number }> {
  try {
    const snap = await getDocs(collection(db, 'payment_accounts'));
    let total = 0;
    let active = 0;
    snap.forEach((docSnap) => {
      total++;
      if (docSnap.data().isActive === true) {
        active++;
      }
    });
    return { total, active };
  } catch (err) {
    console.warn('Error fetching payment account stats:', err);
    return { total: 0, active: 0 };
  }
}

export interface PaymentAccountInput {
  bankName: string;
  accountName: string;
  accountNumber: string;
  description?: string;
  isActive: boolean;
}

/**
 * Create a new payment account in Firestore
 */
export async function createPaymentAccount(
  input: PaymentAccountInput,
  currentAdmin: UserProfile
): Promise<PaymentAccount> {
  const bankName = input.bankName.trim();
  const accountName = input.accountName.trim();
  const accountNumber = input.accountNumber.trim();
  const description = input.description ? input.description.trim() : '';

  if (!bankName) throw new Error('Nama bank wajib diisi.');
  if (!accountName) throw new Error('Nama pemilik rekening wajib diisi.');
  if (!accountNumber) throw new Error('Nomor rekening wajib diisi.');

  const adminUid = currentAdmin.uid || currentAdmin.id || auth.currentUser?.uid || 'admin';
  const newDocRef = doc(collection(db, 'payment_accounts'));
  const now = new Date().toISOString();

  const newAccount: PaymentAccount = {
    id: newDocRef.id,
    bankName,
    accountName,
    accountNumber,
    description,
    isActive: Boolean(input.isActive),
    createdAt: now,
    updatedAt: now,
    createdBy: adminUid,
    updatedBy: adminUid,
  };

  try {
    await setDoc(newDocRef, newAccount);

    // Audit log
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'CREATE_PAYMENT_ACCOUNT',
      targetId: newDocRef.id,
      description: `Menambahkan rekening baru: ${bankName} - ${accountNumber} (a.n. ${accountName})`,
    });

    return newAccount;
  } catch (err: any) {
    console.error('Error creating payment account:', err);
    throw new Error(err.message || 'Gagal menambahkan rekening pembayaran.');
  }
}

/**
 * Update an existing payment account in Firestore
 */
export async function updatePaymentAccount(
  id: string,
  input: PaymentAccountInput,
  currentAdmin: UserProfile
): Promise<void> {
  const bankName = input.bankName.trim();
  const accountName = input.accountName.trim();
  const accountNumber = input.accountNumber.trim();
  const description = input.description ? input.description.trim() : '';

  if (!bankName) throw new Error('Nama bank wajib diisi.');
  if (!accountName) throw new Error('Nama pemilik rekening wajib diisi.');
  if (!accountNumber) throw new Error('Nomor rekening wajib diisi.');

  const adminUid = currentAdmin.uid || currentAdmin.id || auth.currentUser?.uid || 'admin';
  const now = new Date().toISOString();

  try {
    const docRef = doc(db, 'payment_accounts', id);
    await updateDoc(docRef, {
      bankName,
      accountName,
      accountNumber,
      description,
      isActive: Boolean(input.isActive),
      updatedAt: now,
      updatedBy: adminUid,
    });

    // Audit log
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'UPDATE_PAYMENT_ACCOUNT',
      targetId: id,
      description: `Memperbarui rekening pembayaran: ${bankName} - ${accountNumber} (a.n. ${accountName})`,
    });
  } catch (err: any) {
    console.error('Error updating payment account:', err);
    throw new Error(err.message || 'Gagal memperbarui rekening pembayaran.');
  }
}

/**
 * Delete a payment account from Firestore
 */
export async function deletePaymentAccount(
  id: string,
  accountInfo: { bankName: string; accountNumber: string },
  currentAdmin: UserProfile
): Promise<void> {
  try {
    const docRef = doc(db, 'payment_accounts', id);
    await deleteDoc(docRef);

    // Audit log
    await logAdminActivity({
      adminUser: currentAdmin,
      action: 'DELETE_PAYMENT_ACCOUNT',
      targetId: id,
      description: `Menghapus rekening pembayaran: ${accountInfo.bankName} - ${accountInfo.accountNumber}`,
    });
  } catch (err: any) {
    console.error('Error deleting payment account:', err);
    throw new Error(err.message || 'Gagal menghapus rekening pembayaran.');
  }
}

/**
 * Toggle active status of a payment account
 */
export async function togglePaymentAccountStatus(
  id: string,
  currentIsActive: boolean,
  accountInfo: { bankName: string; accountNumber: string },
  currentAdmin: UserProfile
): Promise<boolean> {
  const newStatus = !currentIsActive;
  const adminUid = currentAdmin.uid || currentAdmin.id || auth.currentUser?.uid || 'admin';
  const now = new Date().toISOString();

  try {
    const docRef = doc(db, 'payment_accounts', id);
    await updateDoc(docRef, {
      isActive: newStatus,
      updatedAt: now,
      updatedBy: adminUid,
    });

    // Audit log
    const action = newStatus ? 'ENABLE_PAYMENT_ACCOUNT' : 'DISABLE_PAYMENT_ACCOUNT';
    const statusLabel = newStatus ? 'mengaktifkan' : 'menonaktifkan';

    await logAdminActivity({
      adminUser: currentAdmin,
      action,
      targetId: id,
      description: `Super Admin ${statusLabel} rekening: ${accountInfo.bankName} - ${accountInfo.accountNumber}`,
    });

    return newStatus;
  } catch (err: any) {
    console.error('Error toggling payment account status:', err);
    throw new Error(err.message || 'Gagal mengubah status keaktifan rekening.');
  }
}
