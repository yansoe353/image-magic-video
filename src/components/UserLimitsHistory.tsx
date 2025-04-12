
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, AppUser } from "@/utils/authUtils";
import { useToast } from "@/hooks/use-toast";

interface UsageData {
  imageCount: number;
  videoCount: number;
  userId?: string;
}

interface UserLimitsHistoryProps {
  userId?: string;
}

const UserLimitsHistory: React.FC<UserLimitsHistoryProps> = ({ userId }) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        setIsLoading(true);
        
        // Get target user's limits
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          userId || ''
        );
        
        if (userError || !userData.user) {
          console.error("Error fetching user:", userError);
          toast({
            title: "Error",
            description: "Failed to load user data",
            variant: "destructive",
          });
          return;
        }
        
        // Create AppUser object from auth user
        const appUser: AppUser = {
          id: userData.user.id,
          email: userData.user.email || '',
          name: userData.user.user_metadata?.name || '',
          isAdmin: userData.user.user_metadata?.isAdmin === true,
          imageLimit: userData.user.user_metadata?.imageLimit || 100,
          videoLimit: userData.user.user_metadata?.videoLimit || 20,
        };
        
        setUser(appUser);
        
        // Get usage counts from content history
        const { data: imageData, error: imageError } = await supabase
          .from('user_content_history')
          .select('id')
          .eq('user_id', userId)
          .eq('content_type', 'image');
        
        if (imageError) throw imageError;
        
        const { data: videoData, error: videoError } = await supabase
          .from('user_content_history')
          .select('id')
          .eq('user_id', userId)
          .eq('content_type', 'video');
        
        if (videoError) throw videoError;
        
        setUsage({
          imageCount: imageData?.length || 0,
          videoCount: videoData?.length || 0,
          userId: userId
        });
      } catch (error) {
        console.error("Error fetching usage data:", error);
        toast({
          title: "Error",
          description: "Failed to load usage data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchUsageData();
    }
  }, [userId, toast]);

  if (isLoading) {
    return (
      <div className="py-4">
        <p>Loading usage data...</p>
      </div>
    );
  }

  if (!usage || !user) {
    return (
      <div className="py-4">
        <p>No usage data available</p>
      </div>
    );
  }

  const imagePercentage = (usage.imageCount / (user.imageLimit || 100)) * 100;
  const videoPercentage = (usage.videoCount / (user.videoLimit || 20)) * 100;

  return (
    <Card className="mt-4">
      <CardContent className="pt-6 space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Images Generated
            </span>
            <span className="text-sm">
              {usage.imageCount} / {user.imageLimit || 100}
            </span>
          </div>
          <Progress value={imagePercentage} className="h-2" />
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              Videos Generated
            </span>
            <span className="text-sm">
              {usage.videoCount} / {user.videoLimit || 20}
            </span>
          </div>
          <Progress value={videoPercentage} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

export default UserLimitsHistory;
