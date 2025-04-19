
import { useState, useEffect } from "react";
import { Menu, X, LogOut, LogIn, Users, History, Key, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyInput from "@/components/ApiKeyInput";
import ApiKeyDialog from "@/components/api-key/ApiKeyDialog";
import { fal } from "@fal-ai/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isLoggedIn, logoutUser, getCurrentUser, AppUser } from "@/utils/authUtils";

const Header = () => {
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      const isUserLoggedIn = await isLoggedIn();
      setLoggedIn(isUserLoggedIn);
      
      if (isUserLoggedIn) {
        const user = await getCurrentUser();
        setCurrentUser(user);
      }
      
      const storedApiKey = localStorage.getItem("falApiKey");
      if (storedApiKey) {
        try {
          fal.config({
            credentials: storedApiKey
          });
          setIsApiKeySet(true);
        } catch (error) {
          console.error("Error configuring fal.ai client:", error);
        }
      }
    };
    
    initialize();
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = async () => {
    await logoutUser();
    setLoggedIn(false);
    setCurrentUser(null);
    navigate("/");
  };

  const handleApiKeyClick = () => {
    setApiKeyDialogOpen(true);
  };

  const isHomePage = location.pathname === "/";

  return (
    <header className={`w-full border-b ${isHomePage ? 'bg-transparent absolute top-0 left-0 z-50 border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
      <div className="container flex h-16 items-center justify-between px-4 md:px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <Link to="/" className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue ${isHomePage ? 'hover:opacity-80' : ''}`}>
            YoteShin AI
          </Link>
        </div>
        
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
          <Link 
            to="/faq" 
            className={`font-medium ${isHomePage ? 'text-white hover:text-brand-purple' : 'text-slate-600 hover:text-brand-purple'}`}
          >
            FAQ
          </Link>
          
          {loggedIn && (
            <Link 
              to="/history" 
              className={`font-medium flex items-center gap-1 ${isHomePage ? 'text-white hover:text-brand-purple' : 'text-slate-600 hover:text-brand-purple'}`}
            >
              <History className="h-4 w-4" />
              History
            </Link>
          )}
          
          {loggedIn ? (
            <>
              <span className={`text-sm ${isHomePage ? 'text-white' : 'text-slate-600'}`}>
                {currentUser?.name || currentUser?.email}
              </span>

              <ApiKeyInput onApiKeySet={setIsApiKeySet} />
              {isApiKeySet && (
                <span className={`text-xs ${isHomePage ? 'text-green-300' : 'text-green-600'} mr-2`}>
                  API Key Set
                </span>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={handleApiKeyClick}
              >
                <Key className="h-4 w-4" />
                API Info
              </Button>

              <Link 
                to="/users"
                className={`font-medium flex items-center gap-1 ${isHomePage ? 'text-white hover:text-brand-purple' : 'text-slate-600 hover:text-brand-purple'}`}
              >
                <Users className="h-4 w-4" />
                Users
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2" 
              onClick={() => navigate("/login")}
            >
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          )}
        </nav>
        
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMobileMenu} className={isHomePage ? 'text-white hover:bg-white/10' : 'text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}>
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>
      
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-4 px-6 shadow-md">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="font-medium text-slate-700 dark:text-slate-200 hover:text-brand-purple dark:hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link 
              to="/create" 
              className="font-medium text-slate-700 dark:text-slate-200 hover:text-brand-purple dark:hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create
            </Link>
            <Link 
              to="/examples" 
              className="font-medium text-slate-700 dark:text-slate-200 hover:text-brand-purple dark:hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              Examples
            </Link>
            <Link 
              to="/faq" 
              className="font-medium text-slate-700 dark:text-slate-200 hover:text-brand-purple dark:hover:text-brand-purple"
              onClick={() => setMobileMenuOpen(false)}
            >
              FAQ
            </Link>
            
            {loggedIn && (
              <Link 
                to="/history" 
                className="font-medium flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:text-brand-purple dark:hover:text-brand-purple"
                onClick={() => setMobileMenuOpen(false)}
              >
                <History className="h-4 w-4" />
                History
              </Link>
            )}
            
            {loggedIn ? (
              <>
                <div className="py-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                  <span className="text-sm text-slate-700 dark:text-slate-300 block mb-2">
                    {currentUser?.name || currentUser?.email}
                  </span>
                  <ApiKeyInput onApiKeySet={setIsApiKeySet} />
                  {isApiKeySet && (
                    <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                      API Key Set
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 w-full flex items-center border-slate-300 dark:border-slate-600" 
                  onClick={handleApiKeyClick}
                >
                  <Key className="h-4 w-4" />
                  API Info
                </Button>
                <Link 
                  to="/users"
                  className="font-medium flex items-center gap-1 text-slate-700 dark:text-slate-200 hover:text-brand-purple dark:hover:text-brand-purple"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Users className="h-4 w-4" />
                  Users
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 w-full border-slate-300 dark:border-slate-600" 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 w-full border-slate-300 dark:border-slate-600" 
                onClick={() => {
                  navigate("/login");
                  setMobileMenuOpen(false);
                }}
              >
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            )}
          </nav>
        </div>
      )}
      
      <ApiKeyDialog 
        open={apiKeyDialogOpen}
        setOpen={setApiKeyDialogOpen}
      />
    </header>
  );
};

export default Header;
