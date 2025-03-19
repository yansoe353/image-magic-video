
// Define interface for user data
export interface User {
  id: string;
  email: string;
  name?: string;
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
  }
];

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

// Login user
export const loginUser = async (email: string, password: string): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Find user
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  
  if (!user) return false;
  
  // Create session (valid for 7 days)
  const session: Session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
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
