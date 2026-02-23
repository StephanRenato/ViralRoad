import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from "@google/genai";

const cleanJson = (text: string): string => {
  if (!text) return '{}';
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) return match[1].trim();
  if (text.trim().startsWith('{')) return text.trim();
  return text;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
       console.error("SERVER ERROR: API_KEY is missing in environment variables.");
       return res.status(500).json({ error: "SERVER CONFIGURATION ERROR: API KEY MISSING" });
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
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
