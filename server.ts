import express, { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS headers for all incoming requests and preflight OPTIONS handling
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-gemini-api-key");
  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }
  next();
});

// Normalize request URL for Vercel rewrites (e.g. if Vercel strips /api prefix)
app.use((req, _res, next) => {
  if (req.url && !req.url.startsWith("/api") && !req.url.startsWith("/@") && !req.url.startsWith("/src") && !req.url.startsWith("/node_modules")) {
    const original = req.url;
    // Only prepend /api for known api subroutes
    const apiRoutes = [
      "/chat", "/analyze", "/ideas", "/captions", "/hooks", "/scripts",
      "/hashtags", "/content-plans", "/ai-usage", "/history", "/analytics",
      "/account", "/subscription", "/credits", "/usage-limit", "/auth", "/health"
    ];
    if (apiRoutes.some((r) => original.startsWith(r))) {
      req.url = "/api" + original;
    }
  }
  next();
});

// Persistent Firestore Collections Store
const isVercel = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dataDir = isVercel ? path.join("/tmp", "arvin_data") : path.join(process.cwd(), "data");
const DB_FILE_PATH = path.join(dataDir, "firestore_db.json");

interface FirestoreMockDb {
  content_plans: Record<string, any>;
  ai_usage: Record<string, any>;
  ai_history: Record<string, any>;
  users: Record<string, any>;
  subscriptions: Record<string, any>;
  credit_transactions: Record<string, any>;
  daily_usage: Record<string, any>;
}

const DEFAULT_CREATOR_UID = "usr_agnesya_creator";
const DEFAULT_CREATOR_EMAIL = "id.agnesyakartika@gmail.com";

let inMemoryDbCache: FirestoreMockDb | null = null;

function getDatabase(): FirestoreMockDb {
  if (inMemoryDbCache) {
    return inMemoryDbCache;
  }
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    let db: FirestoreMockDb;
    if (!fs.existsSync(DB_FILE_PATH)) {
      db = {
        content_plans: {},
        ai_usage: {},
        ai_history: {},
        users: {},
        subscriptions: {},
        credit_transactions: {},
        daily_usage: {},
      };
    } else {
      const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      db = {
        content_plans: parsed.content_plans || {},
        ai_usage: parsed.ai_usage || {},
        ai_history: parsed.ai_history || {},
        users: parsed.users || {},
        subscriptions: parsed.subscriptions || {},
        credit_transactions: parsed.credit_transactions || {},
        daily_usage: parsed.daily_usage || {},
      };
    }

    // Ensure default user exists if users collection does not have it
    if (!db.users[DEFAULT_CREATOR_UID]) {
      const now = new Date().toISOString();
      db.users[DEFAULT_CREATOR_UID] = {
        id: DEFAULT_CREATOR_UID,
        email: DEFAULT_CREATOR_EMAIL,
        displayName: "Agnesya Kartika",
        username: "agnesyakartika",
        photoURL: "",
        bio: "Content Creator & Digital Strategist",
        credits: 5,
        createdAt: now,
        updatedAt: now,
      };

      db.subscriptions[`sub_${DEFAULT_CREATOR_UID}`] = {
        id: `sub_${DEFAULT_CREATOR_UID}`,
        userId: DEFAULT_CREATOR_UID,
        plan: "FREE",
        status: "FREE",
        startDate: now,
        endDate: null,
        createdAt: now,
        updatedAt: now,
      };

      db.credit_transactions[`tx_welcome_${DEFAULT_CREATOR_UID}`] = {
        id: `tx_welcome_${DEFAULT_CREATOR_UID}`,
        userId: DEFAULT_CREATOR_UID,
        type: "BONUS",
        amount: 5,
        feature: "Bonus Registrasi Akun",
        description: "Selamat datang di ARVIN STUDIO! 5 kredit awal akun kreator.",
        createdAt: now,
      };

      saveDatabase(db);
    }

    return db;
  } catch (err) {
    console.error("[Firestore DB] Error reading DB file:", err);
    return {
      content_plans: {},
      ai_usage: {},
      ai_history: {},
      users: {},
      subscriptions: {},
      credit_transactions: {},
      daily_usage: {},
    };
  }
}

function saveDatabase(db: FirestoreMockDb) {
  inMemoryDbCache = db;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.warn("[Firestore DB] Warning writing DB file (using in-memory cache):", err);
  }
}

function logAiUsage(userId: string, feature: string) {
  if (!userId || !feature) return;
  try {
    const db = getDatabase();
    const id = `usage_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.ai_usage[id] = {
      id,
      userId,
      feature,
      createdAt: new Date().toISOString(),
    };
    saveDatabase(db);
  } catch (err) {
    console.warn("[Firestore DB] Failed to log AI usage:", err);
  }
}

function logAiHistory(
  userId: string,
  feature: string,
  title: string,
  inputSummary: string,
  result: string
) {
  if (!userId || !feature || !title) return;
  try {
    const db = getDatabase();
    const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.ai_history[id] = {
      id,
      userId,
      feature,
      title,
      inputSummary,
      result,
      createdAt: new Date().toISOString(),
    };
    saveDatabase(db);
  } catch (err) {
    console.warn("[Firestore DB] Failed to log AI history:", err);
  }
}

// Initialize Gemini SDK with User-Agent telemetry
function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey && customApiKey.trim()) || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY belum dikonfigurasi di server. Silakan atur GEMINI_API_KEY di Environment Variables Vercel agar aplikasi bekerja otomatis untuk semua pengunjung, atau masukkan API Key sementara melalui menu aplikasi."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function getClientApiKey(req: Request): string | undefined {
  const headerKey = req.headers["x-gemini-api-key"] as string;
  if (headerKey && headerKey.trim()) return headerKey.trim();
  const auth = req.headers.authorization;
  if (auth && auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.substring(7).trim();
    if (token.length > 10) return token;
  }
  return undefined;
}

/**
 * Safely parse JSON strings returned by LLMs, handling:
 * - Markdown fences (```json ... ```)
 * - Trailing commentary/notes after the JSON closing brace (e.g. line 170 column 1)
 * - Trailing commas before } or ]
 * - Direct array vs { key: [...] } structures
 */
function safeJsonParse<T = any>(rawText: string): T {
  const trimmed = rawText.trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Extract from markdown code fence
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    const codeBlockContent = codeBlockMatch[1].trim();
    try {
      return JSON.parse(codeBlockContent);
    } catch {
      try {
        const cleaned = codeBlockContent.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  // 3. Slice outermost object {...} - completely ignores any trailing commentary after }
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const cleaned = candidate.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  // 4. Slice outermost array [...]
  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = trimmed.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      try {
        const cleaned = candidate.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(cleaned);
      } catch {}
    }
  }

  // 5. Fallback with global backtick removal
  const cleanedText = trimmed.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
  const cFirstBrace = cleanedText.indexOf("{");
  const cLastBrace = cleanedText.lastIndexOf("}");
  if (cFirstBrace !== -1 && cLastBrace > cFirstBrace) {
    const candidate = cleanedText.substring(cFirstBrace, cLastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      const fixed = candidate.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(fixed);
    }
  }

  return JSON.parse(cleanedText);
}

/**
 * Robust fallback scanner that extracts individual JSON objects from a text stream
 * even if the overarching array or wrapper object was incomplete or malformed.
 */
function extractObjectsFromStream(str: string): any[] {
  const objects: any[] = [];
  let depth = 0;
  let startIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === "\\") {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{") {
      if (depth === 0) startIndex = i;
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0 && startIndex !== -1) {
        const objStr = str.substring(startIndex, i + 1);
        try {
          const parsed = JSON.parse(objStr);
          if (parsed && typeof parsed === "object") {
            objects.push(parsed);
          }
        } catch {
          try {
            const cleaned = objStr.replace(/,\s*([}\]])/g, "$1");
            const parsed = JSON.parse(cleaned);
            if (parsed && typeof parsed === "object") {
              objects.push(parsed);
            }
          } catch {}
        }
        startIndex = -1;
      }
    }
  }
  return objects;
}

const SYSTEM_INSTRUCTION = `Kamu adalah ARVIN AI, AI assistant dan creative strategist utama di dalam ARVIN STUDIO — AI-powered workspace khusus untuk content creator (TikTok, Instagram Reels, YouTube Shorts & Long-form, LinkedIn, X, dll).

Tugas utamamu:
1. Memberikan ide konten yang kreatif, segar, relevan dengan tren, dan berpotensi viral (high engagement).
2. Menyusun strategi konten menyeluruh (pilar konten, jadwal posting, target audiens, content funnel awareness-consideration-conversion).
3. Menulis hook kuat untuk 3 detik pertama video yang menghentikan scroll audiens.
4. Menulis script/naskah video yang terstruktur (Hook, Problem/Story, Value/Solution, Call-to-Action) lengkap dengan arahan visual (B-roll, ekspresi, text on screen).
5. Menulis caption yang menarik dan persuasif beserta variasi CTA.
6. Menganalisis kelebihan, kekurangan, dan potensi optimasi dari draf konten pengguna.
7. Rekomendasi hashtag tertarget dan tips algoritma platform terkini.

Gaya Komunikasi:
- Berbahasa Indonesia yang profesional, ramah, kreatif, energik, dan langsung ke inti solusi (actionable).
- Gunakan pemformatan teks yang rapi (headings, poin-poin tebal, langkah terurut, atau tabel jika relevan) agar sangat mudah dibaca oleh creator.
- Selalu dukung creator untuk terus berkembang dan bereksperimen.`;

// Candidate models in priority order:
// Supports both public Google AI Studio keys and AI Studio runtime
const CANDIDATE_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
  "gemini-3.8-flash",
];

interface GenerateAIOptions {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
  endpointName?: string;
}

/**
 * Resilient AI content generator that handles 503 unavailable, 429 rate limit,
 * and high-demand spikes with retry delays and smooth model fallbacks.
 */
async function generateAIContentWithFallback(
  ai: ReturnType<typeof getGeminiClient>,
  options: GenerateAIOptions
): Promise<string> {
  const {
    contents,
    systemInstruction,
    responseMimeType,
    temperature = 0.7,
    maxOutputTokens,
    endpointName = "api",
  } = options;

  let lastError: any = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: any = { temperature };
        if (systemInstruction) config.systemInstruction = systemInstruction;
        if (responseMimeType) config.responseMimeType = responseMimeType;
        if (typeof maxOutputTokens === "number") config.maxOutputTokens = maxOutputTokens;

        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config,
        });

        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errString = String(err?.message || err);
        const is503 =
          err?.status === 503 ||
          err?.code === 503 ||
          errString.includes("503") ||
          errString.includes("high demand") ||
          errString.includes("UNAVAILABLE");
        const is429 =
          err?.status === 429 ||
          err?.code === 429 ||
          errString.includes("429") ||
          errString.includes("RESOURCE_EXHAUSTED");

        console.warn(
          `[ARVIN AI] Model ${modelName} (${endpointName}) attempt ${attempt + 1} notice: ${
            is503 ? "503 High Demand" : is429 ? "429 Rate Limit" : errString.slice(0, 100)
          }`
        );

        if ((is503 || is429) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        break;
      }
    }
  }

  const lastErrString = String(lastError?.message || lastError);
  if (
    lastError?.status === 503 ||
    lastError?.code === 503 ||
    lastErrString.includes("503") ||
    lastErrString.includes("high demand") ||
    lastErrString.includes("UNAVAILABLE")
  ) {
    const highDemandError: any = new Error(
      "Layanan AI sedang mengalami lonjakan trafik tinggi sementara. Silakan coba kembali sesaat lagi."
    );
    highDemandError.status = 503;
    throw highDemandError;
  }

  throw lastError || new Error("Semua model AI sedang sibuk. Silakan coba beberapa saat lagi.");
}

// API routes
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", app: "ARVIN STUDIO", timestamp: new Date().toISOString() });
});

interface ChatMessagePayload {
  role: "user" | "model" | "assistant";
  text?: string;
  content?: string;
}

app.post("/api/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages } = req.body as { messages?: ChatMessagePayload[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Pesan tidak boleh kosong." });
      return;
    }

    const ai = getGeminiClient(getClientApiKey(req));

    // Clean and normalize messages
    const validMessages: Array<{ role: "user" | "model"; text: string }> = [];
    for (const msg of messages) {
      if (!msg) continue;
      const text = (msg.text ?? msg.content ?? "").trim();
      if (!text) continue;
      const role = (msg.role === "assistant" || msg.role === "model") ? "model" : "user";
      
      // If consecutive messages have the same role, merge their content to keep Gemini alternation valid
      if (validMessages.length > 0 && validMessages[validMessages.length - 1].role === role) {
        validMessages[validMessages.length - 1].text += `\n\n${text}`;
      } else {
        validMessages.push({ role, text });
      }
    }

    // Ensure conversation starts with 'user'
    while (validMessages.length > 0 && validMessages[0].role !== "user") {
      validMessages.shift();
    }

    if (validMessages.length === 0) {
      res.status(400).json({ error: "Pesan tidak boleh kosong." });
      return;
    }

    // Map conversation history to Gemini contents format
    const contents = validMessages.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.text }],
    }));

    const replyText = await generateAIContentWithFallback(ai, {
      contents,
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      endpointName: "/api/chat",
    });

    res.json({
      reply: replyText,
      content: replyText,
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/chat:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Terjadi masalah saat menghubungkan ke ARVIN AI. Silakan coba lagi.",
    });
  }
});

app.post("/api/analyze", async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, platform = "Umum", contentType = "Konten Umum" } = req.body as {
      content?: string;
      platform?: string;
      contentType?: string;
    };

    if (!content || !content.trim()) {
      res.status(400).json({ error: "Masukkan konten terlebih dahulu." });
      return;
    }

    const ai = getGeminiClient(getClientApiKey(req));

    const prompt = `Lakukan analisis mendalam terhadap konten berikut:
Platform Target: ${platform}
Jenis Konten: ${contentType}

Draf Konten Pengguna:
"""
${content.trim()}
"""

Panduan Analisis:
1. "overallScore": Skor kualitas total konten (skala integer 0-100).
2. "metrics": Skor untuk setiap 7 kategori (skala integer 0-100), nilailah secara spesifik sesuai draf konten dan jangan disamakan:
   - "hook": Kekuatan hook atau kalimat pembuka dalam memikat perhatian.
   - "clarity": Kejelasan pesan dan kemudahan dipahami oleh audiens.
   - "engagement": Potensi memicu interaksi (komentar, shares, saves, likes).
   - "value": Manfaat nyata, edukasi, atau emosi yang dirasakan audiens.
   - "structure": Kerapian tata letak, alur, pembagian paragraf, dan alur ide.
   - "cta": Daya dorong ajakan bertindak (Call to Action).
   - "platformFit": Tingkat kecocokan format, gaya bahasa, dan dinamika platform ${platform}.
3. "summary": Ringkasan singkat 2-3 kalimat mengenai kualitas konten yang mudah dipahami kreator pemula.
4. "strengths": Array berisi 2-4 poin kelebihan nyata dari draf ini.
5. "improvements": Array berisi 2-4 poin kelemahan nyata yang wajib diperbaiki (bukan kalimat generik).
6. "recommendations": Array berisi 3-5 langkah konkret dan praktis dari ARVIN AI untuk meningkatkan hasil konten.
7. "improvedVersion": Tuliskan versi draf yang telah disempurnakan (Improved ${contentType}) dengan memperbaiki kelemahan tanpa mengubah inti pesan pengguna.
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

    const rawJsonText = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 8192,
      endpointName: "/api/analyze",
    });

    let parsedData: any;
    try {
      parsedData = safeJsonParse(rawJsonText);
    } catch {
      const scanned = extractObjectsFromStream(rawJsonText);
      parsedData = scanned[0] || {};
    }

    // Ensure fallback metric fields exist and are within 0-100
    const metrics = parsedData.metrics || {};
    const sanitizeScore = (v: any) => {
      const num = Number(v);
      return isNaN(num) ? 75 : Math.max(0, Math.min(100, Math.round(num)));
    };

    res.json({
      overallScore: sanitizeScore(parsedData.overallScore),
      metrics: {
        hook: sanitizeScore(metrics.hook),
        clarity: sanitizeScore(metrics.clarity),
        engagement: sanitizeScore(metrics.engagement),
        value: sanitizeScore(metrics.value),
        structure: sanitizeScore(metrics.structure),
        cta: sanitizeScore(metrics.cta),
        platformFit: sanitizeScore(metrics.platformFit),
      },
      summary: parsedData.summary || "Konten telah dianalisis oleh ARVIN AI.",
      strengths: Array.isArray(parsedData.strengths) ? parsedData.strengths : [],
      improvements: Array.isArray(parsedData.improvements) ? parsedData.improvements : [],
      recommendations: Array.isArray(parsedData.recommendations) ? parsedData.recommendations : [],
      improvedVersion: parsedData.improvedVersion || content.trim(),
      improvedVersionTitle: parsedData.improvedVersionTitle || `Versi ${contentType} yang Disempurnakan`,
      platform,
      contentType,
      originalContent: content.trim(),
      analyzedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/analyze:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "ARVIN AI tidak dapat melakukan analisis saat ini. Silakan coba lagi.",
    });
  }
});

// Endpoint: Generate Content Ideas
app.post("/api/ideas", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      niche,
      targetAudience = "Audiens umum",
      platform = "Instagram",
      goal = "Meningkatkan Engagement",
      style = "Edukatif",
      count = 5,
      excludeTitles = [],
    } = req.body as {
      niche?: string;
      targetAudience?: string;
      platform?: string;
      goal?: string;
      style?: string;
      count?: number;
      excludeTitles?: string[];
    };

    if (!niche || !niche.trim()) {
      res.status(400).json({ error: "Silakan isi niche atau topik terlebih dahulu." });
      return;
    }

    const safeCount = [5, 10, 15].includes(Number(count)) ? Number(count) : 5;
    const ai = getGeminiClient(getClientApiKey(req));

    let excludeClause = "";
    if (Array.isArray(excludeTitles) && excludeTitles.length > 0) {
      excludeClause = `\nJangan mengulang ide atau judul yang mirip dengan yang sudah ada: ${excludeTitles.slice(0, 10).join("; ")}.`;
    }

    const prompt = `Buatkan tepat ${safeCount} ide konten yang sangat relevan, tajam, dan menarik untuk content creator dengan spesifikasi berikut:

Niche / Topik: ${niche.trim()}
Target Audiens: ${targetAudience.trim() || "Audiens umum / creator"}
Platform: ${platform}
Tujuan Konten: ${goal}
Gaya Konten: ${style}${excludeClause}

Instruksi Tambahan:
- Buat ide yang segar, tidak klise, dan siap dieksekusi.
- Sesuaikan format dengan platform ${platform}:
  * Jika TikTok: utamakan video pendek dengan visual hook menghentikan scroll dan retensi tinggi.
  * Jika Instagram: kombinasikan format Reels, Carousel edukatif/storytelling, atau Single Post.
  * Jika YouTube: utamakan format video (Shorts atau Long-form) dengan judul berpotensi click-through rate (CTR) tinggi dan konsep yang menahan watch-time.
  * Jika Facebook: utamakan format diskusi komunitas, pertanyaan pemantik, atau cerita yang memicu sharing.
  * Jika LinkedIn: gunakan pendekatan profesional, insight industri, atau thought leadership.
  * Jika X: format ringkas, thread berbobot, atau opini tajam yang memicu retweet/komentar.
  * Jika Semua Platform: buat format yang adaptif dan multi-channel.
- Setiap ide HARUS memiliki:
  1. "id": ID unik singkat (misal: "idea-1", "idea-2", dst).
  2. "title": Judul konten yang menarik dan jelas.
  3. "hook": Kalimat pembuka / visual hook 3 detik pertama yang memancing rasa penasaran audiens.
  4. "concept": Penjelasan konsep dan alur konten secara singkat namun padat (2-3 kalimat).
  5. "format": Format spesifik (misal: Carousel 5 Slide, Video Pendek 30s, Thread 4 Tweet, Reels Edukasi, dsb).
  6. "targetAudience": Segmen audiens yang paling tertarik dengan ide ini.
  7. "cta": Call to action spesifik yang relevan dengan tujuan (${goal}).
  8. "potential": Alasan potensi daya tarik (misal: "Engagement Tinggi", "Viral Potensial", "Konversi Penjualan", "Membangun Otoritas").
  9. "executionTips": 1-2 tips praktis untuk eksekusi (misal: saran visual, audio, atau ekspresi).`;

    const systemInstruction = `Kamu adalah AI Content Strategist profesional di ARVIN STUDIO.
Tugasmu adalah menghasilkan ide konten bermutu tinggi, terstruktur rapi, dan mudah diaplikasikan oleh kreator konten.
Respons HARUS HANYA berupa JSON valid tanpa teks pembuka, penutup, markdown backticks, atau komentar apa pun di luar objek JSON:
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

    const rawJsonText = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 8192,
      endpointName: "/api/ideas",
    });

    let parsedData: any = null;
    try {
      parsedData = safeJsonParse(rawJsonText);
    } catch (parseErr) {
      console.warn("[ARVIN AI] safeJsonParse failed in /api/ideas, will try stream object extraction:", parseErr);
    }

    let ideasArray: any[] = [];
    if (parsedData) {
      if (Array.isArray(parsedData)) {
        ideasArray = parsedData;
      } else if (Array.isArray(parsedData.ideas)) {
        ideasArray = parsedData.ideas;
      }
    }

    // Fallback: if ideasArray is still empty, scan individual JSON objects from the stream
    if (ideasArray.length === 0) {
      const scanned = extractObjectsFromStream(rawJsonText);
      const validIdeas = scanned.filter((item) => item && (item.title || item.hook || item.concept));
      if (validIdeas.length > 0) {
        ideasArray = validIdeas;
      }
    }
    
    // Normalize and sanitize all ideas
    const sanitizedIdeas = ideasArray.map((item: any, idx: number) => ({
      id: item.id || `idea-${Date.now()}-${idx + 1}`,
      title: item.title || `Ide Konten #${idx + 1}`,
      hook: item.hook || "Pernahkah kamu menyadari hal ini?",
      concept: item.concept || "Konsep konten praktis untuk meningkatkan interaksi audiens.",
      format: item.format || (platform === "TikTok" ? "Short Video" : "Carousel Post"),
      targetAudience: item.targetAudience || targetAudience || "Audiens umum",
      cta: item.cta || "Bagaimana pendapatmu? Tulis di komentar!",
      potential: item.potential || "Engagement Tinggi",
      executionTips: item.executionTips || "Gunakan pencahayaan yang jelas dan teks di layar pada 3 detik awal.",
    }));

    if (sanitizedIdeas.length === 0) {
      throw new Error("Format ide yang dihasilkan tidak valid.");
    }

    res.json({
      ideas: sanitizedIdeas,
      niche: niche.trim(),
      platform,
      count: sanitizedIdeas.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/ideas:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.",
    });
  }
});

// Endpoint: Generate Alternative for Single Idea Card
app.post("/api/ideas/regenerate-single", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      niche,
      targetAudience = "Audiens umum",
      platform = "Instagram",
      goal = "Meningkatkan Engagement",
      style = "Edukatif",
      currentTitle = "",
    } = req.body as {
      niche?: string;
      targetAudience?: string;
      platform?: string;
      goal?: string;
      style?: string;
      currentTitle?: string;
    };

    if (!niche || !niche.trim()) {
      res.status(400).json({ error: "Silakan isi niche atau topik terlebih dahulu." });
      return;
    }

    const ai = getGeminiClient(getClientApiKey(req));

    const prompt = `Buatkan 1 ide konten alternatif yang BARU, SEGAR, dan BERBEDA untuk menggantikan ide sebelumnya ("${currentTitle}").

Spesifikasi:
Niche: ${niche.trim()}
Target Audiens: ${targetAudience.trim() || "Audiens umum"}
Platform: ${platform}
Tujuan: ${goal}
Gaya: ${style}

Pastikan ide alternatif ini memiliki angle baru yang memikat rasa penasaran audiens.`;

    const systemInstruction = `Kamu adalah AI Content Strategist profesional di ARVIN STUDIO.
Respons HARUS HANYA berupa JSON valid dengan 1 objek ide tanpa teks pengantar atau penutup:
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

    const rawJsonText = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.8,
      maxOutputTokens: 4096,
      endpointName: "/api/ideas/regenerate-single",
    });

    let parsedData: any;
    try {
      parsedData = safeJsonParse(rawJsonText);
    } catch {
      const scanned = extractObjectsFromStream(rawJsonText);
      parsedData = scanned[0] || {};
    }

    const item = parsedData.idea || parsedData;
    const sanitizedIdea = {
      id: item.id || `alt-idea-${Date.now()}`,
      title: item.title || "Ide Alternatif Baru",
      hook: item.hook || "Pernahkah kamu memikirkan sudut pandang ini?",
      concept: item.concept || "Konsep konten alternatif dengan pendekatan yang lebih segar.",
      format: item.format || (platform === "TikTok" ? "Short Video" : "Carousel Post"),
      targetAudience: item.targetAudience || targetAudience || "Audiens umum",
      cta: item.cta || "Bagikan pandanganmu di kolom komentar!",
      potential: item.potential || "Engagement Tinggi",
      executionTips: item.executionTips || "Fokus pada penyampaian yang dinamis dan visual yang relevan.",
    };

    res.json({
      idea: sanitizedIdea,
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/ideas/regenerate-single:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Maaf, ide konten belum berhasil dibuat. Silakan coba lagi.",
    });
  }
});

// Endpoint: Generate Captions
app.post("/api/captions", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      content,
      platform = "Instagram",
      style = "Santai",
      goal = "Engagement",
      length = "Sedang",
      language = "Indonesia",
      cta = "CTA Engagement",
      regenerateCount = 0,
    } = req.body as {
      content?: string;
      platform?: string;
      style?: string;
      goal?: string;
      length?: string;
      language?: string;
      cta?: string;
      regenerateCount?: number;
    };

    if (!content || !content.trim()) {
      res.status(400).json({ error: "Silakan jelaskan konten yang ingin dibuatkan caption." });
      return;
    }

    const ai = getGeminiClient(getClientApiKey(req));

    // Specific instructions per platform
    let platformGuide = "";
    if (platform === "Instagram") {
      platformGuide = "Instagram: Visual-friendly, spacing rapi, hook awal kuat, engagement-friendly, dan berikan 5-8 hashtag relevan.";
    } else if (platform === "TikTok") {
      platformGuide = "TikTok: Lebih singkat, conversational, punchy, kuat di 3 kata pertama (hook), dan berikan 3-5 hashtag relevan/trending.";
    } else if (platform === "Facebook") {
      platformGuide = "Facebook: Conversational, ramah, mendorong audiens berkomentar dan share cerita, dan berikan 3-5 hashtag.";
    } else if (platform === "YouTube") {
      platformGuide = "YouTube: Cocok untuk deskripsi video, ringkas dan informatif dengan ajakan tonton/subscribe, dan berikan 3-5 hashtag.";
    } else if (platform === "X") {
      platformGuide = "X: Singkat, padat, punchy, hemat karakter, mudah dibaca, dan berikan 1-3 hashtag.";
    } else if (platform === "LinkedIn") {
      platformGuide = "LinkedIn: Profesional, insight-driven, terstruktur dengan line-break rapi, tidak terlalu informal, dan berikan 3-5 hashtag.";
    } else {
      platformGuide = "Umum: Caption fleksibel, seimbang, dan adaptif untuk berbagai platform, berikan 4-6 hashtag.";
    }

    // Specific instructions per length
    let lengthGuide = "";
    if (length === "Pendek") {
      lengthGuide = "Panjang: Pendek (1-2 paragraf singkat atau 30-60 kata, to-the-point).";
    } else if (length === "Panjang") {
      lengthGuide = "Panjang: Panjang (4-6 paragraf komprehensif atau micro-blogging yang mendalam, sekitar 160-280 kata).";
    } else {
      lengthGuide = "Panjang: Sedang (2-3 paragraf berimbang dengan pemisah baris yang nyaman dibaca, sekitar 70-150 kata).";
    }

    // Specific instructions per CTA
    let ctaGuide = "";
    if (cta === "Tanpa CTA") {
      ctaGuide = "CTA: Jangan sertakan Call to Action (tanpa ajakan aksi di akhir).";
    } else if (cta === "CTA Soft") {
      ctaGuide = "CTA: Gunakan Soft CTA yang halus (misal: 'Simpan postingan ini jika bermanfaat untukmu', 'Semoga ada insight yang bisa kamu ambil').";
    } else if (cta === "CTA Penjualan") {
      ctaGuide = "CTA: Gunakan CTA Penjualan yang persuasif (misal: 'Klik link di bio untuk order/amankan slot sebelum kehabisan', 'DM kami sekarang untuk info selengkapnya').";
    } else if (cta === "CTA Follow") {
      ctaGuide = "CTA: Gunakan CTA Follow akun (misal: 'Follow untuk tips & strategi creator harian lainnya', 'Klik ikuti agar tidak ketinggalan update selanjutnya').";
    } else {
      ctaGuide = "CTA: Gunakan CTA Engagement yang memicu interaksi aktif (misal: 'Tulis pendapatmu di kolom komentar!', 'Tag temanmu yang butuh info ini!', 'Kamu paling setuju poin nomor berapa?').";
    }

    // Specific instructions per language
    let languageGuide = "";
    if (language === "English") {
      languageGuide = "Bahasa: Full English (natural, fluent, idiomatic English social media copywriting).";
    } else if (language === "Indonesia + English") {
      languageGuide = "Bahasa: Campuran Bahasa Indonesia dengan istilah industri/kreatif berbahasa Inggris yang natural dan populer di kalangan creator Indonesia.";
    } else {
      languageGuide = "Bahasa: Bahasa Indonesia yang natural, mengalir, modern, dan komunikatif.";
    }

    const regenHint =
      regenerateCount && Number(regenerateCount) > 0
        ? `\nCatatan Regenerasi (Iterasi ke-${regenerateCount}): Buat variasi sudut pandang, hook pembuka, dan susunan kalimat yang segar dan berbeda total dari iterasi sebelumnya.`
        : "";

    const prompt = `Buatkan 3 varian caption media sosial berkualitas tinggi untuk konten berikut:

Konteks / Tentang Konten:
"""
${content.trim()}
"""

Parameter Spesifikasi:
- Platform: ${platform}
- Gaya Caption: ${style}
- Tujuan: ${goal}
- ${lengthGuide}
- ${languageGuide}
- ${ctaGuide}
- Optimasi Platform: ${platformGuide}${regenHint}

Ketentuan Khusus Wajib:
1. Buat tepat 3 varian caption dengan karakteristik berbeda:
   - Varian 1 (Direct & Catchy): Langsung menarik perhatian, to the point, hook tajam tanpa basa-basi.
   - Varian 2 (Storytelling): Menggunakan pendekatan narasi cerita, empati atau sudut pandang pengalaman yang menggugah emosi audiens.
   - Varian 3 (Engagement): Dirancang khusus untuk memicu interaksi, diskusi di kolom komentar, share, atau saves.
2. Setiap caption harus terasa natural, tidak kaku seperti robot/AI, mudah dibaca, dan memiliki jeda antar paragraf (line breaks) yang nyaman dibaca di layar HP.
3. Jangan menaruh hashtag di dalam badan caption, sertakan hashtag hanya di array "hashtags".
4. Sesuaikan jumlah hashtag sesuai platform (jangan berlebihan).`;

    const systemInstruction = `Kamu adalah ARVIN AI, AI Social Media Copywriter profesional di ARVIN STUDIO.
Tugasmu adalah membuat caption media sosial yang natural, relevan, berdampak tinggi, dan sesuai kebutuhan creator.
Format respons HARUS berupa JSON valid dengan skema:
{
  "variants": [
    {
      "id": "variant-1",
      "name": "Direct & Catchy",
      "description": "Langsung menarik perhatian",
      "caption": "string"
    },
    {
      "id": "variant-2",
      "name": "Storytelling",
      "description": "Pendekatan cerita dan emosional",
      "caption": "string"
    },
    {
      "id": "variant-3",
      "name": "Engagement",
      "description": "Mendorong audiens berinteraksi",
      "caption": "string"
    }
  ],
  "hashtags": ["#tag1", "#tag2", "#tag3"]
}`;

    const rawJsonText = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.75,
      maxOutputTokens: 4096,
      endpointName: "/api/captions",
    });

    let parsedData: any = null;
    try {
      parsedData = safeJsonParse(rawJsonText);
    } catch {
      const scanned = extractObjectsFromStream(rawJsonText);
      parsedData = scanned[0] || {};
    }

    // Sanitize variants
    let variants: any[] = Array.isArray(parsedData?.variants) ? parsedData.variants : [];
    if (variants.length === 0) {
      variants = [
        {
          id: "variant-1",
          name: "Direct & Catchy",
          description: "Langsung menarik perhatian",
          caption: typeof parsedData?.caption === "string" ? parsedData.caption : rawJsonText.slice(0, 400),
        },
        {
          id: "variant-2",
          name: "Storytelling",
          description: "Pendekatan cerita dan emosional",
          caption: content.trim(),
        },
        {
          id: "variant-3",
          name: "Engagement",
          description: "Mendorong audiens berinteraksi",
          caption: `${content.trim()}\n\nBagikan pendapatmu di kolom komentar!`,
        },
      ];
    }

    const defaultNames = ["Direct & Catchy", "Storytelling", "Engagement"];
    const defaultDescs = [
      "Langsung menarik perhatian",
      "Pendekatan cerita dan emosional",
      "Mendorong audiens berinteraksi",
    ];

    const sanitizedVariants = variants.slice(0, 3).map((v, idx) => ({
      id: v.id || `variant-${idx + 1}`,
      name: v.name || defaultNames[idx] || `Varian ${idx + 1}`,
      description: v.description || defaultDescs[idx] || "",
      caption: String(v.caption || "").trim(),
    }));

    // Sanitize hashtags
    let hashtags: string[] = [];
    if (Array.isArray(parsedData?.hashtags)) {
      hashtags = parsedData.hashtags
        .map((h: any) => String(h).trim())
        .filter((h: string) => h.length > 0)
        .map((h: string) => (h.startsWith("#") ? h : `#${h}`));
    }

    if (hashtags.length === 0) {
      const words = content
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
        .slice(0, 4);
      hashtags = [
        `#${platform.toLowerCase()}`,
        ...words.map((w) => `#${w.toLowerCase()}`),
        "#creator",
        "#kontenkreatif",
      ].slice(0, 5);
    }

    res.json({
      variants: sanitizedVariants,
      hashtags,
      platform,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/captions:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Maaf, caption belum berhasil dibuat. Silakan coba lagi.",
    });
  }
});

// Endpoint: Generate Viral Hooks
app.post("/api/hooks", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      topic,
      platform = "TikTok",
      targetAudience = "",
      goal = "Engagement",
      style = "Curiosity",
      count = 10,
      regenerateCount = 0,
    } = req.body as {
      topic?: string;
      platform?: string;
      targetAudience?: string;
      goal?: string;
      style?: string;
      count?: number;
      regenerateCount?: number;
    };

    if (!topic || !topic.trim()) {
      res.status(400).json({ error: "Silakan jelaskan isi konten terlebih dahulu." });
      return;
    }

    const requestedCount = Math.min(Math.max(Number(count) || 10, 5), 20);
    const ai = getGeminiClient(getClientApiKey(req));

    // Platform-specific hook optimization guideline
    let platformGuide = "";
    if (platform === "TikTok") {
      platformGuide = "TikTok: Hook harus sangat mematikan di 1-3 detik pertama, natural, sangat conversational, cepat, berirama santai namun bikin penasaran langsung.";
    } else if (platform === "Instagram Reels") {
      platformGuide = "Instagram Reels: Pendek, visual-friendly, curiosity-driven, cocok diucapkan langsung ke kamera atau ditaruh sebagai teks overlay besar.";
    } else if (platform === "Instagram Post") {
      platformGuide = "Instagram Post: Kalimat pembuka caption baris pertama yang memotong preview ('...more') dan memaksa audiens menekan baca selengkapnya.";
    } else if (platform === "YouTube Shorts") {
      platformGuide = "YouTube Shorts: Sangat cepat, to-the-point, pembuka yang provokatif/berisi teka-teki visual dan verbal tanpa basa-basi.";
    } else if (platform === "YouTube") {
      platformGuide = "YouTube Video: Kalimat pembuka 5-10 detik pertama video yang membangun retensi tinggi, menjanjikan payoff yang jelas, dan mengatasi keraguan audiens.";
    } else if (platform === "Facebook") {
      platformGuide = "Facebook: Conversational, relatable, menyentuh problem sehari-hari, membangkitkan empati atau perdebatan santai di komentar.";
    } else if (platform === "X") {
      platformGuide = "X: Singkat, padat, berani, tajam, memancing quote tweet atau reply, menghindari basa-basi pembuka.";
    } else if (platform === "LinkedIn") {
      platformGuide = "LinkedIn: Profesional namun humanis, membongkar perspektif industri/karier yang kontraintuitif, berwibawa dan tidak murahan.";
    } else {
      platformGuide = "Umum: Hook yang fleksibel, berdaya pikat tinggi di berbagai format media sosial modern.";
    }

    // Regenerate variation instructions
    let variationDirective = "";
    if (regenerateCount > 0) {
      const angles = [
        "Fokus pada sudut pandang kontraintuitif atau mitos umum yang salah.",
        "Fokus pada rasa penasaran tajam dan pertanyaan menusuk realita.",
        "Fokus pada kerugian emosional atau finansial jika tidak memperhatikan konten ini.",
        "Fokus pada cerita mikronarasi yang menggugah empati dan relatable.",
      ];
      const selectedAngle = angles[(regenerateCount - 1) % angles.length];
      variationDirective = `\nPERINGATAN REGENERASI (Iterasi #${regenerateCount}): Jangan gunakan pola kalimat yang sama dengan iterasi sebelumnya! Eksplorasi sudut pandang ini: ${selectedAngle}`;
    }

    const systemInstruction = `Anda adalah Viral Content Hook Strategist dan Social Media Copywriter profesional di ARVIN STUDIO.
Fokus utama Anda adalah: STOP SCROLL. Hook harus membuat audiens berhenti scroll di layar hp dan ingin terus menonton/membaca konten sampai selesai.

Prinsip pembuatan hook:
1. Menarik perhatian & membangkitkan rasa penasaran mendalam.
2. Sangat relevan dengan isi konten dan tidak misleading (bukan clickbait murahan).
3. Singkat, padat, dan mudah dipahami dalam 1-3 detik.
4. Sesuai target audiens dan platform yang dituju.
5. Menggunakan bahasa Indonesia natural, manusiawi, dan mengalir santai.
6. HINDARI frasa klise/generik seperti: "Kamu wajib tahu ini!", "Jangan scroll!", "Ini akan mengubah hidupmu!", "Tonton sampai habis!", "Stop scrolling!".
7. Variasikan sudut pandang/kategori (${requestedCount} hook): prioritaskan gaya utama "${style}", tetapi kombinasikan secara variatif dengan kategori relevan lainnya (seperti Curiosity, Problem / Pain Point, Question, Bold Statement, Storytelling, Statistic, Emotional).
8. Hook Score (0-100): Evaluasi sungguh-sungguh berdasarkan Attention, Curiosity, Relevance, Clarity, dan Platform Fit. Berikan skor realistis (80-99).
9. Top 3 Hook: Pilih 3 hook terbaik dan berikan alasan spesifik pemilihannya berdasarkan attention, platform fit, dan engagement potential.

PANDUAN PLATFORM:
${platformGuide}
${variationDirective}

KEMBALIKAN HANYA JSON MURNI TANPA MARKDOWN BACKTICKS DENGAN SKEMA:
{
  "hooks": [
    {
      "text": "Kalimat hook yang kuat dan menarik",
      "category": "Curiosity / Problem / Question / Bold Statement / Storytelling / dll",
      "score": 94,
      "reason": "Alasan singkat mengapa hook ini efektif menghentikan scroll"
    }
  ],
  "topHooks": [
    {
      "text": "Teks persis salah satu dari 3 hook terbaik",
      "reason": "Alasan detail mengapa hook ini menjadi salah satu dari Top 3"
    }
  ]
}`;

    const prompt = `Buatkan tepat ${requestedCount} viral hook konten dengan parameter berikut:
- Topik / Isi Konten: ${topic.trim()}
- Platform: ${platform}
- Target Audiens: ${targetAudience ? targetAudience.trim() : "Audiens umum / target peminat topik ini"}
- Tujuan Konten: ${goal}
- Gaya Utama Hook: ${style}
- Jumlah Hook yang Diminta: ${requestedCount} Hook

Pastikan menghasilkan tepat ${requestedCount} hook dalam array "hooks", dan tepat 3 hook unggulan dalam array "topHooks".
Kembalikan hanya JSON murni sesuai instruksi.`;

    const rawResult = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.88,
      maxOutputTokens: 3000,
      endpointName: "/api/hooks",
    });

    let rawJsonText = rawResult.trim();
    if (rawJsonText.startsWith("```")) {
      rawJsonText = rawJsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    }

    let parsedData: any = safeJsonParse(rawJsonText);
    if (!parsedData || !Array.isArray(parsedData.hooks) || parsedData.hooks.length === 0) {
      const extracted = extractObjectsFromStream(rawJsonText);
      if (extracted && extracted.length > 0) {
        if (extracted[0].hooks && Array.isArray(extracted[0].hooks)) {
          parsedData = extracted[0];
        } else {
          parsedData = { hooks: extracted };
        }
      }
    }

    // Sanitize hooks
    let rawHooks: any[] = Array.isArray(parsedData?.hooks) ? parsedData.hooks : [];
    if (rawHooks.length === 0) {
      // Fallback generator from content if parsing had an unexpected format
      rawHooks = [
        {
          text: `Kalau kamu masih bingung soal ${topic.trim().slice(0, 50)}, mungkin 1 hal ini penyebabnya.`,
          category: style || "Curiosity",
          score: 93,
          reason: "Mengangkat pertanyaan inti yang langsung relevan dengan audiens target.",
        },
        {
          text: `Banyak yang salah paham: kenapa ${topic.trim().slice(0, 45)} justru bikin banyak orang gagal?`,
          category: "Problem / Pain Point",
          score: 91,
          reason: "Membongkar miskonsepsi umum yang memicu rasa ingin tahu seketika.",
        },
        {
          text: `Jangan buru-buru ambil keputusan sebelum tahu fakta tentang ${topic.trim().slice(0, 40)}.`,
          category: "Bold Statement",
          score: 89,
          reason: "Memunculkan urgensi tanpa terkesan clickbait berlebihan.",
        },
      ];
    }

    const sanitizedHooks = rawHooks.map((h, index) => {
      const hookScore = Math.min(Math.max(Number(h.score) || (88 + (index % 10)), 70), 99);
      return {
        id: `hook-${index + 1}`,
        number: index + 1,
        text: String(h.text || "").trim(),
        category: String(h.category || style || "Curiosity").trim(),
        score: hookScore,
        reason: String(h.reason || "Menarik perhatian audiens dan relevan dengan topik konten.").trim(),
      };
    }).filter((h) => h.text.length > 0);

    // Sanitize top hooks (Top 3)
    let rawTopHooks: any[] = Array.isArray(parsedData?.topHooks) ? parsedData.topHooks : [];
    let sanitizedTopHooks: any[] = [];

    if (rawTopHooks.length > 0) {
      sanitizedTopHooks = rawTopHooks.slice(0, 3).map((th) => ({
        text: String(th.text || "").trim(),
        reason: String(th.reason || "Kombinasi kuat antara curiosity dan relevansi platform.").trim(),
      })).filter((th) => th.text.length > 0);
    }

    // If top hooks wasn't provided or less than 3, pick the highest scoring hooks
    if (sanitizedTopHooks.length < 3 && sanitizedHooks.length > 0) {
      const sortedByScore = [...sanitizedHooks].sort((a, b) => b.score - a.score);
      const needed = 3 - sanitizedTopHooks.length;
      for (const item of sortedByScore) {
        if (!sanitizedTopHooks.some((t) => t.text === item.text)) {
          sanitizedTopHooks.push({
            text: item.text,
            reason: item.reason || `Memiliki skor tertinggi (${item.score}/100) dengan daya pikat kuat di ${platform}.`,
          });
        }
        if (sanitizedTopHooks.length >= 3) break;
      }
    }

    res.json({
      hooks: sanitizedHooks,
      topHooks: sanitizedTopHooks.slice(0, 3),
      platform,
      topic,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/hooks:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Maaf, hook belum berhasil dibuat. Silakan coba lagi.",
    });
  }
});

// ==========================================
// ENDPOINT: SCRIPT MAKER (Tahap 6)
// ==========================================
app.post("/api/scripts", async (req, res) => {
  try {
    const {
      topic,
      platform = "TikTok",
      targetAudience = "",
      goal = "Engagement",
      duration = "60 detik",
      style = "Edukatif",
      useHook = true,
      regenerateCount = 0,
    } = req.body || {};

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        error: "Silakan isi topik konten terlebih dahulu.",
      });
    }

    const ai = getGeminiClient(getClientApiKey(req));
    const systemInstruction = `Kamu adalah Lead Scriptwriter & Video Director di ARVIN STUDIO.
Tugasmu membuat naskah konten video/audio yang terstruktur, alami, tidak kaku seperti robot, dan siap dieksekusi oleh creator.

Prinsip Kualitas Script:
1. Alami & Mudah Dibacakan: Gunakan bahasa tutur yang enak didengar dan mengalir.
2. Presisi Durasi: Sesuaikan panjang kata narasi dengan durasi yang diminta (${duration}):
   - 15 detik: 35-45 kata
   - 30 detik: 65-85 kata
   - 60 detik: 130-160 kata
   - 90 detik: 190-230 kata
   - 3-10 menit: struktur bab/scene lebih mendalam
3. Scene Breakdown: Berikan pembagian scene visual dan audio (terutama untuk video 15–90 detik atau video bertahap):
   - sceneNumber: urutan nomor scene (1, 2, 3...)
   - timeRange: rentang detik/waktu (misal "0:00–0:03")
   - visual: arahan tindakan kamera / ekspresi / B-roll
   - voiceOver: narasi/kalimat yang diucapkan
   - textOverlay: teks singkat on-screen
4. Hook: ${useHook ? "Buat hook 3 detik pembuka yang kuat untuk menghentikan scroll." : "Opening langsung fokus ke topik inti tanpa clickbait."}
5. Struktur Lengkap:
   - title: Judul naskah
   - hook: Kalimat hook pembuka
   - opening: Orientasi / pengantar konteks
   - body: Isi materi utama
   - cta: Call to action yang jelas sesuai tujuan
   - ending: Penutup yang berkesan
   - score: Skor naskah 0–100 (berdasarkan hook, structure, clarity, engagement, cta, platform fit)
   - scoreReason: Penjelasan 1-2 kalimat mengapa naskah ini efektif untuk audiens dan platform
6. Format output WAJIB JSON murni tanpa markdown pembungkus.`;

    const prompt = `Buatkan script konten dengan parameter berikut:
- Topik / Isi Konten: "${topic.trim()}"
- Platform: ${platform}
- Target Audiens: ${targetAudience ? targetAudience.trim() : "Audiens umum yang relevan"}
- Tujuan: ${goal}
- Durasi: ${duration}
- Gaya: ${style}
- Gunakan Hook: ${useHook ? "YA (Wajib hook pembuka tajam)" : "TIDAK (Langsung opening)"}
- Variasi Iterasi: #${regenerateCount} (Buat pendekatan naskah yang segar)

Format JSON yang DIBUTUHKAN:
{
  "title": "string",
  "hook": "string",
  "opening": "string",
  "body": "string",
  "scenes": [
    {
      "sceneNumber": 1,
      "timeRange": "0:00–0:03",
      "visual": "string",
      "voiceOver": "string",
      "textOverlay": "string"
    }
  ],
  "cta": "string",
  "ending": "string",
  "score": 92,
  "scoreReason": "string"
}

Pastikan output JSON valid, lengkap, dan tidak terpotong.`;

    const rawResult = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.85,
      maxOutputTokens: 3500,
      endpointName: "/api/scripts",
    });

    let rawJsonText = rawResult.trim();
    if (rawJsonText.startsWith("```json")) {
      rawJsonText = rawJsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (rawJsonText.startsWith("```")) {
      rawJsonText = rawJsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(rawJsonText);
    } catch {
      parsedData = safeJsonParse(rawJsonText);
    }

    if (!parsedData || typeof parsedData !== "object") {
      throw new Error("Maaf, permintaan belum berhasil diproses. Silakan coba lagi.");
    }

    // Sanitize title, hook, opening, body, cta, ending, score, scoreReason
    const title = String(parsedData.title || `Script ${platform} - ${topic.slice(0, 40)}`).trim();
    const hook = useHook ? String(parsedData.hook || "").trim() : "";
    const opening = String(parsedData.opening || hook || "Halo semuanya, simak tips penting berikut.").trim();
    const body = String(parsedData.body || "").trim();
    const cta = String(parsedData.cta || "Yuk bagikan video ini dan tulis komentarmu di bawah!").trim();
    const ending = String(parsedData.ending || "Sampai jumpa di video berikutnya.").trim();

    let rawScore = Number(parsedData.score);
    if (isNaN(rawScore) || rawScore < 50 || rawScore > 100) {
      rawScore = 92;
    }

    const scoreReason = String(
      parsedData.scoreReason ||
        `Naskah memiliki struktur yang pas untuk ${platform} dengan transisi narasi yang mengalir dan CTA yang terarah.`
    ).trim();

    // Sanitize scenes
    let sanitizedScenes: any[] = [];
    if (Array.isArray(parsedData.scenes) && parsedData.scenes.length > 0) {
      sanitizedScenes = parsedData.scenes.map((s: any, idx: number) => ({
        sceneNumber: typeof s.sceneNumber === "number" ? s.sceneNumber : idx + 1,
        timeRange: String(s.timeRange || `Scene ${idx + 1}`).trim(),
        visual: String(s.visual || "Pembicara menghadap kamera").trim(),
        voiceOver: String(s.voiceOver || "").trim(),
        textOverlay: s.textOverlay ? String(s.textOverlay).trim() : undefined,
      })).filter((s: any) => s.voiceOver.length > 0 || s.visual.length > 0);
    }

    // If no scenes returned, create default scenes from hook/opening/body/cta
    if (sanitizedScenes.length === 0) {
      sanitizedScenes = [
        {
          sceneNumber: 1,
          timeRange: "0:00–0:03",
          visual: "Pembicara menghadap kamera dengan ekspresi meyakinkan.",
          voiceOver: hook || opening,
          textOverlay: title.slice(0, 30),
        },
        {
          sceneNumber: 2,
          timeRange: "0:03–0:40",
          visual: "Pembicara menjelaskan materi diselingi contoh visual atau B-roll pendukung.",
          voiceOver: body,
          textOverlay: "Poin Utama",
        },
        {
          sceneNumber: 3,
          timeRange: "0:40–0:60",
          visual: "Pembicara memberikan ajakan bertindak sambil tersenyum ramah.",
          voiceOver: `${cta} ${ending}`,
          textOverlay: "Komen di Bawah 👇",
        },
      ];
    }

    res.json({
      title,
      hook,
      opening,
      body,
      scenes: sanitizedScenes,
      cta,
      ending,
      score: rawScore,
      scoreReason,
      platform,
      duration,
      topic: topic.trim(),
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/scripts:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Maaf, permintaan belum berhasil diproses. Silakan coba lagi.",
    });
  }
});

// ==========================================
// ENDPOINT: HASHTAG GENERATOR (Tahap 6)
// ==========================================
app.post("/api/hashtags", async (req, res) => {
  try {
    const {
      topic,
      platform = "Instagram",
      niche = "",
      targetAudience = "",
      goal = "Reach",
      count = 15,
      regenerateCount = 0,
    } = req.body || {};

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({
        error: "Silakan isi topik konten terlebih dahulu.",
      });
    }

    const requestedCount = [5, 10, 15, 20, 30].includes(Number(count))
      ? Number(count)
      : 15;

    const ai = getGeminiClient(getClientApiKey(req));
    const systemInstruction = `Kamu adalah Social Media Growth Strategist & Algorithm Specialist di ARVIN STUDIO.
Tugasmu menghasilkan daftar hashtag yang sangat relevan, terarah, dan terbukti membantu konten menjangkau audiens yang tepat.

Pedoman Hashtag:
1. Relevansi Tinggi: Jangan gunakan hashtag random spam. Setiap hashtag harus berhubungan erat dengan topik, niche, target audiens, dan tujuan.
2. Kategori Terstruktur (Wajib kelompokkan ke 4 kategori):
   - "Broad": Hashtag umum dengan cakupan luas (misal #Marketing, #Bisnis).
   - "Niche": Hashtag yang sangat spesifik topik konten (misal #DigitalMarketingUMKM, #TipsJualanOnline).
   - "Target Audience": Hashtag persona audiens sasaran (misal #PemilikUMKM, #PengusahaMuda).
   - "Intent": Hashtag tujuan/niat konten (misal #BelajarMarketing, #SolusiBisnis).
3. Format Tag: Selalu diawali tanda '#' tanpa spasi, gunakan CamelCase agar mudah dibaca (misal: #DigitalMarketing).
4. Relevance Score: Berikan skor 80–99 berdasarkan kedalaman relevansi terhadap input pengguna.
5. Reason: Berikan alasan singkat 1 kalimat mengapa hashtag ini dipilih.
6. Optimasi Platform (${platform}):
   - Instagram: Dominan Niche + Target Audiens + sedikit Broad.
   - TikTok: Kombinasi keyword FYP yang sering dicari.
   - YouTube: Relevan dengan SEO video dan search intent.
   - Facebook: Fokus dan tidak berlebihan.
   - X: Singkat, padat, dan bertema trending/topikal.
   - LinkedIn: Profesional dan berorientasi industri.
7. Format output WAJIB JSON murni tanpa markdown pembungkus.`;

    const prompt = `Hasilkan ${requestedCount} hashtag untuk konten berikut:
- Topik Konten: "${topic.trim()}"
- Platform: ${platform}
- Niche: ${niche ? niche.trim() : "Sesuai topik"}
- Target Audiens: ${targetAudience ? targetAudience.trim() : "Audiens umum yang relevan"}
- Tujuan: ${goal}
- Jumlah: ${requestedCount}
- Variasi Iterasi: #${regenerateCount}

Format JSON yang DIBUTUHKAN:
{
  "recommendation": "Penjelasan singkat 1-2 kalimat strategi algoritma mengapa kombinasi hashtag ini dipilih untuk ${platform}.",
  "hashtags": [
    {
      "tag": "#NamaHashtag",
      "category": "Broad" | "Niche" | "Target Audience" | "Intent",
      "relevanceScore": 95,
      "reason": "Alasan singkat pemilihan hashtag ini."
    }
  ]
}

Pastikan menghasilkan tepat ${requestedCount} hashtag yang terdistribusi ke dalam 4 kategori tersebut.`;

    const rawResult = await generateAIContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      responseMimeType: "application/json",
      temperature: 0.85,
      maxOutputTokens: 3000,
      endpointName: "/api/hashtags",
    });

    let rawJsonText = rawResult.trim();
    if (rawJsonText.startsWith("```json")) {
      rawJsonText = rawJsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (rawJsonText.startsWith("```")) {
      rawJsonText = rawJsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(rawJsonText);
    } catch {
      parsedData = safeJsonParse(rawJsonText);
    }

    if (!parsedData || typeof parsedData !== "object") {
      throw new Error("Maaf, permintaan belum berhasil diproses. Silakan coba lagi.");
    }

    let rawList: any[] = [];
    if (Array.isArray(parsedData.hashtags)) {
      rawList = parsedData.hashtags;
    } else if (Array.isArray(parsedData)) {
      rawList = parsedData;
    }

    const validCategories = ["Broad", "Niche", "Target Audience", "Intent"];

    const sanitizedHashtags = rawList.map((item: any, idx: number) => {
      let tag = String(item.tag || item.hashtag || "").trim();
      if (!tag.startsWith("#")) {
        tag = `#${tag.replace(/[^a-zA-Z0-9_]/g, "")}`;
      } else {
        tag = `#${tag.slice(1).replace(/[^a-zA-Z0-9_]/g, "")}`;
      }

      let category = String(item.category || "").trim();
      if (!validCategories.includes(category)) {
        // Fallback categorization based on index
        category = validCategories[idx % validCategories.length];
      }

      let relevanceScore = Number(item.relevanceScore || item.score);
      if (isNaN(relevanceScore) || relevanceScore < 70 || relevanceScore > 100) {
        relevanceScore = Math.floor(Math.random() * 10) + 88;
      }

      const reason = String(
        item.reason || `Hashtag ${category.toLowerCase()} yang relevan untuk mendongkrak visibilitas di ${platform}.`
      ).trim();

      return {
        tag,
        category: category as "Broad" | "Niche" | "Target Audience" | "Intent",
        relevanceScore,
        reason,
      };
    }).filter((h) => h.tag.length > 1);

    if (sanitizedHashtags.length === 0) {
      throw new Error("Maaf, permintaan belum berhasil diproses. Silakan coba lagi.");
    }

    const recommendation = String(
      parsedData.recommendation ||
        `Kombinasi hashtag ${platform} ini disusun strategis memadukan tag niche, target audiens, dan intent untuk jangkauan algoritma yang optimal.`
    ).trim();

    res.json({
      hashtags: sanitizedHashtags,
      platform,
      topic: topic.trim(),
      niche: niche ? niche.trim() : undefined,
      targetAudience: targetAudience ? targetAudience.trim() : undefined,
      goal,
      recommendation,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[ARVIN AI] Error in /api/hashtags:", err?.message || err);
    const statusCode = err?.status === 503 ? 503 : 500;
    res.status(statusCode).json({
      error: err?.message || "Maaf, permintaan belum berhasil diproses. Silakan coba lagi.",
    });
  }
});



// ==========================================
// ENDPOINT: CONTENT PLANS (Tahap 7)
// ==========================================
app.get("/api/content-plans", (req: Request, res: Response): void => {
  const userId = (req.headers["x-user-id"] || req.query.userId) as string;
  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const db = getDatabase();
  const allPlans = Object.values(db.content_plans || {});
  const userPlans = allPlans
    .filter((p: any) => p && p.userId === userId)
    .sort((a: any, b: any) => {
      const dateA = a.scheduledDate || a.createdAt || "";
      const dateB = b.scheduledDate || b.createdAt || "";
      return dateA.localeCompare(dateB);
    });

  res.json({ plans: userPlans });
});

app.post("/api/content-plans", (req: Request, res: Response): void => {
  const userId = (req.headers["x-user-id"] || req.body.userId) as string;
  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const {
    title,
    topic,
    platform = "Instagram",
    format = "Post",
    scheduledDate,
    scheduledTime = "10:00",
    status = "Draft",
    notes = "",
  } = req.body || {};

  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Judul konten wajib diisi." });
    return;
  }

  const now = new Date().toISOString();
  const id = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newPlan = {
    id,
    userId,
    title: title.trim(),
    topic: String(topic || "").trim(),
    platform,
    format,
    scheduledDate: scheduledDate || now.split("T")[0],
    scheduledTime,
    status,
    notes: String(notes || "").trim(),
    createdAt: now,
    updatedAt: now,
  };

  const db = getDatabase();
  db.content_plans[id] = newPlan;
  saveDatabase(db);

  res.status(201).json({ plan: newPlan });
});

app.put("/api/content-plans/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = (req.headers["x-user-id"] || req.body.userId) as string;
  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const db = getDatabase();
  const existing = db.content_plans[id];
  if (!existing) {
    res.status(404).json({ error: "Rencana konten tidak ditemukan." });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Akses ditolak. Dokumen bukan milik Anda." });
    return;
  }

  const {
    title,
    topic,
    platform,
    format,
    scheduledDate,
    scheduledTime,
    status,
    notes,
  } = req.body || {};

  const updatedPlan = {
    ...existing,
    ...(title !== undefined && { title: String(title).trim() }),
    ...(topic !== undefined && { topic: String(topic).trim() }),
    ...(platform !== undefined && { platform }),
    ...(format !== undefined && { format }),
    ...(scheduledDate !== undefined && { scheduledDate }),
    ...(scheduledTime !== undefined && { scheduledTime }),
    ...(status !== undefined && { status }),
    ...(notes !== undefined && { notes: String(notes).trim() }),
    updatedAt: new Date().toISOString(),
  };

  db.content_plans[id] = updatedPlan;
  saveDatabase(db);

  res.json({ plan: updatedPlan });
});

app.delete("/api/content-plans/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = (req.headers["x-user-id"] || req.query.userId) as string;
  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const db = getDatabase();
  const existing = db.content_plans[id];
  if (!existing) {
    res.status(404).json({ error: "Rencana konten tidak ditemukan." });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Akses ditolak. Dokumen bukan milik Anda." });
    return;
  }

  delete db.content_plans[id];
  saveDatabase(db);

  res.json({ success: true, message: "Rencana konten berhasil dihapus." });
});

// ==========================================
// ENDPOINT: AI USAGE (Tahap 7)
// ==========================================
app.post("/api/ai-usage", (req: Request, res: Response): void => {
  const userId = (req.headers["x-user-id"] || req.body.userId) as string;
  const { feature } = req.body || {};
  if (!userId || !feature) {
    res.status(400).json({ error: "userId dan feature wajib disertakan." });
    return;
  }

  logAiUsage(userId, String(feature).trim());
  res.status(201).json({ success: true });
});

// ==========================================
// ENDPOINT: AI HISTORY (Tahap 7)
// ==========================================
app.get("/api/history", (req: Request, res: Response): void => {
  const userId = (req.headers["x-user-id"] || req.query.userId) as string;
  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const { category, search } = req.query as { category?: string; search?: string };
  const db = getDatabase();
  const allHistory = Object.values(db.ai_history || {});

  let userHistory = allHistory.filter((item: any) => item && item.userId === userId);

  if (category && category !== "All" && category !== "Semua") {
    userHistory = userHistory.filter(
      (item: any) => item.feature && item.feature.toLowerCase() === category.toLowerCase()
    );
  }

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    userHistory = userHistory.filter((item: any) => {
      const t = (item.title || "").toLowerCase();
      const f = (item.feature || "").toLowerCase();
      const s = (item.inputSummary || "").toLowerCase();
      return t.includes(q) || f.includes(q) || s.includes(q);
    });
  }

  userHistory.sort((a: any, b: any) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  res.json({ history: userHistory });
});

app.post("/api/history", (req: Request, res: Response): void => {
  const userId = (req.headers["x-user-id"] || req.body.userId) as string;
  const { feature, title, inputSummary = "", result } = req.body || {};

  if (!userId || !feature || !title) {
    res.status(400).json({ error: "userId, feature, dan title wajib diisi." });
    return;
  }

  const resultStr = typeof result === "string" ? result : JSON.stringify(result);
  logAiHistory(userId, String(feature).trim(), String(title).trim(), String(inputSummary).trim(), resultStr);
  logAiUsage(userId, String(feature).trim());

  const db = getDatabase();
  const recentHistories = Object.values(db.ai_history)
    .filter((h: any) => h.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.status(201).json({ item: recentHistories[0] || null });
});

app.delete("/api/history/:id", (req: Request, res: Response): void => {
  const { id } = req.params;
  const userId = (req.headers["x-user-id"] || req.query.userId) as string;
  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const db = getDatabase();
  const existing = db.ai_history[id];
  if (!existing) {
    res.status(404).json({ error: "Riwayat tidak ditemukan." });
    return;
  }

  if (existing.userId !== userId) {
    res.status(403).json({ error: "Akses ditolak. Dokumen bukan milik Anda." });
    return;
  }

  delete db.ai_history[id];
  saveDatabase(db);

  res.json({ success: true, message: "Riwayat berhasil dihapus." });
});

// ==========================================
// ENDPOINT: ANALYTICS (Tahap 7)
// ==========================================
app.get("/api/analytics", (req: Request, res: Response): void => {
  const userId = (req.headers["x-user-id"] || req.query.userId) as string;
  const period = (req.query.period as string) || "all";

  if (!userId) {
    res.status(400).json({ error: "User ID diperlukan." });
    return;
  }

  const db = getDatabase();
  const allPlans = Object.values(db.content_plans || {}).filter(
    (p: any) => p && p.userId === userId
  );
  const allUsage = Object.values(db.ai_usage || {}).filter(
    (u: any) => u && u.userId === userId
  );

  const now = new Date();
  let cutoffTime = 0;
  if (period === "7d") {
    cutoffTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  } else if (period === "30d") {
    cutoffTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;
  } else if (period === "90d") {
    cutoffTime = now.getTime() - 90 * 24 * 60 * 60 * 1000;
  }

  const filteredPlans = allPlans.filter((p: any) => {
    if (cutoffTime === 0) return true;
    const planTime = new Date(p.scheduledDate || p.createdAt || 0).getTime();
    return planTime >= cutoffTime;
  });

  const filteredUsage = allUsage.filter((u: any) => {
    if (cutoffTime === 0) return true;
    const usageTime = new Date(u.createdAt || 0).getTime();
    return usageTime >= cutoffTime;
  });

  const totalContent = filteredPlans.length;
  let scheduled = 0;
  let published = 0;
  let draft = 0;
  let cancelled = 0;

  const platformDistribution = {
    Facebook: 0,
    Instagram: 0,
    TikTok: 0,
    YouTube: 0,
    X: 0,
    Other: 0,
  };

  filteredPlans.forEach((plan: any) => {
    const st = String(plan.status || "").toLowerCase();
    if (st === "scheduled" || st === "siap diposting") {
      scheduled++;
    } else if (st === "published" || st === "diposting") {
      published++;
    } else if (st === "draft" || st === "ide") {
      draft++;
    } else if (st === "cancelled" || st === "ditunda") {
      cancelled++;
    } else {
      draft++;
    }

    const pf = String(plan.platform || "").trim();
    if (pf === "Facebook") platformDistribution.Facebook++;
    else if (pf === "Instagram") platformDistribution.Instagram++;
    else if (pf === "TikTok") platformDistribution.TikTok++;
    else if (pf === "YouTube") platformDistribution.YouTube++;
    else if (pf === "X") platformDistribution.X++;
    else platformDistribution.Other++;
  });

  const aiFeatureBreakdown: Record<string, number> = {
    "Content Analyzer": 0,
    "Content Ideas": 0,
    "Caption Maker": 0,
    "Hook Generator": 0,
    "Script Maker": 0,
    "Hashtag Generator": 0,
  };

  filteredUsage.forEach((u: any) => {
    const featureName = String(u.feature || "Lainnya").trim();
    if (aiFeatureBreakdown[featureName] !== undefined) {
      aiFeatureBreakdown[featureName]++;
    } else {
      aiFeatureBreakdown[featureName] = 1;
    }
  });

  const daysCount = period === "7d" ? 7 : period === "30d" ? 14 : 7;
  const dailyActivity: Array<{ date: string; plans: number; ai: number }> = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split("T")[0];
    const plansOnDay = filteredPlans.filter((p: any) => {
      const pDate = (p.scheduledDate || p.createdAt || "").split("T")[0];
      return pDate === dateStr;
    }).length;
    const aiOnDay = filteredUsage.filter((u: any) => {
      const uDate = (u.createdAt || "").split("T")[0];
      return uDate === dateStr;
    }).length;

    dailyActivity.push({
      date: dateStr,
      plans: plansOnDay,
      ai: aiOnDay,
    });
  }

  const summary = {
    period,
    totalContent,
    scheduled,
    published,
    draft,
    cancelled,
    platformDistribution,
    totalAiGenerations: filteredUsage.length,
    aiFeatureBreakdown,
    dailyActivity,
    totalContentPlans: totalContent,
    contentDiposting: published,
    contentDraft: draft,
    contentSiapDiposting: scheduled,
    contentIde: draft,
    contentDitunda: cancelled,
  };

  res.json({ summary });
});

// ====================================================
// TAHAP 8: ACCOUNT, PROFILE, PREMIUM, CREDITS, USAGE
// ====================================================

const AI_FEATURE_KEYS = [
  "chat",
  "content-analyzer",
  "content-ideas",
  "caption-maker",
  "hook-generator",
  "script-maker",
  "hashtag-generator",
] as const;

const AI_FEATURE_LABELS: Record<string, string> = {
  chat: "Chat AI",
  "content-analyzer": "Content Analyzer",
  "content-ideas": "Content Ideas",
  "caption-maker": "Caption Maker",
  "hook-generator": "Hook Generator",
  "script-maker": "Script Maker",
  "hashtag-generator": "Hashtag Generator",
};

const FREE_DAILY_LIMIT_PER_FEATURE = 5;

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function resolveUserAndSubscription(db: FirestoreMockDb, userId: string) {
  let user = db.users[userId];
  const now = new Date().toISOString();
  if (!user) {
    user = {
      id: userId,
      email: userId === DEFAULT_CREATOR_UID ? DEFAULT_CREATOR_EMAIL : `${userId}@arvinstudio.id`,
      displayName: userId === DEFAULT_CREATOR_UID ? "Agnesya Kartika" : "Kreator ARVIN",
      username: userId === DEFAULT_CREATOR_UID ? "agnesyakartika" : `creator_${userId.substring(0, 6)}`,
      photoURL: "",
      bio: "Digital Content Creator",
      credits: 5,
      createdAt: now,
      updatedAt: now,
    };
    db.users[userId] = user;

    db.credit_transactions[`tx_init_${userId}`] = {
      id: `tx_init_${userId}`,
      userId,
      type: "BONUS",
      amount: 5,
      feature: "Bonus Registrasi",
      description: "Kredit selamat datang untuk pengguna baru ARVIN STUDIO",
      createdAt: now,
    };
  }

  let sub = db.subscriptions[`sub_${userId}`];
  if (!sub) {
    sub = {
      id: `sub_${userId}`,
      userId,
      plan: "FREE",
      status: "FREE",
      startDate: now,
      endDate: null,
      createdAt: now,
      updatedAt: now,
    };
    db.subscriptions[`sub_${userId}`] = sub;
  }

  // Check if subscription has expired
  if (sub.status === "PREMIUM_ACTIVE" && sub.endDate) {
    const endMs = new Date(sub.endDate).getTime();
    if (Date.now() > endMs) {
      sub.status = "PREMIUM_EXPIRED";
      sub.updatedAt = now;
      db.subscriptions[`sub_${userId}`] = sub;
    }
  }

  return { user, sub };
}

function getDailyUsageMap(db: FirestoreMockDb, userId: string, dateStr: string) {
  const map: Record<string, { count: number; limit: number; remaining: number; featureLabel: string }> = {};
  for (const feat of AI_FEATURE_KEYS) {
    const usageId = `${userId}_${dateStr}_${feat}`;
    const rec = db.daily_usage[usageId];
    const count = rec ? rec.count || 0 : 0;
    map[feat] = {
      count,
      limit: FREE_DAILY_LIMIT_PER_FEATURE,
      remaining: Math.max(0, FREE_DAILY_LIMIT_PER_FEATURE - count),
      featureLabel: AI_FEATURE_LABELS[feat] || feat,
    };
  }
  return map;
}

// 1. GET /api/account
app.get("/api/account", (req: Request, res: Response) => {
  const userId = String(req.query.userId || DEFAULT_CREATOR_UID);
  const db = getDatabase();
  const { user, sub } = resolveUserAndSubscription(db, userId);

  // Calculate credits used
  const allTx = Object.values(db.credit_transactions || {}).filter(
    (t: any) => t.userId === userId
  );
  const creditsUsed = allTx
    .filter((t: any) => t.type === "USE")
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

  const todayStr = getTodayString();
  const dailyUsage = getDailyUsageMap(db, userId, todayStr);
  const isPremium = sub.status === "PREMIUM_ACTIVE";

  saveDatabase(db);
  res.json({
    user,
    subscription: sub,
    creditsBalance: user.credits || 0,
    creditsUsed,
    dailyUsage,
    isPremium,
  });
});

// 2. PUT /api/account/profile
app.put("/api/account/profile", (req: Request, res: Response) => {
  const { userId, displayName, username, bio, photoURL } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId diperlukan" });
  }

  const db = getDatabase();
  const { user } = resolveUserAndSubscription(db, userId);

  if (displayName !== undefined) user.displayName = String(displayName).trim();
  if (username !== undefined) {
    const sanitizedUsername = String(username).replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();
    user.username = sanitizedUsername;
  }
  if (bio !== undefined) user.bio = String(bio).trim();
  if (photoURL !== undefined) user.photoURL = String(photoURL).trim();
  user.updatedAt = new Date().toISOString();

  db.users[userId] = user;
  saveDatabase(db);

  res.json({ success: true, user });
});

// 3. GET /api/subscription
app.get("/api/subscription", (req: Request, res: Response) => {
  const userId = String(req.query.userId || DEFAULT_CREATOR_UID);
  const db = getDatabase();
  const { sub } = resolveUserAndSubscription(db, userId);
  saveDatabase(db);
  res.json({
    subscription: sub,
    isPremium: sub.status === "PREMIUM_ACTIVE",
  });
});

// 4. POST /api/subscription/simulate
app.post("/api/subscription/simulate", (req: Request, res: Response) => {
  const { userId, plan, status } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId diperlukan" });
  }

  const db = getDatabase();
  const { sub } = resolveUserAndSubscription(db, userId);
  const now = new Date();

  if (status === "FREE" || plan === "FREE") {
    sub.plan = "FREE";
    sub.status = "FREE";
    sub.endDate = null;
  } else if (status === "PREMIUM_EXPIRED") {
    sub.status = "PREMIUM_EXPIRED";
    sub.plan = plan || sub.plan || "MONTHLY";
    // Set endDate to yesterday
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    sub.endDate = past.toISOString();
  } else if (status === "PREMIUM_ACTIVE" || !status) {
    sub.status = "PREMIUM_ACTIVE";
    sub.plan = plan || "MONTHLY";
    sub.startDate = now.toISOString();

    let durationDays = 30;
    if (sub.plan === "WEEKLY") durationDays = 7;
    else if (sub.plan === "MONTHLY") durationDays = 30;
    else if (sub.plan === "YEARLY") durationDays = 365;

    const future = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    sub.endDate = future.toISOString();
  }

  sub.updatedAt = now.toISOString();
  db.subscriptions[`sub_${userId}`] = sub;
  saveDatabase(db);

  res.json({ success: true, subscription: sub, isPremium: sub.status === "PREMIUM_ACTIVE" });
});

// 5. GET /api/credits
app.get("/api/credits", (req: Request, res: Response) => {
  const userId = String(req.query.userId || DEFAULT_CREATOR_UID);
  const db = getDatabase();
  const { user } = resolveUserAndSubscription(db, userId);

  const allTx = Object.values(db.credit_transactions || {})
    .filter((t: any) => t.userId === userId)
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const creditsUsed = allTx
    .filter((t: any) => t.type === "USE")
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount || 0), 0);

  saveDatabase(db);
  res.json({
    balance: user.credits || 0,
    creditsUsed,
    transactions: allTx,
  });
});

// 6. POST /api/credits/transact
app.post("/api/credits/transact", (req: Request, res: Response) => {
  const { userId, type, amount, feature, description } = req.body;
  if (!userId || !type || amount === undefined) {
    return res.status(400).json({ error: "userId, type, and amount diperlukan" });
  }

  const db = getDatabase();
  const { user } = resolveUserAndSubscription(db, userId);

  const amt = Number(amount);
  if (type === "USE" && (user.credits || 0) < Math.abs(amt)) {
    return res.status(400).json({ error: "Saldo kredit tidak mencukupi" });
  }

  if (type === "USE") {
    user.credits = Math.max(0, (user.credits || 0) - Math.abs(amt));
  } else {
    user.credits = (user.credits || 0) + Math.abs(amt);
  }
  user.updatedAt = new Date().toISOString();
  db.users[userId] = user;

  const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tx = {
    id: txId,
    userId,
    type,
    amount: type === "USE" ? -Math.abs(amt) : Math.abs(amt),
    feature: feature || "Penyesuaian Kredit",
    description: description || "Transaksi kredit ARVIN STUDIO",
    createdAt: new Date().toISOString(),
  };

  db.credit_transactions[txId] = tx;
  saveDatabase(db);

  res.json({ success: true, balance: user.credits, transaction: tx });
});

// 7. GET /api/usage-limit/status
app.get("/api/usage-limit/status", (req: Request, res: Response) => {
  const userId = String(req.query.userId || DEFAULT_CREATOR_UID);
  const db = getDatabase();
  const { sub } = resolveUserAndSubscription(db, userId);
  const isPremium = sub.status === "PREMIUM_ACTIVE";
  const todayStr = getTodayString();
  const dailyUsage = getDailyUsageMap(db, userId, todayStr);

  saveDatabase(db);
  res.json({
    isPremium,
    subscriptionStatus: sub.status,
    dailyUsage,
  });
});

// 8. GET /api/usage-limit/check
app.get("/api/usage-limit/check", (req: Request, res: Response) => {
  const userId = String(req.query.userId || DEFAULT_CREATOR_UID);
  const feature = String(req.query.feature || "").trim();

  if (!feature) {
    return res.status(400).json({ error: "feature diperlukan" });
  }

  const db = getDatabase();
  const { sub } = resolveUserAndSubscription(db, userId);
  const isPremium = sub.status === "PREMIUM_ACTIVE";

  if (isPremium) {
    saveDatabase(db);
    return res.json({
      allowed: true,
      feature,
      count: 0,
      limit: 99999,
      remaining: 99999,
      isPremium: true,
      reason: "ALLOWED",
    });
  }

  const todayStr = getTodayString();
  const usageId = `${userId}_${todayStr}_${feature}`;
  const rec = db.daily_usage[usageId];
  const count = rec ? rec.count || 0 : 0;
  const limit = FREE_DAILY_LIMIT_PER_FEATURE;
  const remaining = Math.max(0, limit - count);

  saveDatabase(db);

  if (count >= limit) {
    return res.json({
      allowed: false,
      feature,
      count,
      limit,
      remaining: 0,
      isPremium: false,
      reason: "DAILY_LIMIT_REACHED",
    });
  }

  return res.json({
    allowed: true,
    feature,
    count,
    limit,
    remaining,
    isPremium: false,
    reason: "ALLOWED",
  });
});

// 9. POST /api/usage-limit/consume
app.post("/api/usage-limit/consume", (req: Request, res: Response) => {
  const { userId, feature } = req.body;
  if (!userId || !feature) {
    return res.status(400).json({ error: "userId dan feature diperlukan" });
  }

  const db = getDatabase();
  const { sub } = resolveUserAndSubscription(db, userId);
  const isPremium = sub.status === "PREMIUM_ACTIVE";

  // For premium users, track usage for metrics but don't limit
  const todayStr = getTodayString();
  const usageId = `${userId}_${todayStr}_${feature}`;
  const rec = db.daily_usage[usageId];
  const currentCount = rec ? rec.count || 0 : 0;
  const newCount = currentCount + 1;

  db.daily_usage[usageId] = {
    id: usageId,
    userId,
    date: todayStr,
    feature,
    count: newCount,
    updatedAt: new Date().toISOString(),
  };

  saveDatabase(db);

  res.json({
    success: true,
    feature,
    count: newCount,
    limit: isPremium ? 99999 : FREE_DAILY_LIMIT_PER_FEATURE,
    remaining: isPremium ? 99999 : Math.max(0, FREE_DAILY_LIMIT_PER_FEATURE - newCount),
    isPremium,
  });
});

// 10. POST /api/auth/login
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email, displayName } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email diperlukan" });
  }

  const db = getDatabase();
  const cleanEmail = String(email).trim().toLowerCase();

  // Find user by email or create
  let user = Object.values(db.users || {}).find(
    (u: any) => (u.email || "").toLowerCase() === cleanEmail
  );

  const now = new Date().toISOString();

  if (!user) {
    const userId = cleanEmail === DEFAULT_CREATOR_EMAIL
      ? DEFAULT_CREATOR_UID
      : `usr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;

    const derivedUsername = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

    user = {
      id: userId,
      email: cleanEmail,
      displayName: displayName || derivedUsername || "Kreator ARVIN",
      username: derivedUsername || `user_${userId.substring(0, 5)}`,
      photoURL: "",
      bio: "Digital Content Creator",
      credits: 5,
      createdAt: now,
      updatedAt: now,
    };
    db.users[userId] = user;

    db.subscriptions[`sub_${userId}`] = {
      id: `sub_${userId}`,
      userId,
      plan: "FREE",
      status: "FREE",
      startDate: now,
      endDate: null,
      createdAt: now,
      updatedAt: now,
    };

    db.credit_transactions[`tx_init_${userId}`] = {
      id: `tx_init_${userId}`,
      userId,
      type: "BONUS",
      amount: 5,
      feature: "Bonus Registrasi",
      description: "Kredit selamat datang untuk pengguna baru ARVIN STUDIO",
      createdAt: now,
    };
  }

  const sub = db.subscriptions[`sub_${user.id}`];
  saveDatabase(db);

  res.json({
    success: true,
    user,
    subscription: sub,
  });
});



async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`ARVIN STUDIO Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
