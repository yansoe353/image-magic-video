import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  X,
  LogIn,
  LogOut,
  History,
  User,
  Shield,
  CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, isAdmin, AppUser } from "@/utils/authUtils";

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Add a state for tracking admin status
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  const checkAdminStatus = async () => {
    try {
      const adminStatus = await isAdmin();
      setIsUserAdmin(adminStatus);
    } catch (error) {
      console.error("Error checking admin status:", error);
    }
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
    };

    checkAuth();

    if (isAuthenticated) {
      fetchUserData();
      checkAdminStatus(); // Check if user is admin
    }
  }, [isAuthenticated]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  const renderMobileMenu = () => {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="md:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="px-2">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="text-2xl font-bold">
                KlingAI
              </Link>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-6 w-6" />
                </Button>
              </SheetClose>
            </div>
            <nav className="flex flex-col gap-4">
              <Link to="/" className="hover:text-primary transition">Home</Link>
              <Link to="/examples" className="hover:text-primary transition">Examples</Link>
              <Link to="/gallery" className="hover:text-primary transition">Gallery</Link>
              <Link to="/buy-credits" className="hover:text-primary transition">Pricing</Link>
              {isAuthenticated && (
                <>
                  <Link to="/create" className="hover:text-primary transition">Create</Link>
                  <Link to="/history" className="hover:text-primary transition">History</Link>
                  {isUserAdmin && (
                    <Link to="/admin" className="hover:text-primary transition">Admin</Link>
                  )}
                  <Button variant="outline" onClick={handleSignOut} className="justify-start mt-4">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              )}
              {!isAuthenticated && (
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  const renderDesktopMenu = () => {
    return (
      <div className="hidden md:flex items-center space-x-6">
        <nav className="flex items-center space-x-6">
          <Link to="/" className="hover:text-primary transition">
            Home
          </Link>
          <Link to="/examples" className="hover:text-primary transition">
            Examples
          </Link>
          <Link to="/gallery" className="hover:text-primary transition">
            Gallery
          </Link>
          <Link to="/buy-credits" className="hover:text-primary transition">
            Pricing
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/create" className="hover:text-primary transition">
                Create
              </Link>
              <Link to="/history" className="hover:text-primary transition">
                History
              </Link>
              {isUserAdmin && (
                <Link to="/admin" className="hover:text-primary transition">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>
        <div>
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user ? (
                    <Avatar>
                      <AvatarFallback>
                        {user.name ? user.name[0] : user.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/history" className="flex w-full items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>My History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/buy-credits" className="flex w-full items-center">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Pricing Plans</span>
                  </Link>
                </DropdownMenuItem>
                {isUserAdmin && (
                  <DropdownMenuItem>
                    <Link to="/admin" className="flex w-full items-center">
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Admin Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="default">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="border-b">
      <div className="container flex h-16 items-center justify-between py-4">
        <Link to="/" className="text-2xl font-bold">
          YoteshinAI
        </Link>
        <div className="flex items-center space-x-4">
          {renderMobileMenu()}
          {renderDesktopMenu()}
        </div>
      </div>
    </div>
  );
};

export default Header;
