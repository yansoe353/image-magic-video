import { supabase } from "@/integrations/supabase/client";

// Define interface for our app's user data
export interface AppUser {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  imageLimit?: number;
  videoLimit?: number;
}

// Define interface for session data
export interface Session {
  user: AppUser;
  token: string;
  expiresAt: number;
}

// Check if user is logged in - now properly returns a boolean
export const isLoggedIn = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch (error) {
    console.error("Error checking auth status:", error);
    return false;
  }
};

// Get current user
export const getCurrentUser = async (): Promise<AppUser | null> => {
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) return null;
  
  // Extract user metadata - ensure admin status is correctly identified
  const isAdmin = data.user.user_metadata?.isAdmin === true;
  
  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.name,
    isAdmin: isAdmin, // Use the extracted isAdmin value
    imageLimit: data.user.user_metadata?.imageLimit || 100, // Default value
    videoLimit: data.user.user_metadata?.videoLimit || 50   // Default value
  };
};

// Check if current user is an admin
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.isAdmin === true;
};

// Login user
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  return !error;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  await supabase.auth.signOut();
};

// Add new user - changed to use regular signup instead of admin methods
export const addNewUser = async (
  email: string, 
  password: string, 
  name?: string, 
  isAdmin: boolean = false, 
  imageLimit: number = 100, 
  videoLimit: number = 50
): Promise<boolean> => {
  // Use regular signup method instead of admin method
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, isAdmin, imageLimit, videoLimit }
    }
  });
  
  if (error || !data.user) {
    console.error("Error creating user:", error);
    return false;
  }
  
  return true;
};

// Update user
export const updateUser = async (
  userId: string,
  data: {
    name?: string;
    email?: string;
    password?: string;
    isAdmin?: boolean;
    imageLimit?: number;
    videoLimit?: number;
  }
): Promise<boolean> => {
  // For non-admin users, only allow self-updates
  const currentUser = await getCurrentUser();
  const isAdminUser = await isAdmin();
  
  if (!isAdminUser && currentUser?.id !== userId) {
    console.error("Only admins can update other users");
    return false;
  }

  // Update user metadata
  const userMetadata: any = {};
  if (data.name !== undefined) userMetadata.name = data.name;
  if (data.isAdmin !== undefined) userMetadata.isAdmin = data.isAdmin;
  if (data.imageLimit !== undefined) userMetadata.imageLimit = data.imageLimit;
  if (data.videoLimit !== undefined) userMetadata.videoLimit = data.videoLimit;
  
  if (Object.keys(userMetadata).length > 0) {
    const { error: metadataError } = await supabase.auth.updateUser({
      data: userMetadata
    });
    
    if (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      return false;
    }
  }
  
  // Update email or password if provided
  if (data.email || data.password) {
    const authUpdates: any = {};
    if (data.email) authUpdates.email = data.email;
    if (data.password) authUpdates.password = data.password;
    
    const { error: authError } = await supabase.auth.updateUser(authUpdates);
    
    if (authError) {
      console.error("Error updating auth user:", authError);
      return false;
    }
  }
  
  return true;
};

// Delete user - Note: regular users cannot delete users, only admins can
export const deleteUser = async (userId: string): Promise<boolean> => {
  const isAdminUser = await isAdmin();
  
  if (!isAdminUser) {
    console.error("Only admins can delete users");
    return false;
  }
  
  // This will need to be done by an admin through the Supabase dashboard
  // or with a custom server-side function with admin privileges
  console.error("User deletion requires admin privileges in Supabase dashboard");
  return false;
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<AppUser[]> => {
  // Regular users cannot list all users, this requires admin privileges
  // Return empty array for now with a console warning
  console.warn("Listing users requires admin privileges in Supabase dashboard");
  return [];
};

// Set user limits
export const setUserLimits = async (
  userId: string, 
  imageLimit: number, 
  videoLimit: number
): Promise<boolean> => {
  return updateUser(userId, { imageLimit, videoLimit });
};
