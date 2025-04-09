
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, isAdmin } from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    const checkAdmin = async () => {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
    };
    
    fetchUser();
    checkAdmin();
  }, []);
  
  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/login");
      toast({
        title: "Signed out successfully",
      });
    }
  };

  return (
    <header className="flex flex-col md:flex-row justify-between w-full">
      <div className="flex items-center">
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-bold text-xl text-white">YoteShin AI</span>
        </Link>
      </div>
      
      <div className="flex items-center mt-4 md:mt-0">
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="sm:max-w-xs">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
              <SheetDescription>
                Explore the YoteShin AI platform.
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-4">
              <Link to="/create" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white block">
                Create
              </Link>
              <Link to="/gallery" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white block">
                Gallery
              </Link>
              <Link to="/history" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white block">
                History
              </Link>
              <Link to="/buy-credits" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white block">
                Buy Credits
              </Link>
              
              {userIsAdmin && (
                <Link to="/users" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white flex items-center block">
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </Link>
              )}
            </div>
          </SheetContent>
        </Sheet>
        
        <nav className="hidden md:flex items-center space-x-1">
          <Link 
            to="/create" 
            className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white"
          >
            Create
          </Link>
          <Link 
            to="/gallery" 
            className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white"
          >
            Gallery
          </Link>
          <Link 
            to="/history" 
            className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white"
          >
            History
          </Link>
          <Link 
            to="/buy-credits" 
            className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white"
          >
            Buy Credits
          </Link>
          
          {userIsAdmin && (
            <Link 
              to="/users" 
              className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors text-white flex items-center"
            >
              <Users className="h-4 w-4 mr-1" />
              Users
            </Link>
          )}
        </nav>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 rounded-md shadow-lg bg-slate-800 ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <Link to="/create" className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700" role="menuitem">Create</Link>
              <Link to="/gallery" className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700" role="menuitem">Gallery</Link>
              <Link to="/history" className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700" role="menuitem">History</Link>
              <Link to="/buy-credits" className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700" role="menuitem">Buy Credits</Link>
              
              {userIsAdmin && (
                <Link to="/users" className="block px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 flex items-center" role="menuitem">
                  <Users className="h-4 w-4 mr-1" />
                  Users
                </Link>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="focus:outline-none">Sign Out</DropdownMenuItem>
            </div>
          </div>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url} alt={user?.name} />
                <AvatarFallback>{user?.name?.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              <span className="mr-2">Credits:</span>
              <span className="font-medium">{user?.credits || 0}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="focus:outline-none">Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
