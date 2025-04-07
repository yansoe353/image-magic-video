import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./authUtils";

// Define constants for usage limits
export const DEFAULT_IMAGE_CREDITS = 100;
export const DEFAULT_VIDEO_CREDITS = 100;
// Export constants with naming convention expected by components
export const IMAGE_LIMIT = DEFAULT_IMAGE_CREDITS;
export const VIDEO_LIMIT = DEFAULT_VIDEO_CREDITS;

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
  return videoCredits >= 5;
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

// Alias for getRemainingCredits to match expected function name
export const getRemainingCounts = getRemainingCredits;

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

// Alias for getRemainingCreditsAsync to match expected function name
export const getRemainingCountsAsync = getRemainingCreditsAsync;

// Add content to user's history and decrement credit count
export const incrementImageCount = async (): Promise<boolean> => {
  // No need to decrement credits here as we're tracking usage based on history entries
  return true;
};

// Add video content to user's history and decrement credit count
export const incrementVideoCount = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;

  try {
    const { error } = await supabase
      .from('user_content_history')
      .insert({
        user_id: user.id,
        content_type: 'video',
        content_url: '', // Placeholder, will be updated later
        prompt: '', // Placeholder, will be updated later
        is_public: false, // Placeholder, will be updated later
        metadata: {} // Placeholder, will be updated later
      });

    if (error) throw error;

    // Decrement video credits by 5
    const updatedCredits = {
      imageCredits: user.imageCredits || DEFAULT_IMAGE_CREDITS,
      videoCredits: (user.videoCredits || DEFAULT_VIDEO_CREDITS) - 5
    };

    await setUserCredits(user.id, updatedCredits.imageCredits, updatedCredits.videoCredits);

    return true;
  } catch (error) {
    console.error("Error incrementing video count:", error);
    return false;
  }
};

export const initializeApiKeyUsage = async (apiKey: string): Promise<void> => {
  // We don't need to track the API key usage in local storage anymore
  // The apiKey parameter is kept for backward compatibility
  console.log("API key initialized, credit system is now based on user account");
};

async function setUserCredits(userId: string, imageCredits: number, videoCredits: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('auth.users')
      .update({
        user_metadata: {
          imageCredits,
          videoCredits
        }
      })
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("Error setting user credits:", error);
    return false;
  }
}
