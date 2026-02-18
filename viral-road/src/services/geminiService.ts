
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
 * This solves "Failed to fetch" when proxy is unavailable or blocked,
 * and solves "API Key missing" when running client-side without env vars.
 */
async function callGeminiHybrid(model: string, prompt: string, config: any) {
  // 1. Attempt via Proxy (Serverless)
  try {
    const response = await fetch('/.netlify/functions/ia-proxy', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, contents: prompt, config })
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      // Throw specific error to trigger fallback
      throw new Error(`Proxy unavailable or invalid response (${response.status})`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);
    
    return data;

  } catch (proxyError) {
    console.warn("⚠️ IA Proxy failed, attempting Client-Side fallback...", proxyError);

    // 2. Fallback: Direct Client SDK
    try {
      if (!process.env.API_KEY) {
        throw new Error("Client Fallback Failed: API Key not found in environment.");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: config
      });

      const text = response.text || "{}";
      
      if (config.responseMimeType === "application/json") {
          return JSON.parse(cleanJson(text));
      }
      
      return { text };

    } catch (clientError: any) {
      console.error("❌ Critical AI Failure (Proxy + Client):", clientError);
      throw clientError;
    }
  }
}

export async function generateNarratives(params: any) {
  const { segment, profileType, specialization, platform, targetAudience } = params;
  
  const prompt = `ESTRATÉGIA DE CONTEÚDO PARA: ${profileType} (${specialization}).
  Público: ${targetAudience}. Plataforma: ${platform}.
  Tema Central: "${segment}".
  
  Gere 3 ângulos narrativos distintos e profundos. Não seja genérico.
  SAÍDA EM PORTUGUÊS (PT-BR).
  
  Retorne JSON: { "analysis_insight": string, "narratives": [{ "title": string, "description": string }] }`;

  const data = await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        analysis_insight: { type: Type.STRING },
        narratives: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["title", "description"]
          }
        }
      },
      required: ["analysis_insight", "narratives"]
    }
  });
  
  return data;
}

export async function generateHeadlines(params: any) {
  const { narrative, platform } = params;
  const prompt = `Gere 5 ganchos (Hooks) magnéticos para: "${narrative}".
  Plataforma: ${platform}. 
  Objetivo: Parar o scroll em 3 segundos.
  SAÍDA EM PORTUGUÊS (PT-BR).
  Retorne JSON: { "headlines": [string] }`;

  const data = await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        headlines: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["headlines"]
    }
  });
  
  return {
    headlines: (data.headlines || []).map((h: any) => String(h))
  };
}

export async function generateFinalStrategy(params: any) {
  const { headline, profileType, specialization, format } = params;
  
  const prompt = `Crie um Roteiro Completo para ${profileType} (${specialization}).
  Gancho: "${headline}".
  Formato: ${format}.
  
  O roteiro deve ter: Gancho, Retenção, Conteúdo de Valor e CTA.
  Inclua sugestões de B-Roll e edição.
  SAÍDA EM PORTUGUÊS (PT-BR).
  
  Retorne JSON completo conforme schema.`;

  const data = await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        objective: { type: Type.STRING },
        pilar: { type: Type.STRING },
        mainMetric: { type: Type.STRING },
        hook: { type: Type.STRING },
        script: { type: Type.STRING },
        caption: { type: Type.STRING },
        hashtags: { type: Type.STRING },
        creativeDirection: { type: Type.STRING },
        distribution: { type: Type.STRING },
        nextTest: { type: Type.STRING }
      },
      required: ["script", "caption", "hashtags"]
    }
  });
  
  return data;
}

export async function analyzeSocialStrategy(params: any): Promise<AnalysisResult> {
  const { profiles, niche, specialization, realMetrics, objective, recentPosts } = params;

  const metricsContext = realMetrics ? `
    DADOS REAIS DE ENGAJAMENTO (@${realMetrics.handle}):
    - Seguidores: ${realMetrics.followers}
    - Média Likes: ${realMetrics.likes}
    - Vídeos/Posts: ${realMetrics.posts}
    - Taxa de Engajamento Calculada: ${realMetrics.engagement_rate}%
    - Bio Atual: "${realMetrics.bio ? realMetrics.bio.substring(0, 200) : ''}"
  ` : "DADOS: Perfil ainda não analisado ou privado. Assuma métricas de iniciante.";

  const contentContext = recentPosts ? `
    CONTEÚDO RECENTE (AMOSTRA DE POSTS/VÍDEOS COM LEGENDA E NUMEROS):
    ${recentPosts}
  ` : "";

  const prompt = `ATUAR COMO: Estrategista Sênior de Viralização e Algoritmo.
  
  ANÁLISE DE PERFIL: ${niche} (${specialization}).
  OBJETIVO DO USUÁRIO: ${objective || "Crescimento Geral"}
  ${metricsContext}
  ${contentContext}
  
  TAREFAS ESTRATÉGICAS:
  1. Calcule o "viral_score" (0-100) estritamente baseado na taxa de engajamento fornecida e consistência.
     - Se Engajamento > 10%: Score Alto (80+).
     - Se Engajamento < 2%: Score Baixo (<40).
  2. Identifique o melhor formato GERAL (Reels, Carrossel, etc.) para alavancar esse engajamento específico.
  3. Sugira 3 Pilares de Conteúdo com alto potencial de viralização para este perfil e nicho.
  4. Sugira uma Bio otimizada focada em conversão/autoridade.
  5. Gere um diagnóstico tático (Auditoria de Tom e Ação Chave Imediata).
  6. IMPORTANTE: Analise os padrões de sucesso em "CONTEÚDO RECENTE" e preencha "top_performing_content".
  7. CRÍTICO: Com base no que está funcionando melhor (maior likes/views recentes), preencha "next_post_recommendation" sugerindo EXATAMENTE qual formato (Reels/Shorts/Post) e tema o usuário deve postar AGORA para manter a tração.
  8. DIAGNÓSTICO ESTENDIDO: Liste 3 Pontos Fortes, 3 Pontos Fracos (Gaps) e 3 Recomendações Práticas em "extended_diagnostic".
  
  REGRAS CRÍTICAS:
  - Seja TÉCNICO e CONCISO.
  - O "key_action_item" deve ser uma tarefa prática para aumentar o engajamento HOJE.
  - O "next_post_recommendation" deve justificar o formato escolhido com base nos dados.
  - SAÍDA: JSON estrito conforme o schema.`;

  const data = await callGeminiHybrid("gemini-3-flash-preview", prompt, {
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
                                audience_demographics: {
                                    type: Type.OBJECT,
                                    properties: {
                                        age_range: { type: Type.STRING },
                                        gender_split: { type: Type.STRING },
                                        top_locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        audience_persona: { type: Type.STRING }
                                    }
                                },
                                profile_optimization: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name_suggestion: { type: Type.STRING },
                                        bio_suggestion: { type: Type.STRING }
                                    }
                                },
                                extended_diagnostic: {
                                    type: Type.OBJECT,
                                    properties: {
                                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                                        recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                                    }
                                },
                                top_performing_content: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            type: { type: Type.STRING },
                                            topic: { type: Type.STRING },
                                            engagement_score: { type: Type.NUMBER },
                                            insight: { type: Type.STRING }
                                        }
                                    }
                                },
                                next_post_recommendation: {
                                  type: Type.OBJECT,
                                  properties: {
                                    format: { type: Type.STRING },
                                    topic: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                  }
                                },
                                diagnostic: {
                                    type: Type.OBJECT,
                                    properties: {
                                        status_label: { type: Type.STRING },
                                        content_strategy_advice: { type: Type.STRING },
                                        tone_audit: { type: Type.STRING },
                                        key_action_item: { type: Type.STRING }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            detected_specialization: { type: Type.STRING },
            suggestion_reason: { type: Type.STRING }
        }
    }
  });

  // Inject profile ID if missing
  if (data.results && data.results.length > 0 && profiles && profiles[0]) {
      if (!data.results[0].profile_id) {
          data.results[0].profile_id = profiles[0].id;
      }
  }

  return data;
}

export async function generateHookSeedIdeas(params: any) {
  const { profileType, specialization } = params;
  const prompt = `Gere 6 temas virais (Trends/Padrões) para criar ganchos no nicho: ${profileType} - ${specialization}.
  Foque em dores latentes e curiosidade.
  SAÍDA EM PORTUGUÊS (PT-BR).`;

  const data = await callGeminiHybrid("gemini-3-flash-preview", prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        topics: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    }
  });
  
  return data;
}

export async function generateHooksFromTopic(params: any) {
  const { profileType, specialization, topic } = params;
  
  const prompt = `Gere 6 ganchos (Hooks) prontos para usar sobre o tema: "${topic}".
  Nicho: ${profileType} (${specialization}).
  
  Para cada gancho, dê uma porcentagem de viralização estimada (0-100) e uma breve explicação do porquê funciona.
  SAÍDA EM PORTUGUÊS (PT-BR).`;

  const data = await callGeminiHybrid("gemini-3-flash-preview", prompt, {
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
  
  return data;
}
