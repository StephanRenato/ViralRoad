import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();

const ACTOR_IDS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-channel-scraper',
  kwai: 'luan.r.dev~kwai-profile-scraper'
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    if (!APIFY_TOKEN || APIFY_TOKEN.length < 10) {
      return res.status(500).json({ error: "APIFY_CONFIGURATION_ERROR", message: "Token Apify ausente." });
    }

    let { platform, payload } = req.body || {};
    platform = platform ? platform.toString().toLowerCase().trim() : '';
    const actorId = ACTOR_IDS[platform];

    if (!actorId) {
      return res.status(400).json({ error: `Plataforma '${platform}' não suportada ou inválida.` });
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
            return res.status(504).json({ 
              error: "APIFY_TIMEOUT", 
              message: "A plataforma demorou muito para responder. Tente novamente." 
            });
          }
          throw new Error(`Apify Error (${response.status}): ${response.statusText}`);
      }

      const data = await response.json();
      return res.status(200).json(data);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        return res.status(504).json({ error: "TIMEOUT", message: "Tempo limite excedido." });
      }
      throw fetchError;
    }
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
