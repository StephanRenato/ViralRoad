
import { createClient } from '@supabase/supabase-js';

// Credenciais fornecidas para integração com o projeto Supabase do usuário
export const supabaseUrl = 'https://pawcolinueutmyxxlrui.supabase.co';
export const supabaseAnonKey = 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ';

// Inicialização segura do cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
