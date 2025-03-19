
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

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
  
  // Get additional user data from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();
  
  if (error || !userData) {
    console.error("Error fetching user data:", error);
    return null;
  }
  
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    isAdmin: userData.is_admin,
    imageLimit: userData.image_limit,
    videoLimit: userData.video_limit
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
    user_metadata: { name }
  });
  
  if (error || !data.user) {
    console.error("Error creating user:", error);
    return false;
  }
  
  // Check if the trigger already created the user
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', data.user.id)
    .single();
  
  if (!existingUser) {
    // If not, manually create user entry
    const { error: insertError } = await supabase
      .from('users')
      .insert([
        { 
          id: data.user.id, 
          email, 
          name, 
          is_admin: isAdmin,
          image_limit: imageLimit,
          video_limit: videoLimit
        }
      ]);
    
    if (insertError) {
      console.error("Error adding user data:", insertError);
      return false;
    }
  } else {
    // Update user with additional data
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        name, 
        is_admin: isAdmin,
        image_limit: imageLimit,
        video_limit: videoLimit
      })
      .eq('id', data.user.id);
    
    if (updateError) {
      console.error("Error updating user data:", updateError);
      return false;
    }
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
  const updates: any = {};
  
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
  if (data.name !== undefined) updates.name = data.name;
  if (data.isAdmin !== undefined) updates.is_admin = data.isAdmin;
  if (data.imageLimit !== undefined) updates.image_limit = data.imageLimit;
  if (data.videoLimit !== undefined) updates.video_limit = data.videoLimit;
  
  if (Object.keys(updates).length > 0) {
    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);
    
    if (updateError) {
      console.error("Error updating user data:", updateError);
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
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  
  return data.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.is_admin,
    imageLimit: user.image_limit,
    videoLimit: user.video_limit
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
