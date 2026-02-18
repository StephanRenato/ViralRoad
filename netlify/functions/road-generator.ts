
import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: "Method Not Allowed"
      };
    }

    const body = JSON.parse(event.body || "{}");

    const {
      profileUrl,
      objective,
      niche,
      platform,
      format,
      funnelStage
    } = body;

    if (!profileUrl || !platform) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Dados obrigatórios ausentes" })
      };
    }

    // 🔹 SIMULAÇÃO CONTROLADA (Validando fluxo conforme solicitado)
    const result = {
      status: "ok",
      platform,
      profileUrl,
      objective,
      // Mapeamento para manter compatibilidade com UI existente
      roadScore: 85, 
      insights: `Estratégia detectada para ${niche || 'o perfil'}: Focar em ${format || 'conteúdo viral'} no estágio de ${funnelStage || 'Consciência'}.`,
      strategy: {
        hook: "Você está cometendo esse erro sem perceber",
        contentIdea: "Vídeo explicando o erro mais comum no nicho",
        cta: "Siga para mais estratégias"
      }
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Erro interno na função",
        details: error.message
      })
    };
  }
};
