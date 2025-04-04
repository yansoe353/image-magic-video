
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./authUtils";

// Define constants for usage limits
export const IMAGE_LIMIT = 100;
export const VIDEO_LIMIT = 20;
export const RUNWAY_VIDEO_LIMIT = 5;

// Define interface for usage tracking
export interface ApiKeyUsage {
  imageCount: number;
  videoCount: number;
  runwayVideoCount?: number;
  userId?: string;
}

// Get usage from supabase for current user
export const getApiKeyUsage = async (): Promise<ApiKeyUsage | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    // Get user's generation counts from user_content_history
    const { data: imageData, error: imageError } = await supabase
      .from('user_content_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', 'image');
    
    if (imageError) throw imageError;
    
    const { data: videoData, error: videoError } = await supabase
      .from('user_content_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', 'video');
    
    if (videoError) throw videoError;
    
    // Get count of Runway generations specifically
    const { data: runwayVideoData, error: runwayVideoError } = await supabase
      .from('user_content_history')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', 'video')
      .eq('metadata->source', 'runway');
    
    if (runwayVideoError) throw runwayVideoError;
    
    return {
      imageCount: imageData?.length || 0,
      videoCount: videoData?.length || 0,
      runwayVideoCount: runwayVideoData?.length || 0,
      userId: user.id
    };
  } catch (error) {
    console.error("Error getting API key usage data:", error);
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
  // Don't increment count, as it will be handled by history entries
  // Just check if user can generate more images
  const { remainingImages } = await getRemainingCountsAsync();
  return remainingImages > 0;
};

export const incrementVideoCount = async (): Promise<boolean> => {
  // Don't increment count, as it will be handled by history entries
  // Just check if user can generate more videos
  const { remainingVideos } = await getRemainingCountsAsync();
  return remainingVideos > 0;
};

export const incrementRunwayVideoCount = async (): Promise<boolean> => {
  // Don't increment count, as it will be handled by history entries
  // Just check if user can generate more Runway videos
  const { remainingRunwayVideos } = await getRemainingCountsAsync();
  return (remainingRunwayVideos || 0) > 0;
};

// Get remaining counts (synchronous version with default values)
export const getRemainingCounts = (): { 
  remainingImages: number; 
  remainingVideos: number; 
  remainingRunwayVideos?: number;
} => {
  // Default values when not initialized
  return { 
    remainingImages: IMAGE_LIMIT, 
    remainingVideos: VIDEO_LIMIT,
    remainingRunwayVideos: RUNWAY_VIDEO_LIMIT
  };
};

// Asynchronous version for when we need to wait for actual counts
export const getRemainingCountsAsync = async (): Promise<{ 
  remainingImages: number; 
  remainingVideos: number;
  remainingRunwayVideos?: number; 
}> => {
  const usage = await getApiKeyUsage();
  const { imageLimit, videoLimit } = await getUserLimits();
  
  if (!usage) {
    return { 
      remainingImages: imageLimit, 
      remainingVideos: videoLimit,
      remainingRunwayVideos: RUNWAY_VIDEO_LIMIT
    };
  }
  
  return {
    remainingImages: Math.max(0, imageLimit - usage.imageCount),
    remainingVideos: Math.max(0, videoLimit - usage.videoCount),
    remainingRunwayVideos: Math.max(0, RUNWAY_VIDEO_LIMIT - (usage.runwayVideoCount || 0))
  };
};

export const initializeApiKeyUsage = async (apiKey: string): Promise<void> => {
  // We don't need to track the API key usage in local storage anymore
  // The apiKey parameter is kept for backward compatibility
  console.log("API key initialized, usage tracking is now based on user account");
};
