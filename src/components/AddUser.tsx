
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { addNewUser } from "@/utils/authUtils";

const AddUser = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageLimit, setImageLimit] = useState(IMAGE_LIMIT);
  const [videoLimit, setVideoLimit] = useState(VIDEO_LIMIT);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
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
      const success = await addNewUser(
        email,
        password,
        name,
        isAdmin,
        imageLimit,
        videoLimit
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "User account created successfully",
        });
        // Clear form
        setEmail("");
        setPassword("");
        setName("");
        setIsAdmin(false);
        setImageLimit(IMAGE_LIMIT);
        setVideoLimit(VIDEO_LIMIT);
        // Navigate to users list
        navigate("/users");
      } else {
        setError("Failed to create account. Email may already be in use.");
        toast({
          title: "Error",
          description: "Failed to create account. Email may already be in use.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating user:", error);
      setError("An error occurred while creating the account: " + (error.message || error));
      toast({
        title: "Error",
        description: "An error occurred while creating the account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create a New User</CardTitle>
          <CardDescription>
            Add a new user to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
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
              
              <div className="space-y-2">
                <Label htmlFor="imageLimit">Image Generation Limit</Label>
                <Input
                  id="imageLimit"
                  type="number"
                  min="0"
                  value={imageLimit}
                  onChange={(e) => setImageLimit(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="videoLimit">Video Generation Limit</Label>
                <Input
                  id="videoLimit"
                  type="number"
                  min="0"
                  value={videoLimit}
                  onChange={(e) => setVideoLimit(parseInt(e.target.value) || 0)}
                  required
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="admin-mode"
                  checked={isAdmin}
                  onCheckedChange={setIsAdmin}
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
                {isLoading ? "Creating..." : "Create User"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUser;
