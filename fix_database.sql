-- VIRAL ROAD - EMERGENCY DATABASE FIX
-- Execute este script no SQL Editor do seu projeto Supabase (https://app.supabase.com)
-- Isso resolverá os erros de "Column not found" e "RLS Policy Violation".

-- 1. Garantir que as colunas existam na tabela 'profiles'
DO $$ 
BEGIN
    -- Adicionar 'settings' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='settings') THEN
        ALTER TABLE public.profiles ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Adicionar 'updated_at' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar 'social_profiles' se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='social_profiles') THEN
        ALTER TABLE public.profiles ADD COLUMN social_profiles JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Recriar Políticas de Segurança (Garantindo acesso total ao dono do dado)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Política de Visualização
CREATE POLICY "Users can view own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Política de Atualização
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- Política de Inserção
CREATE POLICY "Users can insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- 4. Garantir permissões de schema
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 5. Opcional: Criar função para facilitar o upsert via RPC se necessário no futuro
CREATE OR REPLACE FUNCTION public.upsert_profile(profile_data JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios de quem criou a função (admin)
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, specialization, avatar_url, social_profiles, settings, updated_at)
  VALUES (
    (profile_data->>'id')::uuid,
    profile_data->>'name',
    profile_data->>'specialization',
    profile_data->>'avatar_url',
    COALESCE((profile_data->'social_profiles'), '[]'::jsonb),
    COALESCE((profile_data->'settings'), '{}'::jsonb),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    specialization = EXCLUDED.specialization,
    avatar_url = EXCLUDED.avatar_url,
    social_profiles = EXCLUDED.social_profiles,
    settings = EXCLUDED.settings,
    updated_at = NOW();
    
  RETURN profile_data;
END;
$$;
