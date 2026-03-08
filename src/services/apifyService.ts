
import { roadScore } from './roadScore';
import { normalizeProfileData } from './normalizeProfile';

const ACTOR_IDS: Record<string, string> = {
  instagram: 'apify~instagram-scraper',
  tiktok: 'clockworks~tiktok-scraper',
  youtube: 'streamers~youtube-channel-scraper',
  kwai: 'luan.r.dev~kwai-profile-scraper'
};

/**
 * Função universal para buscar dados reais de perfis sociais via Apify
 */
export async function fetchSocialProfile(platform: string, url: string) {
  const platformId = platform.toLowerCase();
  const actorId = ACTOR_IDS[platformId];

  if (!actorId) {
    throw new Error(`Plataforma ${platform} não suportada.`);
  }

  // Normalização básica de URL para garantir que o Apify aceite
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Payload específico por plataforma
  let payload: any = {};
  if (platformId === 'instagram') {
    payload = { directUrls: [cleanUrl], resultsLimit: 1, resultsType: 'details' };
  } else if (platformId === 'tiktok') {
    // Extrair username para TikTok se necessário, mas o scraper aceita URLs
    payload = { startUrls: [{ url: cleanUrl }], resultsPerPage: 1 };
  } else if (platformId === 'youtube') {
    payload = { startUrls: [{ url: cleanUrl }], maxResults: 1 };
  } else if (platformId === 'kwai') {
    payload = { startUrls: [{ url: cleanUrl }] };
  }

  try {
    const response = await fetch('/api/apify-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: platformId, payload })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erro ao acessar API (${response.status})`);
    }

    const data = await response.json();
    const items = data.items || (Array.isArray(data) ? data : [data]);
    
    if (!items || items.length === 0) {
      throw new Error("Nenhum dado encontrado para este perfil. Verifique se o link está correto e o perfil é público.");
    }

    const rawData = items[0];
    const normalized = normalizeProfileData(rawData, platformId);
    const scoreData = roadScore(normalized);

    return {
      ...normalized,
      road_score: scoreData.score,
      insight: scoreData.insight,
      raw: rawData
    };
  } catch (error: any) {
    console.error(`Error fetching ${platform} profile:`, error);
    throw new Error(error.message || "Falha na comunicação com os servidores de dados.");
  }
}

/**
 * Mantido para compatibilidade com análise de posts específicos do Instagram
 */
export async function fetchInstagramPosts(url: string, limit: number = 40) {
  const payload = { 
    directUrls: [url], 
    resultsType: 'posts', 
    resultsLimit: limit,
    searchType: 'user',
    addParentData: false,
    includeReels: true,
    includeVideos: true,
  };

  const response = await fetch('/api/apify-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: 'instagram', payload })
  });

  if (!response.ok) throw new Error("Falha ao buscar posts do Instagram.");
  
  const data = await response.json();
  const items = data.items || (Array.isArray(data) ? data : [data]);
  
  return items.sort((a: any, b: any) => {
    const dateA = new Date(a.timestamp || 0).getTime();
    const dateB = new Date(b.timestamp || 0).getTime();
    return dateB - dateA;
  });
}
