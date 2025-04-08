
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "./authUtils";

// Define constants for usage limits
export const DEFAULT_IMAGE_CREDITS = 100;
export const DEFAULT_VIDEO_CREDITS = 100;
export const IMAGE_COST = 1;
export const VIDEO_COST = 5;
export const STORY_IMAGE_COST = 1;
export const STORY_VIDEO_COST = 1;

// Define interface for credit tracking
export interface UserCredits {
  imageCredits: number;
  videoCredits: number;
  userId?: string;
}

// Get credits from supabase for current user
export const getUserCredits = async (): Promise<UserCredits> => {
  const user = await getCurrentUser();
  
  // Default credits if no user or database error
  const defaultCredits: UserCredits = {
    imageCredits: DEFAULT_IMAGE_CREDITS,
    videoCredits: DEFAULT_VIDEO_CREDITS,
    userId: user?.id
  };
  
  if (!user) return defaultCredits;
  
  try {
    // Try to get user's credits from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('image_credits, video_credits')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error("Error getting user credits:", error);
      return defaultCredits;
    }
    
    return {
      imageCredits: data?.image_credits ?? DEFAULT_IMAGE_CREDITS,
      videoCredits: data?.video_credits ?? DEFAULT_VIDEO_CREDITS,
      userId: user.id
    };
  } catch (error) {
    console.error("Error getting user credits data:", error);
    return defaultCredits;
  }
};

export const checkImageCredit = async (cost: number = IMAGE_COST): Promise<boolean> => {
  const credits = await getUserCredits();
  return credits.imageCredits >= cost;
};

export const checkVideoCredit = async (cost: number = VIDEO_COST): Promise<boolean> => {
  const credits = await getUserCredits();
  return credits.videoCredits >= cost;
};

export const deductImageCredit = async (cost: number = IMAGE_COST): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const credits = await getUserCredits();
  if (credits.imageCredits < cost) return false;
  
  try {
    // Use any to bypass type checking until we update the database schema
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        image_credits: credits.imageCredits - cost
      })
      .eq('id', user.id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deducting image credits:", error);
    return false;
  }
};

export const deductVideoCredit = async (cost: number = VIDEO_COST): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const credits = await getUserCredits();
  if (credits.videoCredits < cost) return false;
  
  try {
    // Use any to bypass type checking until we update the database schema
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        video_credits: credits.videoCredits - cost
      })
      .eq('id', user.id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deducting video credits:", error);
    return false;
  }
};

export const addImageCredit = async (amount: number): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const credits = await getUserCredits();
  
  try {
    // Use any to bypass type checking until we update the database schema
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        image_credits: credits.imageCredits + amount
      })
      .eq('id', user.id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding image credits:", error);
    return false;
  }
};

export const addVideoCredit = async (amount: number): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const credits = await getUserCredits();
  
  try {
    // Use any to bypass type checking until we update the database schema
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        video_credits: credits.videoCredits + amount
      })
      .eq('id', user.id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding video credits:", error);
    return false;
  }
};

// Add functions that were missing and causing the errors
export const incrementImageCount = async (): Promise<boolean> => {
  return await deductImageCredit(IMAGE_COST);
};

export const incrementVideoCount = async (): Promise<boolean> => {
  return await deductVideoCredit(VIDEO_COST);
};

// These functions are kept for backward compatibility
export const getRemainingCounts = async (): Promise<{ 
  remainingImages: number; 
  remainingVideos: number;
}> => {
  const credits = await getUserCredits();
  
  return {
    remainingImages: credits.imageCredits,
    remainingVideos: credits.videoCredits
  };
};

// For backward compatibility
export const getRemainingCountsAsync = getRemainingCounts;

// For backward compatibility
export const IMAGE_LIMIT = DEFAULT_IMAGE_CREDITS;
export const VIDEO_LIMIT = DEFAULT_VIDEO_CREDITS;
