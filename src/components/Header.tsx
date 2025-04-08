import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useLocation } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ModeToggle";
import { navigation } from "@/data/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Menu, User, UserPlus } from "lucide-react";
import { isLoggedIn, logoutUser, getCurrentUser, AppUser } from "@/utils/authUtils";
import ApiKeyDialog from "./api-key/ApiKeyDialog";

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const loggedIn = await isLoggedIn();
      setIsLoggedIn(loggedIn);
      
      if (loggedIn) {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    };
    
    checkAuthStatus();
  }, [location]);

  const handleLogout = async () => {
    await logoutUser();
    setIsLoggedIn(false);
    setUser(null);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        {/* Logo and navigation */}
        <Link to="/" className="mr-4 font-bold">
          YoteShin AI
        </Link>
        <nav className="mx-6 hidden md:flex">
          <ul className="flex items-center space-x-6">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="text-sm font-medium transition-colors hover:text-primary">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <ModeToggle />
          
          {!isLoggedIn && (
            <>
              <Button
                variant="outline"
                className="hidden md:flex"
                size="sm"
                asChild
              >
                <Link to="/buy-account">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Account
                </Link>
              </Button>
              <Button
                variant="default"
                className="hidden md:flex"
                size="sm"
                asChild
              >
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            </>
          )}
          
          {isLoggedIn && (
            <Button
              variant="outline"
              className="hidden md:flex"
              size="sm"
              asChild
            >
              <Link to="/buy-credits">
                Buy Credits
              </Link>
            </Button>
          )}

          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="hidden md:flex"
            >
              Logout
            </Button>
          )}
          
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setApiKeyDialogOpen(true)}
              className="hidden md:flex"
            >
              API Key
            </Button>
          )}
          
          {/* Mobile menu */}
          {isMobile && (
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>
                    Explore the app and manage your account.
                  </SheetDescription>
                </SheetHeader>
                <nav className="grid gap-4 text-sm font-semibold pt-6">
                  {navigation.map((item) => (
                    <Link key={item.href} to={item.href} className="hover:text-primary block py-2">
                      {item.label}
                    </Link>
                  ))}
                  
                  {isLoggedIn && (
                    <Link to="/buy-credits" className="hover:text-primary block py-2">
                      Buy Credits
                    </Link>
                  )}
                  
                  {!isLoggedIn ? (
                    <>
                      <Link to="/buy-account" className="hover:text-primary block py-2">
                        Create Account
                      </Link>
                      <Link to="/login" className="hover:text-primary block py-2">
                        Login
                      </Link>
                    </>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start">
                      Logout
                    </Button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
      
      <ApiKeyDialog open={apiKeyDialogOpen} setOpen={setApiKeyDialogOpen} />
    </header>
  );
};

export default Header;
