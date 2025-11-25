// Helper function to extract YouTube video ID from URL
export function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Generate YouTube embed URL from video ID or full URL
export function getYouTubeEmbedUrl(urlOrId: string): string | null {
  if (!urlOrId) return null;
  
  const videoId = urlOrId.includes('youtube.com') || urlOrId.includes('youtu.be') 
    ? getYouTubeVideoId(urlOrId)
    : urlOrId;
  
  if (!videoId) return null;
  
  return `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=0&controls=1&rel=0`;
}

// Get YouTube thumbnail URL
export function getYouTubeThumbnailUrl(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  
  // Use maxresdefault for highest quality, fall back to hqdefault if not available
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

