import { GoogleGenAI } from '@google/genai';

const DEPRECATED_LOCALSTORAGE_KEY = 'arvin_gemini_api_key';

// Automatically purge any residual keys from localStorage on load
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(DEPRECATED_LOCALSTORAGE_KEY)) {
      localStorage.removeItem(DEPRECATED_LOCALSTORAGE_KEY);
      console.log('[Security] Kunci API Gemini lokal dihapus dari localStorage. Kunci kini tersimpan aman di Firebase Firestore.');
    }
  } catch {}
}

/**
 * Get stored Gemini API key: No longer stored in localStorage.
 * Only fallback to VITE_GEMINI_API_KEY if present, otherwise relies purely on server & Firebase.
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  // Purge any stale localStorage
  try {
    localStorage.removeItem(DEPRECATED_LOCALSTORAGE_KEY);
  } catch {}
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return typeof envKey === 'string' ? envKey.trim() : '';
}

/**
 * Deprecated: Do not save to localStorage. All persistence is strictly in Firebase Firestore.
 */
export function setStoredApiKey(_key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEPRECATED_LOCALSTORAGE_KEY);
  } catch {}
}

/**
 * Remove stored custom Gemini API key
 */
export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DEPRECATED_LOCALSTORAGE_KEY);
  } catch {}
}

/**
 * Check if a custom API key is present
 */
export function hasCustomApiKey(): boolean {
  return false;
}

/**
 * Test a Gemini API key by making a lightweight request
 */
export async function testGeminiApiKey(key: string): Promise<{ success: boolean; message: string }> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { success: false, message: 'Kunci API tidak boleh kosong.' };
  }

  const testModels = [
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
  ];

  const ai = new GoogleGenAI({ apiKey: trimmed });
  let lastErrorMsg = '';

  for (const model of testModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: 'Halo, respon dengan 1 kata singkat: OK',
      });

      if (response?.text) {
        return { success: true, message: `Koneksi ke Gemini AI berhasil terhubung! (Model: ${model})` };
      }
    } catch (err: any) {
      console.warn(`Test with model ${model} failed:`, err?.message || err);
      const msg = err?.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        return { success: false, message: 'Kunci API tidak valid atau telah kedaluwarsa. Periksa kembali di Google AI Studio (aistudio.google.com).' };
      }
      lastErrorMsg = msg;
      // Try next model if 404 or unsupported
      continue;
    }
  }

  if (lastErrorMsg.includes('429') || lastErrorMsg.includes('QUOTA_EXCEEDED')) {
    return { success: false, message: 'Kuota API key telah melampaui batas rate limit.' };
  }

  return { success: false, message: lastErrorMsg || 'Koneksi gagal. Periksa kembali format API key Anda.' };
}
