
/**
 * Normalização padrão para dados de diferentes redes sociais
 */
export function normalizeProfileData(rawData: any, platform: string) {
  const p = platform.toLowerCase();
  
  let data = {
    platform: p,
    username: '',
    avatar: '',
    bio: '',
    followers: 0,
    following: 0,
    likes: 0,
    posts: 0,
    views: 0,
    engagement_rate: 0,
    verified: false
  };

  if (p === 'instagram') {
    data.username = rawData.username || '';
    data.avatar = rawData.profilePicUrlHD || rawData.profilePicUrl || '';
    data.bio = rawData.biography || '';
    data.followers = rawData.followersCount || 0;
    data.following = rawData.followsCount || 0;
    data.posts = rawData.postsCount || 0;
    data.verified = rawData.verified || false;
    
    // engagement_rate = (likes + comments) / followers * 100
    const recentPosts = rawData.latestPosts || [];
    if (recentPosts.length > 0 && data.followers > 0) {
      const totalLikes = recentPosts.reduce((acc: number, post: any) => acc + (post.likesCount || 0), 0);
      const totalComments = recentPosts.reduce((acc: number, post: any) => acc + (post.commentsCount || 0), 0);
      data.likes = totalLikes;
      data.engagement_rate = ((totalLikes + totalComments) / data.followers) * 100;
    }
  } 
  
  else if (p === 'tiktok') {
    const user = rawData.authorMeta || rawData.user || rawData;
    const stats = rawData.stats || rawData.authorStats || rawData;
    
    data.username = user.uniqueId || user.name || '';
    data.avatar = user.avatarLarger || user.avatar || '';
    data.bio = user.signature || user.bio || '';
    data.followers = stats.followerCount || stats.fans || 0;
    data.following = stats.followingCount || stats.following || 0;
    data.posts = stats.videoCount || stats.video || 0;
    data.likes = stats.heartCount || stats.heart || 0;
    data.views = stats.playCount || 0;
    data.verified = user.verified || false;
    
    if (data.followers > 0) {
      data.engagement_rate = (data.likes / data.followers) * 100;
    }
  } 
  
  else if (p === 'youtube') {
    data.username = rawData.channelHandle || rawData.channelName || '';
    data.avatar = rawData.channelThumbnail || '';
    data.bio = rawData.channelDescription || '';
    data.followers = parseInt(rawData.subscriberCount) || 0;
    data.posts = parseInt(rawData.videoCount) || 0;
    data.views = parseInt(rawData.viewCount) || 0;
    data.verified = rawData.verified || false;
    
    if (data.followers > 0) {
      data.engagement_rate = (data.views / data.followers) * 100;
    }
  } 
  
  else if (p === 'kwai') {
    data.username = rawData.username || '';
    data.avatar = rawData.avatar || '';
    data.bio = rawData.biography || '';
    data.followers = rawData.followersCount || 0;
    data.following = rawData.followingCount || 0;
    data.posts = rawData.postsCount || 0;
    data.likes = rawData.likesCount || 0;
    
    if (data.followers > 0) {
      data.engagement_rate = (data.likes / data.followers) * 100;
    }
  }

  data.engagement_rate = parseFloat(data.engagement_rate.toFixed(2));
  
  return data;
}
