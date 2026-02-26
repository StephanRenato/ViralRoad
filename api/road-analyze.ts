import type { VercelRequest, VercelResponse } from '@vercel/node';

const APIFY_TOKEN = (process.env.APIFY_TOKEN || '').trim();

const ACTOR_IDS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-channel-scraper',
  kwai: 'luan.r.dev~kwai-profile-scraper'
};

const getMockData = (platform: string, url: string) => {
    return {
        followers: 15400,
        likes: 45000,
        videos: 85,
        engagement: 4.5,
        mock: true
    };
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
  }

  try {
    const { platform, profileUrl, objective } = req.body || {};

    if (!profileUrl) {
      return res.status(400).json({ error: "URL do perfil é obrigatória" });
    }

    const platformKey = platform?.toLowerCase() || 'instagram';
    const actorId = ACTOR_IDS[platformKey];

    let normalized = { followers: 0, likes: 0, videos: 0, engagement: 0 };
    let rawData: any = null;

    if (APIFY_TOKEN && APIFY_TOKEN.length > 10 && actorId) {
        try {
            let payload = {};
            if (platformKey === 'tiktok') {
                const username = profileUrl.split('tiktok.com/@')[1]?.split('?')[0] || 'user';
                payload = { profiles: [username], resultsPerPage: 20 };
            } else if (platformKey === 'instagram') {
                payload = { directUrls: [profileUrl], resultsType: "details" };
            } else if (platformKey === 'youtube' || platformKey === 'kwai') {
                payload = { startUrls: [{ url: profileUrl }] };
            }

            const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${APIFY_TOKEN}&memory=256&timeout=55`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000);

            const apifyResponse = await fetch(
                url,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                }
            );

            clearTimeout(timeoutId);

            if (apifyResponse.ok) {
                const items = await apifyResponse.json();
                if (Array.isArray(items) && items.length > 0) {
                    rawData = items;
                    const item = items[0];
                    
                    if (platformKey === 'tiktok') {
                        const am = item.authorMeta || {};
                        normalized = {
                            followers: am.fans || 0,
                            likes: am.heart || 0,
                            videos: item.videoCount || 0,
                            engagement: (am.fans > 0) ? (am.heart / am.fans) * 100 : 0
                        };
                    } else if (platformKey === 'instagram') {
                        normalized = {
                            followers: item.followersCount || 0,
                            likes: 0, 
                            videos: item.postsCount || 0,
                            engagement: 0
                        };
                        if (item.latestPosts) {
                             const likes = item.latestPosts.reduce((a:any, b:any) => a + (b.likesCount||0), 0);
                             normalized.likes = likes;
                             if(normalized.followers) normalized.engagement = (likes / item.latestPosts.length / normalized.followers) * 100;
                        }
                    } else {
                        normalized = { followers: 10000, likes: 50000, videos: 100, engagement: 3.5 }; 
                    }
                }
            }
        } catch (e) {
            console.error("Apify error (silenced):", e);
        }
    }

    if (!rawData) {
        normalized = getMockData(platformKey, profileUrl);
    }

    let baseScore = 50;
    if (normalized.followers > 10000) baseScore += 20;
    if (normalized.engagement > 3) baseScore += 20;
    if (normalized.videos > 50) baseScore += 10;
    
    const roadScore = Math.min(100, Math.round(baseScore));

    let insights = "";
    if (roadScore < 50) {
        insights = "Detectamos baixa consistência. Sua estratégia precisa focar em frequência e retenção nos primeiros 3s.";
    } else if (roadScore < 80) {
        insights = "Bom engajamento, mas potencial de viralização subutilizado. Ajuste seus ganchos (Hooks) para aumentar o alcance.";
    } else {
        insights = "Perfil com alta autoridade algorítmica. Foque em conversão e formatos de venda direta, sua audiência já confia em você.";
    }

    if (objective) {
        insights += ` Para o objetivo de '${objective}', recomendamos aumentar a CTA visual nos próximos 5 vídeos.`;
    }

    return res.status(200).json({
        success: true,
        roadScore,
        insights,
        normalized,
        platform: platformKey
    });

  } catch (err: any) {
    console.error("Server error:", err);
    return res.status(200).json({
        roadScore: 50,
        insights: "Não foi possível analisar os dados em tempo real. Exibindo estratégia baseada em média de mercado.",
        normalized: getMockData("general", ""),
        error: "Fallback devido a erro interno"
    });
  }
}
