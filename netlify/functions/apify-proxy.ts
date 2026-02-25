
import { Handler } from '@netlify/functions';

const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_J8nQQGmU3omQUqNSqhFNvIcNPNMh3y3MTEp5';

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

    // ULTRA MEMORY BOOST: Aumentado para 4096MB (4GB)
    // Isso garante inicialização instantânea do navegador headless e evita timeouts de CPU.
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=4096`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
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
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || "Internal Server Error" }),
    };
  }
};

export { handler };
