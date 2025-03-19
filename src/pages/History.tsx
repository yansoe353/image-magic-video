
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HistoryPanel from "@/components/HistoryPanel";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const History = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthChecking(true);
      
      try {
        // Use Supabase's built-in session check
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("User is logged in with session:", data.session.user.id);
          setIsAuthenticated(true);
        } else {
          console.log("No active session found, redirecting to login");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        navigate('/login');
      } finally {
        setIsAuthChecking(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  const handleSelectContent = (url: string, type: 'image' | 'video') => {
    // Navigate to creator with the selected content
    navigate('/create', { 
      state: { 
        selectedContent: {
          url,
          type
        }
      }
    });
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Loader2 className="h-12 w-12 animate-spin text-slate-400" />
        <p className="mt-4 text-slate-600">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1 container max-w-6xl py-8 px-4 md:px-6 mt-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-8">
          Content History
        </h1>
        
        <Card className="p-6">
          {isAuthenticated ? (
            <HistoryPanel onSelectContent={handleSelectContent} />
          ) : (
            <div className="text-center py-12">
              <p>You need to be logged in to view your history.</p>
            </div>
          )}
        </Card>
      </main>
      
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="container text-center text-slate-500 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default History;
