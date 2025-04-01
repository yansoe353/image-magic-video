
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export interface StorageMetadata {
  isPublic?: boolean;
  prompt?: string;
  generationParams?: Record<string, any>;
}

/**
 * Fetches an image from a URL and uploads it to Supabase storage
 */
export const uploadUrlToStorage = async (
  url: string, 
  type: 'image' | 'video' | 'audio', 
  userId?: string,
  metadata?: StorageMetadata
): Promise<string> => {
  try {
    // Fetch the file from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${type} from URL: ${response.statusText}`);
    }
    
    const fileBlob = await response.blob();
    
    // Generate a unique file path
    const fileExt = type === 'image' ? 'png' : type === 'audio' ? 'mp3' : 'mp4';
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // User ID folder structure - if no userId, store in 'anonymous' folder
    const folderPath = userId ? `${userId}` : 'anonymous';
    const filePath = `${folderPath}/${type}s/${fileName}`;
    
    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from('generated_content')
      .upload(filePath, fileBlob, {
        contentType: type === 'image' ? 'image/png' : type === 'audio' ? 'audio/mpeg' : 'video/mp4',
        upsert: false,
        metadata: metadata ? {
          isPublic: metadata.isPublic ? 'true' : 'false',
          prompt: metadata.prompt || '',
          ...metadata.generationParams
        } : undefined
      });
    
    if (error) {
      console.error(`Error uploading ${type} to Supabase:`, error);
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('generated_content')
      .getPublicUrl(filePath);
    
    // If content is public, add it to the public_gallery table
    if (metadata?.isPublic) {
      try {
        await supabase.from('public_gallery').insert({
          content_type: type,
          content_url: publicUrlData.publicUrl,
          prompt: metadata.prompt || '',
          user_id: userId,
          metadata: metadata.generationParams || {}
        });
      } catch (galleryError) {
        console.error("Error adding to public gallery:", galleryError);
        // Continue even if gallery insertion fails
      }
    }
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error(`Error in uploadUrlToStorage for ${type}:`, error);
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

/**
 * Fetch public gallery content
 */
export const fetchPublicGallery = async (contentType?: 'image' | 'video'): Promise<any[]> => {
  try {
    let query = supabase.from('public_gallery').select('*');
    
    if (contentType) {
      query = query.eq('content_type', contentType);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false }).limit(12);
    
    if (error) {
      console.error("Error fetching public gallery:", error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error("Error in fetchPublicGallery:", error);
    return [];
  }
};
