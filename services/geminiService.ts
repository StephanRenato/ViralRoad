import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_PROMPT = `Você é o VIRAL ROAD, estrategista de elite. Responda em PT-BR.`;

async function callGeminiHybrid(model: string, prompt: string, config: any) {
  const response = await fetch('/api/ia-proxy', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, contents: prompt, config })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro na API: ${response.status}`);
  }
  
  return await response.json();
}

export async function generateNarratives(params: any) {
  const prompt = `Gere 3 narrativas para: ${params.segment}.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        analysis_insight: { type: Type.STRING },
        narratives: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } } } }
      }
    }
  });
}

export async function generateHeadlines(params: any) {
  const prompt = `Gere 5 ganchos para: ${params.narrative}.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: { headlines: { type: Type.ARRAY, items: { type: Type.STRING } } }
    }
  });
}

export async function generateFinalStrategy(params: any) {
  const prompt = `Roteiro completo: ${params.headline}. Nicho: ${params.profileType}.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        script: { type: Type.STRING },
        caption: { type: Type.STRING },
        hashtags: { type: Type.STRING }
      }
    }
  });
}

export async function analyzeSocialStrategy(params: any): Promise<AnalysisResult> {
    const prompt = `Analise perfil: ${params.niche}.`;
    return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                results: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            profile_id: { type: Type.STRING },
                            analysis: {
                                type: Type.OBJECT,
                                properties: {
                                    viral_score: { type: Type.NUMBER },
                                    best_format: { type: Type.STRING },
                                    diagnostic: {
                                        type: Type.OBJECT,
                                        properties: {
                                            status_label: { type: Type.STRING },
                                            key_action_item: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
}

export async function auditUserProfile(params: any) {
  const prompt = `Auditoria: ${params.name}.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER },
        market_status: { type: Type.STRING },
        verdict: { type: Type.STRING },
        tip: { type: Type.STRING }
      }
    }
  });
}

export async function generateHookSeedIdeas(params: any) {
    const prompt = `Temas virais para ${params.profileType}.`;
    return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { topics: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    });
}

export async function generateHooksFromTopic(params: any) {
    const prompt = `Ganchos para: ${params.topic}.`;
    return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                hooks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            content: { type: Type.STRING },
                            viral_percentage: { type: Type.NUMBER },
                            explanation: { type: Type.STRING }
                        }
                    }
                }
            }
        }
    });
}