
import { createClient } from '@supabase/supabase-js';

// Credenciais via variáveis de ambiente para segurança e flexibilidade (Vercel/Local)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ';

// Inicialização segura do cliente Supabase com configurações otimizadas para iframes
let supabaseClient: any;
try {
  console.log("🔗 Supabase: Inicializando cliente...");
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'viral-road-auth-token',
      flowType: 'pkce'
    }
  });
  console.log("✅ Supabase: Cliente inicializado.");
} catch (error) {
  console.error("💥 Supabase: Erro crítico na inicialização:", error);
  // Fallback para evitar crash total, embora o app precise do Supabase
  supabaseClient = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
    })
  };
}

export const supabase = supabaseClient;
