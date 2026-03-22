import { AnalysisResult } from "../types";
import { GoogleGenAI, Modality } from "@google/genai";

const SYSTEM_PROMPT = `Você é o VIRAL ROAD, estrategista de elite. Responda em PT-BR.`;

// Lazy initialization of GoogleGenAI
let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave da API Gemini não foi configurada. Por favor, verifique as configurações.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

async function callAI(model: string, prompt: string, config: any) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: model || "gemini-3-flash-preview",
      contents: prompt,
      config: {
        ...config,
        systemInstruction: config.systemInstruction || SYSTEM_PROMPT,
      }
    });

    if (!response.text) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    if (config.responseMimeType === "application/json") {
      try {
        return JSON.parse(response.text);
      } catch (e) {
        // Fallback for malformed JSON
        const cleaned = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleaned);
      }
    }

    return response.text;
  } catch (error: any) {
    console.error("Erro na chamada da IA:", error);
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
      type: "OBJECT",
      properties: {
        analysis_insight: { type: "STRING" },
        narratives: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, description: { type: "STRING" } } } }
      }
    }
  });
  return normalizeAIKeys(res);
}

export async function generateImage(prompt: string) {
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const base64EncodeString: string = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    throw new Error("Nenhuma imagem foi gerada.");
  } catch (error) {
    console.error("Erro ao gerar imagem:", error);
    throw error;
  }
}

export async function generateVideo(prompt: string) {
  try {
    const ai = getAI();
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Link de download do vídeo não encontrado.");

    // Fetch the video with the API key
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey || '',
      },
    });

    if (!response.ok) throw new Error("Falha ao baixar o vídeo gerado.");
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Erro ao gerar vídeo:", error);
    throw error;
  }
}

export async function chatWithAssistant(message: string, history: any[] = []) {
  try {
    const ai = getAI();
    const chat = ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_PROMPT + " Você ajuda o usuário a criar conteúdo viral, dá ideias de posts e analisa estratégias.",
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    console.error("Erro no chat com assistente:", error);
    throw error;
  }
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
  const res = await callAI("gemini-3-flash-preview", prompt, {
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

    return await callAI("gemini-3-flash-preview", prompt, {
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
  return await callAI("gemini-3-flash-preview", prompt, {
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
    return await callAI("gemini-3-flash-preview", prompt, {
        responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { topics: { type: "ARRAY", items: { type: "STRING" } } } }
    });
}

export async function generateHooksFromTopic(params: any) {
    const prompt = `Ganchos para: ${params.topic}.`;
    return await callAI("gemini-3-flash-preview", prompt, {
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

export async function generateRoadStrategy(params: any) {
  const prompt = `
    Crie uma estratégia de conteúdo completa para:
    Nicho: ${params.niche}
    Objetivo: ${params.objective}
    Plataforma: ${params.platform}

    INSTRUÇÃO DE FORMATO:
    Retorne um objeto JSON com as chaves EXATAMENTE assim:
    {
      "content_pillars": ["pilar 1", "pilar 2", "pilar 3"],
      "viral_hooks": ["gancho 1", "gancho 2", "gancho 3"],
      "post_ideas": ["ideia 1", "ideia 2", "ideia 3"],
      "posting_frequency": "string",
      "best_format": "string",
      "video_script": "string"
    }

    Responda em Português do Brasil (PT-BR).
  `;
  return await callAI("gemini-3-flash-preview", prompt, {
    systemInstruction: SYSTEM_PROMPT,
    responseMimeType: "application/json",
    responseSchema: {
      type: "OBJECT",
      properties: {
        content_pillars: { type: "ARRAY", items: { type: "STRING" } },
        viral_hooks: { type: "ARRAY", items: { type: "STRING" } },
        post_ideas: { type: "ARRAY", items: { type: "STRING" } },
        posting_frequency: { type: "STRING" },
        best_format: { type: "STRING" },
        video_script: { type: "STRING" }
      }
    }
  });
}
