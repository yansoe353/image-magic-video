
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
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
    console.log("Creating new user:", { email, name, isAdmin, imageLimit, videoLimit });
    
    // Use admin client for user creation to ensure admin role works
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, isAdmin, imageLimit, videoLimit }
    });
    
    if (error || !data.user) {
      console.error("Error creating user:", error);
      return false;
    }
    
    console.log("User created successfully:", data.user.id);
    return true;
  } catch (error) {
    console.error("Exception in addNewUser:", error);
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

    // Update user metadata
    const userMetadata: any = {};
    if (data.name !== undefined) userMetadata.name = data.name;
    if (data.isAdmin !== undefined) userMetadata.isAdmin = data.isAdmin;
    if (data.imageLimit !== undefined) userMetadata.imageLimit = data.imageLimit;
    if (data.videoLimit !== undefined) userMetadata.videoLimit = data.videoLimit;
    
    if (Object.keys(userMetadata).length > 0) {
      console.log("Updating user metadata:", { userId, metadata: userMetadata });
      
      // For admin users, use the admin API to update other users
      if (isAdminUser && currentUser?.id !== userId) {
        try {
          const { error: adminUpdateError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { user_metadata: userMetadata }
          );
          
          if (adminUpdateError) {
            console.error("Admin user update error:", adminUpdateError);
            return false;
          }
        } catch (error) {
          console.error("Error in admin update:", error);
          return false;
        }
      } else {
        // Self-update for regular users
        const { error: metadataError } = await supabase.auth.updateUser({
          data: userMetadata
        });
        
        if (metadataError) {
          console.error("Error updating user metadata:", metadataError);
          return false;
        }
      }
    }
    
    // Update email or password if provided (only for self or by admin)
    if (data.email || data.password) {
      const authUpdates: any = {};
      if (data.email) authUpdates.email = data.email;
      if (data.password) authUpdates.password = data.password;
      
      console.log("Updating user auth data:", { userId, hasEmail: !!data.email, hasPassword: !!data.password });
      
      if (isAdminUser && currentUser?.id !== userId) {
        try {
          const { error: adminAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            authUpdates
          );
          
          if (adminAuthError) {
            console.error("Admin auth update error:", adminAuthError);
            return false;
          }
        } catch (error) {
          console.error("Error in admin auth update:", error);
          return false;
        }
      } else {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        
        if (authError) {
          console.error("Error updating auth user:", authError);
          return false;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Exception in updateUser:", error);
    return false;
  }
};

// Set user limits - specific function for updating generation limits
export const setUserLimits = async (
  userId: string, 
  imageLimit: number, 
  videoLimit: number
): Promise<boolean> => {
  console.log(`Setting limits for user ${userId}: images=${imageLimit}, videos=${videoLimit}`);
  return updateUser(userId, { imageLimit, videoLimit });
};

// Delete user - only admins can delete users
export const deleteUser = async (userId: string): Promise<boolean> => {
  try {
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      console.error("Only admins can delete users");
      return false;
    }
    
    console.log("Attempting to delete user:", userId);
    
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (error) {
        console.error("Error deleting user:", error);
        return false;
      }
      
      console.log("User deleted successfully");
      return true;
    } catch (error) {
      console.error("Error in admin delete:", error);
      return false;
    }
  } catch (error) {
    console.error("Exception in deleteUser:", error);
    return false;
  }
};

// Get all users (admin function)
export const getAllUsers = async (): Promise<AppUser[]> => {
  try {
    console.log("Checking admin status before listing users");
    const isAdminUser = await isAdmin();
    
    if (!isAdminUser) {
      console.error("Only admins can list users");
      return [];
    }
    
    console.log("Admin check passed, attempting to list users");
    
    try {
      // Use the supabaseAdmin client with service role key
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error("Error listing users:", error);
        console.error("Admin API access failed. This may indicate that the service_role key is not correctly configured.");
        return [];
      }
      
      if (!data?.users) {
        console.log("No users found or empty response");
        return [];
      }
      
      console.log(`Found ${data.users.length} users`);
      
      return data.users.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name,
        isAdmin: user.user_metadata?.isAdmin === true,
        imageLimit: user.user_metadata?.imageLimit || IMAGE_LIMIT,
        videoLimit: user.user_metadata?.videoLimit || VIDEO_LIMIT
      }));
    } catch (error) {
      console.error("Error in admin list:", error);
      console.error("This may indicate an issue with your service role key configuration.");
      return [];
    }
  } catch (error) {
    console.error("Exception in getAllUsers:", error);
    return [];
  }
};
