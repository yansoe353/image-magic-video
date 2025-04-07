
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./authUtils";

// Define constants for usage limits
export const DEFAULT_IMAGE_CREDITS = 100;
export const DEFAULT_VIDEO_CREDITS = 100;

// Define interface for usage tracking
export interface ApiKeyUsage {
  imageCredits: number;
  videoCredits: number;
  userId?: string;
}

// Get usage from supabase for current user
export const getApiKeyUsage = async (): Promise<ApiKeyUsage | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    // Get user from auth.users to check current credits
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (!data.user) return null;
    
    // Get the image and video credits from user metadata
    const imageCredits = data.user.user_metadata?.imageCredits ?? DEFAULT_IMAGE_CREDITS;
    const videoCredits = data.user.user_metadata?.videoCredits ?? DEFAULT_VIDEO_CREDITS;
    
    // Get usage counts
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
    
    const usedImageCredits = imageData?.length || 0;
    const usedVideoCredits = videoData?.length || 0;
    
    return {
      imageCredits: Math.max(0, imageCredits - usedImageCredits),
      videoCredits: Math.max(0, videoCredits - usedVideoCredits),
      userId: user.id
    };
  } catch (error) {
    console.error("Error getting API key usage data:", error);
    return null;
  }
};

// Get user limits (total credits)
export const getUserCredits = async (): Promise<{ totalImageCredits: number; totalVideoCredits: number }> => {
  const user = await getCurrentUser();
  if (!user) {
    return { 
      totalImageCredits: DEFAULT_IMAGE_CREDITS, 
      totalVideoCredits: DEFAULT_VIDEO_CREDITS 
    };
  }
  
  return {
    totalImageCredits: user.imageCredits || DEFAULT_IMAGE_CREDITS,
    totalVideoCredits: user.videoCredits || DEFAULT_VIDEO_CREDITS
  };
};

// Check if user can generate more images
export const checkImageCredits = async (): Promise<boolean> => {
  const { imageCredits } = await getRemainingCreditsAsync();
  return imageCredits > 0;
};

// Check if user can generate more videos
export const checkVideoCredits = async (): Promise<boolean> => {
  const { videoCredits } = await getRemainingCreditsAsync();
  return videoCredits > 0;
};

// Get remaining credits (synchronous version with default values)
export const getRemainingCredits = (): { 
  imageCredits: number; 
  videoCredits: number; 
} => {
  // Default values when not initialized
  return { 
    imageCredits: DEFAULT_IMAGE_CREDITS, 
    videoCredits: DEFAULT_VIDEO_CREDITS,
  };
};

// Asynchronous version for when we need to wait for actual counts
export const getRemainingCreditsAsync = async (): Promise<{ 
  imageCredits: number; 
  videoCredits: number;
}> => {
  const usage = await getApiKeyUsage();
  
  if (!usage) {
    return { 
      imageCredits: DEFAULT_IMAGE_CREDITS, 
      videoCredits: DEFAULT_VIDEO_CREDITS,
    };
  }
  
  return {
    imageCredits: usage.imageCredits,
    videoCredits: usage.videoCredits
  };
};

export const initializeApiKeyUsage = async (apiKey: string): Promise<void> => {
  // We don't need to track the API key usage in local storage anymore
  // The apiKey parameter is kept for backward compatibility
  console.log("API key initialized, credit system is now based on user account");
};
