
import { useState, useEffect } from "react";
import { getAllUsers, AppUser, isAdmin, deleteUser } from "@/utils/authUtils";
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
} from "@/components/ui/dialog";

const UserList = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const loadedUsers = await getAllUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
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
      // Check if user is admin
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      if (!adminStatus) {
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
                <p className="text-xs font-medium">Image Limit: {user.imageCredits || 100}</p>
                <p className="text-xs font-medium">Video Limit: {user.videoCredits || 50}</p>
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
      
      {users.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No users found.</p>
        </div>
      )}
    </div>
  );
};

export default UserList;
