
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { getCurrentUser, isAdmin } from "./authUtils";

// Define constants for default usage limits
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
      .eq('metadata->>source', 'runway');
    
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

// Get the user's custom limits from their user metadata or fallback to defaults
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

// Check if the user can generate more images
export const incrementImageCount = async (): Promise<boolean> => {
  // Just check if user can generate more images
  const { remainingImages } = await getRemainingCountsAsync();
  return remainingImages > 0;
};

// Check if the user can generate more videos
export const incrementVideoCount = async (): Promise<boolean> => {
  // Just check if user can generate more videos
  const { remainingVideos } = await getRemainingCountsAsync();
  return remainingVideos > 0;
};

// Check if the user can generate more Runway videos
export const incrementRunwayVideoCount = async (): Promise<boolean> => {
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

// Get remaining counts for a specific user (admin function)
export const getRemainingCountsForUser = async (userId: string): Promise<{ 
  remainingImages: number; 
  remainingVideos: number;
}> => {
  try {
    // Get user's custom limits
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError) throw userError;
    
    // Get user's generation counts
    const { data: imageData, error: imageError } = await supabaseAdmin
      .from('user_content_history')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'image');
    
    if (imageError) throw imageError;
    
    const { data: videoData, error: videoError } = await supabaseAdmin
      .from('user_content_history')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', 'video');
    
    if (videoError) throw videoError;
    
    const imageLimit = userData?.image_credits || IMAGE_LIMIT;
    const videoLimit = userData?.video_credits || VIDEO_LIMIT;
    
    return {
      remainingImages: Math.max(0, imageLimit - (imageData?.length || 0)),
      remainingVideos: Math.max(0, videoLimit - (videoData?.length || 0))
    };
  } catch (error) {
    console.error("Error getting remaining counts for user:", error);
    return { remainingImages: 0, remainingVideos: 0 };
  }
};

// Refill user limits to their maximum values (admin function)
export const refillUserLimits = async (userId: string): Promise<boolean> => {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      console.error("Only admins can refill user limits");
      return false;
    }
    
    // Delete all user's content history to reset their usage
    const { error: deleteError } = await supabaseAdmin
      .from('user_content_history')
      .delete()
      .eq('user_id', userId);
    
    if (deleteError) {
      console.error("Error deleting user content history:", deleteError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error refilling user limits:", error);
    return false;
  }
};

// For backwards compatibility
export const initializeApiKeyUsage = async (apiKey: string): Promise<void> => {
  // We don't need to track the API key usage in local storage anymore
  // The apiKey parameter is kept for backward compatibility
  console.log("API key initialized, usage tracking is now based on user account");
};
