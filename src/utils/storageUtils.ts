
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

export const getUserId = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id || null;
};

export const getUserProfile = async () => {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return null;
    }
    
    // Query the user profile from the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const uploadUrlToStorage = async (
  url: string, 
  contentType: "image" | "video" | "audio", 
  userId?: string | null,
  isPublic: boolean = false
): Promise<string> => {
  try {
    if (!userId) {
      userId = await getUserId();
    }

    // Create a folder structure based on content type and user id
    const folderPath = isPublic 
      ? `public/${contentType}s/` 
      : `${userId}/${contentType}s/`;
    
    // Generate a unique file name
    const fileName = `${uuidv4()}.${contentType === 'image' ? 'png' : contentType === 'audio' ? 'mp3' : 'mp4'}`;
    const fullPath = `${folderPath}${fileName}`;

    // Fetch the file content from the URL
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch file from URL');
    const blob = await response.blob();

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from('user_content')
      .upload(fullPath, blob, {
        contentType: contentType === 'image' 
          ? 'image/png' 
          : contentType === 'audio' 
            ? 'audio/mpeg' 
            : 'video/mp4',
        upsert: true
      });

    if (error) throw error;

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('user_content')
      .getPublicUrl(fullPath);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading file to Supabase:', error);
    throw error;
  }
};
