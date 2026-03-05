import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

const SYSTEM_PROMPT = `Você é o VIRAL ROAD, estrategista de elite. Responda em PT-BR.`;

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function callAI(modelName: string, prompt: string, config: any) {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: config.systemInstruction || SYSTEM_PROMPT,
        responseMimeType: config.responseMimeType || "application/json",
        responseSchema: config.responseSchema,
        temperature: config.temperature || 1,
      }
    });

    if (!response.text) {
      throw new Error("Resposta vazia da IA");
    }

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return { text: response.text };
    }
  } catch (error: any) {
    console.error(`Erro na geração de conteúdo (${modelName}):`, error);
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
  const res = await callAI("gemini-3-flash-preview", prompt, {
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
  const res = await callAI("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: { headlines: { type: Type.ARRAY, items: { type: Type.STRING } } }
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
  const res = await callAI("gemini-3-flash-preview", prompt, {
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
        2. best_format: Identifique o formato vencedor ESPECÍFICO (ex: "Reels de Curiosidade com Cortes Rápidos", "Carrosséis de Tutorial Passo-a-Passo"). NÃO use termos genéricos.
        3. frequency_suggestion: Plano prático e detalhado (ex: "1 Reel diário focado em topo de funil + 3 Stories de interação").
        4. content_pillars: Lista de 3 a 4 temas estratégicos (ex: "Bastidores da Produção", "Dicas Rápidas de [Nicho]", "Quebra de Objeções").
        5. diagnostic.status_label: Uma frase curta e impactante de status.
        6. diagnostic.key_action_item: A ação #1 TÁTICA que o usuário deve fazer HOJE (ex: "Grave um vídeo de 15s respondendo a dúvida X", "Mude sua Bio para focar no benefício Y").
        7. diagnostic.tone_audit: Auditoria profunda do tom de voz atual vs ideal.
        8. diagnostic.content_strategy_advice: Linha Editorial e narrativa mestre. Como se diferenciar da concorrência?
        9. diagnostic.visual_style: Estética visual, paleta de cores sugerida e estilo de fotografia/vídeo.
        10. next_post_recommendation: Uma ideia real, pronta para gravar, incluindo gancho e objetivo.

        IMPORTANTE: Você é um consultor de R$ 10.000/hora. Seja extremamente específico, tático e direto. Não use placeholders. Use os dados reais fornecidos para embasar sua estratégia.
    `;

    return await callAI("gemini-3.1-pro-preview", prompt, {
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
                                            content_strategy_advice: { type: Type.STRING },
                                            visual_style: { type: Type.STRING }
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
  return await callAI("gemini-3-flash-preview", prompt, {
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
    return await callAI("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: { type: Type.OBJECT, properties: { topics: { type: Type.ARRAY, items: { type: Type.STRING } } } }
    });
}

export async function generateHooksFromTopic(params: any) {
    const prompt = `Ganchos para: ${params.topic}.`;
    return await callAI("gemini-3-flash-preview", prompt, {
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
