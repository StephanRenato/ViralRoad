import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();

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

  // IA Proxy Route
  app.post("/api/ia-proxy", async (req, res) => {
    console.log("IA Proxy Request received");
    try {
      const apiKey = (process.env.GEMINI_API_KEY || '').trim();
      
      if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
         console.error("CRITICAL: GEMINI_API_KEY is missing or invalid.");
         return res.status(500).json({ 
           error: "IA_CONFIGURATION_ERROR", 
           message: "A chave da API Gemini não foi configurada corretamente no ambiente (GEMINI_API_KEY)." 
         });
      }

      console.log(`Using Gemini API Key: ${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`);
      const ai = new GoogleGenAI({ apiKey });
      const { contents, config, model } = req.body || {};

      const response = await ai.models.generateContent({
        model: model || "gemini-3-flash-preview",
        contents,
        config
      });

      if (!response) throw new Error("O modelo não retornou uma resposta válida.");

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
      
      // Handle specific Google GenAI errors
      if (error.message?.includes("API key not valid")) {
        return res.status(401).json({ 
          error: "INVALID_API_KEY", 
          message: "A chave da API Gemini fornecida é inválida. Verifique suas configurações." 
        });
      }

      return res.status(500).json({ 
        error: "IA_PROXY_ERROR", 
        message: error.message || "Erro interno ao processar requisição de IA." 
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
  });
}

startServer();
