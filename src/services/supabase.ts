
import { createClient } from '@supabase/supabase-js';

// Credenciais via variáveis de ambiente para segurança e flexibilidade (Vercel/Local)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ';

// Inicialização segura do cliente Supabase com configurações otimizadas para iframes
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'viral-road-auth-token',
    flowType: 'pkce'
  }
});
