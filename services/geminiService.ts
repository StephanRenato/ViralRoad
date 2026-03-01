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
  const prompt = `
    Gere 3 narrativas estratégicas para o nicho: ${params.profileType} (${params.specialization}).
    Tema central: ${params.segment}
    Plataforma: ${params.platform}
    Etapa do Funil: ${params.funnel}
    Público-Alvo: ${params.targetAudience}

    Responda em Português do Brasil (PT-BR).
  `;
  return await callGeminiHybrid("gemini-1.5-flash", prompt, {
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
  const prompt = `
    Gere 5 ganchos (hooks) virais e magnéticos para a narrativa: "${params.narrative}".
    Plataforma: ${params.platform}
    Público: ${params.targetAudience}

    Os ganchos devem ser curtos, impactantes e em Português do Brasil (PT-BR).
  `;
  return await callGeminiHybrid("gemini-1.5-flash", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: { headlines: { type: Type.ARRAY, items: { type: Type.STRING } } }
    }
  });
}

export async function generateFinalStrategy(params: any) {
  const prompt = `
    Crie um roteiro completo e estratégia de postagem para o gancho: "${params.headline}".
    Nicho: ${params.profileType} (${params.specialization})
    Plataforma: ${params.platform}
    Formato: ${params.format}
    Modo de Comunicação: ${params.communicationMode}

    Inclua:
    1. Roteiro Detalhado (Script)
    2. Legenda Otimizada (Caption)
    3. Hashtags Estratégicas
    4. Direção Criativa (Dicas de gravação/edição)

    Responda tudo em Português do Brasil (PT-BR).
  `;
  return await callGeminiHybrid("gemini-1.5-flash", prompt, {
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

export async function analyzeSocialStrategy(params: any): Promise<AnalysisResult> {
    const metrics = params.realMetrics || {};
    const prompt = `
        Analise o perfil social com os seguintes dados reais:
        - Plataforma: ${params.profiles?.[0]?.id || 'Instagram'}
        - Usuário: ${metrics.handle || 'N/A'}
        - Seguidores: ${metrics.followers || 0}
        - Engajamento: ${metrics.engagement_rate || 0}%
        - Posts: ${metrics.posts || 0}
        - Nicho: ${params.niche || 'Geral'}
        - Especialização: ${params.specialization || 'N/A'}
        - Objetivo: ${params.objective || 'Crescimento'}

        Forneça uma análise estratégica completa em Português do Brasil (PT-BR).
        Certifique-se de que todos os campos do schema sejam preenchidos com insights valiosos e táticos.
        O campo 'key_action_item' deve ser uma ação prática e curta em PT-BR.
    `;

    return await callGeminiHybrid("gemini-1.5-flash", prompt, {
        systemInstruction: SYSTEM_PROMPT,
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
                                    frequency_suggestion: { type: Type.STRING },
                                    content_pillars: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    diagnostic: {
                                        type: Type.OBJECT,
                                        properties: {
                                            status_label: { type: Type.STRING },
                                            key_action_item: { type: Type.STRING },
                                            tone_audit: { type: Type.STRING },
                                            content_strategy_advice: { type: Type.STRING }
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