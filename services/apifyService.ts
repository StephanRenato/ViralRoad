import { NormalizedMetrics } from '../types';
import { normalizeProfile } from './normalize';

const APIFY_TOKEN_FALLBACK = '';

const ACTOR_IDS = {
  TIKTOK: 'clockworks~tiktok-scraper',
  INSTAGRAM: 'apify~instagram-scraper',
  YOUTUBE: 'streamers~youtube-channel-scraper',
  KWAI: 'luan.r.dev~kwai-profile-scraper'
};

async function callApifyActor(actorId: string, input: any): Promise<any> {
  let platform = 'instagram';
  if (actorId.includes('tiktok')) platform = 'tiktok';
  else if (actorId.includes('youtube')) platform = 'youtube';
  else if (actorId.includes('kwai')) platform = 'kwai';

  const proxyResponse = await fetch('/api/apify-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, payload: input })
  });

  if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      return data.items || (Array.isArray(data) ? data : [data]);
  }
  
  const errorData = await proxyResponse.json().catch(() => ({}));
  const errorMessage = errorData.message || errorData.error || `Falha ao buscar dados da plataforma: ${proxyResponse.status}`;
  throw new Error(errorMessage);
}

export const mapToAppMetrics = (normalized: any): NormalizedMetrics => {
    return {
        followers: normalized.followers,
        following: normalized.following || 0,
        likes: normalized.likes,
        posts: normalized.posts,
        views: normalized.views || null, 
        engagement_rate: normalized.engagement || 0,
        bio: normalized.bio,
        avatar_url: normalized.avatar,
        external_link: normalized.profile_url,
        verified: normalized.is_verified || false,
        is_private: normalized.is_private || false,
        handle: normalized.username
    };
};

const normalizeUrl = (url: string, platform: string): string => {
  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  if (platform === 'instagram' && !cleanUrl.includes('instagram.com')) {
    const handle = cleanUrl.split('/').pop()?.replace('@', '');
    return `https://www.instagram.com/${handle}/`;
  }

  if (platform === 'tiktok' && !cleanUrl.includes('tiktok.com')) {
    const handle = cleanUrl.split('/').pop()?.replace('@', '');
    return `https://www.tiktok.com/@${handle}`;
  }

  return cleanUrl;
};

export async function fetchInstagramProfileData(url: string) {
  const normalizedUrl = normalizeUrl(url, 'instagram');
  const items = await callApifyActor(ACTOR_IDS.INSTAGRAM, { directUrls: [normalizedUrl], resultsLimit: 1, resultsType: 'details' });
  const normalized = normalizeProfile(items, "instagram");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchInstagramPosts(url: string, limit: number = 20) {
  const normalizedUrl = normalizeUrl(url, 'instagram');
  const items = await callApifyActor(ACTOR_IDS.INSTAGRAM, { 
    directUrls: [normalizedUrl], 
    resultsType: 'posts', 
    resultsLimit: limit,
    addParentData: false
  });
  return items;
}

export async function fetchTikTokProfileData(url: string) {
  const normalizedUrl = normalizeUrl(url, 'tiktok');
  
  // Robust username extraction from normalized URL
  let username = '';
  const match = normalizedUrl.match(/@([a-zA-Z0-9._-]+)/);
  if (match) {
    username = match[1];
  } else {
    username = normalizedUrl.split('/').pop()?.replace('@', '').split('?')[0] || '';
  }

  if (!username) throw new Error("Não foi possível extrair o usuário da URL do TikTok.");

  const items = await callApifyActor(ACTOR_IDS.TIKTOK, { profiles: [username], resultsPerPage: 1 });
  const normalized = normalizeProfile(items, "tiktok");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchYouTubeProfileData(url: string) {
    const items = await callApifyActor(ACTOR_IDS.YOUTUBE, { startUrls: [{ url }], maxResults: 1 });
    const normalized = normalizeProfile(items, "youtube");
    return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export function getMockProfileData(platform: string, input: any) {
    // Return data in a format that normalizeProfile can handle as "raw"
    if (platform === 'instagram') {
        return {
            _isMock: true,
            username: input.url?.split('/').pop() || 'user',
            fullName: "Estrategista Road",
            followersCount: 12500,
            followsCount: 430,
            postsCount: 84,
            engagementRate: 4.2,
            profilePicUrl: "https://picsum.photos/200",
            biography: "Perfil em análise tática pelo Road Engine.",
            url: input.url,
            verified: false,
            private: false
        };
    }
    if (platform === 'tiktok') {
        return {
            _isMock: true,
            authorMeta: {
                name: input.url?.split('@').pop() || 'user',
                nickName: "Viral Creator",
                fans: 45000,
                heart: 154000,
                video: 120,
                signature: "Criando conteúdo viral.",
                avatar: "https://picsum.photos/200"
            }
        };
    }
    // Default mock
    return {
        _isMock: true,
        username: 'user',
        followersCount: 1000,
        engagementRate: 3.0,
        url: input.url
    };
}

export async function fetchKwaiProfileData(url: string) {
    const items = await callApifyActor(ACTOR_IDS.KWAI, { startUrls: [{ url }] });
    const normalized = normalizeProfile(items, "kwai");
    return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}