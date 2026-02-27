
import { Handler } from '@netlify/functions';

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();

const ACTOR_IDS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-channel-scraper',
  kwai: 'luan.r.dev~kwai-profile-scraper'
};

const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    if (!APIFY_TOKEN || APIFY_TOKEN.length < 10) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "APIFY_CONFIGURATION_ERROR", message: "Token Apify ausente." }) 
      };
    }

    let { platform, payload } = JSON.parse(event.body || '{}');
    
    // Normalização robusta da plataforma para evitar "Plataforma não suportada"
    platform = platform ? platform.toString().toLowerCase().trim() : '';
    
    const actorId = ACTOR_IDS[platform];

    if (!actorId) {
      console.error(`Erro de Roteamento: Plataforma '${platform}' não encontrada nos ACTOR_IDS.`);
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: `Plataforma '${platform}' não suportada ou inválida.` }) 
      };
    }

    // Adicionado timeout de 55 segundos para evitar 504 do gateway
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=2048&timeout=55`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
          if (response.status === 504 || response.status === 408) {
            return {
              statusCode: 504,
              body: JSON.stringify({ error: "APIFY_TIMEOUT", message: "A plataforma demorou muito para responder." })
            };
          }
          throw new Error(`Apify Error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();

      return {
        statusCode: 200,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return { statusCode: 504, body: JSON.stringify({ error: "TIMEOUT" }) };
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Proxy Error:", error);
    
    let statusCode = 500;
    let errorBody = { error: "APIFY_PROXY_ERROR", message: error.message || "Internal Server Error" };

    if (error.message?.includes("401")) {
      statusCode = 401;
      errorBody = { error: "APIFY_AUTH_ERROR", message: "Falha na autenticação com Apify. Verifique o APIFY_TOKEN." };
    } else if (error.message?.includes("404")) {
      statusCode = 404;
      errorBody = { error: "APIFY_ACTOR_NOT_FOUND", message: "O Actor do Apify não foi encontrado. Verifique os ACTOR_IDS." };
    }

    return {
      statusCode,
      body: JSON.stringify(errorBody),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

export { handler };
