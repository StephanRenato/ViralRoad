import { NormalizedMetrics } from '../types';
import { normalizeProfile } from './normalize';

const APIFY_TOKEN_FALLBACK = 'apify_api_J8nQQGmU3omQUqNSqhFNvIcNPNMh3y3MTEp5';

const ACTOR_IDS = {
  TIKTOK: 'clockworks/tiktok-scraper',
  INSTAGRAM: 'apify/instagram-scraper',
  YOUTUBE: 'streamers/youtube-channel-scraper',
  KWAI: 'luan.r.dev/kwai-profile-scraper'
};

async function callApifyActor(actorId: string, input: any): Promise<any> {
  try {
    const proxyResponse = await fetch('/.netlify/functions/apify-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: actorId.includes('tiktok') ? 'tiktok' : 'instagram', payload: input })
    });

    if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        return data.items || (Array.isArray(data) ? data : [data]);
    }
    throw new Error("Proxy fail");
  } catch (e) {
    const token = process.env.APIFY_TOKEN || APIFY_TOKEN_FALLBACK;
    const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&memory=256`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    return await res.json();
  }
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

export async function fetchInstagramProfileData(url: string) {
  const items = await callApifyActor(ACTOR_IDS.INSTAGRAM, { directUrls: [url], resultsLimit: 1 });
  const normalized = normalizeProfile(items, "instagram");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchTikTokProfileData(url: string) {
  const items = await callApifyActor(ACTOR_IDS.TIKTOK, { profiles: [url.split('@')[1]], resultsPerPage: 1 });
  const normalized = normalizeProfile(items, "tiktok");
  return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export async function fetchYouTubeProfileData(url: string) {
    const items = await callApifyActor(ACTOR_IDS.YOUTUBE, { startUrls: [{ url }], maxResults: 1 });
    const normalized = normalizeProfile(items, "youtube");
    return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}

export function getMockProfileData(platform: string, input: any) {
    return {
        username: input.url?.split('/').pop() || 'user',
        followers: 1250,
        following: 430,
        posts: 84,
        likes: 15400,
        engagement: 4.2,
        avatar: "https://picsum.photos/200",
        bio: "Perfil em análise tática pelo Road Engine.",
        profile_url: input.url,
        is_verified: false
    };
}

export async function fetchKwaiProfileData(url: string) {
    const items = await callApifyActor(ACTOR_IDS.KWAI, { startUrls: [{ url }] });
    const normalized = normalizeProfile(items, "kwai");
    return { normalized: mapToAppMetrics(normalized), raw: items[0] };
}