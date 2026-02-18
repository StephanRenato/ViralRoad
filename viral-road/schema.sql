
-- VIRAL ROAD DATABASE SCHEMA
-- Focado em Alta Performance e Flexibilidade para Dados Reais (Apify)

-- 1. Atualização da Tabela de Perfis
-- Adiciona coluna para armazenar múltiplos perfis sociais com dados brutos e análises
-- Estrutura DEFINITIVA do objeto dentro do array JSONB 'social_profiles':
-- [
--   {
--     "platform": "instagram | tiktok | youtube | kwai",
--     "url": "https://tiktok.com/@usuario",
--     "username": "usuario",
--     "avatar_url": "url_real_do_apify",
--     "last_sync": "ISO_DATE_STRING",
--
--     "normalized_metrics": {
--       "followers": 1000,
--       "following": 50,
--       "likes": 5000,
--       "posts": 120,
--       "views": 10000,
--       "engagement_rate": 5.2,
--       "bio": "Bio do perfil",
--       "external_link": "link.bio",
--       "verified": false,
--       "is_private": false
--     },
--
--     "analysis_ai": {
--        "viral_score": 85,
--        "content_pillars": ["Humor", "Educação"],
--        "best_format": "Reels",
--        "frequency_suggestion": "1x por dia",
--        "bio_suggestion": "Bio otimizada",
--        "diagnostic": {
--           "status_label": "Em crescimento",
--           "key_action_item": "Postar mais stories",
--           "content_strategy_advice": "Focar em...",
--           "tone_audit": "Tom divertido"
--        }
--     },
--
--     "raw_apify_data": { ... }
--   }
-- ]

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS social_profiles JSONB DEFAULT '[]'::jsonb;

-- Adiciona coluna para configurações de usuário (Notificações, Preferências)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Índices para performance em consultas de JSONB
CREATE INDEX IF NOT EXISTS idx_profiles_social_profiles ON public.profiles USING gin (social_profiles);
