
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./authUtils";

// Define constants for usage limits (default values)
export const IMAGE_LIMIT = 100;
export const VIDEO_LIMIT = 100;
export const RUNWAY_VIDEO_LIMIT = 5;

// Credit costs for different operations
export const IMAGE_CREDIT_COST = 1;
export const VIDEO_CREDIT_COST = 5;
export const STORY_VIDEO_CREDIT_COST = 1;

// Define interface for usage tracking
export interface ApiKeyUsage {
  imageCount: number;
  videoCount: number;
  runwayVideoCount?: number;
  userId?: string;
  imageCredits?: number;
  videoCredits?: number;
}

// Get usage from user profile in Supabase
export const getApiKeyUsage = async (): Promise<ApiKeyUsage | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    // Get user's credits from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, image_credits, video_credits')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error("Error getting profile data:", profileError);
      return null;
    }
    
    // Get historical usage counts from user_content_history
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
      .eq('metadata->>source', 'runway');
    
    if (runwayVideoError) throw runwayVideoError;
    
    return {
      imageCount: imageData?.length || 0,
      videoCount: videoData?.length || 0,
      runwayVideoCount: runwayVideoData?.length || 0,
      userId: user.id,
      imageCredits: profileData?.image_credits || IMAGE_LIMIT,
      videoCredits: profileData?.video_credits || VIDEO_LIMIT
    };
  } catch (error) {
    console.error("Error getting API key usage data:", error);
    return null;
  }
};

export const getUserLimits = async (): Promise<{ imageLimit: number; videoLimit: number }> => {
  const usage = await getApiKeyUsage();
  
  if (!usage) {
    return { imageLimit: IMAGE_LIMIT, videoLimit: VIDEO_LIMIT };
  }
  
  return {
    imageLimit: usage.imageCredits || IMAGE_LIMIT,
    videoLimit: usage.videoCredits || VIDEO_LIMIT
  };
};

// Decrement image credits
export const decrementImageCredits = async (amount: number = IMAGE_CREDIT_COST): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, image_credits')
      .eq('id', user.id)
      .single();
    
    if (error || !profile) {
      console.error("Error fetching profile:", error);
      return false;
    }
    
    if (profile.image_credits < amount) {
      return false;
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        image_credits: profile.image_credits - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error("Failed to decrement image credits:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error decrementing image credits:", error);
    return false;
  }
};

// Decrement video credits
export const decrementVideoCredits = async (amount: number = VIDEO_CREDIT_COST): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, video_credits')
      .eq('id', user.id)
      .single();
    
    if (error || !profile) {
      console.error("Error fetching profile:", error);
      return false;
    }
    
    if (profile.video_credits < amount) {
      return false;
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        video_credits: profile.video_credits - amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error("Failed to decrement video credits:", updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error decrementing video credits:", error);
    return false;
  }
};

// Check if user can generate more images
export const incrementImageCount = async (): Promise<boolean> => {
  return await decrementImageCredits(IMAGE_CREDIT_COST);
};

// Check if user can generate more videos
export const incrementVideoCount = async (): Promise<boolean> => {
  return await decrementVideoCredits(VIDEO_CREDIT_COST);
};

// Check if user can generate more Runway videos
export const incrementRunwayVideoCount = async (): Promise<boolean> => {
  return await decrementVideoCredits(VIDEO_CREDIT_COST);
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
  
  if (!usage) {
    return { 
      remainingImages: IMAGE_LIMIT, 
      remainingVideos: VIDEO_LIMIT,
      remainingRunwayVideos: RUNWAY_VIDEO_LIMIT
    };
  }
  
  return {
    remainingImages: Math.max(0, usage.imageCredits || 0),
    remainingVideos: Math.max(0, usage.videoCredits || 0),
    remainingRunwayVideos: Math.max(0, RUNWAY_VIDEO_LIMIT)
  };
};

export const initializeApiKeyUsage = async (apiKey: string): Promise<void> => {
  // We don't need to track the API key usage in local storage anymore
  // The apiKey parameter is kept for backward compatibility
  console.log("API key initialized, usage tracking is now based on user account");
};
