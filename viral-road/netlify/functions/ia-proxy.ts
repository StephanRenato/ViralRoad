
import { GoogleGenAI } from "@google/genai";
import { Handler } from "@netlify/functions";

const cleanJson = (text: string): string => {
  if (!text) return '{}';
  const match = text.match(/```json([\s\S]*?)```/);
  if (match) return match[1].trim();
  if (text.trim().startsWith('{')) return text.trim();
  return text;
};

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  try {
    // 1. Securely access API Key from Server Environment
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    
    if (!apiKey) {
       console.error("SERVER ERROR: API_KEY is missing in environment variables.");
       return {
         statusCode: 500,
         headers,
         body: JSON.stringify({ error: "SERVER CONFIGURATION ERROR: API KEY MISSING" })
       };
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // 2. Extract Prompt and Config from Client Request
    const { contents, config, model } = JSON.parse(event.body || '{}');

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents,
      config
    });

    // 4. Process and Return Response
    const rawText = cleanJson(response.text || '{}');
    let parsedData;
    
    try {
        parsedData = JSON.parse(rawText);
    } catch (e) {
        // Fallback if response is not JSON
        parsedData = { text: response.text, raw: rawText };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsedData)
    };

  } catch (error: any) {
    console.error("IA Proxy Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal Server Error" })
    };
  }
};
