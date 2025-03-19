
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

/**
 * Fetches an image from a URL and uploads it to Supabase storage
 */
export const uploadUrlToStorage = async (url: string, contentType: 'image' | 'video', userId?: string): Promise<string> => {
  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${contentType} from URL: ${response.statusText}`);
    }
    
    const fileBlob = await response.blob();
    
    // Generate a unique file path
    const fileExt = contentType === 'image' ? 'png' : 'mp4';
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // User ID folder structure - if no userId, store in 'anonymous' folder
    const folderPath = userId ? `${userId}` : 'anonymous';
    const filePath = `${folderPath}/${contentType}s/${fileName}`;
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('generated_content')
      .upload(filePath, fileBlob, {
        contentType: contentType === 'image' ? 'image/png' : 'video/mp4',
        upsert: false
      });
    
    if (error) {
      console.error(`Error uploading ${contentType} to Supabase:`, error);
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('generated_content')
      .getPublicUrl(filePath);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadUrlToStorage for ${contentType}:`, error);
    throw error;
  }
};

/**
 * Get user ID from Supabase auth session
 */
export const getUserId = async (): Promise<string | undefined> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.log("No active session found when getting user ID");
      return undefined;
    }
    
    return session.user.id;
  } catch (error) {
    console.error("Error getting user ID from session:", error);
    return undefined;
  }
};

