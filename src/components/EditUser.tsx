
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { updateUser, isAdmin, getAllUsers, User } from "@/utils/authUtils";
import { Switch } from "@/components/ui/switch";

const EditUser = () => {
  const { userId } = useParams<{ userId: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if current user is admin
    const adminStatus = isAdmin();
    setUserIsAdmin(adminStatus);
    
    if (!adminStatus) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to edit users",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    // Load user data
    if (userId) {
      const users = getAllUsers();
      const foundUser = users.find(u => u.id === userId);
      
      if (foundUser) {
        setUser(foundUser);
        setEmail(foundUser.email);
        setName(foundUser.name || "");
        setMakeAdmin(foundUser.isAdmin || false);
      } else {
        toast({
          title: "Error",
          description: "User not found",
          variant: "destructive",
        });
        navigate("/users");
      }
    }
  }, [userId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter an email",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Only update fields that were changed
      const updateData: any = {};
      
      if (email !== user?.email) updateData.email = email;
      if (name !== user?.name) updateData.name = name;
      if (makeAdmin !== user?.isAdmin) updateData.isAdmin = makeAdmin;
      if (password) updateData.password = password;
      
      const success = await updateUser(userId!, updateData);
      
      if (success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });
        navigate("/users");
      } else {
        toast({
          title: "Error",
          description: "Failed to update user. Email may already be in use.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userIsAdmin || !user) {
    return null;
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Edit User</CardTitle>
          <CardDescription>
            Update user account information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter user's name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter user's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password (leave blank to keep current)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="admin-mode"
                  checked={makeAdmin}
                  onCheckedChange={setMakeAdmin}
                />
                <Label htmlFor="admin-mode" className="cursor-pointer">Administrator</Label>
              </div>
            </div>
            <CardFooter className="flex justify-end pt-6 pb-0 px-0">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2"
                onClick={() => navigate("/users")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUser;
