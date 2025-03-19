
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { addNewUser, isAdmin } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

const AddUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [makeAdmin, setMakeAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if current user is admin
    const adminStatus = isAdmin();
    setUserIsAdmin(adminStatus);
    
    if (!adminStatus) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to add users",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await addNewUser(email, password, name, makeAdmin);
      
      if (success) {
        toast({
          title: "Success",
          description: `User ${makeAdmin ? "admin" : ""} added successfully`,
        });
        // Clear form
        setEmail("");
        setPassword("");
        setName("");
        setMakeAdmin(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to add user. Email may already be in use.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding the user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!userIsAdmin) {
    return null;
  }

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Add New User</CardTitle>
          <CardDescription>
            Create a new user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name (Optional)</Label>
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter user's password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="admin-mode"
                  checked={makeAdmin}
                  onCheckedChange={setMakeAdmin}
                />
                <Label htmlFor="admin-mode" className="cursor-pointer">Make this user an administrator</Label>
              </div>
            </div>
            <CardFooter className="flex justify-end pt-6 pb-0 px-0">
              <Button 
                type="button" 
                variant="outline" 
                className="mr-2"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add User"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUser;
