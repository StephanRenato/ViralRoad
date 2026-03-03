import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
const SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const ANON_KEY = (process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ').trim();

if (!SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing. Administrative tasks (auth.admin) will fail.");
} else {
  console.log(`✅ SUPABASE_SERVICE_ROLE_KEY detected (Length: ${SERVICE_ROLE_KEY.length})`);
}

// Use SERVICE_ROLE_KEY for the server-side client to bypass RLS and perform admin tasks
const SUPABASE_KEY = SERVICE_ROLE_KEY || ANON_KEY;

const supabaseServer = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const ACTOR_IDS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-channel-scraper',
  kwai: 'luan.r.dev~kwai-profile-scraper'
};

const cleanJson = (text: string): string => {
  if (!text) return '{}';
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) return match[1].trim();
  if (text.trim().startsWith('{')) return text.trim();
  return text;
};

console.log("VIRAL ROAD Server starting...");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Log all requests for debugging
  app.use((req, res, next) => {
    if (req.url !== '/api/health' && req.url !== '/api/ping') {
      console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Viral Road API is live",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
  });

  // Ping for connectivity test
  app.get("/api/ping", (req, res) => {
    res.send("pong");
  });

  // Supabase Health Check
  app.get("/api/supabase-health", async (req, res) => {
    try {
      const { data, error } = await supabaseServer.from('profiles').select('count', { count: 'exact', head: true });
      
      return res.json({ 
        status: error ? 'error' : 'ok', 
        message: error ? error.message : 'Conexão com Supabase estável',
        details: error || null,
        config: {
          url: SUPABASE_URL.substring(0, 15) + '...',
          hasServiceKey: !!SERVICE_ROLE_KEY && SERVICE_ROLE_KEY.length > 20,
          hasAnonKey: !!ANON_KEY && ANON_KEY.length > 20,
          isServiceKeyValid: SERVICE_ROLE_KEY !== ANON_KEY
        }
      });
    } catch (error: any) {
      return res.status(500).json({ 
        status: 'error', 
        message: error.message || 'Falha catastrófica ao contatar Supabase' 
      });
    }
  });

  // Debug Environment (Masked)
  app.get("/api/debug-env", (req, res) => {
    res.json({
      SUPABASE_URL: SUPABASE_URL ? "SET" : "MISSING",
      SERVICE_ROLE_KEY: SERVICE_ROLE_KEY ? `SET (Length: ${SERVICE_ROLE_KEY.length})` : "MISSING",
      ANON_KEY: ANON_KEY ? `SET (Length: ${ANON_KEY.length})` : "MISSING",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "MISSING",
      APIFY_TOKEN: APIFY_TOKEN ? "SET" : "MISSING",
      NODE_ENV: process.env.NODE_ENV
    });
  });

  // DB Proxy Route (More resilient than client-side fetch)
  app.get("/api/db/profile", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Profile Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error("Supabase Get Profile Error:", error);
        throw error;
      }
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Profile Proxy Error:", error);
      return res.status(500).json({ 
        error: "DB_GET_PROFILE_ERROR", 
        message: error.message || "Erro ao carregar perfil via proxy." 
      });
    }
  });

  // DB Schema Check (Debug)
  app.get("/api/db/schema-check", async (req, res) => {
    try {
      const { data, error } = await supabaseServer.rpc('get_table_columns', { table_name: 'profiles' });
      
      // If RPC is not available, try a simple select
      if (error) {
        const { data: sample, error: selectError } = await supabaseServer.from('profiles').select('*').limit(1);
        return res.json({ 
          status: "fallback", 
          columns: sample ? Object.keys(sample[0] || {}) : [],
          error: selectError 
        });
      }
      
      return res.json({ status: "ok", columns: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/db/upsert-profile", async (req, res) => {
    const { userId, profileData } = req.body;
    console.log(`${new Date().toISOString()} | DB Upsert Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!profileData) return res.status(400).json({ error: "Missing profileData" });

    try {
      // Ensure the ID is set correctly in the payload
      const payload: any = { 
        ...profileData,
        id: userId,
        updated_at: new Date().toISOString()
      };

      // Recursive recovery for missing columns (PGRST204)
      const performUpsertWithRecovery = async (currentPayload: any, attempt = 1): Promise<{ data: any, error: any, removedColumns: string[] }> => {
        const removedColumns: string[] = [];
        const { data, error } = await supabaseServer
          .from('profiles')
          .upsert(currentPayload, { onConflict: 'id' })
          .select();

        if (error && error.code === 'PGRST204' && attempt < 5) {
          console.warn(`[Attempt ${attempt}] Column error: ${error.message}`);
          
          const missingColumnMatch = error.message.match(/column '([^']+)'/) || error.message.match(/'([^']+)' column/);
          const missingColumn = missingColumnMatch ? missingColumnMatch[1] : (error.message.includes("'settings' column") ? 'settings' : null);

          if (missingColumn && currentPayload[missingColumn] !== undefined) {
            console.log(`Removing problematic column '${missingColumn}' and retrying upsert...`);
            const nextPayload = { ...currentPayload };
            delete nextPayload[missingColumn];
            const result = await performUpsertWithRecovery(nextPayload, attempt + 1);
            return {
              ...result,
              removedColumns: [missingColumn, ...result.removedColumns]
            };
          }
        }
        return { data, error, removedColumns };
      };

      const { data, error, removedColumns } = await performUpsertWithRecovery(payload);
      
      if (error) {
        console.error("Final Supabase Upsert Error:", error);
        return res.status(400).json({ 
          error: "SUPABASE_UPSERT_ERROR", 
          message: error.message,
          details: error 
        });
      }
      return res.json({ 
        status: "ok", 
        data, 
        recovered: removedColumns.length > 0,
        removedColumns 
      });
    } catch (error: any) {
      console.error("DB Proxy Exception:", error);
      return res.status(500).json({ 
        error: "DB_PROXY_EXCEPTION", 
        message: error.message || "Erro interno ao processar upsert via proxy." 
      });
    }
  });

  // Auth Proxy Route (Fallback for metadata updates)
  app.post("/api/auth/update-metadata", async (req, res) => {
    const { userId, metadata } = req.body;
    console.log(`${new Date().toISOString()} | Auth Metadata Update Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!metadata) return res.status(400).json({ error: "Missing metadata" });

    try {
      if (!SERVICE_ROLE_KEY || SERVICE_ROLE_KEY === ANON_KEY) {
        console.warn("SERVICE_ROLE_KEY is missing or same as ANON_KEY. Auth Admin operations will likely fail.");
      }

      const { data, error } = await supabaseServer.auth.admin.updateUserById(userId, {
        user_metadata: metadata
      });
      
      if (error) {
        console.error("Supabase Auth Update Error:", error);
        
        // If it's a permission error, it might be the key
        if (error.status === 403 || error.code === 'not_admin') {
           return res.status(403).json({
             error: "AUTH_PERMISSION_ERROR",
             message: "O servidor não tem permissão para atualizar metadados (SERVICE_ROLE_KEY inválida ou ausente).",
             details: error
           });
        }

        return res.status(error.status || 500).json({ 
          error: "SUPABASE_AUTH_ERROR", 
          message: error.message,
          details: error
        });
      }
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("Auth Proxy Exception:", error);
      return res.status(500).json({ 
        error: "AUTH_PROXY_EXCEPTION", 
        message: error.message || "Erro interno ao atualizar metadados via proxy." 
      });
    }
  });

  // Hooks Library Proxy Routes
  app.get("/api/db/hooks", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Hooks Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('hooks_library')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Supabase Get Hooks Error:", error);
        return res.status(400).json({ error: "SUPABASE_ERROR", message: error.message });
      }
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Hooks Proxy Exception:", error);
      return res.status(500).json({ error: "DB_GET_HOOKS_EXCEPTION", message: error.message });
    }
  });

  app.post("/api/db/hooks", async (req, res) => {
    const { userId, payload } = req.body;
    console.log(`${new Date().toISOString()} | DB Insert Hooks Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      // Ensure userId is set on all items if it's an array
      const itemsToInsert = Array.isArray(payload) 
        ? payload.map(item => ({ ...item, user_id: userId }))
        : { ...payload, user_id: userId };

      const { data, error } = await supabaseServer
        .from('hooks_library')
        .insert(itemsToInsert)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Insert Hooks Error:", error);
      return res.status(500).json({ error: "DB_INSERT_HOOKS_ERROR", message: error.message });
    }
  });

  app.delete("/api/db/hooks/:id", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Delete Hook Request for ${id} (User: ${userId})`);
    
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { error } = await supabaseServer
        .from('hooks_library')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      return res.json({ status: "ok" });
    } catch (error: any) {
      console.error("DB Delete Hook Error:", error);
      return res.status(500).json({ error: "DB_DELETE_HOOK_ERROR", message: error.message });
    }
  });

  // Content Blueprints Proxy Routes
  app.get("/api/db/blueprints", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Blueprints Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('content_blueprints')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Blueprints Error:", error);
      return res.status(500).json({ error: "DB_GET_BLUEPRINTS_ERROR", message: error.message });
    }
  });

  app.post("/api/db/blueprints", async (req, res) => {
    const { userId, payload } = req.body;
    console.log(`${new Date().toISOString()} | DB Insert Blueprint Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      const itemToInsert = { ...payload, user_id: userId };

      const { data, error } = await supabaseServer
        .from('content_blueprints')
        .insert(itemToInsert)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Insert Blueprint Error:", error);
      return res.status(500).json({ error: "DB_INSERT_BLUEPRINT_ERROR", message: error.message });
    }
  });

  app.patch("/api/db/blueprints/:id", async (req, res) => {
    const { id } = req.params;
    const { userId, payload } = req.body;
    console.log(`${new Date().toISOString()} | DB Patch Blueprint Request for ${id}`);
    
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    if (!payload) return res.status(400).json({ error: "Missing payload" });

    try {
      const { data, error } = await supabaseServer
        .from('content_blueprints')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Patch Blueprint Error:", error);
      return res.status(500).json({ error: "DB_PATCH_BLUEPRINT_ERROR", message: error.message });
    }
  });

  app.delete("/api/db/blueprints/:id", async (req, res) => {
    const { id } = req.params;
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Delete Blueprint Request for ${id}`);
    
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { error } = await supabaseServer
        .from('content_blueprints')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      return res.json({ status: "ok" });
    } catch (error: any) {
      console.error("DB Delete Blueprint Error:", error);
      return res.status(500).json({ error: "DB_DELETE_BLUEPRINT_ERROR", message: error.message });
    }
  });

  // Usage Limits Proxy Routes
  app.get("/api/db/usage", async (req, res) => {
    const { userId } = req.query;
    console.log(`${new Date().toISOString()} | DB Get Usage Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseServer
        .from('usage_limits')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Get Usage Error:", error);
      return res.status(500).json({ error: "DB_GET_USAGE_ERROR", message: error.message });
    }
  });

  app.post("/api/db/usage/increment", async (req, res) => {
    const { userId } = req.body;
    console.log(`${new Date().toISOString()} | DB Increment Usage Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      // Get current usage
      const { data: usageData, error: getError } = await supabaseServer
        .from('usage_limits')
        .select('used_this_month')
        .eq('user_id', userId)
        .single();
      
      if (getError && getError.code !== 'PGRST116') throw getError;
      
      const newUsedCount = (usageData?.used_this_month || 0) + 1;
      
      const { data, error } = await supabaseServer
        .from('usage_limits')
        .upsert({ 
          user_id: userId, 
          used_this_month: newUsedCount,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Increment Usage Error:", error);
      return res.status(500).json({ error: "DB_INCREMENT_USAGE_ERROR", message: error.message });
    }
  });

  // Apify Proxy Route
  app.post("/api/apify-proxy", async (req, res) => {
    console.log("Apify Proxy Request received");
    try {
      if (!APIFY_TOKEN || APIFY_TOKEN.length < 10) {
        console.error("APIFY_TOKEN MISSING");
        return res.status(500).json({ 
          error: "APIFY_CONFIGURATION_ERROR", 
          message: "O token do Apify não foi configurado no ambiente (APIFY_TOKEN)." 
        });
      }

      let { platform, payload } = req.body || {};
      platform = platform ? platform.toString().toLowerCase().trim() : '';
      const actorId = ACTOR_IDS[platform];

      if (!actorId) {
        return res.status(400).json({ error: `Plataforma '${platform}' não suportada ou inválida.` });
      }

      // Adicionado timeout de 55 segundos para evitar 504 do gateway
      const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=2048&timeout=55`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            console.error("Apify Error Body:", errorBody);

            if (response.status === 504 || response.status === 408) {
              return res.status(504).json({ 
                error: "APIFY_TIMEOUT", 
                message: "A plataforma demorou muito para responder. Tente novamente em instantes." 
              });
            }
            
            return res.status(response.status).json({
              error: "APIFY_API_ERROR",
              message: errorBody.error?.message || errorBody.message || `Erro ${response.status} no Apify`,
              details: errorBody
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          return res.status(504).json({ error: "TIMEOUT", message: "Tempo limite de requisição excedido." });
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error("Proxy Error:", error);
      
      if (error.message?.includes("401")) {
        return res.status(401).json({ 
          error: "APIFY_AUTH_ERROR", 
          message: "Falha na autenticação com Apify. Verifique o APIFY_TOKEN." 
        });
      }
      
      if (error.message?.includes("404")) {
        return res.status(404).json({ 
          error: "APIFY_ACTOR_NOT_FOUND", 
          message: "O Actor do Apify não foi encontrado. Verifique os ACTOR_IDS." 
        });
      }

      return res.status(500).json({ 
        error: "APIFY_PROXY_ERROR", 
        message: error.message || "Erro interno no proxy do Apify." 
      });
    }
  });

  // OpenAI IA Proxy Route
  app.post("/api/ia-proxy", async (req, res) => {
    console.log(`${new Date().toISOString()} | OpenAI IA Proxy Request received`);
    try {
      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      
      if (!apiKey || apiKey.length < 10) {
        console.error("OPENAI_API_KEY MISSING OR INVALID");
        return res.status(401).json({ 
          error: "OPENAI_KEY_MISSING", 
          message: "A chave da API OpenAI (OPENAI_API_KEY) não foi configurada no servidor." 
        });
      }

      const openai = new OpenAI({ apiKey });
      const { contents, config, model } = req.body || {};

      // If it's an image generation request (based on model or some flag)
      if (model === 'gemini-2.5-flash-image' || model?.includes('image')) {
        const prompt = typeof contents === 'string' ? contents : (contents?.parts?.[0]?.text || "Generate an icon");
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          response_format: "b64_json"
        });

        if (response.data && response.data[0] && response.data[0].b64_json) {
          return res.status(200).json({ 
            image: {
              data: response.data[0].b64_json,
              mimeType: "image/png"
            }
          });
        }
        throw new Error("Falha na geração da imagem: dados ausentes");
      }

      // Standard text generation
      let prompt = typeof contents === 'string' ? contents : JSON.stringify(contents);
      
      // OpenAI requirement: prompt must contain 'json' if response_format is 'json_object'
      const isJsonRequested = config?.responseMimeType === "application/json";
      if (isJsonRequested && !prompt.toLowerCase().includes("json")) {
        prompt += "\n\nResponda obrigatoriamente em formato JSON.";
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: isJsonRequested ? { type: "json_object" } : undefined
      });

      const rawText = completion.choices[0].message.content || '{}';
      
      let parsedData;
      try {
        parsedData = JSON.parse(rawText);
      } catch (e) {
        parsedData = { text: rawText };
      }

      return res.status(200).json(parsedData);
    } catch (error: any) {
      console.error("OpenAI Proxy Error:", error);
      
      return res.status(500).json({ 
        error: "OPENAI_PROXY_ERROR", 
        message: error.message || "Erro interno no processamento da IA." 
      });
    }
  });

  // OpenAI Health Route
  app.get("/api/gemini-health", async (req, res) => {
    try {
      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      if (!apiKey || apiKey.length < 10) {
        return res.json({ status: "error", message: "Chave OpenAI ausente ou curta demais" });
      }
      
      const openai = new OpenAI({ apiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 1
      });
      
      if (response.choices[0].message.content) {
        return res.json({ status: "ok", message: "OpenAI está operacional" });
      }
      return res.json({ status: "error", message: "Resposta vazia da OpenAI" });
    } catch (error: any) {
      console.error("OpenAI Health Error:", error);
      return res.json({ 
        status: "error", 
        message: error.message || "Erro desconhecido"
      });
    }
  });

  // Social Analyze Proxy Route (OpenAI version)
  app.post("/api/social-analyze", async (req, res) => {
    console.log(`${new Date().toISOString()} | Social Analyze Proxy Request received`);
    try {
      const apiKey = (process.env.OPENAI_API_KEY || '').trim();
      if (!apiKey || apiKey.length < 10) {
        return res.status(401).json({ error: "OPENAI_KEY_MISSING", message: "A chave da API OpenAI não foi configurada." });
      }

      const openai = new OpenAI({ apiKey });
      const { profiles, niche, specialization, realMetrics, objective, recentPosts } = req.body || {};

      const metricsContext = realMetrics ? `
        DADOS REAIS DE ENGAJAMENTO (@${realMetrics.handle}):
        - Seguidores: ${realMetrics.followers}
        - Média Likes: ${realMetrics.likes}
        - Vídeos/Posts: ${realMetrics.posts}
        - Taxa de Engajamento Calculada: ${realMetrics.engagement_rate}%
      ` : "DADOS: Perfil ainda não analisado ou privado.";

      const prompt = `Analise o perfil social: ${niche} (${specialization}). Objetivo: ${objective || "Crescimento"}. ${metricsContext}. Responda obrigatoriamente em formato JSON com o campo "results" contendo um array de objetos com "profile_id" e "analysis" (viral_score, best_format, frequency_suggestion, content_pillars, diagnostic, next_post_recommendation).`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });

      const rawText = completion.choices[0].message.content || '{}';
      return res.status(200).json(JSON.parse(rawText));
    } catch (error: any) {
      console.error("Social Analyze Proxy Error:", error);
      return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Running in DEVELOPMENT mode with Vite middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in PRODUCTION mode");
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  // Global Error Handler (After Routes)
  app.use((err: any, req: any, res: any, next: any) => {
    console.error(`[GLOBAL ERROR] ${new Date().toISOString()} | ${req.method} ${req.url}:`, err);
    if (res.headersSent) return next(err);
    res.status(500).json({ 
      error: "INTERNAL_SERVER_ERROR", 
      message: err.message || "Ocorreu um erro inesperado no servidor." 
    });
  });

  try {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[${new Date().toISOString()}] VIRAL ROAD Server is fully operational on port ${PORT}`);
      console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`[${new Date().toISOString()}] Supabase URL: ${SUPABASE_URL}`);
    });
  } catch (listenError) {
    console.error("FAILED TO START SERVER:", listenError);
    process.exit(1);
  }
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
  process.exit(1);
});
