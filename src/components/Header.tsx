
import { useState, useEffect } from "react";
import { Github, Key, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyInput from "@/components/ApiKeyInput";
import { fal } from "@fal-ai/client";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if API key is already set in localStorage
    const storedApiKey = localStorage.getItem("falApiKey");
    if (storedApiKey) {
      try {
        // Configure fal.ai client with the API key
        fal.config({
          credentials: storedApiKey
        });
        setIsApiKeySet(true);
      } catch (error) {
        console.error("Error configuring fal.ai client:", error);
      }
    }
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const isHomePage = location.pathname === "/";

  return (
    <header className={`w-full border-b border-slate-200 ${isHomePage ? 'bg-transparent absolute top-0 left-0 z-10 border-transparent' : 'bg-white'}`}>
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Link to="/" className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue ${isHomePage ? 'hover:opacity-80' : ''}`}>
            YoteShin AI
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/" 
            className={`font-medium ${isHomePage ? 'text-white hover:text-brand-purple' : 'text-slate-600 hover:text-brand-purple'}`}
          >
            Home
          </Link>
          <Link 
            to="/create" 
            className={`font-medium ${isHomePage ? 'text-white hover:text-brand-purple' : 'text-slate-600 hover:text-brand-purple'}`}
          >
            Create
          </Link>
          <Link 
            to="/examples" 
            className={`font-medium ${isHomePage ? 'text-white hover:text-brand-purple' : 'text-slate-600 hover:text-brand-purple'}`}
          >
            Examples
          </Link>
          <ApiKeyInput onApiKeySet={setIsApiKeySet} />
          
          {isApiKeySet && (
            <span className={`text-xs ${isHomePage ? 'text-green-300' : 'text-green-600'} mr-2`}>
              API Key Set
            </span>
          )}
          
          <Button variant="outline" size="icon" asChild>
            <a 
              href="https://github.com/your-username/ai-video-generator"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className={isHomePage ? 'border-white text-white hover:bg-white/10' : ''}
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </nav>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className={isHomePage ? 'text-white hover:bg-white/10' : ''}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 py-4 px-6">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="font-medium text-slate-600 hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/create" 
              className="font-medium text-slate-600 hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create
            </Link>
            <Link 
              to="/examples" 
              className="font-medium text-slate-600 hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Examples
            </Link>
            <div className="py-2">
              <ApiKeyInput onApiKeySet={setIsApiKeySet} />
              {isApiKeySet && (
                <span className="text-xs text-green-600 ml-2">
                  API Key Set
                </span>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
