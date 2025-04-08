
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
export const getUserCredits = async (): Promise<UserCredits | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  
  try {
    // Get user's credits from the profiles table (or another appropriate table)
    const { data, error } = await supabase
      .from('profiles')
      .select('image_credits, video_credits')
      .eq('id', user.id)
      .single();
    
    if (error) throw error;
    
    return {
      imageCredits: data?.image_credits ?? DEFAULT_IMAGE_CREDITS,
      videoCredits: data?.video_credits ?? DEFAULT_VIDEO_CREDITS,
      userId: user.id
    };
  } catch (error) {
    console.error("Error getting user credits data:", error);
    return {
      imageCredits: DEFAULT_IMAGE_CREDITS,
      videoCredits: DEFAULT_VIDEO_CREDITS,
      userId: user.id
    };
  }
};

export const checkImageCredit = async (cost: number = IMAGE_COST): Promise<boolean> => {
  const credits = await getUserCredits();
  return credits ? credits.imageCredits >= cost : false;
};

export const checkVideoCredit = async (cost: number = VIDEO_COST): Promise<boolean> => {
  const credits = await getUserCredits();
  return credits ? credits.videoCredits >= cost : false;
};

export const deductImageCredit = async (cost: number = IMAGE_COST): Promise<boolean> => {
  const user = await getCurrentUser();
  if (!user) return false;
  
  const credits = await getUserCredits();
  if (!credits || credits.imageCredits < cost) return false;
  
  try {
    const { error } = await supabase
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
  if (!credits || credits.videoCredits < cost) return false;
  
  try {
    const { error } = await supabase
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
  if (!credits) return false;
  
  try {
    const { error } = await supabase
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
  if (!credits) return false;
  
  try {
    const { error } = await supabase
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

// These functions are kept for backward compatibility
export const getRemainingCounts = async (): Promise<{ 
  remainingImages: number; 
  remainingVideos: number;
}> => {
  const credits = await getUserCredits();
  
  if (!credits) {
    return { 
      remainingImages: DEFAULT_IMAGE_CREDITS, 
      remainingVideos: DEFAULT_VIDEO_CREDITS
    };
  }
  
  return {
    remainingImages: credits.imageCredits,
    remainingVideos: Math.floor(credits.videoCredits / VIDEO_COST)
  };
};

// For backward compatibility
export const getRemainingCountsAsync = getRemainingCounts;

// For backward compatibility
export const IMAGE_LIMIT = DEFAULT_IMAGE_CREDITS;
export const VIDEO_LIMIT = DEFAULT_VIDEO_CREDITS;
