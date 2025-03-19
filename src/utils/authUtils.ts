
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

// Check if user is logged in
export const isLoggedIn = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Get current user
export const getCurrentUser = async (): Promise<AppUser | null> => {
  const { data } = await supabase.auth.getUser();
  
  if (!data.user) return null;
  
  // For now, return basic user data from auth
  // Once the database is properly set up, we can fetch additional user data
  return {
    id: data.user.id,
    email: data.user.email || '',
    name: data.user.user_metadata?.name,
    isAdmin: false, // Default value until we can fetch from database
    imageLimit: 100, // Default value
    videoLimit: 50   // Default value
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

// Add new user
export const addNewUser = async (
  email: string, 
  password: string, 
  name?: string, 
  isAdmin: boolean = false, 
  imageLimit: number = 100, 
  videoLimit: number = 50
): Promise<boolean> => {
  // First create auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, isAdmin, imageLimit, videoLimit }
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
  // Update auth user if email or password changed
  if (data.email || data.password) {
    const authUpdates: any = {};
    if (data.email) authUpdates.email = data.email;
    if (data.password) authUpdates.password = data.password;
    
    const { error: authError } = await supabase.auth.admin.updateUserById(
      userId,
      authUpdates
    );
    
    if (authError) {
      console.error("Error updating auth user:", authError);
      return false;
    }
  }
  
  // Update user metadata
  const userMetadata: any = {};
  if (data.name !== undefined) userMetadata.name = data.name;
  if (data.isAdmin !== undefined) userMetadata.isAdmin = data.isAdmin;
  if (data.imageLimit !== undefined) userMetadata.imageLimit = data.imageLimit;
  if (data.videoLimit !== undefined) userMetadata.videoLimit = data.videoLimit;
  
  if (Object.keys(userMetadata).length > 0) {
    const { error: metadataError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: userMetadata }
    );
    
    if (metadataError) {
      console.error("Error updating user metadata:", metadataError);
      return false;
    }
  }
  
  return true;
};

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.auth.admin.deleteUser(userId);
  
  if (error) {
    console.error("Error deleting user:", error);
    return false;
  }
  
  return true;
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<AppUser[]> => {
  const { data, error } = await supabase.auth.admin.listUsers();
  
  if (error || !data.users) {
    console.error("Error fetching users:", error);
    return [];
  }
  
  return data.users.map(user => ({
    id: user.id,
    email: user.email || '',
    name: user.user_metadata?.name as string | undefined,
    isAdmin: user.user_metadata?.isAdmin as boolean | undefined,
    imageLimit: user.user_metadata?.imageLimit as number | undefined,
    videoLimit: user.user_metadata?.videoLimit as number | undefined
  }));
};

// Set user limits
export const setUserLimits = async (
  userId: string, 
  imageLimit: number, 
  videoLimit: number
): Promise<boolean> => {
  return updateUser(userId, { imageLimit, videoLimit });
};
