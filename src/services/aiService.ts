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

/**
 * Normaliza as chaves de um objeto ou array de objetos de Português para Inglês.
 * Útil quando a IA traduz as chaves do JSON mesmo com schema definido.
 */
function normalizeAIKeys(data: any): any {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map(item => normalizeAIKeys(item));
  }

  if (typeof data === 'object') {
    const normalized: any = {};
    const keyMap: Record<string, string> = {
      // Narrativas
      'narrativas': 'narratives',
      'titulo': 'title',
      'descricao': 'description',
      'objetivo': 'objective',
      'insight_analise': 'analysis_insight',
      'analise_insight': 'analysis_insight',
      
      // Headlines / Hooks
      'ganchos': 'headlines',
      'manchetes': 'headlines',
      'titulos': 'headlines',
      
      // Final Strategy
      'roteiro': 'script',
      'legenda': 'caption',
      'direcaoCriativa': 'creativeDirection',
      'direcao_criativa': 'creativeDirection',
      'hashtags_estrategicas': 'hashtags'
    };

    for (const key in data) {
      const normalizedKey = keyMap[key] || key;
      let value = data[key];
      
      // Recursivamente normaliza valores se forem objetos ou arrays
      if (typeof value === 'object' && value !== null) {
        value = normalizeAIKeys(value);
      }
      
      normalized[normalizedKey] = value;
    }
    return normalized;
  }

  return data;
}

export async function generateNarratives(params: any) {
  const prompt = `
    Gere 3 narrativas estratégicas para o nicho: ${params.profileType} (${params.specialization}).
    Tema central: ${params.segment}
    Plataforma: ${params.platform}
    Etapa do Funil: ${params.funnel}
    Público-Alvo: ${params.targetAudience}

    INSTRUÇÃO DE FORMATO:
    Retorne um objeto JSON com as chaves EXATAMENTE assim:
    {
      "analysis_insight": "string",
      "narratives": [
        { "title": "string", "description": "string" }
      ]
    }

    Responda em Português do Brasil (PT-BR).
  `;
  const res = await callAIProxy("gemini-3-flash-preview", prompt, {
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
  return normalizeAIKeys(res);
}

export async function generateHeadlines(params: any) {
  const prompt = `
    Gere 5 ganchos (hooks) virais e magnéticos para a narrativa: "${params.narrative}".
    Plataforma: ${params.platform}
    Público: ${params.targetAudience}

    INSTRUÇÃO DE FORMATO:
    Retorne um objeto JSON com a chave EXATAMENTE assim:
    {
      "headlines": ["gancho 1", "gancho 2", ...]
    }

    Os ganchos devem ser curtos, impactantes e em Português do Brasil (PT-BR).
  `;
  const res = await callAIProxy("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: { headlines: { type: "ARRAY", items: { type: "STRING" } } }
    }
  });
  return normalizeAIKeys(res);
}

export async function generateFinalStrategy(params: any) {
  const prompt = `
    Crie um roteiro completo e estratégia de postagem para o gancho: "${params.headline}".
    Nicho: ${params.profileType} (${params.specialization})
    Plataforma: ${params.platform}
    Formato: ${params.format}
    Modo de Comunicação: ${params.communicationMode}

    INSTRUÇÃO DE FORMATO:
    Retorne um objeto JSON com as chaves EXATAMENTE assim:
    {
      "script": "string",
      "caption": "string",
      "hashtags": "string",
      "creativeDirection": "string"
    }

    Inclua:
    1. Roteiro Detalhado (Script)
    2. Legenda Otimizada (Caption)
    3. Hashtags Estratégicas
    4. Direção Criativa (Dicas de gravação/edição)

    Responda tudo em Português do Brasil (PT-BR).
  `;
  const res = await callAIProxy("gemini-3-flash-preview", prompt, {
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
  return normalizeAIKeys(res);
}

export async function analyzeSocialStrategy(params: any): Promise<AnalysisResult> {
    const metrics = params.realMetrics || {};
    const prompt = `
        Você é o estrategista chefe da VIRAL ROAD. Sua missão é realizar uma auditoria neural profunda deste perfil:
        
        DADOS REAIS DO PERFIL:
        - Plataforma: ${params.profiles?.[0]?.id || 'Instagram'}
        - Usuário: @${metrics.handle || 'N/A'}
        - Seguidores: ${metrics.followers || 0}
        - Engajamento: ${metrics.engagement_rate || 0}%
        - Posts: ${metrics.posts || 0}
        - Nicho: ${params.niche || 'Geral'}
        - Especialização: ${params.specialization || 'N/A'}
        - Objetivo Principal: ${params.objective || 'Crescimento e Autoridade'}

        INSTRUÇÕES PARA O RELATÓRIO (RESPONDA EM PT-BR):
        1. viral_score: Um número de 0 a 100 baseado no potencial de viralização atual.
        2. best_format: Identifique o formato vencedor (ex: "Reels de Curiosidade", "Carrosséis Educativos", "Shorts de Lifestyle").
        3. frequency_suggestion: Plano prático de postagem (ex: "1 Reel diário + 5 Stories estratégicos").
        4. content_pillars: Lista de 3 a 4 temas que o perfil DEVE dominar.
        5. diagnostic.status_label: Uma frase curta de status (ex: "PERFIL COM ALTO POTENCIAL", "NECESSITA AJUSTE DE RITMO").
        6. diagnostic.key_action_item: A ação #1 que o usuário deve fazer HOJE para mudar o jogo.
        7. diagnostic.tone_audit: Analise o tom de voz. Ele é autoritário? Amigável? Precisa ser mais magnético?
        8. diagnostic.content_strategy_advice: A Linha Editorial completa. Como ele deve se posicionar? Qual a narrativa mestre?
        9. next_post_recommendation: Uma ideia real de postagem para ele fazer agora.

        IMPORTANTE: Não use placeholders. Seja específico para o nicho "${params.niche}".
    `;

    return await callAIProxy("gemini-3-flash-preview", prompt, {
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
  const prompt = `
    Realize uma análise de Market Fit para o perfil: ${params.name}.
    Nicho: ${params.niche}
    Especialização: ${params.specialization}

    Retorne um JSON com:
    - score: 0-100
    - market_status: (ex: "Oceano Azul", "Mercado Saturado", "Alta Demanda")
    - verdict: Uma análise de 2 frases sobre como o perfil se encaixa no mercado atual.
    - tip: Uma tática de diferenciação única para este usuário.

    Responda em PT-BR.
  `;
  return await callAIProxy("gemini-3-flash-preview", prompt, {
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
    return await callAIProxy("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { topics: { type: "ARRAY", items: { type: "STRING" } } } }
    });
}

export async function generateHooksFromTopic(params: any) {
    const prompt = `Ganchos para: ${params.topic}.`;
    return await callAIProxy("gemini-3-flash-preview", prompt, {
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