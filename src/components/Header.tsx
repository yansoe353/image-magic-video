import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Menu, LogOut, User, Home, History, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { logoutUser, isLoggedIn, isAdmin } from "@/utils/authUtils";
import ApiKeyInput from "./ApiKeyInput";

interface HeaderProps {
  onApiKeySet?: (isSet: boolean) => void;
}

const Header = ({ onApiKeySet }: HeaderProps) => {
  const [userAuthenticated, setUserAuthenticated] = useState<boolean>(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const loggedIn = await isLoggedIn();
      setUserAuthenticated(loggedIn);
      
      if (loggedIn) {
        const adminStatus = await isAdmin();
        setUserIsAdmin(adminStatus);
      }
      
      // Check if API key exists in environment
      if (onApiKeySet) {
        const hasApiKey = !!import.meta.env.VITE_FAL_API_KEY;
        onApiKeySet(hasApiKey);
      }
    };
    
    checkAuth();
  }, [location.pathname, onApiKeySet]);

  const handleLogout = async () => {
    await logoutUser();
    setUserAuthenticated(false);
    setUserIsAdmin(false);
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const DesktopNavigation = () => (
    <div className="hidden md:flex items-center space-x-6">
      <Link to="/" className="text-sm font-medium hover:underline">
        Home
      </Link>
      {userAuthenticated && (
        <>
          <Link to="/create" className="text-sm font-medium hover:underline">
            Create
          </Link>
          <Link to="/history" className="text-sm font-medium hover:underline">
            History
          </Link>
          {userIsAdmin && (
            <Link to="/users" className="text-sm font-medium hover:underline">
              Users
            </Link>
          )}
        </>
      )}
      {!userAuthenticated ? (
        <Link to="/login" className="text-sm font-medium hover:underline">
          Login
        </Link>
      ) : (
        <Button size="sm" onClick={handleLogout}>
          Logout
        </Button>
      )}
    </div>
  );

  const MobileNavigation = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col space-y-4">
          <Link to="/" className="text-sm font-medium hover:underline" onClick={closeMobileMenu}>
            <Home className="mr-2 h-4 w-4 inline-block" />
            Home
          </Link>
          {userAuthenticated && (
            <>
              <Link to="/create" className="text-sm font-medium hover:underline" onClick={closeMobileMenu}>
                <User className="mr-2 h-4 w-4 inline-block" />
                Create
              </Link>
              <Link to="/history" className="text-sm font-medium hover:underline" onClick={closeMobileMenu}>
                <History className="mr-2 h-4 w-4 inline-block" />
                History
              </Link>
              {userIsAdmin && (
                <Link to="/users" className="text-sm font-medium hover:underline" onClick={closeMobileMenu}>
                  <Users className="mr-2 h-4 w-4 inline-block" />
                  Users
                </Link>
              )}
            </>
          )}
          {!userAuthenticated ? (
            <Link to="/login" className="text-sm font-medium hover:underline" onClick={closeMobileMenu}>
              <LogOut className="mr-2 h-4 w-4 inline-block" />
              Login
            </Link>
          ) : (
            <Button size="sm" onClick={handleLogout} variant="ghost">
              Logout
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="bg-white py-4 shadow-sm sticky top-0 z-50">
      <div className="container flex items-center justify-between">
        <Link to="/" className="font-bold text-lg">
          YoteShin AI
        </Link>
        <div className="flex items-center space-x-4">
          <DesktopNavigation />
          <ApiKeyInput onApiKeySet={onApiKeySet} />
          <MobileNavigation />
        </div>
      </div>
    </header>
  );
};

export default Header;
