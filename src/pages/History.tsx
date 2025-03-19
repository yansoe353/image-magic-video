
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import HistoryPanel from "@/components/HistoryPanel";
import { Card } from "@/components/ui/card";
import { isLoggedIn } from "@/utils/authUtils";

const History = () => {
  const navigate = useNavigate();
  
  // Redirect to login if not logged in - Fixed: Changed useState to useEffect
  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login');
    }
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1 container max-w-6xl py-8 px-4 md:px-6 mt-16">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-8">
          Content History
        </h1>
        
        <Card className="p-6">
          <HistoryPanel onSelectContent={handleSelectContent} />
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
