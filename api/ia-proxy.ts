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
    let apiKey = (process.env.GEMINI_API_KEY || '').trim();
    
    // Fallback para a chave fornecida pelo usuário se a do ambiente estiver incorreta
    if (!apiKey || !apiKey.startsWith('AIza')) {
      apiKey = 'AIzaSyBHyUoeLJlucU8AI5s2sRxfVgXQZD0_Fm8';
    }
    
    if (!apiKey || apiKey === 'undefined' || apiKey.length < 10) {
       console.error("SERVER ERROR: GEMINI_API_KEY is missing or invalid.");
       return res.status(500).json({ error: "IA_CONFIGURATION_ERROR", message: "Chave API Gemini inválida ou ausente (GEMINI_API_KEY)." });
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
    
    // Handle specific Google GenAI errors
    if (error.message?.includes("API key not valid") || error.message?.includes("API_KEY_INVALID")) {
      return res.status(401).json({ 
        error: "INVALID_API_KEY", 
        message: "A chave da API Gemini (GEMINI_API_KEY) é inválida. Verifique se você copiou a chave corretamente do Google AI Studio e se ela não possui espaços extras." 
      });
    }

    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
