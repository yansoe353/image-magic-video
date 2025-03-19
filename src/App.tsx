
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Examples from "./pages/Examples";
import History from "./pages/History";
import Login from "./components/Login";
import AddUser from "./components/AddUser";
import UserList from "./components/UserList";
import EditUser from "./components/EditUser";
import UserLimits from "./components/UserLimits";
import { isLoggedIn } from "./utils/authUtils";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
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

export default App;
