import { GoogleGenAI } from '@google/genai';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
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

const CLIENT_CANDIDATE_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
];

let cachedFirestoreKey: string | null = null;

/**
 * Retrieves the effective Gemini API Key from:
 * 1. Custom stored user key (localStorage / VITE_ env)
 * 2. Cached Firestore key
 * 3. Firestore system_settings/gemini_config
 */
export async function getEffectiveApiKey(): Promise<string> {
  const stored = getStoredApiKey();
  if (stored) return stored;

  if (cachedFirestoreKey) return cachedFirestoreKey;

  try {
    const snap = await getDoc(doc(db, 'system_settings', 'gemini_config'));
    if (snap.exists()) {
      const data = snap.data();
      if (data?.apiKey && typeof data.apiKey === 'string' && data.apiKey.trim()) {
        cachedFirestoreKey = data.apiKey.trim();
        return cachedFirestoreKey;
      }
    }
  } catch (err) {
    console.warn('[AI Service] Tidak dapat membaca kunci dari Firestore:', err);
  }

  return '';
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = await getEffectiveApiKey();
  if (key) {
    headers['x-gemini-api-key'] = key;
    headers['Authorization'] = `Bearer ${key}`;
  }
  return headers;
}

/**
 * Accurately extracts the first complete balanced JSON object {...} or array [...]
 * from a string, ignoring any leading text or trailing notes/commentary after the JSON.
 */
function extractFirstCompleteJson(str: string): any {
  let depth = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{' || ch === '[') {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0 && start !== -1) {
        const candidate = str.substring(start, i + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          try {
            const cleaned = candidate.replace(/,\s*([}\]])/g, '$1');
            return JSON.parse(cleaned);
          } catch {}
        }
      }
    }
  }
  return null;
}

/**
 * Safely parse JSON returned by LLMs
 */
function safeJsonParse<T = any>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') return {} as T;
  const trimmed = rawText.trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const balanced = extractFirstCompleteJson(trimmed);
  if (balanced !== null && balanced !== undefined) {
    return balanced as T;
  }

  const cleanedText = trimmed.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanedText);
  } catch {}

  const cFirstBrace = cleanedText.indexOf('{');
  const cLastBrace = cleanedText.lastIndexOf('}');
  if (cFirstBrace !== -1 && cLastBrace > cFirstBrace) {
    try {
      return JSON.parse(cleanedText.substring(cFirstBrace, cLastBrace + 1));
    } catch {}
  }

  return {} as T;
}

/**
 * Direct client helper for text/JSON generation with Gemini SDK
 */
async function directClientGenerate(
  apiKey: string,
  prompt: string,
  systemInstruction: string,
  options?: { temperature?: number; responseMimeType?: string }
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError: any = null;

  for (const model of CLIENT_CANDIDATE_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: options?.temperature ?? 0.7,
          ...(options?.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
        },
      });

      const text = response?.text;
      if (text && text.trim()) {
        return text.trim();
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Client Gemini] Model ${model} generation failed:`, err?.message || err);
      const msg = err?.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        throw new Error('API Key Google Gemini yang dimasukkan tidak valid. Periksa kembali di Google AI Studio (aistudio.google.com).');
      }
    }
  }

  throw lastError || new Error('Tidak menerima balasan dari Gemini AI.');
}

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
      console.warn(`[Client Gemini Chat] Model ${model} failed:`, err?.message || err);
      const msg = err?.message || '';
      if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
        throw new Error('API Key Google Gemini yang dimasukkan tidak valid. Periksa kembali di Google AI Studio (aistudio.google.com).');
      }
      continue;
    }
  }

  throw lastError || new Error('Tidak menerima balasan teks dari Gemini AI.');
}

// ---------------------------------------------------------------------------
// CLIENT DIRECT IMPLEMENTATIONS (Fallback for Vercel/Static/Timeout)
// ---------------------------------------------------------------------------

async function directClientAnalyzeContent(
  apiKey: string,
  params: { content: string; platform: PlatformType; contentType: ContentCategoryType }
): Promise<ContentAnalysisResult> {
  const prompt = `Lakukan analisis mendalam terhadap konten berikut:
Platform Target: ${params.platform}
Jenis Konten: ${params.contentType}

Draf Konten Pengguna:
"""
${params.content.trim()}
"""

Panduan Analisis:
1. "overallScore": Skor kualitas total konten (skala integer 0-100).
2. "metrics": Skor untuk setiap 7 kategori (skala integer 0-100):
   - "hook": Kekuatan hook atau kalimat pembuka
   - "clarity": Kejelasan pesan
   - "engagement": Potensi interaksi (komentar, shares, saves, likes)
   - "value": Manfaat nyata bagi audiens
   - "structure": Alur ide dan kerapian
   - "cta": Daya dorong ajakan bertindak
   - "platformFit": Tingkat kecocokan platform ${params.platform}
3. "summary": Ringkasan singkat 2-3 kalimat mengenai kualitas konten.
4. "strengths": Array berisi 2-4 poin kelebihan nyata.
5. "improvements": Array berisi 2-4 poin kelemahan nyata yang wajib diperbaiki.
6. "recommendations": Array berisi 3-5 langkah konkret untuk meningkatkan hasil.
7. "improvedVersion": Tuliskan versi draf yang telah disempurnakan.
8. "improvedVersionTitle": Judul deskriptif untuk versi yang disarankan.`;

  const systemInstruction = `Kamu adalah ARVIN AI, Content Quality Analyst & Creative Strategist di ARVIN STUDIO.
Analisis konten pengguna secara objektif, mendalam, dan konstruktif.
Respons HARUS dalam format JSON valid dengan skema:
{
  "overallScore": number,
  "metrics": {
    "hook": number,
    "clarity": number,
    "engagement": number,
    "value": number,
    "structure": number,
    "cta": number,
    "platformFit": number
  },
  "summary": string,
  "strengths": string[],
  "improvements": string[],
  "recommendations": string[],
  "improvedVersion": string,
  "improvedVersionTitle": string
}`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.3,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  const metrics = parsed?.metrics || {};
  const sanitizeScore = (v: any) => {
    const num = Number(v);
    return isNaN(num) ? 75 : Math.max(0, Math.min(100, Math.round(num)));
  };

  return {
    overallScore: sanitizeScore(parsed?.overallScore),
    metrics: {
      hook: sanitizeScore(metrics.hook),
      clarity: sanitizeScore(metrics.clarity),
      engagement: sanitizeScore(metrics.engagement),
      value: sanitizeScore(metrics.value),
      structure: sanitizeScore(metrics.structure),
      cta: sanitizeScore(metrics.cta),
      platformFit: sanitizeScore(metrics.platformFit),
    },
    summary: parsed?.summary || 'Konten telah dianalisis oleh ARVIN AI.',
    strengths: Array.isArray(parsed?.strengths) ? parsed.strengths : ['Ide konten sudah menarik.'],
    improvements: Array.isArray(parsed?.improvements) ? parsed.improvements : ['Tingkatkan kejelasan kalimat pembuka.'],
    recommendations: Array.isArray(parsed?.recommendations) ? parsed.recommendations : ['Tambahkan ajakan bertindak (CTA) yang lebih spesifik.'],
    improvedVersion: parsed?.improvedVersion || params.content.trim(),
    improvedVersionTitle: parsed?.improvedVersionTitle || `Versi ${params.contentType} yang Disempurnakan`,
    platform: params.platform,
    contentType: params.contentType,
    originalContent: params.content.trim(),
    analyzedAt: new Date().toISOString(),
  };
}

async function directClientGenerateIdeas(
  apiKey: string,
  params: GenerateIdeasParams
): Promise<ContentIdeaItem[]> {
  const safeCount = [5, 10, 15].includes(Number(params.count)) ? Number(params.count) : 5;
  const prompt = `Buatkan tepat ${safeCount} ide konten yang sangat relevan, tajam, dan menarik untuk content creator:
Niche / Topik: ${params.niche.trim()}
Target Audiens: ${params.targetAudience?.trim() || 'Audiens umum / creator'}
Platform: ${params.platform}
Tujuan Konten: ${params.goal}
Gaya Konten: ${params.style}

Setiap ide HARUS memiliki:
1. "id": ID unik singkat (misal: "idea-1", "idea-2", dst).
2. "title": Judul konten yang menarik dan jelas.
3. "hook": Kalimat pembuka 3 detik pertama yang memancing rasa penasaran.
4. "concept": Penjelasan konsep dan alur konten (2-3 kalimat).
5. "format": Format spesifik (Carousel, Video Pendek, dsb).
6. "targetAudience": Segmen audiens sasaran.
7. "cta": Call to action spesifik.
8. "potential": Alasan potensi daya tarik.
9. "executionTips": Tips praktis untuk eksekusi.`;

  const systemInstruction = `Kamu adalah AI Content Strategist profesional di ARVIN STUDIO.
Respons HARUS HANYA berupa JSON valid:
{
  "ideas": [
    {
      "id": string,
      "title": string,
      "hook": string,
      "concept": string,
      "format": string,
      "targetAudience": string,
      "cta": string,
      "potential": string,
      "executionTips": string
    }
  ]
}`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.7,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  let ideasArray: any[] = [];
  if (Array.isArray(parsed)) {
    ideasArray = parsed;
  } else if (Array.isArray(parsed?.ideas)) {
    ideasArray = parsed.ideas;
  }

  return ideasArray.map((item: any, idx: number) => ({
    id: item.id || `idea-${Date.now()}-${idx + 1}`,
    title: item.title || `Ide Konten #${idx + 1}`,
    hook: item.hook || 'Pernahkah kamu menyadari hal ini?',
    concept: item.concept || 'Konsep konten praktis untuk meningkatkan interaksi audiens.',
    format: item.format || (params.platform === 'TikTok' ? 'Short Video' : 'Carousel Post'),
    targetAudience: item.targetAudience || params.targetAudience || 'Audiens umum',
    cta: item.cta || 'Bagaimana pendapatmu? Tulis di komentar!',
    potential: item.potential || 'Engagement Tinggi',
    executionTips: item.executionTips || 'Gunakan teks di layar pada 3 detik awal.',
  }));
}

async function directClientRegenerateSingleIdea(
  apiKey: string,
  params: {
    niche: string;
    targetAudience?: string;
    platform: string;
    goal: string;
    style: string;
    currentTitle: string;
  }
): Promise<ContentIdeaItem> {
  const prompt = `Buatkan 1 ide konten alternatif yang BARU, SEGAR, dan BERBEDA untuk menggantikan ide sebelumnya ("${params.currentTitle}").
Spesifikasi:
Niche: ${params.niche.trim()}
Target Audiens: ${params.targetAudience?.trim() || 'Audiens umum'}
Platform: ${params.platform}
Tujuan: ${params.goal}
Gaya: ${params.style}`;

  const systemInstruction = `Kamu adalah AI Content Strategist profesional di ARVIN STUDIO.
Respons HARUS HANYA berupa JSON valid:
{
  "idea": {
    "id": string,
    "title": string,
    "hook": string,
    "concept": string,
    "format": string,
    "targetAudience": string,
    "cta": string,
    "potential": string,
    "executionTips": string
  }
}`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.8,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  const item = parsed?.idea || parsed || {};

  return {
    id: item.id || `idea-${Date.now()}`,
    title: item.title || `Ide Alternatif ${params.niche}`,
    hook: item.hook || 'Ini cara baru yang belum banyak dicoba.',
    concept: item.concept || 'Konsep segar untuk audiens.',
    format: item.format || 'Short Video',
    targetAudience: item.targetAudience || params.targetAudience || 'Audiens umum',
    cta: item.cta || 'Simpan konten ini agar tidak lupa!',
    potential: item.potential || 'Viral Potensial',
    executionTips: item.executionTips || 'Mulai dengan ekspresi penasaran di 3 detik awal.',
  };
}

async function directClientGenerateCaptions(
  apiKey: string,
  params: GenerateCaptionParams & { regenerateCount?: number }
): Promise<GenerateCaptionResult> {
  const prompt = `Buatkan 3 varian caption media sosial berkualitas tinggi untuk konten berikut:
Konteks / Tentang Konten:
"""
${params.content.trim()}
"""
Platform: ${params.platform}
Gaya: ${params.style}
Tujuan: ${params.goal}
Bahasa: ${params.language}
${params.regenerateCount ? `(Regenerasi iterasi #${params.regenerateCount})` : ''}

Ketentuan Khusus:
1. Buat tepat 3 varian: Direct & Catchy, Storytelling, dan Engagement.
2. Jangan menaruh hashtag di badan caption, taruh hanya di array hashtags.`;

  const systemInstruction = `Kamu adalah ARVIN AI, AI Social Media Copywriter profesional di ARVIN STUDIO.
Format respons HARUS berupa JSON valid:
{
  "variants": [
    { "id": "variant-1", "name": "Direct & Catchy", "description": "Langsung menarik perhatian", "caption": "string" },
    { "id": "variant-2", "name": "Storytelling", "description": "Pendekatan cerita dan emosional", "caption": "string" },
    { "id": "variant-3", "name": "Engagement", "description": "Mendorong audiens berinteraksi", "caption": "string" }
  ],
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.75,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  const variants = Array.isArray(parsed?.variants) ? parsed.variants : [];
  const defaultNames = ['Direct & Catchy', 'Storytelling', 'Engagement'];
  const defaultDescs = ['Langsung menarik perhatian', 'Pendekatan cerita dan emosional', 'Mendorong audiens berinteraksi'];

  const sanitizedVariants = (variants.length > 0 ? variants : [
    { id: 'variant-1', name: 'Direct & Catchy', description: 'Langsung menarik perhatian', caption: params.content.trim() },
    { id: 'variant-2', name: 'Storytelling', description: 'Pendekatan cerita dan emosional', caption: params.content.trim() },
    { id: 'variant-3', name: 'Engagement', description: 'Mendorong audiens berinteraksi', caption: `${params.content.trim()}\n\nBagaimana menurutmu? Tulis di komentar!` },
  ]).slice(0, 3).map((v: any, idx: number) => ({
    id: v.id || `variant-${idx + 1}`,
    name: v.name || defaultNames[idx] || `Varian ${idx + 1}`,
    description: v.description || defaultDescs[idx] || '',
    caption: String(v.caption || '').trim(),
  }));

  const hashtags = Array.isArray(parsed?.hashtags)
    ? parsed.hashtags.map((h: any) => String(h).trim()).filter(Boolean).map((h: string) => (h.startsWith('#') ? h : `#${h}`))
    : [`#${params.platform.toLowerCase()}`, '#kontenkreatif', '#creator'];

  return {
    variants: sanitizedVariants,
    hashtags,
    platform: params.platform,
    generatedAt: new Date().toISOString(),
  };
}

async function directClientGenerateHooks(
  apiKey: string,
  params: GenerateHooksParams & { regenerateCount?: number }
): Promise<GenerateHooksResult> {
  const requestedCount = Math.min(Math.max(Number(params.count) || 10, 5), 20);
  const prompt = `Buatkan ${requestedCount} variasi hook pembuka 3 detik pertama yang sangat mematikan dan efektif menghentikan scroll untuk konten:
Topik: ${params.topic.trim()}
Platform: ${params.platform}
Gaya Utama: ${params.style}
Target Audiens: ${params.targetAudience || 'Audiens umum'}
Tujuan: ${params.goal}
${params.regenerateCount ? `(Iterasi ke-${params.regenerateCount})` : ''}

Ketentuan:
1. Hook harus singkat, padat, dan membuat audiens berhenti scroll di layar hp dalam 1-3 detik.
2. Hindari klise seperti "Jangan scroll!".
3. Berikan skor (80-99) dan alasan pemilihannya.
4. Pilih 3 hook terbaik dalam array topHooks.`;

  const systemInstruction = `Kamu adalah Viral Content Hook Strategist di ARVIN STUDIO.
Respons HARUS HANYA berupa JSON valid:
{
  "hooks": [
    { "id": "hook-1", "text": "string", "category": "string", "score": 95, "reason": "string" }
  ],
  "topHooks": [
    { "text": "string", "reason": "string" }
  ]
}`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.8,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  const hooks = Array.isArray(parsed?.hooks) ? parsed.hooks : [];
  const sanitizedHooks = hooks.map((h: any, idx: number) => ({
    id: h.id || `hook-${idx + 1}`,
    text: String(h.text || `Hook #${idx + 1}`).trim(),
    category: h.category || params.style,
    score: Number(h.score) || 90,
    reason: h.reason || 'Memancing rasa penasaran audiens dalam 3 detik awal.',
  }));

  const topHooks = Array.isArray(parsed?.topHooks) && parsed.topHooks.length > 0
    ? parsed.topHooks.map((th: any) => ({ text: String(th.text || ''), reason: String(th.reason || '') }))
    : sanitizedHooks.slice(0, 3).map((h: any) => ({ text: h.text, reason: h.reason }));

  return {
    hooks: sanitizedHooks,
    topHooks,
    platform: params.platform,
    topic: params.topic.trim(),
    generatedAt: new Date().toISOString(),
  };
}

async function directClientGenerateScript(
  apiKey: string,
  params: GenerateScriptParams & { regenerateCount?: number }
): Promise<GenerateScriptResult> {
  const prompt = `Buatkan script konten dengan parameter berikut:
Topik / Isi: "${params.topic.trim()}"
Platform: ${params.platform}
Durasi: ${params.duration}
Gaya: ${params.style}
Gunakan Hook: ${params.useHook ? 'YA' : 'TIDAK'}
Target Audiens: ${params.targetAudience || 'Audiens umum'}
Tujuan: ${params.goal}

Format JSON:
{
  "title": "string",
  "hook": "string",
  "opening": "string",
  "body": "string",
  "scenes": [
    { "sceneNumber": 1, "timeRange": "0:00–0:03", "visual": "string", "voiceOver": "string", "textOverlay": "string" }
  ],
  "cta": "string",
  "ending": "string",
  "score": 92,
  "scoreReason": "string"
}`;

  const systemInstruction = `Kamu adalah Lead Scriptwriter & Video Director di ARVIN STUDIO.
Respons HARUS HANYA berupa JSON valid tanpa markdown.`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.85,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  const title = String(parsed?.title || `Script ${params.platform} - ${params.topic.slice(0, 30)}`).trim();
  const hook = params.useHook ? String(parsed?.hook || '').trim() : '';
  const opening = String(parsed?.opening || '').trim();
  const body = String(parsed?.body || params.topic).trim();
  const cta = String(parsed?.cta || 'Ikuti akun ini untuk tips berikutnya!').trim();
  const ending = String(parsed?.ending || 'Sampai jumpa di video selanjutnya.').trim();
  const score = Number(parsed?.score) || 90;
  const scoreReason = String(parsed?.scoreReason || 'Naskah terstruktur dan siap dieksekusi.');

  const scenes = Array.isArray(parsed?.scenes) ? parsed.scenes.map((s: any, idx: number) => ({
    sceneNumber: Number(s.sceneNumber) || idx + 1,
    timeRange: String(s.timeRange || `0:0${idx * 3}–0:0${(idx + 1) * 3}`),
    visual: String(s.visual || 'Kamera menyorot presenter'),
    voiceOver: String(s.voiceOver || ''),
    textOverlay: String(s.textOverlay || ''),
  })) : [
    { sceneNumber: 1, timeRange: '0:00–0:03', visual: 'Close-up presenter', voiceOver: hook || body.slice(0, 50), textOverlay: 'Wajib Tahu!' },
    { sceneNumber: 2, timeRange: '0:03–0:15', visual: 'Screen share / B-roll penjelasan', voiceOver: body, textOverlay: 'Tips Utama' },
    { sceneNumber: 3, timeRange: '0:15–0:20', visual: 'Presenter tersenyum', voiceOver: cta, textOverlay: 'Komen di Bawah 👇' },
  ];

  return {
    title,
    hook,
    opening,
    body,
    scenes,
    cta,
    ending,
    score,
    scoreReason,
    platform: params.platform,
    duration: params.duration,
    topic: params.topic.trim(),
    generatedAt: new Date().toISOString(),
  };
}

async function directClientGenerateHashtags(
  apiKey: string,
  params: GenerateHashtagsParams & { regenerateCount?: number }
): Promise<GenerateHashtagsResult> {
  const requestedCount = [5, 10, 15, 20, 30].includes(Number(params.count)) ? Number(params.count) : 15;
  const prompt = `Hasilkan ${requestedCount} hashtag untuk konten:
Topik: "${params.topic.trim()}"
Platform: ${params.platform}
Niche: ${params.niche || 'Sesuai topik'}
Target Audiens: ${params.targetAudience || 'Audiens umum'}
Tujuan: ${params.goal}

Format JSON:
{
  "recommendation": "string",
  "hashtags": [
    { "tag": "#TagCamelCase", "category": "Broad" | "Niche" | "Target Audience" | "Intent", "relevance": 95, "reason": "string" }
  ]
}`;

  const systemInstruction = `Kamu adalah Social Media Growth Strategist di ARVIN STUDIO.
Respons HARUS HANYA berupa JSON valid tanpa markdown.`;

  const rawJsonText = await directClientGenerate(apiKey, prompt, systemInstruction, {
    temperature: 0.7,
    responseMimeType: 'application/json',
  });

  const parsed = safeJsonParse<any>(rawJsonText);
  const recommendation = String(parsed?.recommendation || `Kombinasi hashtag optimal untuk meningkatkan jangkauan di ${params.platform}.`);
  const rawList = Array.isArray(parsed?.hashtags) ? parsed.hashtags : [];

  const hashtags = rawList.map((h: any, idx: number) => {
    const rawTag = String(h.tag || `#hashtag${idx + 1}`).trim();
    const tag = rawTag.startsWith('#') ? rawTag : `#${rawTag}`;
    return {
      tag,
      category: (h.category as any) || 'Niche',
      relevance: Number(h.relevance) || 90,
      reason: String(h.reason || 'Relevan dengan topik dan target audiens konten.'),
    };
  });

  return {
    recommendation,
    hashtags: hashtags.length > 0 ? hashtags : [
      { tag: `#${params.platform.toLowerCase()}`, category: 'Broad', relevance: 95, reason: 'Kategori platform utama.' },
      { tag: '#kontenkreatif', category: 'Niche', relevance: 92, reason: 'Komunitas kreator konten.' },
    ],
    platform: params.platform,
    topic: params.topic.trim(),
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// PUBLIC API SERVICE METHODS (Dual-Layer: Server First + Client Fallback)
// ---------------------------------------------------------------------------

/**
 * Send chat message using ARVIN AI (Gemini)
 */
export async function sendChatMessage(
  messages: Array<Pick<ChatMessage, 'role' | 'text'>>
): Promise<string> {
  const headers = await getAuthHeaders();

  const payloadMessages = messages.map((m) => ({
    role: m.role,
    text: m.text,
    content: m.text,
  }));

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
      console.warn(`[ARVIN AI] Server /api/chat error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
      const effectiveKey = await getEffectiveApiKey();
      if (effectiveKey) {
        return await directClientGeminiChat(effectiveKey, messages);
      }
      throw new Error(`Layanan AI tidak dapat diakses (Status ${response.status}).`);
    }
  } catch (error: any) {
    console.warn('[ARVIN AI] Server /api/chat tidak dapat dihubungi. Mengaktifkan fallback langsung Gemini SDK...');
    try {
      const effectiveKey = await getEffectiveApiKey();
      if (effectiveKey) {
        return await directClientGeminiChat(effectiveKey, messages);
      }
    } catch (clientErr: any) {
      throw new Error(clientErr?.message || 'Gagal menghubungi Gemini AI.');
    }

    throw new Error('Koneksi AI Terputus. Periksa API Key Gemini Anda di System Settings atau coba beberapa saat lagi.');
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
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const result: ContentAnalysisResult = await response.json();
      return result;
    }

    console.warn(`[ARVIN AI] Server /api/analyze error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/analyze gagal dihubungi. Mengaktifkan fallback langsung Gemini SDK...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientAnalyzeContent(effectiveKey, params);
    } catch (clientErr: any) {
      console.error('[ARVIN AI] Direct client analyzeContent error:', clientErr);
      throw new Error(clientErr?.message || 'ARVIN AI tidak dapat melakukan analisis saat ini. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi. Silakan simpan API Key di menu System Settings (Admin) atau Pengaturan Akun.');
}

/**
 * Generate Content Ideas using ARVIN AI (Gemini)
 */
export async function generateContentIdeas(
  params: GenerateIdeasParams
): Promise<ContentIdeaItem[]> {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/ideas', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.ideas && Array.isArray(data.ideas) && data.ideas.length > 0) {
        return data.ideas;
      }
    }

    console.warn(`[ARVIN AI] Server /api/ideas error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/ideas gagal dihubungi. Mengaktifkan fallback langsung Gemini SDK...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientGenerateIdeas(effectiveKey, params);
    } catch (clientErr: any) {
      console.error('[ARVIN AI] Direct client generateContentIdeas error:', clientErr);
      throw new Error(clientErr?.message || 'Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi. Silakan simpan API Key di menu System Settings (Admin) atau Pengaturan Akun.');
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
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/ideas/regenerate-single', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.idea) {
        return data.idea;
      }
    }

    console.warn(`[ARVIN AI] Server /api/ideas/regenerate-single error. Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/ideas/regenerate-single gagal dihubungi. Mengaktifkan fallback langsung...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientRegenerateSingleIdea(effectiveKey, params);
    } catch (clientErr: any) {
      throw new Error(clientErr?.message || 'Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi.');
}

/**
 * Generate Captions using ARVIN AI (Gemini)
 */
export async function generateCaptions(
  params: GenerateCaptionParams & { regenerateCount?: number }
): Promise<GenerateCaptionResult> {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/captions', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.variants && Array.isArray(data.variants) && data.variants.length > 0) {
        return data as GenerateCaptionResult;
      }
    }

    console.warn(`[ARVIN AI] Server /api/captions error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/captions gagal dihubungi. Mengaktifkan fallback langsung Gemini SDK...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientGenerateCaptions(effectiveKey, params);
    } catch (clientErr: any) {
      console.error('[ARVIN AI] Direct client generateCaptions error:', clientErr);
      throw new Error(clientErr?.message || 'Maaf, caption belum berhasil dibuat. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi. Silakan simpan API Key di menu System Settings (Admin) atau Pengaturan Akun.');
}

/**
 * Generate Viral Hooks using ARVIN AI (Gemini)
 */
export async function generateHooks(
  params: GenerateHooksParams & { regenerateCount?: number }
): Promise<GenerateHooksResult> {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/hooks', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.hooks && Array.isArray(data.hooks) && data.hooks.length > 0) {
        return data as GenerateHooksResult;
      }
    }

    console.warn(`[ARVIN AI] Server /api/hooks error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/hooks gagal dihubungi. Mengaktifkan fallback langsung Gemini SDK...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientGenerateHooks(effectiveKey, params);
    } catch (clientErr: any) {
      console.error('[ARVIN AI] Direct client generateHooks error:', clientErr);
      throw new Error(clientErr?.message || 'Maaf, hook belum berhasil dibuat. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi. Silakan simpan API Key di menu System Settings (Admin) atau Pengaturan Akun.');
}

/**
 * Generate Structured Script using ARVIN AI (Gemini)
 */
export async function generateScript(
  params: GenerateScriptParams & { regenerateCount?: number }
): Promise<GenerateScriptResult> {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/scripts', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.title && data.body) {
        return data as GenerateScriptResult;
      }
    }

    console.warn(`[ARVIN AI] Server /api/scripts error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/scripts gagal dihubungi. Mengaktifkan fallback langsung Gemini SDK...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientGenerateScript(effectiveKey, params);
    } catch (clientErr: any) {
      console.error('[ARVIN AI] Direct client generateScript error:', clientErr);
      throw new Error(clientErr?.message || 'Maaf, permintaan belum berhasil diproses. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi. Silakan simpan API Key di menu System Settings (Admin) atau Pengaturan Akun.');
}

/**
 * Generate Targeted Hashtags using ARVIN AI (Gemini)
 */
export async function generateHashtags(
  params: GenerateHashtagsParams & { regenerateCount?: number }
): Promise<GenerateHashtagsResult> {
  const headers = await getAuthHeaders();

  try {
    const response = await fetch('/api/hashtags', {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.hashtags && Array.isArray(data.hashtags) && data.hashtags.length > 0) {
        return data as GenerateHashtagsResult;
      }
    }

    console.warn(`[ARVIN AI] Server /api/hashtags error (status ${response.status}). Mengaktifkan fallback langsung Gemini SDK...`);
  } catch (fetchErr) {
    console.warn('[ARVIN AI] Server /api/hashtags gagal dihubungi. Mengaktifkan fallback langsung Gemini SDK...', fetchErr);
  }

  // Client-side direct fallback
  const effectiveKey = await getEffectiveApiKey();
  if (effectiveKey) {
    try {
      return await directClientGenerateHashtags(effectiveKey, params);
    } catch (clientErr: any) {
      console.error('[ARVIN AI] Direct client generateHashtags error:', clientErr);
      throw new Error(clientErr?.message || 'Maaf, permintaan belum berhasil diproses. Silakan coba lagi.');
    }
  }

  throw new Error('Kunci API Gemini belum dikonfigurasi. Silakan simpan API Key di menu System Settings (Admin) atau Pengaturan Akun.');
}
