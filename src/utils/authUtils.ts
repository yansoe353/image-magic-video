
import { supabase } from "@/integrations/supabase/client";
import { IMAGE_LIMIT, VIDEO_LIMIT } from "./usageTracker";

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
    imageLimit: data.user.user_metadata?.imageLimit || IMAGE_LIMIT, // Use constant
    videoLimit: data.user.user_metadata?.videoLimit || VIDEO_LIMIT   // Use constant
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
  imageLimit: number = IMAGE_LIMIT, 
  videoLimit: number = VIDEO_LIMIT
): Promise<boolean> => {
  try {
    // Check if current user is admin
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.error("Only admins can add new users");
      return false;
    }
    
    // Use admin createUser method
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { name, isAdmin, imageLimit, videoLimit }
    });
    
    if (error || !data.user) {
      console.error("Error creating user:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error adding new user:", error);
    return false;
  }
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
  try {
    // For non-admin users, only allow self-updates
    const currentUser = await getCurrentUser();
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser && currentUser?.id !== userId) {
      console.error("Only admins can update other users");
      return false;
    }
    
    // Update user metadata and auth data
    const userMetadata: any = {};
    if (data.name !== undefined) userMetadata.name = data.name;
    if (data.isAdmin !== undefined) userMetadata.isAdmin = data.isAdmin;
    if (data.imageLimit !== undefined) userMetadata.imageLimit = data.imageLimit;
    if (data.videoLimit !== undefined) userMetadata.videoLimit = data.videoLimit;
    
    if (Object.keys(userMetadata).length > 0 || data.email || data.password) {
      const updatePayload: any = {};
      
      if (Object.keys(userMetadata).length > 0) {
        updatePayload.user_metadata = userMetadata;
      }
      
      if (data.email) updatePayload.email = data.email;
      if (data.password) updatePayload.password = data.password;
      
      const { error } = await supabase.auth.admin.updateUserById(userId, updatePayload);
      
      if (error) {
        console.error("Error updating user:", error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating user:", error);
    return false;
  }
};

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      console.error("Only admins can delete users");
      return false;
    }
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      console.error("Error deleting user:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting user:", error);
    return false;
  }
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      console.error("Only admins can list all users");
      return [];
    }
    
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error("Error listing users:", error);
      return [];
    }
    
    return data.users.map(user => ({
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.name || '',
      isAdmin: user.user_metadata?.isAdmin === true,
      imageLimit: user.user_metadata?.imageLimit || IMAGE_LIMIT,
      videoLimit: user.user_metadata?.videoLimit || VIDEO_LIMIT
    }));
  } catch (error) {
    console.error("Error getting all users:", error);
    return [];
  }
};

// Set user limits
export const setUserLimits = async (
  userId: string, 
  imageLimit: number, 
  videoLimit: number
): Promise<boolean> => {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      console.error("Only admins can set user limits");
      return false;
    }
    
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { imageLimit, videoLimit }
    });
    
    if (error) {
      console.error("Error setting user limits:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error setting user limits:", error);
    return false;
  }
};
