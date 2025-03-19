
import { useState, useEffect } from "react";
import { getAllUsers } from "@/utils/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

const UserList = () => {
  const [users, setUsers] = useState<Array<{ id: string; email: string; name?: string }>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load users when component mounts
    const loadedUsers = getAllUsers();
    setUsers(loadedUsers);
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => navigate("/add-user")} className="gap-2">
          <Plus className="h-4 w-4" />
          Add New User
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map(user => (
          <Card key={user.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{user.name || "Unnamed User"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
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
