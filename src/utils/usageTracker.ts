
// Define interface for usage tracking
export interface ApiKeyUsage {
  key: string;
  imageCount: number;
  videoCount: number;
}

export const IMAGE_LIMIT = 100;
export const VIDEO_LIMIT = 50;

export const getApiKeyUsage = (): ApiKeyUsage | null => {
  const usageData = localStorage.getItem("apiKeyUsage");
  if (!usageData) return null;
  
  try {
    return JSON.parse(usageData) as ApiKeyUsage;
  } catch (error) {
    console.error("Error parsing API key usage data:", error);
    return null;
  }
};

export const incrementImageCount = (): boolean => {
  const usage = getApiKeyUsage();
  if (!usage) return false;
  
  if (usage.imageCount >= IMAGE_LIMIT) {
    return false;
  }
  
  usage.imageCount += 1;
  localStorage.setItem("apiKeyUsage", JSON.stringify(usage));
  return true;
};

export const incrementVideoCount = (): boolean => {
  const usage = getApiKeyUsage();
  if (!usage) return false;
  
  if (usage.videoCount >= VIDEO_LIMIT) {
    return false;
  }
  
  usage.videoCount += 1;
  localStorage.setItem("apiKeyUsage", JSON.stringify(usage));
  return true;
};

export const getRemainingCounts = (): { remainingImages: number; remainingVideos: number } => {
  const usage = getApiKeyUsage();
  if (!usage) {
    return { remainingImages: 0, remainingVideos: 0 };
  }
  
  return {
    remainingImages: Math.max(0, IMAGE_LIMIT - usage.imageCount),
    remainingVideos: Math.max(0, VIDEO_LIMIT - usage.videoCount)
  };
};
