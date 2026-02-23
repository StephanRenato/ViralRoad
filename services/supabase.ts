
import { createClient } from '@supabase/supabase-js';

// Credenciais via variáveis de ambiente para segurança e flexibilidade (Vercel/Local)
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ';

// Inicialização segura do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
