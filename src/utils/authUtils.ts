
// Define interface for user data
export interface User {
  id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  imageLimit?: number;
  videoLimit?: number;
}

// Define interface for session data
export interface Session {
  user: User;
  token: string;
  expiresAt: number;
}

// Mock user database (in production, this would be a real database)
const MOCK_USERS = [
  {
    id: "user1",
    email: "user@example.com",
    password: "password123",
    name: "Demo User",
    isAdmin: false,
    imageLimit: 50,
    videoLimit: 20
  },
  {
    id: "admin1",
    email: "htetnay4u@gmail.com",
    password: "Devyan@2332",
    name: "Admin User",
    isAdmin: true,
    imageLimit: 1000,
    videoLimit: 500
  }
];

// Function to save users to local storage
const saveUsers = () => {
  localStorage.setItem("mockUsers", JSON.stringify(MOCK_USERS));
};

// Function to load users from local storage
const loadUsers = () => {
  const storedUsers = localStorage.getItem("mockUsers");
  if (storedUsers) {
    try {
      const parsedUsers = JSON.parse(storedUsers);
      if (Array.isArray(parsedUsers)) {
        return parsedUsers;
      }
    } catch (error) {
      console.error("Error parsing stored users:", error);
    }
  }
  // If no stored users or error, initialize with default users
  saveUsers();
  return MOCK_USERS;
};

// Initialize users from local storage
let users = loadUsers();

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  const sessionStr = localStorage.getItem("userSession");
  if (!sessionStr) return false;
  
  try {
    const session = JSON.parse(sessionStr) as Session;
    // Check if session is expired
    if (session.expiresAt < Date.now()) {
      // Clear expired session
      localStorage.removeItem("userSession");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error parsing session data:", error);
    return false;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  if (!isLoggedIn()) return null;
  
  try {
    const sessionStr = localStorage.getItem("userSession");
    if (!sessionStr) return null;
    
    const session = JSON.parse(sessionStr) as Session;
    return session.user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

// Check if current user is an admin
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.isAdmin === true;
};

// Login user
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  // Reload users to ensure we have the latest data
  users = loadUsers();
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find user - make sure to do case-insensitive email comparison
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  
  if (!user) return false;
  
  // Create session (valid for 7 days)
  const session: Session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: user.isAdmin
    },
    token: Math.random().toString(36).substring(2, 15),
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  };
  
  // Save session to localStorage
  localStorage.setItem("userSession", JSON.stringify(session));
  
  return true;
};

// Logout user
export const logoutUser = (): void => {
  localStorage.removeItem("userSession");
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
  // Reload users to ensure we have the latest data
  users = loadUsers();
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return false;
  }
  
  // Generate new user ID
  const newUserId = `user${Date.now()}`;
  
  // Create new user
  const newUser = {
    id: newUserId,
    email,
    password,
    name: name || undefined,
    isAdmin,
    imageLimit,
    videoLimit
  };
  
  // Add to users array
  users.push(newUser);
  
  // Save updated users to localStorage
  saveUsers();
  
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
  // Reload users to ensure we have the latest data
  users = loadUsers();
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find user index
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  // Check if email is being changed and already exists
  if (data.email && data.email !== users[userIndex].email) {
    if (users.some(u => u.id !== userId && u.email.toLowerCase() === data.email!.toLowerCase())) {
      return false;
    }
  }
  
  // Update user data
  users[userIndex] = {
    ...users[userIndex],
    ...data
  };
  
  // Save updated users to localStorage
  saveUsers();
  
  // Update current session if the user being updated is the logged-in user
  const sessionStr = localStorage.getItem("userSession");
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr) as Session;
      if (session.user.id === userId) {
        // Update session with new user data
        session.user = {
          id: users[userIndex].id,
          email: users[userIndex].email,
          name: users[userIndex].name,
          isAdmin: users[userIndex].isAdmin,
          imageLimit: users[userIndex].imageLimit,
          videoLimit: users[userIndex].videoLimit
        };
        localStorage.setItem("userSession", JSON.stringify(session));
      }
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }
  
  return true;
};

// Delete user
export const deleteUser = async (userId: string): Promise<boolean> => {
  // Reload users to ensure we have the latest data
  users = loadUsers();
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Check if user exists
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  // Remove user
  users.splice(userIndex, 1);
  
  // Save updated users to localStorage
  saveUsers();
  
  return true;
};

// Get all users (admin function)
export const getAllUsers = (): User[] => {
  // Reload users to ensure we have the latest data
  users = loadUsers();
  
  // Return users without passwords
  return users.map(({ id, email, name, isAdmin, imageLimit, videoLimit }) => ({ 
    id, 
    email, 
    name, 
    isAdmin,
    imageLimit,
    videoLimit
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
