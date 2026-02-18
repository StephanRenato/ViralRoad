
-- VIRAL ROAD - SQL SETUP
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Tabela de Perfis (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  profile_type TEXT,
  specialization TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'none',
  current_plan TEXT DEFAULT 'starter',
  social_profiles JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Conteúdos (Blueprints)
CREATE TABLE IF NOT EXISTS public.content_blueprints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT,
  blueprint_type TEXT,
  script TEXT,
  caption TEXT,
  hashtags TEXT,
  niche TEXT,
  sub_niche TEXT,
  funnel_stage TEXT,
  platform TEXT,
  format TEXT,
  status TEXT DEFAULT 'ideia',
  scheduled_date TIMESTAMP WITH TIME ZONE,
  labels JSONB DEFAULT '[]'::jsonb,
  subtasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Ganchos (Hooks)
CREATE TABLE IF NOT EXISTS public.hooks_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  niche TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Limites de Uso
CREATE TABLE IF NOT EXISTS public.usage_limits (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  plan TEXT DEFAULT 'starter',
  monthly_limit INTEGER DEFAULT 5,
  used_this_month INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurações de RLS (Segurança)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hooks_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

-- Políticas Simples: Apenas o dono acessa seus dados
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can manage own blueprints" ON public.content_blueprints FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own hooks" ON public.hooks_library FOR ALL USING (auth.uid() = user_id);
