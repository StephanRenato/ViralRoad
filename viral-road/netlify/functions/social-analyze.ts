
import { GoogleGenAI, Type } from "@google/genai";
import type { Handler } from "@netlify/functions";

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
    // Check API Key Availability on Server
    if (!process.env.API_KEY) {
       console.error("API_KEY is missing in server environment");
       return {
         statusCode: 500,
         headers,
         body: JSON.stringify({ error: "Server Configuration Error: API Key missing." })
       };
    }

    // Instantiate Google GenAI ONLY on the server
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const { profiles, niche, specialization, realMetrics, objective, recentPosts } = JSON.parse(event.body || '{}');

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
    
    REGRAS CRÍTICAS:
    - Seja TÉCNICO e CONCISO.
    - O "key_action_item" deve ser uma tarefa prática para aumentar o engajamento HOJE.
    - O "next_post_recommendation" deve justificar o formato escolhido com base nos dados.
    - SAÍDA: JSON estrito conforme o schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        maxOutputTokens: 2000, 
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
      }
    });

    const rawText = cleanJson(response.text || '{}');
    const parsed = JSON.parse(rawText);

    // Associa o ID do perfil à resposta
    if (parsed.results && parsed.results.length > 0 && profiles && profiles[0]) {
        if (!parsed.results[0].profile_id) {
            parsed.results[0].profile_id = profiles[0].id;
        }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsed)
    };

  } catch (error: any) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || "Internal Server Error" })
    };
  }
};
