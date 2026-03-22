
import { createClient } from '@supabase/supabase-js';
import { User, SocialProfile, NormalizedMetrics, AnalysisAi } from '../types';

// Credenciais via variáveis de ambiente para segurança e flexibilidade
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ';

// Inicialização segura do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'viral-road-auth-token',
    flowType: 'pkce'
  }
});

/**
 * Service to manage Creator Data (Profiles)
 */
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId: string, profileData: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId);
    return { data, error };
  }
};

/**
 * Service to manage Content Performance Metrics
 */
export const metricsService = {
  async saveMetrics(userId: string, platform: string, handle: string, metrics: NormalizedMetrics) {
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert({
        user_id: userId,
        platform,
        handle,
        followers: metrics.followers,
        following: metrics.following,
        likes: metrics.likes,
        posts: metrics.posts,
        views: metrics.views,
        engagement_rate: metrics.engagement_rate
      });
    return { data, error };
  },

  async getMetricsHistory(userId: string, platform?: string) {
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: false });
    
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data, error } = await query;
    return { data, error };
  }
};

/**
 * Service to manage User Engagement Analytics
 */
export const analyticsService = {
  async saveAnalysis(userId: string, platform: string, analysis: AnalysisAi) {
    const { data, error } = await supabase
      .from('engagement_analytics')
      .insert({
        user_id: userId,
        platform,
        viral_score: analysis.viral_score,
        best_format: analysis.best_format,
        frequency_suggestion: analysis.frequency_suggestion,
        content_pillars: analysis.content_pillars,
        diagnostic: analysis.diagnostic,
        next_post_recommendation: analysis.next_post_recommendation
      });
    return { data, error };
  },

  async getLatestAnalysis(userId: string, platform: string) {
    const { data, error } = await supabase
      .from('engagement_analytics')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single();
    return { data, error };
  }
};
