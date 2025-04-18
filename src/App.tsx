
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Examples from "./pages/Examples";
import History from "./pages/History";
import UserGallery from "./pages/UserGallery";
import Login from "./components/Login";
import AddUser from "./components/AddUser";
import UserList from "./components/UserList";
import EditUser from "./components/EditUser";
import UserLimits from "./components/UserLimits";
import { supabase } from "./integrations/supabase/client";
import BuyAccount from "./pages/BuyAccount";
import BuyCredits from "./pages/BuyCredits";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

// Protected route component with proper loading state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };
    
    checkAuth();
  }, []);
  
  if (isAuthenticated === null) {
    // Still checking authentication
    return null;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  // Moved the useEffect inside the component
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/buy-account" element={<BuyAccount />} />
            <Route path="/buy-credits" element={<BuyCredits />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/gallery" element={<UserGallery />} />
            <Route 
              path="/create" 
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              } 
            />
            <Route path="/examples" element={<Examples />} />
            <Route 
              path="/history" 
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <UserList />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/add-user" 
              element={
                <ProtectedRoute>
                  <AddUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/edit-user/:userId" 
              element={
                <ProtectedRoute>
                  <EditUser />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/user-limits/:userId" 
              element={
                <ProtectedRoute>
                  <UserLimits />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
