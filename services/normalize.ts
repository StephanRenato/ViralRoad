
// @ts-nocheck
export function normalizeProfile(
  rawData: any,
  platformInput: string
) {
  const now = new Date().toISOString();
  const platform = (platformInput || 'instagram').toLowerCase();
  
  // Safely get the first item
  const firstItem = Array.isArray(rawData) ? rawData[0] : rawData;
  if (!firstItem) return null;

  // Handle Mock Data (Fallback Mode)
  if (firstItem._isMock) {
      return {
          platform,
          username: firstItem.username,
          name: firstItem.fullName || firstItem.username,
          display_name: firstItem.fullName || firstItem.username,
          avatar: firstItem.profilePicUrl || "", 
          avatar_url: firstItem.profilePicUrl || "", 
          bio: firstItem.biography || "",
          profile_url: firstItem.url,
          
          followers: firstItem.followersCount,
          following: firstItem.followsCount,
          likes: firstItem.likesCount,
          posts: firstItem.postsCount,
          views: null,
          engagement: firstItem.engagementRate,
          engagement_rate: firstItem.engagementRate,
          
          is_verified: firstItem.verified,
          is_private: firstItem.private,
          
          last_sync: now,
          raw_data: rawData,
          _isMock: true
      };
  }

  // INSTAGRAM
  if (platform === "instagram") {
    const p = firstItem;
    const followers = p.followersCount || 0;
    const following = p.followsCount || 0;
    const posts = p.postsCount || 0;
    
    // Engagement Rate Calculation
    const recentPosts = Array.isArray(p.latestPosts) ? p.latestPosts : [];
    let engagement = 0;
    let totalSampleLikes = 0;

    if (recentPosts.length > 0) {
        const totalInteractions = recentPosts.reduce((acc: number, post: any) => {
            const likes = (post.likesCount || 0);
            const comments = (post.commentsCount || 0);
            totalSampleLikes += likes;
            return acc + likes + comments;
        }, 0);
        
        if (followers > 0) {
            const avgInteractions = totalInteractions / recentPosts.length;
            engagement = (avgInteractions / followers) * 100;
        }
    }

    const avatar = p.profilePicUrlHD || p.profilePicUrl || "";

    return {
      platform: "instagram",
      avatar: avatar,
      avatar_url: avatar,
      username: p.username || p.ownerUsername || "",
      name: p.fullName || "",
      bio: p.biography || "",
      profile_url: `https://instagram.com/${p.username}`,
      
      followers: followers,
      following: following,
      posts: posts,
      likes: totalSampleLikes, // Sample based likes
      engagement: parseFloat(engagement.toFixed(2)),
      engagement_rate: parseFloat(engagement.toFixed(2)),
      is_verified: p.verified || false,
      is_private: p.isPrivate || false,
      last_sync: now,
      raw_data: rawData
    };
  }

  // TIKTOK
  if (platform === "tiktok") {
    // Support varying Apify outputs
    const p = firstItem.authorMeta || firstItem.user || firstItem;
    const stats = firstItem.stats || firstItem.authorStats || firstItem;

    const followers = p?.fans || stats?.followerCount || 0;
    const likes = p?.heart || stats?.heartCount || 0;
    const following = p?.following || stats?.followingCount || 0;
    const posts = p?.video || stats?.videoCount || 0;
    
    return {
      platform: "tiktok",
      avatar: p?.avatar || p?.avatarLarger || "",
      avatar_url: p?.avatar || p?.avatarLarger || "",
      username: p?.name || p?.uniqueId || "",
      name: p?.nickName || p?.nickname || "",
      bio: p?.signature || p?.bio || "",
      profile_url: `https://tiktok.com/@${p?.name || p?.uniqueId}`,
      followers: followers,
      following: following,
      posts: posts,
      likes: likes,
      engagement: followers > 0 ? parseFloat(((likes / followers) * 100).toFixed(2)) : 0,
      engagement_rate: followers > 0 ? parseFloat(((likes / followers) * 100).toFixed(2)) : 0,
      is_verified: p?.verified || false,
      is_private: p?.private || false,
      last_sync: now,
      raw_data: rawData
    }
  }

  // YOUTUBE
  if (platform === "youtube") {
    const p = firstItem;
    const parseNumber = (num: any) => typeof num === 'string' ? parseInt(num.replace(/[^0-9]/g, '')) : (num || 0);

    const subscribers = parseNumber(p.subscriberCount);
    const totalViews = parseNumber(p.viewCount);

    return {
      platform: "youtube",
      avatar: p.channelThumbnail || p.avatarUrl || "",
      avatar_url: p.channelThumbnail || p.avatarUrl || "",
      username: p.channelHandle || p.channelName || "",
      name: p.channelName || "",
      bio: p.channelDescription || p.description || "",
      profile_url: p.channelUrl || `https://youtube.com/${p.channelHandle || p.channelName}`,
      followers: subscribers,
      following: 0,
      posts: parseNumber(p.videoCount),
      likes: parseNumber(p.likeCount), 
      engagement: subscribers > 0 ? parseFloat(((totalViews / subscribers) * 100).toFixed(2)) : 0,
      engagement_rate: subscribers > 0 ? parseFloat(((totalViews / subscribers) * 100).toFixed(2)) : 0,
      is_verified: p.verified || false,
      is_private: false,
      last_sync: now,
      raw_data: rawData
    }
  }

  // KWAI
  if (platform === "kwai") {
    const p = firstItem;
    const followers = p.followersCount || 0;
    const likes = p.likesCount || 0;

    return {
      platform: "kwai",
      avatar: p.avatar || "",
      avatar_url: p.avatar || "",
      username: p.username || "",
      name: p.displayName || "",
      bio: p.biography || "",
      profile_url: `https://kwai.com/@${p.username}`,
      followers: followers,
      following: p.followingCount || 0,
      posts: p.postsCount || 0,
      likes: likes,
      engagement: followers > 0 ? parseFloat(((likes / followers) * 100).toFixed(2)) : 0,
      engagement_rate: followers > 0 ? parseFloat(((likes / followers) * 100).toFixed(2)) : 0,
      is_verified: false,
      is_private: false,
      last_sync: now,
      raw_data: rawData
    }
  }

  return null;
}
