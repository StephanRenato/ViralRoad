
export enum ProfileType {
  InfluencerGeneral = 'Influenciador Geral',
  Lawyer = 'Advogado',
  Fitness = 'Fitness / Saúde',
  Beauty = 'Beleza / Skincare',
  Tech = 'Tecnologia / Gadgets',
  Finance = 'Finanças / Investimentos',
  Fashion = 'Moda / Estilo',
  Travel = 'Viagem / Lifestyle',
  Comedy = 'Comédia / Humor',
  Education = 'Educação / Idiomas',
  Gastronomy = 'Gastronomia / Receitas',
  Gamer = 'Gamer / Streamer',
  Parenting = 'Maternidade / Paternidade',
  Sales = 'Vendas / Afiliado'
}

export enum Platform {
  Instagram = 'Instagram',
  TikTok = 'TikTok',
  Kwai = 'Kwai',
  YouTube = 'YouTube'
}

export enum Format {
  Reels = 'Reels (9:16)',
  Carousel = 'Carrossel (4:5)',
  Stories = 'Stories (9:16)',
  Post = 'Feed Quadrado (1:1)',
  ShortVideo = 'Vídeo Curto',
  LongVideo = 'Vídeo Longo'
}

export enum UserLevel {
  Beginner = 'Iniciante',
  Intermediate = 'Intermediário',
  Advanced = 'Avançado'
}

export enum FunnelStage {
  Top = 'Topo (Consciência)',
  Middle = 'Meio (Consideração)',
  Bottom = 'Fundo (Conversão)'
}

export enum TargetAudience {
  NewFollowers = 'Novos Seguidores',
  ExistingAudience = 'Audiência Atual',
  PotentialClients = 'Clientes Potenciais'
}

export enum CommunicationMode {
  Light = 'Leve / Divertido',
  Serious = 'Sério / Institucional',
  Educational = 'Educativo / Técnico',
  Provocative = 'Provocador / Polêmico',
  Inspirational = 'Inspirador / Storytelling'
}

export enum ContentStatus {
  Idea = 'ideia',
  Approved = 'aprovado',
  Planned = 'agendado',
  Published = 'publicado'
}

export enum PlanType {
  Starter = 'starter',
  Creator = 'creator',
  Pro = 'pro'
}

export enum SubscriptionStatus {
  Active = 'active',
  Trialing = 'trialing',
  PastDue = 'past_due',
  Canceled = 'canceled',
  None = 'none'
}

export interface RoadLabel {
  id: string;
  text: string;
  color: string;
}

export interface RoadSubtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface GeneratedContent {
  id: string;
  userId: string;
  type: 'blueprint' | 'content';
  segment: string;
  profileType: ProfileType;
  specialization?: string;
  platform: Platform;
  format: Format;
  funnel: FunnelStage;
  level: UserLevel;
  targetAudience: TargetAudience;
  communicationMode?: CommunicationMode;
  title?: string;
  objective: string;
  pilar: string;
  mainMetric: string;
  hook: string;
  script: string;
  caption: string;
  hashtags: string;
  creativeDirection: string;
  distribution: string;
  nextTest: string;
  nextContentRecommendation?: string;
  nextFunnelStage?: string;
  status: ContentStatus;
  date: string;
  startDate?: string;
  endDate?: string;
  labels?: RoadLabel[];
  subtasks?: RoadSubtask[];
  tags?: string[];
}

export interface SocialPostAnalysis {
  type: string;
  topic: string;
  engagement_score: number;
  insight: string;
}

export interface AudienceDemographics {
  age_range?: string;
  gender_split?: string;
  top_locations?: string[];
  audience_persona?: string;
}

export interface ExtendedDiagnostic {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface RoadDiagnostic {
  status_label: string;
  content_strategy_advice: string;
  tone_audit: string;
  key_action_item: string;
}

export interface ApifyRawData {
  user?: any;
  stats?: any;
  videos?: any[];
  [key: string]: any;
}

// Normalized Metrics based on user prompt
export interface NormalizedMetrics {
  followers: number | null;
  following: number | null;
  likes: number | null;
  posts: number | null;
  views: number | null;
  engagement_rate: number | null;
  bio: string | null;
  avatar_url: string | null;
  external_link: string | null;
  verified: boolean | null;
  is_private: boolean | null;
  
  // Backwards compatibility for internal use if needed (mapped from old types)
  handle?: string; 
}

// Analysis AI structure based on user prompt
export interface AnalysisAi {
  viral_score: number | null;
  content_pillars: string[] | null;
  best_format: string | null;
  frequency_suggestion: string | null;
  bio_suggestion: string | null;
  diagnostic: {
    status_label: string;
    key_action_item: string;
    content_strategy_advice: string;
    tone_audit: string;
  };
  
  // Optional extras from Gemini service
  top_performing_content?: SocialPostAnalysis[];
  next_post_recommendation?: {
    format: string;
    topic: string;
    reason: string;
  };
  audience_demographics?: AudienceDemographics;
  profile_optimization?: {
    name_suggestion: string;
    bio_suggestion: string;
  };
  extended_diagnostic?: ExtendedDiagnostic;
}

export interface SocialProfile {
  platform: string;
  url: string;
  username: string;
  normalized_metrics: NormalizedMetrics;
  analysis_ai: AnalysisAi;
  raw_apify_data: any;
  last_sync: string;
  
  // Helper for UI logic
  objective?: string;
}

export interface AnalysisResult {
  results: {
    profile_id: string;
    analysis: any; // Flexible to accommodate mapping
  }[];
  detected_specialization?: string;
  suggestion_reason?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  profileType?: ProfileType;
  specialization?: string;
  avatarUrl?: string;
  stripeCustomerId?: string;
  subscriptionStatus?: SubscriptionStatus;
  currentPlan?: PlanType;
  subscriptionEndDate?: string;
  usedBlueprints?: number;
  monthlyLimit?: number;
  notificationsAiDaily?: boolean;
  notificationsEngagement?: boolean;
  socialProfiles?: SocialProfile[];
}

export interface UsageLimit {
  user_id: string;
  plan: PlanType;
  monthly_limit: number;
  used_this_month: number;
}
