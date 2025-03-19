
import { useState, useEffect } from "react";
import { getAllUsers, User, isAdmin } from "@/utils/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Plus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const adminStatus = isAdmin();
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
    const loadedUsers = getAllUsers();
    setUsers(loadedUsers);
  }, [navigate, toast]);

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
            </CardContent>
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
