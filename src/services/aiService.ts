import { AnalysisResult } from "../types";

const SYSTEM_PROMPT = `Você é o VIRAL ROAD, estrategista de elite. Responda em PT-BR.`;

async function callAIProxy(model: string, prompt: string, config: any) {
  try {
    const response = await fetch('/api/ia-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        contents: prompt,
        config
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error("Erro na geração de narrativas:", error);
    throw error;
  }
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
  return await callAIProxy("gpt-4o", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        analysis_insight: { type: "STRING" },
        narratives: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, description: { type: "STRING" } } } }
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
  return await callAIProxy("gpt-4o", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: { headlines: { type: "ARRAY", items: { type: "STRING" } } }
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
  return await callAIProxy("gpt-4o", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        script: { type: "STRING" },
        caption: { type: "STRING" },
        hashtags: { type: "STRING" },
        creativeDirection: { type: "STRING" }
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

        INSTRUÇÕES CRÍTICAS:
        1. Responda TUDO em Português do Brasil (PT-BR).
        2. O campo 'key_action_item' DEVE ser uma ação prática, curta e impactante em PT-BR (ex: "Aumente a interação nos stories com enquetes").
        3. O campo 'tone_audit' DEVE descrever o tom de voz atual e sugerir melhorias.
        4. O campo 'frequency_suggestion' DEVE ser uma recomendação clara (ex: "3x por semana nos Reels, 5x nos Stories").
        5. O campo 'content_pillars' DEVE conter 3 a 4 temas principais para o nicho.
        6. O campo 'content_strategy_advice' DEVE ser a Linha Editorial detalhada.
        7. NÃO deixe nenhum campo vazio ou em inglês.
    `;

    return await callAIProxy("gpt-4o", prompt, {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
            type: "OBJECT",
            properties: {
                results: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            profile_id: { type: "STRING" },
                            analysis: {
                                type: "OBJECT",
                                properties: {
                                    viral_score: { type: "NUMBER" },
                                    best_format: { type: "STRING" },
                                    frequency_suggestion: { type: "STRING" },
                                    content_pillars: { type: "ARRAY", items: { type: "STRING" } },
                                    diagnostic: {
                                        type: "OBJECT",
                                        properties: {
                                            status_label: { type: "STRING" },
                                            key_action_item: { type: "STRING" },
                                            tone_audit: { type: "STRING" },
                                            content_strategy_advice: { type: "STRING" }
                                        }
                                    },
                                    next_post_recommendation: {
                                        type: "OBJECT",
                                        properties: {
                                            format: { type: "STRING" },
                                            topic: { type: "STRING" },
                                            reason: { type: "STRING" }
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
  return await callAIProxy("gpt-4o", prompt, {
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        score: { type: "NUMBER" },
        market_status: { type: "STRING" },
        verdict: { type: "STRING" },
        tip: { type: "STRING" }
      }
    }
  });
}

export async function generateHookSeedIdeas(params: any) {
    const prompt = `Temas virais para ${params.profileType}.`;
    return await callAIProxy("gpt-4o", prompt, {
        responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { topics: { type: "ARRAY", items: { type: "STRING" } } } }
    });
}

export async function generateHooksFromTopic(params: any) {
    const prompt = `Ganchos para: ${params.topic}.`;
    return await callAIProxy("gpt-4o", prompt, {
        responseMimeType: "application/json",
        responseSchema: {
            type: "OBJECT",
            properties: {
                hooks: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            content: { type: "STRING" },
                            viral_percentage: { type: "NUMBER" },
                            explanation: { type: "STRING" }
                        }
                    }
                }
            }
        }
    });
}