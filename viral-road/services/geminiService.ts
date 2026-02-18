
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_PROMPT = `Você é o VIRAL ROAD, o maior estrategista de conteúdo do mundo.
Sua missão é criar roteiros e ganchos que pareçam ter sido escritos por um especialista sênior da área do usuário.
IMPORTANTE: TODAS AS RESPOSTAS DEVEM SER ESTRITAMENTE EM PORTUGUÊS DO BRASIL (PT-BR).`;

const cleanJson = (text: string): string => {
  if (!text) return '{}';
  let clean = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  clean = clean.replace(/```\s*/g, '');
  return clean.trim();
};

/**
 * Hybrid Call: Tries Serverless Proxy first, falls back to Client SDK.
 */
async function callGeminiHybrid(model: string, prompt: string, config: any) {
  try {
    const response = await fetch('/.netlify/functions/ia-proxy', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, contents: prompt, config })
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      throw new Error(`Proxy unavailable or invalid response (${response.status})`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (proxyError) {
    console.warn("⚠️ IA Proxy failed, attempting Client-Side fallback...", proxyError);
    try {
      if (!process.env.API_KEY) throw new Error("Client Fallback Failed: API Key not found.");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({ model, contents: prompt, config });
      const text = response.text || "{}";
      if (config.responseMimeType === "application/json") return JSON.parse(cleanJson(text));
      return { text };
    } catch (clientError: any) {
      console.error("❌ Critical AI Failure:", clientError);
      throw clientError;
    }
  }
}

export async function analyzeSocialStrategy(params: any): Promise<AnalysisResult> {
  const { profiles, niche, specialization, realMetrics, objective, recentPosts } = params;

  const metricsContext = realMetrics ? `
    DADOS REAIS DE ENGAJAMENTO (@${realMetrics.handle}):
    - Seguidores: ${realMetrics.followers}
    - Média Likes: ${realMetrics.likes}
    - Vídeos/Posts: ${realMetrics.posts}
    - Taxa de Engajamento: ${realMetrics.engagement_rate}%
    - Bio Atual: "${realMetrics.bio ? realMetrics.bio.substring(0, 150) : ''}"
  ` : "DADOS: Iniciante.";

  const prompt = `ATUAR COMO: Estrategista Sênior de Growth e Viralização (Ex-Meta/TikTok).
  
  ANÁLISE TÁTICA DE PERFIL: ${niche} (${specialization}).
  OBJETIVO DO USUÁRIO: ${objective || "Crescimento Geral"}
  ${metricsContext}
  CONTEÚDO RECENTE PARA ANÁLISE: ${recentPosts || "Não fornecido."}
  
  TAREFAS ESTRATÉGICAS:
  1. Score Viral (0-100): Baseado em Engajamento vs Seguidores.
  2. Melhores Formatos: Identifique quais tipos de postagem (ex: Reels curtos, Carrosséis informativos) trariam mais escala AGORA.
  3. Pilares de Conteúdo: Defina 3 temas centrais para dominar o nicho.
  4. Diagnóstico Tático Imediato: Gere um "Key Action Item" (O que fazer HOJE), Auditoria de Tom e Conselho de Estratégia.
  5. Recomendação de Próximo Post: Tema e formato específico com justificativa técnica.
  
  SAÍDA: JSON estrito conforme o schema. RESPOSTAS EM PORTUGUÊS (PT-BR).`;

  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    responseMimeType: "application/json",
    maxOutputTokens: 2500, 
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
                                tone_recommendation: { type: Type.STRING },
                                frequency_suggestion: { type: Type.STRING },
                                content_pillars: { type: Type.ARRAY, items: { type: Type.STRING } },
                                diagnostic: {
                                    type: Type.OBJECT,
                                    properties: {
                                        status_label: { type: Type.STRING },
                                        content_strategy_advice: { type: Type.STRING },
                                        tone_audit: { type: Type.STRING },
                                        key_action_item: { type: Type.STRING }
                                    }
                                },
                                next_post_recommendation: {
                                  type: Type.OBJECT,
                                  properties: {
                                    format: { type: Type.STRING },
                                    topic: { type: Type.STRING },
                                    reason: { type: Type.STRING }
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

export async function generateNarratives(params: any) {
  const { segment, profileType, specialization, platform, targetAudience } = params;
  const prompt = `ESTRATÉGIA DE CONTEÚDO PARA: ${profileType} (${specialization}). Público: ${targetAudience}. Plataforma: ${platform}. Tema: "${segment}". Gere 3 ângulos narrativos distintos. SAÍDA JSON PT-BR.`;
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
  const { narrative, platform } = params;
  const prompt = `Gere 5 ganchos magnéticos para: "${narrative}". Plataforma: ${platform}. JSON PT-BR.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: { headlines: { type: Type.ARRAY, items: { type: Type.STRING } } }
    }
  });
}

export async function generateFinalStrategy(params: any) {
  const { headline, profileType, specialization, format } = params;
  const prompt = `Roteiro completo para ${profileType} (${specialization}). Gancho: "${headline}". Formato: ${format}. Inclua script, legenda e hashtags. JSON PT-BR.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        script: { type: Type.STRING },
        caption: { type: Type.STRING },
        hashtags: { type: Type.STRING },
        creativeDirection: { type: Type.STRING }
      }
    }
  });
}

export async function auditUserProfile(params: any) {
  const { name, niche, specialization } = params;
  const prompt = `AUDITORIA DE POSICIONAMENTO: Nome: ${name}. Nicho: ${niche}. Especialização: ${specialization}. Analise saturação e dê uma dica de diferenciação. JSON PT-BR.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
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
  const { profileType, specialization } = params;
  const prompt = `Gere 6 temas virais para criar ganchos em: ${profileType} - ${specialization}. JSON PT-BR.`;
  return await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    responseMimeType: "application/json",
    responseSchema: { type: Type.OBJECT, properties: { topics: { type: Type.ARRAY, items: { type: Type.STRING } } } }
  });
}

export async function generateHooksFromTopic(params: any) {
  const { profileType, specialization, topic } = params;
  const prompt = `Gere 6 ganchos prontos para o tema: "${topic}". Nicho: ${profileType} (${specialization}). JSON PT-BR.`;
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
              explanation: { type: Type.STRING },
              niche_tag: { type: Type.STRING }
            }
          }
        }
      }
    }
  });
}
