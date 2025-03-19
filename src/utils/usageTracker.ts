
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./authUtils";

// Define constants for usage limits
export const IMAGE_LIMIT = 100;
export const VIDEO_LIMIT = 50;

// Define interface for usage tracking
export interface ApiKeyUsage {
  key: string;
  imageCount: number;
  videoCount: number;
  userId?: string;
}

// Get storage key based on user ID
const getStorageKey = async (): Promise<string> => {
  const user = await getCurrentUser();
  return user ? `apiKeyUsage_${user.id}` : "apiKeyUsage";
};

export const getApiKeyUsage = async (): Promise<ApiKeyUsage | null> => {
  const storageKey = await getStorageKey();
  const usageData = localStorage.getItem(storageKey);
  if (!usageData) return null;
  
  try {
    return JSON.parse(usageData) as ApiKeyUsage;
  } catch (error) {
    console.error("Error parsing API key usage data:", error);
    return null;
  }
};

export const getUserLimits = async (): Promise<{ imageLimit: number; videoLimit: number }> => {
  const user = await getCurrentUser();
  if (!user) {
    return { imageLimit: IMAGE_LIMIT, videoLimit: VIDEO_LIMIT }; // Use constants
  }
  
  return {
    imageLimit: user.imageLimit || IMAGE_LIMIT,
    videoLimit: user.videoLimit || VIDEO_LIMIT
  };
};

export const incrementImageCount = async (): Promise<boolean> => {
  const usage = await getApiKeyUsage();
  if (!usage) return false;
  
  const { imageLimit } = await getUserLimits();
  
  if (usage.imageCount >= imageLimit) {
    return false;
  }
  
  usage.imageCount += 1;
  localStorage.setItem(await getStorageKey(), JSON.stringify(usage));
  return true;
};

export const incrementVideoCount = async (): Promise<boolean> => {
  const usage = await getApiKeyUsage();
  if (!usage) return false;
  
  const { videoLimit } = await getUserLimits();
  
  if (usage.videoCount >= videoLimit) {
    return false;
  }
  
  usage.videoCount += 1;
  localStorage.setItem(await getStorageKey(), JSON.stringify(usage));
  return true;
};

// Modified to return a concrete object instead of a Promise
export const getRemainingCounts = (): { remainingImages: number; remainingVideos: number } => {
  // Default values when not initialized
  return { remainingImages: IMAGE_LIMIT, remainingVideos: VIDEO_LIMIT };
};

// Asynchronous version for when we need to wait for actual counts
export const getRemainingCountsAsync = async (): Promise<{ remainingImages: number; remainingVideos: number }> => {
  const usage = await getApiKeyUsage();
  const { imageLimit, videoLimit } = await getUserLimits();
  
  if (!usage) {
    return { remainingImages: imageLimit, remainingVideos: videoLimit };
  }
  
  return {
    remainingImages: Math.max(0, imageLimit - usage.imageCount),
    remainingVideos: Math.max(0, videoLimit - usage.videoCount)
  };
};

export const initializeApiKeyUsage = async (apiKey: string): Promise<void> => {
  const user = await getCurrentUser();
  const storageKey = await getStorageKey();
  
  // Store the key in Supabase if user is logged in
  if (user) {
    const { error } = await supabase.from('api_keys').upsert([
      {
        user_id: user.id,
        key_name: 'fal_api_key',
        key_value: apiKey
      }
    ], { onConflict: 'user_id,key_name' });
    
    if (error) {
      console.error("Error storing API key:", error);
    }
  }
  
  const usage: ApiKeyUsage = {
    key: apiKey,
    imageCount: 0,
    videoCount: 0,
    userId: user?.id
  };
  
  localStorage.setItem(storageKey, JSON.stringify(usage));
};
