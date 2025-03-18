
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
  credits: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  addCredits: (amount: number) => void;
  useCredits: (amount: number) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Simulate login
  const login = async (email: string, password: string) => {
    // In a real app, this would validate with a backend
    // For demo purposes, we'll create a mock user
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      credits: 10, // New users get 10 free credits
    };
    
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  // Simulate signup
  const signup = async (email: string, name: string, password: string) => {
    // In a real app, this would register with a backend
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name,
      credits: 10, // New users get 10 free credits
    };
    
    setUser(mockUser);
    localStorage.setItem("user", JSON.stringify(mockUser));
  };

  // Logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Add credits to user account
  const addCredits = (amount: number) => {
    if (user) {
      const updatedUser = {
        ...user,
        credits: user.credits + amount
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  // Use credits for a video generation
  const useCredits = (amount: number): boolean => {
    if (!user || user.credits < amount) {
      return false;
    }
    
    const updatedUser = {
      ...user,
      credits: user.credits - amount
    };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      addCredits, 
      useCredits 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
