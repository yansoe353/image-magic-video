
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { setUserLimits, isAdmin, getCurrentUser, AppUser } from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";
import { BarChart } from "lucide-react";
import UserLimitsHistory from "./UserLimitsHistory";

const UserLimits = () => {
  const { userId } = useParams<{ userId: string }>();
  const [imageLimit, setImageLimit] = useState<number>(100);
  const [videoLimit, setVideoLimit] = useState<number>(20);
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
          const { data, error } = await supabase.auth.admin.getUserById(userId);
          
          if (error || !data.user) {
            toast({
              title: "Error",
              description: "User not found",
              variant: "destructive",
            });
            navigate("/admin");
            return;
          }
          
          const userData = data.user;
          const foundUser: AppUser = {
            id: userData.id,
            email: userData.email || '',
            name: userData.user_metadata?.name || '',
            isAdmin: userData.user_metadata?.isAdmin === true,
            imageLimit: userData.user_metadata?.imageLimit || 100,
            videoLimit: userData.user_metadata?.videoLimit || 20,
          };
          
          setUser(foundUser);
          setImageLimit(foundUser.imageLimit || 100);
          setVideoLimit(foundUser.videoLimit || 20);
        } catch (error) {
          console.error("Error fetching user:", error);
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
          navigate("/admin");
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
        // Update the user state with new limits
        if (user) {
          setUser({
            ...user,
            imageLimit,
            videoLimit
          });
        }
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
    <div className="flex justify-center items-start py-12">
      <div className="w-full max-w-md">
        <Card>
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
                  onClick={() => navigate("/admin")}
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
        
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Current Usage</h3>
          <UserLimitsHistory userId={userId} />
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => navigate("/admin")}>
            Back to Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserLimits;
