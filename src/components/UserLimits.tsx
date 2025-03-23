
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { setUserLimits, isAdmin, getCurrentUser, AppUser } from "@/utils/authUtils";
import { BarChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UserLimits = () => {
  const { userId } = useParams<{ userId: string }>();
  const [imageLimit, setImageLimit] = useState<number>(5);
  const [videoLimit, setVideoLimit] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [user, setUser] = useState<AppUser | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize component
    const initialize = async () => {
      // Check if current user is admin
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to edit user limits",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      // Load user data
      if (userId) {
        try {
          const { data: userData, error } = await supabase.auth.admin.getUserById(userId);
          
          if (error || !userData?.user) {
            toast({
              title: "Error",
              description: "User not found",
              variant: "destructive",
            });
            navigate("/users");
            return;
          }
          
          const userDetails: AppUser = {
            id: userData.user.id,
            email: userData.user.email || '',
            name: userData.user.user_metadata?.name,
            isAdmin: userData.user.user_metadata?.isAdmin === true,
            imageLimit: userData.user.user_metadata?.imageLimit || 5,
            videoLimit: userData.user.user_metadata?.videoLimit || 0
          };
          
          setUser(userDetails);
          setImageLimit(userDetails.imageLimit || 5);
          setVideoLimit(userDetails.videoLimit || 0);
        } catch (error) {
          console.error("Error fetching user:", error);
          toast({
            title: "Error",
            description: "Failed to load user data",
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
    
    if (imageLimit < 0 || videoLimit < 0) {
      toast({
        title: "Error",
        description: "Limits cannot be negative",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await setUserLimits(userId!, imageLimit, videoLimit);
      
      if (success) {
        toast({
          title: "Success",
          description: "User limits updated successfully",
        });
        navigate("/users");
      } else {
        toast({
          title: "Error",
          description: "Failed to update user limits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating user limits:", error);
      toast({
        title: "Error",
        description: "An error occurred while updating the user limits",
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
              <CardTitle className="text-2xl font-bold">User Generation Limits</CardTitle>
              <CardDescription>
                Set content generation limits for {user.name || user.email}
              </CardDescription>
            </div>
            <BarChart className="h-10 w-10 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
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
                <p className="text-xs text-muted-foreground">Maximum number of images this user can generate</p>
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
                <p className="text-xs text-muted-foreground">Maximum number of videos this user can generate</p>
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
                {isLoading ? "Saving..." : "Save Limits"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserLimits;
