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
  | 'account'
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
  | 'history'
  | 'account'
  | 'profile'
  | 'premium'
  | 'credits'
  | 'settings'
  | 'login'
  | 'register'
  | 'forgot-password';

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
  | 'Facebook'
  | 'Instagram'
  | 'TikTok'
  | 'YouTube'
  | 'X'
  | 'Other'
  | 'LinkedIn';

export type ContentPlanFormat =
  | 'Post'
  | 'Reel'
  | 'Story'
  | 'Video'
  | 'Carousel'
  | 'Article'
  | 'Other'
  | 'Reels'
  | 'Image'
  | 'Short'
  | 'Long Video'
  | 'Text Post'
  | 'Artikel';

export type ContentPlanStatus =
  | 'Draft'
  | 'Scheduled'
  | 'Published'
  | 'Cancelled'
  | 'Ide'
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

export interface PlatformDistribution {
  Facebook: number;
  Instagram: number;
  TikTok: number;
  YouTube: number;
  X: number;
  Other: number;
}

export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  totalContent: number;
  scheduled: number;
  published: number;
  draft: number;
  cancelled: number;
  platformDistribution: PlatformDistribution;
  totalAiGenerations: number;
  aiFeatureBreakdown: Record<string, number>;
  dailyActivity: Array<{
    date: string;
    plans: number;
    ai: number;
  }>;
  // Legacy backwards-compatible aliases
  totalContentPlans?: number;
  contentDiposting?: number;
  contentDraft?: number;
  contentSiapDiposting?: number;
  contentIde?: number;
  contentDitunda?: number;
  totalGenerated?: number;
  plansByStatus?: { Draft: number; Scheduled: number; Published: number; Cancelled: number };
  toolUsageStats?: Array<{ feature: string; count: number; percentage: number }>;
  dailyUsageTrend?: Array<{ date: string; count: number }>;
}

// ----------------------------------------------------
// TAHAP 8: ACCOUNT, PROFILE, SUBSCRIPTION, & CREDITS
// ----------------------------------------------------

export interface UserProfile {
  id: string;
  uid: string;
  fullName: string;
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  adminAccess?: boolean;
  plan: 'FREE' | 'PREMIUM';
  subscriptionStatus: 'INACTIVE' | 'ACTIVE';
  subscriptionExpiry?: string | null;
  // Backwards compatibility
  displayName?: string;
  credits?: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentSubscriptionStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface SubscriptionRecord {
  id: string;
  userId: string;
  plan: string;
  price: number;
  duration: string;
  status: PaymentSubscriptionStatus;
  paymentProofUrl?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlan = 'FREE' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'FREE' | 'PREMIUM_ACTIVE' | 'PREMIUM_EXPIRED';

export interface UserSubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreditTransactionType =
  | 'EARN'
  | 'USE'
  | 'BONUS'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;
  feature: string;
  description: string;
  createdAt: string;
}

export type AiFeatureKey =
  | 'chat'
  | 'content-analyzer'
  | 'content-ideas'
  | 'caption-maker'
  | 'hook-generator'
  | 'script-maker'
  | 'hashtag-generator';

export interface DailyUsageRecord {
  id: string;
  userId: string;
  date: string;
  feature: AiFeatureKey;
  count: number;
  updatedAt: string;
}

export interface FeatureUsageStatus {
  feature: AiFeatureKey;
  featureLabel: string;
  count: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
}

export interface UsageLimitCheckResult {
  allowed: boolean;
  feature: AiFeatureKey;
  count: number;
  limit: number;
  remaining: number;
  isPremium: boolean;
  reason?: 'DAILY_LIMIT_REACHED' | 'EXPIRED_FALLBACK_TO_FREE' | 'ALLOWED';
}

export interface AccountSummary {
  user: UserProfile;
  subscription: UserSubscription;
  creditsBalance: number;
  creditsUsed: number;
  dailyUsage: Record<AiFeatureKey, FeatureUsageStatus>;
  isPremium: boolean;
}

// ----------------------------------------------------
// TAHAP 8B: SUPER ADMIN PANEL
// ----------------------------------------------------

export type AdminViewKey =
  | 'dashboard'
  | 'user-management'
  | 'premium-management'
  | 'payment-verification'
  | 'credit-management'
  | 'ai-usage'
  | 'content-history'
  | 'activity-logs'
  | 'system-settings'
  | 'admin-profile';

export interface AdminActivityLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  action: string;
  targetUserId?: string | null;
  targetSubscriptionId?: string | null;
  description: string;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  freeUsers: number;
  premiumUsers: number;
  pendingPayments: number;
  totalAiUsage: number;
  activeSubscriptions: number;
  revenue: number;
}





