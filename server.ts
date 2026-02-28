import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import dotenv from "dotenv";

dotenv.config();

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pawcolinueutmyxxlrui.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VZ_fuGTHNuFhI3ivO_W62g_Ggh7ngGQ';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  app.use(express.json());

  // Log all requests for debugging
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} | ${req.method} ${req.url}`);
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

  // Apify Health Check
  app.get("/api/apify-health", async (req, res) => {
    try {
      if (!APIFY_TOKEN || APIFY_TOKEN.length < 10) {
        return res.status(500).json({ 
          status: "error", 
          code: "APIFY_TOKEN_MISSING",
          message: "APIFY_TOKEN is missing or invalid in environment." 
        });
      }
      
      const response = await fetch(`https://api.apify.com/v2/users/me?token=${APIFY_TOKEN}`);
      if (response.ok) {
        const data = await response.json();
        return res.json({ 
          status: "ok", 
          message: "Apify connection verified", 
          user: data.data.username,
          proxy_actors: Object.keys(ACTOR_IDS)
        });
      } else {
        return res.status(response.status).json({ 
          status: "error", 
          code: "APIFY_AUTH_ERROR",
          message: `Apify returned ${response.status}: ${response.statusText}` 
        });
      }
    } catch (error: any) {
      return res.status(500).json({ status: "error", message: error.message });
    }
  });

  // Gemini Health Check
  app.get("/api/gemini-health", async (req, res) => {
    try {
      let apiKey = (process.env.GEMINI_API_KEY || '').trim();
      
      // Fallback para a chave fornecida pelo usuário se a do ambiente estiver incorreta
      if (!apiKey || !apiKey.startsWith('AIza')) {
        console.log("Ambiente com chave inválida. Usando fallback fornecido pelo usuário.");
        apiKey = 'AIzaSyBHyUoeLJlucU8AI5s2sRxfVgXQZD0_Fm8';
      }

      if (!apiKey || apiKey.length < 10) {
        return res.status(500).json({ 
          status: "error", 
          code: "GEMINI_TOKEN_MISSING",
          message: "A chave GEMINI_API_KEY está ausente ou é muito curta." 
        });
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Responda apenas 'OK' se estiver funcionando."
      });

      if (response.text?.includes("OK")) {
        return res.json({ 
          status: "ok", 
          message: "Conexão Gemini verificada",
          key_preview: `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
        });
      } else {
        throw new Error("Resposta inesperada do modelo.");
      }
    } catch (error: any) {
      return res.status(500).json({ 
        status: "error", 
        message: error.message,
        details: error.details || "Verifique se a chave tem permissão para o modelo gemini-3-flash-preview."
      });
    }
  });

  // IA Proxy Route
  app.post("/api/ia-proxy", async (req, res) => {
    console.log(`${new Date().toISOString()} | IA Proxy Request`);
    try {
      let apiKey = (process.env.GEMINI_API_KEY || '').trim();
      
      if (!apiKey || !apiKey.startsWith('AIza')) {
        apiKey = 'AIzaSyBHyUoeLJlucU8AI5s2sRxfVgXQZD0_Fm8';
      }
      
      if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
         return res.status(500).json({ 
           error: "IA_CONFIGURATION_ERROR", 
           message: "Chave Gemini não configurada." 
         });
      }

      const ai = new GoogleGenAI({ apiKey });
      const { contents, config, model } = req.body || {};

      const response = await ai.models.generateContent({
        model: model || "gemini-3-flash-preview",
        contents,
        config
      });

      const rawText = cleanJson(response.text || '{}');
      let parsedData;
      try {
          parsedData = JSON.parse(rawText);
      } catch (e) {
          parsedData = { text: response.text, raw: rawText };
      }
      return res.status(200).json(parsedData);
    } catch (error: any) {
      console.error("IA Proxy Error:", error);
      return res.status(500).json({ error: "IA_PROXY_ERROR", message: error.message });
    }
  });

  // DB Proxy Route (More resilient than client-side fetch)
  app.post("/api/db/upsert-profile", async (req, res) => {
    const { userId, profiles } = req.body;
    console.log(`${new Date().toISOString()} | DB Upsert Request for ${userId}`);
    
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .upsert({ 
          id: userId, 
          social_profiles: profiles,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select();
      
      if (error) throw error;
      return res.json({ status: "ok", data });
    } catch (error: any) {
      console.error("DB Proxy Error:", error);
      return res.status(500).json({ 
        error: "DB_PROXY_ERROR", 
        message: error.message || "Erro ao salvar no banco via proxy." 
      });
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VIRAL ROAD Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("CRITICAL SERVER ERROR:", err);
  process.exit(1);
});
