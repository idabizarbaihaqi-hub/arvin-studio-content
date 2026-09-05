import { GoogleGenAI } from '@google/genai';
import { getStoredApiKey } from './apiKeyService';
import {
  ChatMessage,
  ContentAnalysisResult,
  PlatformType,
  ContentCategoryType,
  GenerateIdeasParams,
  ContentIdeaItem,
  GenerateCaptionParams,
  GenerateCaptionResult,
  GenerateHooksParams,
  GenerateHooksResult,
  GenerateScriptParams,
  GenerateScriptResult,
  GenerateHashtagsParams,
  GenerateHashtagsResult,
} from '../types';

export interface ChatServiceResponse {
  reply?: string;
  content?: string;
  error?: string;
}

const SYSTEM_INSTRUCTION = `Anda adalah ARVIN AI, asisten strategi dan produksi konten digital profesional untuk ARVIN STUDIO (dikembangkan untuk membantu content creator, pembuat video, copywriter, dan solopreneur di Indonesia).
Fokus utama Anda adalah membantu:
1. Ideasi & perumusan sudut pandang (angle) konten yang segar, kreatif, dan anti-mainstream.
2. Hook 3 detik pertama yang mematikan dan efektif menghentikan scroll di TikTok, Instagram Reels, dan YouTube Shorts.
3. Struktur naskah/script konten yang menahan watch-time tinggi (Hook - Story/Value - Climax - Call to Action).
4. Caption memikat yang memicu interaksi (likes, komentar, saves, shares).
5. Riset hashtag bertarget dan strategi pertumbuhan audiens organik.
6. Evaluasi dan kurasi draf konten agar siap diproduksi.

Gaya Komunikasi:
- Nada bicara: Cerdas, berenergi, solutif, empatik, dan suportif.
- Gunakan Bahasa Indonesia yang natural, modern, ringkas, dan relevan dengan tren konten masa kini.
- Gunakan pemformatan teks yang rapi (headings, poin-poin tebal, langkah terurut, atau tabel jika relevan).
- Selalu dukung creator untuk terus berkembang dan bereksperimen.`;

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = getStoredApiKey();
  if (key) {
    headers['x-gemini-api-key'] = key;
    headers['Authorization'] = `Bearer ${key}`;
  }
  return headers;
}

const CLIENT_CANDIDATE_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
];

async function directClientGeminiChat(
  apiKey: string,
  messages: Array<Pick<ChatMessage, 'role' | 'text'>>
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const validMessages = messages
    .filter((m) => m && (m.text || '').trim().length > 0)
    .map((m) => ({
      role: m.role === 'model' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.text }],
    }));

  while (validMessages.length > 0 && validMessages[0].role !== 'user') {
    validMessages.shift();
  }

  if (validMessages.length === 0) {
    throw new Error('Pesan tidak boleh kosong.');
  }

  let lastError: any = null;
  for (const model of CLIENT_CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: validMessages,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        },
      });

      const reply = response?.text;
      if (reply) {
        return reply;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Client Gemini] Model ${model} failed:`, err?.message || err);
      const msg = err?.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        throw new Error('API Key Google Gemini yang dimasukkan tidak valid. Periksa kembali di Google AI Studio (aistudio.google.com).');
      }
      continue;
    }
  }

  throw lastError || new Error('Tidak menerima balasan teks dari Gemini AI.');
}

/**
 * AI Service for ARVIN STUDIO
 * Resilient dual-layer: Server-side API with automatic client-side Gemini SDK fallback
 */
export async function sendChatMessage(
  messages: Array<Pick<ChatMessage, 'role' | 'text'>>
): Promise<string> {
  const userApiKey = getStoredApiKey();
  const headers = getAuthHeaders();

  const payloadMessages = messages.map((m) => ({
    role: m.role,
    text: m.text,
    content: m.text,
  }));

  // 1. Try server-side route first
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages: payloadMessages }),
    });

    if (response.ok) {
      const data: ChatServiceResponse = await response.json();
      const replyText = data.reply || data.content;
      if (replyText) {
        return replyText;
      }
    } else {
      let serverErrorMsg = '';
      try {
        const errorData = await response.json();
        if (errorData?.error) serverErrorMsg = errorData.error;
      } catch {}

      // If server returned error but client has an API key, use direct client SDK
      if (userApiKey) {
        console.warn('Server /api/chat error (status ' + response.status + '). Menggunakan fallback langsung Gemini SDK di browser.');
        return await directClientGeminiChat(userApiKey, messages);
      }

      if (serverErrorMsg) {
        throw new Error(serverErrorMsg);
      }
      throw new Error(
        `Layanan AI tidak dapat diakses (Status ${response.status}). Silakan atur API Key melalui tombol "Input GEMINI_API_KEY".`
      );
    }
  } catch (error: any) {
    // 2. Network/fetch failure (e.g. static host without serverless functions, offline, etc.)
    if (userApiKey) {
      console.warn('Gagal menghubungi /api/chat. Menggunakan fallback langsung Gemini SDK di browser.');
      try {
        return await directClientGeminiChat(userApiKey, messages);
      } catch (clientErr: any) {
        throw new Error(clientErr?.message || 'Gagal menghubungi Gemini AI dengan API Key yang tersimpan.');
      }
    }

    const message = error?.message || '';
    if (message.includes('GEMINI_API_KEY') || message.includes('Input GEMINI_API_KEY')) {
      throw error;
    }

    throw new Error(
      'Koneksi AI Terputus. Server API tidak dapat dijangkau dan GEMINI_API_KEY belum diatur. Silakan klik tombol "Input GEMINI_API_KEY" untuk menghubungkan langsung.'
    );
  }

  throw new Error('Tidak ada respon dari ARVIN AI.');
}

/**
 * Analyze Content using ARVIN AI
 */
export async function analyzeContent(params: {
  content: string;
  platform: PlatformType;
  contentType: ContentCategoryType;
}): Promise<ContentAnalysisResult> {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'ARVIN AI tidak dapat melakukan analisis saat ini. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const result: ContentAnalysisResult = await response.json();
    return result;
  } catch (error: unknown) {
    console.error('Error in analyzeContent:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('ARVIN AI tidak dapat melakukan analisis saat ini. Silakan coba lagi.');
  }
}

/**
 * Generate Content Ideas using ARVIN AI (Gemini)
 */
export async function generateContentIdeas(
  params: GenerateIdeasParams
): Promise<ContentIdeaItem[]> {
  try {
    const response = await fetch('/api/ideas', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.ideas || !Array.isArray(data.ideas)) {
      throw new Error('Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.');
    }

    return data.ideas;
  } catch (error: unknown) {
    console.error('Error in generateContentIdeas:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
  }
}

/**
 * Regenerate a single idea card with alternative angle
 */
export async function regenerateSingleIdea(params: {
  niche: string;
  targetAudience?: string;
  platform: string;
  goal: string;
  style: string;
  currentTitle: string;
}): Promise<ContentIdeaItem> {
  try {
    const response = await fetch('/api/ideas/regenerate-single', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.idea) {
      throw new Error('Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.');
    }

    return data.idea;
  } catch (error: unknown) {
    console.error('Error in regenerateSingleIdea:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
  }
}

/**
 * Generate Captions using ARVIN AI (Gemini)
 */
export async function generateCaptions(
  params: GenerateCaptionParams & { regenerateCount?: number }
): Promise<GenerateCaptionResult> {
  try {
    const response = await fetch('/api/captions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Maaf, caption belum berhasil dibuat. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.variants || !Array.isArray(data.variants)) {
      throw new Error('Maaf, caption belum berhasil dibuat. Silakan coba lagi.');
    }

    return data as GenerateCaptionResult;
  } catch (error: unknown) {
    console.error('Error in generateCaptions:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
  }
}

/**
 * Generate Viral Hooks using ARVIN AI (Gemini)
 */
export async function generateHooks(
  params: GenerateHooksParams & { regenerateCount?: number }
): Promise<GenerateHooksResult> {
  try {
    const response = await fetch('/api/hooks', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Maaf, hook belum berhasil dibuat. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.hooks || !Array.isArray(data.hooks)) {
      throw new Error('Maaf, hook belum berhasil dibuat. Silakan coba lagi.');
    }

    return data as GenerateHooksResult;
  } catch (error: unknown) {
    console.error('Error in generateHooks:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
  }
}

/**
 * Generate Structured Script using ARVIN AI (Gemini)
 */
export async function generateScript(
  params: GenerateScriptParams & { regenerateCount?: number }
): Promise<GenerateScriptResult> {
  try {
    const response = await fetch('/api/scripts', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Maaf, permintaan belum berhasil diproses. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.title || !data.body) {
      throw new Error('Maaf, permintaan belum berhasil diproses. Silakan coba lagi.');
    }

    return data as GenerateScriptResult;
  } catch (error: unknown) {
    console.error('Error in generateScript:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
  }
}

/**
 * Generate Targeted Hashtags using ARVIN AI (Gemini)
 */
export async function generateHashtags(
  params: GenerateHashtagsParams & { regenerateCount?: number }
): Promise<GenerateHashtagsResult> {
  try {
    const response = await fetch('/api/hashtags', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Maaf, permintaan belum berhasil diproses. Silakan coba lagi.';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.hashtags || !Array.isArray(data.hashtags)) {
      throw new Error('Maaf, permintaan belum berhasil diproses. Silakan coba lagi.');
    }

    return data as GenerateHashtagsResult;
  } catch (error: unknown) {
    console.error('Error in generateHashtags:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Tidak dapat terhubung ke AI. Periksa koneksi dan coba lagi.');
  }
}



