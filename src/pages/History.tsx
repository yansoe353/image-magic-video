
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HistoryPanel from "@/components/HistoryPanel";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

const History = () => {
  const navigate = useNavigate();
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthChecking(true);
      
      try {
        // Use Supabase's built-in session check
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log("User is logged in with session:", data.session.user.id);
          setUserId(data.session.user.id);
          setIsAuthenticated(true);
        } else {
          console.log("No active session found, redirecting to login");
          toast.error("Please log in to view your history");
          navigate('/login');
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Authentication error");
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-brand-500" />
        <p className="mt-4 text-slate-300">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-950 text-white">
      <Header />
      
      <main className="flex-1 container max-w-6xl py-8 px-4 md:px-6 mt-16">
        <div className="flex items-center gap-3 mb-8">
          <HistoryIcon className="h-8 w-8 text-brand-500" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Content History
          </h1>
        </div>
        
        <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm text-white shadow-xl">
          {isAuthenticated ? (
            <HistoryPanel userId={userId} onSelectContent={handleSelectContent} />
          ) : (
            <div className="text-center py-12">
              <p>You need to be logged in to view your history.</p>
            </div>
          )}
        </Card>
      </main>
      
      <footer className="py-6 border-t border-slate-800 bg-slate-900/80">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default History;
