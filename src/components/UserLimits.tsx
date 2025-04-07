import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { setUserCredits, isAdmin, getAllUsers, AppUser } from "@/utils/authUtils";
import { BarChart } from "lucide-react";

const UserLimits = () => {
  const { userId } = useParams<{ userId: string }>();
  const [imageCredits, setImageCredits] = useState<number>(100);
  const [videoCredits, setVideoCredits] = useState<number>(100);
  const [isLoading, setIsLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const initialize = async () => {
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to edit user credits",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      if (userId) {
        const users = await getAllUsers();
        const foundUser = users.find(u => u.id === userId);
        
        if (foundUser) {
          setUser(foundUser);
          setImageCredits(foundUser.imageCredits || 100);
          setVideoCredits(foundUser.videoCredits || 100);
        } else {
          toast({
            title: "Error",
            description: "User not found",
            variant: "destructive",
          });
          navigate("/users");
        }
      }
    };
    
    initialize();
  }, [userId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (imageCredits < 0 || videoCredits < 0) {
      toast({
        title: "Error",
        description: "Credits cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (videoCredits % 8 !== 0) {
      toast({
        title: "Error",
        description: "Video credits must be a multiple of 8 (1 generation = 8 videos)",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await setUserCredits(userId!, imageCredits, videoCredits);
      
      if (success) {
        toast({
          title: "Success",
          description: "User credits updated successfully",
        });
        navigate("/users");
      } else {
        toast({
          title: "Error",
          description: "Failed to update user credits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user credits:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the user credits",
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">User Generation Credits</CardTitle>
              <CardDescription>
                Set content generation credits for {user.name || user.email}
              </CardDescription>
            </div>
            <BarChart className="h-10 w-10 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imageCredits">Image Generation Credits</Label>
                <Input
                  id="imageCredits"
                  type="number"
                  min="0"
                  value={imageCredits}
                  onChange={(e) => setImageCredits(parseInt(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">Maximum number of images this user can generate</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="videoCredits">Video Generation Credits</Label>
                <Input
                  id="videoCredits"
                  type="number"
                  min="0"
                  step="8"
                  value={videoCredits}
                  onChange={(e) => setVideoCredits(parseInt(e.target.value) || 0)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Total video credits. <strong>1 generation = 8 videos</strong>. Enter a multiple of 8.
                </p>
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
                {isLoading ? "Saving..." : "Save Credits"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLimits;
