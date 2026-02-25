-- VIRAL ROAD - SECURITY FIXES (v2)
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. Mover Extensão 'http' para um schema seguro
-- Como 'ALTER EXTENSION SET SCHEMA' não é suportado pela extensão http, 
-- a solução é remover e recriar no schema correto.
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
    -- Remove a extensão do public se ela existir
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http' AND (SELECT nspname FROM pg_namespace WHERE oid = extnamespace) = 'public') THEN
        DROP EXTENSION http;
    END IF;
    
    -- Cria a extensão no schema extensions
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'http') THEN
        CREATE EXTENSION http SCHEMA extensions;
    END IF;
END $$;

-- 2. Corrigir Search Path das Funções (Prevenção de Search Path Hijacking)
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.set_user_id_on_insert() SET search_path = public;
ALTER FUNCTION public.can_user_generate_blueprint(uuid) SET search_path = public;

-- Tenta corrigir run_apify_scraper se existir
DO $$
BEGIN
    ALTER FUNCTION public.run_apify_scraper(text, text) SET search_path = public;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Função run_apify_scraper não encontrada ou assinatura diferente.';
END $$;

-- 3. Nota sobre Senhas Vazadas (Leaked Passwords)
-- Esta funcionalidade requer o plano PRO do Supabase. 
-- Se você estiver no plano gratuito, pode ignorar este aviso de segurança no dashboard.
