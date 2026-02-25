import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = process.env.APIFY_TOKEN || 'apify_api_J8nQQGmU3omQUqNSqhFNvIcNPNMh3y3MTEp5';

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
    let { platform, payload } = req.body || {};
    platform = platform ? platform.toString().toLowerCase().trim() : '';
    const actorId = ACTOR_IDS[platform];

    if (!actorId) {
      return res.status(400).json({ error: `Plataforma '${platform}' não suportada ou inválida.` });
    }

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
    return res.status(200).json(data);
  } catch (error: any) {
    console.error("Proxy Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
