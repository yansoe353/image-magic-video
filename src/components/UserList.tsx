
import { useState, useEffect } from "react";
import { getAllUsers, AppUser, isAdmin, deleteUser, getCurrentUser } from "@/utils/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Plus, Shield, Pencil, Trash, BarChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

const UserList = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      console.log("Attempting to load users...");
      const loadedUsers = await getAllUsers();
      console.log("Users loaded:", loadedUsers);
      setUsers(loadedUsers);
      
      // Check if we got any users or encountered auth errors
      if (loadedUsers.length === 0) {
        // Test the admin API directly to diagnose issues
        try {
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) {
            if (error.message.includes("not_admin") || error.message.includes("service_role")) {
              setError("Admin API access error: " + error.message + 
                "\n\nThis indicates that your app may not be using the service role key when making admin requests. " +
                "Please check your Supabase service role key configuration.");
            } else {
              setError("Error accessing admin API: " + error.message);
            }
          } else if (!data || data.users.length === 0) {
            setError("No users found in the database. This could be because there are genuinely no users registered yet.");
          }
        } catch (testError) {
          console.error("Error testing admin API access:", testError);
          setError("Failed to test admin API access: " + (testError instanceof Error ? testError.message : String(testError)) + 
            "\n\nThis indicates that your service role key may not be correctly configured.");
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users. This could be due to insufficient permissions or service role key configuration issues.");
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      try {
        // Get current user info
        const user = await getCurrentUser();
        setCurrentUserData(user);
        
        // Check if user is admin
        const adminStatus = await isAdmin();
        setUserIsAdmin(adminStatus);
        
        console.log("Current user:", user);
        console.log("Is admin:", adminStatus);
        
        if (!adminStatus) {
          setError("You need admin privileges to view this page");
          toast({
            title: "Access Denied",
            description: "You need admin privileges to view this page",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        // Load users when component mounts (only if admin)
        loadUsers();
      } catch (err) {
        console.error("Error checking admin status:", err);
        setError("Error checking admin status");
        setIsLoading(false);
      }
    };
    
    checkAdminAndLoadUsers();
  }, [navigate, toast]);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await deleteUser(userId);
      
      if (success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        loadUsers(); // Reload users after deletion
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        {userIsAdmin && (
          <Button onClick={() => navigate("/add-user")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {error}
            {error.includes("permissions") || error.includes("service role") || error.includes("not_admin") ? (
              <div className="mt-2">
                <p><b>Troubleshooting Steps:</b></p>
                <ol className="list-decimal pl-4 space-y-1 mt-1">
                  <li>Verify your account has admin privileges in Supabase Auth</li>
                  <li>Check if the service role key is correctly set in your Supabase project settings</li>
                  <li>Ensure your application is using the service role key for admin operations</li>
                </ol>
                <p className="font-semibold mt-2">Current email: {currentUserData?.email}</p>
                <p className="text-sm mt-1">Admin status: {currentUserData?.isAdmin ? "Yes" : "No"}</p>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <Card key={user.id} className={user.isAdmin ? "border-2 border-amber-500" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{user.name || "Unnamed User"}</CardTitle>
                {user.isAdmin && (
                  <Shield className="h-5 w-5 text-amber-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
              {user.isAdmin && (
                <p className="text-xs font-medium text-amber-600 mt-1">Administrator</p>
              )}
              <div className="mt-2">
                <p className="text-xs font-medium">Image Limit: {user.imageLimit || 100}</p>
                <p className="text-xs font-medium">Video Limit: {user.videoLimit || 50}</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/user-limits/${user.id}`)}
              >
                <BarChart className="h-4 w-4 mr-1" />
                Limits
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/edit-user/${user.id}`)}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDeleteUser(user.id)}
                disabled={isDeleting || user.isAdmin}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {!error && users.length === 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <p className="text-muted-foreground mb-2">No users found.</p>
              <p className="text-sm text-muted-foreground">Click to see potential solutions</p>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>No Users Found</DialogTitle>
              <DialogDescription>
                Here are some possible reasons why no users are showing up:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">1. Administrator Status</h3>
                <p className="text-sm text-muted-foreground">
                  Your account ({currentUserData?.email || "unknown"}) might not have proper admin privileges in Supabase.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">2. Supabase Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Your application is not correctly configured to use the Supabase service_role key for admin operations.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check that your service_role key is correctly set in the Supabase project settings.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">3. No Registered Users</h3>
                <p className="text-sm text-muted-foreground">
                  There might not be any users registered in your system yet. Try adding a test user.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
              <Button className="ml-2" onClick={() => navigate("/add-user")}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserList;
