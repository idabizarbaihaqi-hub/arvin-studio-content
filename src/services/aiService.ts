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

/**
 * AI Service for ARVIN STUDIO
 * Direct real connection to backend Gemini service
 */
export async function sendChatMessage(
  messages: Array<Pick<ChatMessage, 'role' | 'text'>>
): Promise<string> {
  // Only send legitimate user and model messages
  const payloadMessages = messages.map((m) => ({
    role: m.role,
    text: m.text,
    content: m.text,
  }));

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages: payloadMessages }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.error || 'Terjadi masalah saat menghubungkan ke ARVIN AI.';
      throw new Error(errorMessage);
    }

    const data: ChatServiceResponse = await response.json();
    const replyText = data.reply || data.content;
    if (!replyText) {
      throw new Error('AI tidak dapat terhubung. Silakan coba lagi.');
    }

    return replyText;
  } catch (error: unknown) {
    console.error('Error contacting AI service:', error);
    if (error instanceof Error && error.message) {
      throw error;
    }
    throw new Error('Terjadi masalah saat menghubungkan ke ARVIN AI.');
  }
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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



