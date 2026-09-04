export type MessageRole = 'user' | 'model';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export type SidebarMenuItemId =
  | 'new-chat'
  | 'content-analyzer'
  | 'content-ideas'
  | 'caption-maker'
  | 'hook-generator'
  | 'script-maker'
  | 'hashtag-generator'
  | 'content-planner'
  | 'analytics'
  | 'history'
  | 'premium'
  | 'credits'
  | 'profile'
  | 'settings';

export interface MenuItem {
  id: SidebarMenuItemId;
  label: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface MenuGroup {
  category: string;
  items: MenuItem[];
}

export type PlatformType =
  | 'Instagram'
  | 'TikTok'
  | 'Facebook'
  | 'YouTube'
  | 'X'
  | 'LinkedIn'
  | 'Umum';

export type ContentCategoryType =
  | 'Caption'
  | 'Hook'
  | 'Script'
  | 'Judul'
  | 'Deskripsi'
  | 'Copywriting'
  | 'Ide Konten'
  | 'Konten Umum';

export interface AnalysisMetrics {
  hook: number;
  clarity: number;
  engagement: number;
  value: number;
  structure: number;
  cta: number;
  platformFit: number;
}

export interface ContentAnalysisResult {
  overallScore: number;
  metrics: AnalysisMetrics;
  summary: string;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  improvedVersion: string;
  improvedVersionTitle?: string;
  platform: PlatformType;
  contentType: ContentCategoryType;
  originalContent: string;
  analyzedAt: string;
}

export type IdeaPlatform =
  | 'Instagram'
  | 'TikTok'
  | 'Facebook'
  | 'YouTube'
  | 'X'
  | 'LinkedIn'
  | 'Semua Platform';

export type IdeaGoal =
  | 'Meningkatkan Engagement'
  | 'Mendapatkan Followers'
  | 'Meningkatkan Penjualan'
  | 'Membangun Personal Branding'
  | 'Edukasi'
  | 'Entertainment'
  | 'Promosi Produk'
  | 'Branding';

export type IdeaStyle =
  | 'Edukatif'
  | 'Santai'
  | 'Profesional'
  | 'Storytelling'
  | 'Kontroversial'
  | 'Inspiratif'
  | 'Lucu'
  | 'Persuasif';

export type IdeaCount = 5 | 10 | 15;

export interface ContentIdeaItem {
  id: string;
  title: string;
  hook: string;
  concept: string;
  format: string;
  targetAudience: string;
  cta: string;
  potential: string;
  executionTips?: string;
}

export interface GenerateIdeasParams {
  niche: string;
  targetAudience?: string;
  platform: IdeaPlatform;
  goal: IdeaGoal;
  style: IdeaStyle;
  count: IdeaCount;
  excludeTitles?: string[];
}

export type ActiveView =
  | 'chat'
  | 'content-analyzer'
  | 'content-ideas'
  | 'caption-maker'
  | 'hook-generator'
  | 'script-maker'
  | 'hashtag-generator'
  | 'content-planner'
  | 'analytics'
  | 'history';

export type CaptionPlatform =
  | 'Instagram'
  | 'TikTok'
  | 'Facebook'
  | 'YouTube'
  | 'X'
  | 'LinkedIn'
  | 'Umum';

export type CaptionStyle =
  | 'Santai'
  | 'Profesional'
  | 'Edukatif'
  | 'Persuasif'
  | 'Storytelling'
  | 'Inspiratif'
  | 'Lucu'
  | 'Elegan'
  | 'Viral / Catchy';

export type CaptionGoal =
  | 'Engagement'
  | 'Followers'
  | 'Penjualan'
  | 'Branding'
  | 'Edukasi'
  | 'Promosi'
  | 'Personal Branding';

export type CaptionLength = 'Pendek' | 'Sedang' | 'Panjang';

export type CaptionLanguage = 'Indonesia' | 'Indonesia + English' | 'English';

export type CaptionCta =
  | 'Tanpa CTA'
  | 'CTA Soft'
  | 'CTA Engagement'
  | 'CTA Penjualan'
  | 'CTA Follow';

export interface CaptionVariant {
  id: string;
  name: string;
  description: string;
  caption: string;
}

export interface GenerateCaptionParams {
  content: string;
  platform: CaptionPlatform;
  style: CaptionStyle;
  goal: CaptionGoal;
  length: CaptionLength;
  language: CaptionLanguage;
  cta: CaptionCta;
}

export interface GenerateCaptionResult {
  variants: CaptionVariant[];
  hashtags: string[];
  platform: CaptionPlatform;
  generatedAt: string;
}

export type HookPlatform =
  | 'TikTok'
  | 'Instagram Reels'
  | 'Instagram Post'
  | 'YouTube'
  | 'YouTube Shorts'
  | 'Facebook'
  | 'X'
  | 'LinkedIn'
  | 'Umum';

export type HookGoal =
  | 'Engagement'
  | 'Views'
  | 'Followers'
  | 'Penjualan'
  | 'Branding'
  | 'Edukasi'
  | 'Curiosity';

export type HookStyle =
  | 'Curiosity'
  | 'Problem / Pain Point'
  | 'Question'
  | 'Bold Statement'
  | 'Controversial'
  | 'Storytelling'
  | 'Fear of Missing Out'
  | 'Surprise'
  | 'Statistic'
  | 'Emotional'
  | 'Direct'
  | 'Educational';

export type HookCount = 5 | 10 | 15 | 20;

export interface HookItem {
  id?: string;
  number?: number;
  text: string;
  category: string;
  score: number;
  reason: string;
}

export interface TopHookItem {
  text: string;
  reason: string;
  category?: string;
}

export interface GenerateHooksParams {
  topic: string;
  platform: HookPlatform;
  targetAudience?: string;
  goal: HookGoal;
  style: HookStyle;
  count: HookCount;
  regenerateCount?: number;
}

export interface GenerateHooksResult {
  hooks: HookItem[];
  topHooks: TopHookItem[];
  platform: HookPlatform;
  topic: string;
  generatedAt: string;
}

// SCRIPT MAKER TYPES
export type ScriptPlatform =
  | 'TikTok'
  | 'Instagram Reels'
  | 'YouTube Shorts'
  | 'YouTube'
  | 'Facebook'
  | 'X'
  | 'LinkedIn'
  | 'Umum';

export type ScriptGoal =
  | 'Engagement'
  | 'Views'
  | 'Followers'
  | 'Penjualan'
  | 'Branding'
  | 'Edukasi'
  | 'Entertainment';

export type ScriptDuration =
  | '15 detik'
  | '30 detik'
  | '60 detik'
  | '90 detik'
  | '3 menit'
  | '5 menit'
  | '10 menit';

export type ScriptStyle =
  | 'Edukatif'
  | 'Storytelling'
  | 'Santai'
  | 'Profesional'
  | 'Persuasif'
  | 'Inspiratif'
  | 'Lucu'
  | 'Dramatis'
  | 'Viral / Catchy';

export interface ScriptScene {
  sceneNumber: number;
  timeRange?: string;
  visual: string;
  voiceOver: string;
  textOverlay?: string;
}

export interface GenerateScriptParams {
  topic: string;
  platform: ScriptPlatform;
  targetAudience?: string;
  goal: ScriptGoal;
  duration: ScriptDuration;
  style: ScriptStyle;
  useHook: boolean;
  regenerateCount?: number;
}

export interface GenerateScriptResult {
  title: string;
  hook?: string;
  opening: string;
  body: string;
  scenes?: ScriptScene[];
  cta: string;
  ending: string;
  score: number;
  scoreReason: string;
  platform: ScriptPlatform;
  duration: ScriptDuration;
  topic: string;
  generatedAt?: string;
}

// HASHTAG GENERATOR TYPES
export type HashtagPlatform =
  | 'TikTok'
  | 'Instagram'
  | 'YouTube'
  | 'Facebook'
  | 'X'
  | 'LinkedIn'
  | 'Umum';

export type HashtagGoal =
  | 'Reach'
  | 'Engagement'
  | 'Followers'
  | 'Penjualan'
  | 'Branding'
  | 'Edukasi';

export type HashtagCount = 5 | 10 | 15 | 20 | 30;

export type HashtagCategory = 'Broad' | 'Niche' | 'Target Audience' | 'Intent';

export interface HashtagItem {
  tag: string;
  category: HashtagCategory;
  relevanceScore: number;
  reason: string;
}

export interface GenerateHashtagsParams {
  topic: string;
  platform: HashtagPlatform;
  niche?: string;
  targetAudience?: string;
  goal: HashtagGoal;
  count: HashtagCount;
  regenerateCount?: number;
}

export interface GenerateHashtagsResult {
  hashtags: HashtagItem[];
  platform: HashtagPlatform;
  topic: string;
  niche?: string;
  targetAudience?: string;
  goal?: HashtagGoal;
  recommendation?: string;
  generatedAt?: string;
}

// CONTENT PLANNER TYPES
export type ContentPlanPlatform =
  | 'Instagram'
  | 'TikTok'
  | 'Facebook'
  | 'YouTube'
  | 'X'
  | 'LinkedIn';

export type ContentPlanFormat =
  | 'Reels'
  | 'Video'
  | 'Carousel'
  | 'Image'
  | 'Story'
  | 'Short'
  | 'Long Video'
  | 'Text Post'
  | 'Artikel';

export type ContentPlanStatus =
  | 'Ide'
  | 'Draft'
  | 'Siap Diposting'
  | 'Diposting'
  | 'Ditunda';

export interface ContentPlan {
  id: string;
  userId: string;
  title: string;
  topic: string;
  platform: ContentPlanPlatform;
  format: ContentPlanFormat;
  scheduledDate: string;
  scheduledTime: string;
  status: ContentPlanStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// AI USAGE ANALYTICS TYPES
export interface AiUsageRecord {
  id: string;
  userId: string;
  feature: string;
  createdAt: string;
}

// AI HISTORY TYPES
export type AiHistoryCategory =
  | 'Semua'
  | 'Chat'
  | 'Content Analyzer'
  | 'Content Ideas'
  | 'Caption Maker'
  | 'Hook Generator'
  | 'Script Maker'
  | 'Hashtag Generator';

export interface AiHistoryItem {
  id: string;
  userId: string;
  feature: string;
  title: string;
  inputSummary: string;
  result: string;
  createdAt: string;
}

// ANALYTICS TYPES
export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totalContentPlans: number;
  contentDiposting: number;
  contentDraft: number;
  contentSiapDiposting: number;
  contentIde: number;
  contentDitunda: number;
  totalAiGenerations: number;
  aiFeatureBreakdown: {
    'Content Analyzer': number;
    'Content Ideas': number;
    'Caption Maker': number;
    'Hook Generator': number;
    'Script Maker': number;
    'Hashtag Generator': number;
    'Chat AI': number;
  };
  dailyActivity: Array<{
    date: string;
    plans: number;
    ai: number;
  }>;
}



