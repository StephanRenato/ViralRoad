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
    res.json({ status: "ok", message: "Viral Road API is live" });
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
      return res.status(500).json({ error: error.message || "Internal Server Error" });
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

      const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=4096`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
          throw new Error(`Apify Error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (error: any) {
      console.error("Proxy Error:", error);
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VIRAL ROAD Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
