
import { getCurrentUser } from "./authUtils";

// Define interface for usage tracking
export interface ApiKeyUsage {
  key: string;
  imageCount: number;
  videoCount: number;
  userId?: string;
}

// Get storage key based on user ID
const getStorageKey = (): string => {
  const user = getCurrentUser();
  return user ? `apiKeyUsage_${user.id}` : "apiKeyUsage";
};

export const getApiKeyUsage = (): ApiKeyUsage | null => {
  const storageKey = getStorageKey();
  const usageData = localStorage.getItem(storageKey);
  if (!usageData) return null;
  
  try {
    return JSON.parse(usageData) as ApiKeyUsage;
  } catch (error) {
    console.error("Error parsing API key usage data:", error);
    return null;
  }
};

export const getUserLimits = (): { imageLimit: number; videoLimit: number } => {
  const user = getCurrentUser();
  if (!user) {
    return { imageLimit: 100, videoLimit: 50 }; // Default limits
  }
  
  return {
    imageLimit: user.imageLimit || 100,
    videoLimit: user.videoLimit || 50
  };
};

export const incrementImageCount = (): boolean => {
  const usage = getApiKeyUsage();
  if (!usage) return false;
  
  const { imageLimit } = getUserLimits();
  
  if (usage.imageCount >= imageLimit) {
    return false;
  }
  
  usage.imageCount += 1;
  localStorage.setItem(getStorageKey(), JSON.stringify(usage));
  return true;
};

export const incrementVideoCount = (): boolean => {
  const usage = getApiKeyUsage();
  if (!usage) return false;
  
  const { videoLimit } = getUserLimits();
  
  if (usage.videoCount >= videoLimit) {
    return false;
  }
  
  usage.videoCount += 1;
  localStorage.setItem(getStorageKey(), JSON.stringify(usage));
  return true;
};

export const getRemainingCounts = (): { remainingImages: number; remainingVideos: number } => {
  const usage = getApiKeyUsage();
  const { imageLimit, videoLimit } = getUserLimits();
  
  if (!usage) {
    return { remainingImages: imageLimit, remainingVideos: videoLimit };
  }
  
  return {
    remainingImages: Math.max(0, imageLimit - usage.imageCount),
    remainingVideos: Math.max(0, videoLimit - usage.videoCount)
  };
};

export const initializeApiKeyUsage = (apiKey: string): void => {
  const user = getCurrentUser();
  const storageKey = getStorageKey();
  
  const usage: ApiKeyUsage = {
    key: apiKey,
    imageCount: 0,
    videoCount: 0,
    userId: user?.id
  };
  
  localStorage.setItem(storageKey, JSON.stringify(usage));
};
