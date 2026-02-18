
// @ts-nocheck
export function normalizeProfile(
  rawData: any,
  platform: "instagram" | "tiktok" | "youtube" | "kwai"
) {
  const now = new Date().toISOString();
  
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
          avatar: firstItem.profilePicUrl || "", // normalize to 'avatar' to match interface
          avatar_url: firstItem.profilePicUrl || "", // support both keys
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

    return {
      platform: "instagram",
      avatar: p.profilePicUrlHD || p.profilePicUrl || "",
      username: p.username || p.ownerUsername || "",
      name: p.fullName || "",
      bio: p.biography || "",
      
      followers: followers,
      following: following,
      posts: posts,
      likes: totalSampleLikes, // Sample based likes
      engagement: parseFloat(engagement.toFixed(2))
    };
  }

  // TIKTOK
  if (platform === "tiktok") {
    // Support varying Apify outputs
    const p = firstItem.authorMeta || firstItem.user || firstItem;
    const stats = firstItem.stats || firstItem.authorStats || firstItem;

    const followers = p.fans || stats.followerCount || 0;
    const likes = p.heart || stats.heartCount || 0;
    const following = p.following || stats.followingCount || 0;
    const posts = p.video || stats.videoCount || 0;
    
    return {
      platform: "tiktok",
      avatar: p.avatar || p.avatarLarger || "",
      username: p.name || p.uniqueId || "",
      name: p.nickName || p.nickname || "",
      bio: p.signature || p.bio || "",
      followers: followers,
      following: following,
      posts: posts,
      likes: likes,
      engagement: followers > 0 ? parseFloat(((likes / followers) * 100).toFixed(2)) : 0
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
      username: p.channelHandle || p.channelName || "",
      name: p.channelName || "",
      bio: p.channelDescription || p.description || "",
      followers: subscribers,
      following: 0,
      posts: parseNumber(p.videoCount),
      likes: parseNumber(p.likeCount), 
      engagement: subscribers > 0 ? parseFloat(((totalViews / subscribers) * 100).toFixed(2)) : 0
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
      username: p.username || "",
      name: p.displayName || "",
      bio: p.biography || "",
      followers: followers,
      following: p.followingCount || 0,
      posts: p.postsCount || 0,
      likes: likes,
      engagement: followers > 0 ? parseFloat(((likes / followers) * 100).toFixed(2)) : 0
    }
  }

  return null;
}
