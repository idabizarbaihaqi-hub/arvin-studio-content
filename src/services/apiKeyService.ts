import { GoogleGenAI } from '@google/genai';

const API_KEY_STORAGE_KEY = 'arvin_gemini_api_key';

/**
 * Get the stored Gemini API key from localStorage or Vite environment variable
 */
export function getStoredApiKey(): string {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
  if (stored && stored.trim().length > 0) {
    return stored.trim();
  }
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  return (typeof envKey === 'string' ? envKey : '');
}

/**
 * Save custom Gemini API key into localStorage
 */
export function setStoredApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
  } else {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  }
}

/**
 * Remove stored custom Gemini API key from localStorage
 */
export function removeStoredApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_KEY_STORAGE_KEY);
}

/**
 * Check if a custom API key is present in localStorage
 */
export function hasCustomApiKey(): boolean {
  if (typeof window === 'undefined') return false;
  const key = localStorage.getItem(API_KEY_STORAGE_KEY);
  return Boolean(key && key.trim().length > 0);
}

/**
 * Test a Gemini API key by making a lightweight request
 */
export async function testGeminiApiKey(key: string): Promise<{ success: boolean; message: string }> {
  const trimmed = key.trim();
  if (!trimmed) {
    return { success: false, message: 'Kunci API tidak boleh kosong.' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: trimmed });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Halo, respon dengan 1 kata singkat: OK',
    });

    if (response?.text) {
      return { success: true, message: 'Koneksi ke Gemini AI berhasil terhubung!' };
    }
    return { success: false, message: 'Tidak menerima respon dari model Gemini.' };
  } catch (err: any) {
    console.error('API key test error:', err);
    let msg = err?.message || 'Koneksi gagal. Periksa kembali format API key Anda.';
    if (msg.includes('API_KEY_INVALID') || msg.includes('400')) {
      msg = 'Kunci API tidak valid atau telah kedaluwarsa. Periksa kembali di Google AI Studio.';
    } else if (msg.includes('429') || msg.includes('QUOTA_EXCEEDED')) {
      msg = 'Kuota API key telah melampaui batas rate limit.';
    }
    return { success: false, message: msg };
  }
}
