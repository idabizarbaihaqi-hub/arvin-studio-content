import { ChatMessage } from '../types';

/**
 * Service to manage private, user-isolated chat histories.
 * Ensures each user account only ever accesses their own chat messages.
 */

const STORAGE_PREFIX = 'arvin_chat_history_';

export function getUserChatMessages(userId?: string | null): ChatMessage[] {
  if (!userId) return [];

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((m: any) => m && typeof m.text === 'string' && !m.isError)
      .map((m: any) => ({
        ...m,
        timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
      }));
  } catch (err) {
    console.warn('Gagal memuat riwayat chat privat pengguna:', err);
    return [];
  }
}

export function saveUserChatMessages(userId: string | null | undefined, messages: ChatMessage[]): void {
  if (!userId) return;

  try {
    const cleanMessages = messages
      .filter((m) => !m.isError)
      .slice(-100); // Batasi 100 percakapan terbaru demi performa & privasi

    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(cleanMessages)
    );
  } catch (err) {
    console.warn('Gagal menyimpan riwayat chat privat pengguna:', err);
  }
}

export function clearUserChatMessages(userId?: string | null): void {
  if (!userId) return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch (err) {
    console.warn('Gagal menghapus riwayat chat privat pengguna:', err);
  }
}
