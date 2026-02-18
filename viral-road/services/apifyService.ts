
import { NormalizedMetrics } from '../types';
import { normalizeProfile } from './normalize';

// O token está definido aqui apenas como fallback local de desenvolvimento.
// Em produção, a chamada deve ir para o proxy que injeta o token secretamente.
const APIFY_TOKEN_FALLBACK = 'apify_api_J8nQQGmU3omQUqNSqhFNvIcNPNMh3y3MTEp5';

// Mapeamento dos Atores (Scrapers) do Apify
const ACTOR_IDS = {
  TIKTOK: 'clockworks/tiktok-scraper',
  INSTAGRAM: 'apify/instagram-scraper',
  YOUTUBE: 'streamers/youtube-channel-scraper',
  KWAI: 'luan.r.dev/kwai-profile-scraper'
};

// Timeout ajustado para 50s (Com 4GB de RAM, deve responder muito antes disso)
const DATA_FETCH_TIMEOUT = 50000; 

/**
 * Gera dados simulados quando a API falha ou é bloqueada (CORS/AdBlock)
 */
export function getMockProfileData(platform: string, input: any) {
    let handle = "usuario_simulado";
    
    // Tenta extrair o handle ou URL do input
    if (input.profiles && input.profiles.length > 0) {
        handle = input.profiles[0];
    } else if (input.directUrls && input.directUrls.length > 0) {
        const parts = input.directUrls[0].split('/').filter(Boolean);
        handle = parts[parts.length - 1] || "usuario";
    } else if (input.startUrls && input.startUrls.length > 0) {
        const parts = input.startUrls[0].url.split('/').filter(Boolean);
        handle = parts[parts.length - 1] || "usuario";
    }

    handle = handle.split('?')[0].replace('@', '');

    return {
        _isMock: true,
        username: handle,
        fullName: `${handle} (Simulado)`,
        biography: "⚠️ Conexão de rede bloqueada ou timeout. Exibindo dados simulados.",
        profilePicUrl: null,
        url: `https://${platform}.com/${handle}`,
        followersCount: 15420,
        followsCount: 230,
        likesCount: 89000,
        postsCount: 45,
        engagementRate: 4.2,
        verified: false,
        private: false
    };
}

/**
 * Função genérica para chamar a API do Apify
 * Prioriza o uso do Proxy Serverless para segurança.
 */
async function callApifyActor(actorId: string, input: any, retries = 1, delay = 2000): Promise<any> {
  // Identifica a plataforma baseada no ActorID para uso no proxy
  let platformKey = 'instagram';
  if (actorId.includes('tiktok')) platformKey = 'tiktok';
  if (actorId.includes('youtube')) platformKey = 'youtube';
  if (actorId.includes('kwai')) platformKey = 'kwai';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DATA_FETCH_TIMEOUT);

  try {
    // 1. Tenta via Proxy Serverless (Recomendado para Produção)
    const proxyResponse = await fetch('/.netlify/functions/apify-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            platform: platformKey, 
            payload: input 
        }),
        signal: controller.signal
    });

    clearTimeout(timeoutId);

    const contentType = proxyResponse.headers.get("content-type");
    if (proxyResponse.ok && contentType && contentType.includes("application/json")) {
        const data = await proxyResponse.json();
        // Verifica se houve erro lógico retornado pelo proxy
        if (data.error) throw new Error(data.error);

        const items = data.items || (Array.isArray(data) ? data : [data]);
        if (items && items.length > 0) return items;
        throw new Error("Proxy retornou dados vazios.");
    }

    throw new Error(`Proxy indisponível (Status ${proxyResponse.status}) ou resposta inválida.`);

  } catch (proxyError: any) {
    clearTimeout(timeoutId);
    if (proxyError.name === 'AbortError') {
        console.warn("⏳ Timeout na requisição Apify Proxy.");
        return [getMockProfileData(platformKey, input)];
    }

    console.warn("⚠️ Proxy falhou, tentando acesso direto (Fallback)...", proxyError);
    
    // Fallback: Chamada Direta (Client-Side)
    try {
        const token = process.env.APIFY_TOKEN || APIFY_TOKEN_FALLBACK;
        // ULTRA MEMORY BOOST: 4096MB no fallback também
        const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&memory=4096`;

        const directController = new AbortController();
        const directTimeoutId = setTimeout(() => directController.abort(), 50000);

        const directResponse = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
          signal: directController.signal
        });

        clearTimeout(directTimeoutId);

        if (!directResponse.ok) {
             if (retries > 0 && directResponse.status >= 500) {
                 await new Promise(resolve => setTimeout(resolve, delay));
                 return callApifyActor(actorId, input, retries - 1, delay * 2);
             }
             throw new Error(`Erro Apify Direto (${directResponse.status})`);
        }
        
        const items = await directResponse.json();
        if (!Array.isArray(items) || items.length === 0) throw new Error("Perfil não encontrado.");
        
        return items;

    } catch (directError: any) {
        console.error("Apify Call Error (Direct):", directError);
        return [getMockProfileData(platformKey, input)];
    }
  }
}

export const mapToAppMetrics = (normalized: any): NormalizedMetrics => {
    return {
        followers: normalized.followers,
        following: normalized.following || 0,
        likes: normalized.likes,
        posts: normalized.posts,
        views: normalized.views || null, 
        engagement_rate: normalized.engagement_rate,
        bio: normalized.bio,
        avatar_url: normalized.avatar_url,
        external_link: normalized.profile_url,
        verified: normalized.is_verified || false,
        is_private: normalized.is_private || false,
        handle: normalized.username
    };
};

export async function fetchTikTokProfileData(urlOrHandle: string) {
  let handle = urlOrHandle.trim();
  try {
    if (handle.includes('tiktok.com/@')) handle = handle.split('tiktok.com/@')[1].split(/[?\/]/)[0];
    else if (handle.includes('tiktok.com/')) handle = handle.split('tiktok.com/')[1].split(/[?\/]/)[0];
    handle = handle.replace(/^@/, '').replace(/[^a-zA-Z0-9_.-]/g, '');
  } catch (e) { /* ignore */ }

  const items = await callApifyActor(ACTOR_IDS.TIKTOK, {
    profiles: [handle],
    resultsPerPage: 5,
    shouldDownloadVideos: false,
    shouldDownloadCovers: false
  });

  const normalized = normalizeProfile(items, "tiktok");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchInstagramProfileData(urlOrHandle: string) {
  let url = urlOrHandle.trim();
  if (!url.startsWith('http')) url = `https://www.instagram.com/${url.replace(/^@/, '')}`;
  try { const u = new URL(url); u.search = ''; url = u.toString(); } catch(e){}

  // PAYLOAD OTIMIZADO PARA VELOCIDADE EXTREMA
  // Limit 12: Suficiente para amostra de engajamento recente, muito mais rápido que 200.
  // searchType: "hashtag": Mantido para garantir funcionamento do scraper sem fallback.
  const items = await callApifyActor(ACTOR_IDS.INSTAGRAM, {
    directUrls: [url],
    resultsType: "details", 
    resultsLimit: 12, // Reduzido de 200 para 12 para extração instantânea
    searchLimit: 1,
    searchType: "hashtag",
    addParentData: false 
  });

  const normalized = normalizeProfile(items, "instagram");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchYouTubeProfileData(url: string) {
  const items = await callApifyActor(ACTOR_IDS.YOUTUBE, {
    startUrls: [{ url }],
    maxResults: 1
  });

  const normalized = normalizeProfile(items, "youtube");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchKwaiProfileData(url: string) {
  const items = await callApifyActor(ACTOR_IDS.KWAI, {
    startUrls: [{ url }]
  });

  const normalized = normalizeProfile(items, "kwai");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}
