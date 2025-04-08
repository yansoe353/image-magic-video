
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Coins, History } from "lucide-react";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getRemainingCountsAsync, ensureUserProfileExists } from "@/utils/usageTracker";
import { BuyCreditButton } from "@/components/image-generation/BuyCreditButton";
import { Link, useNavigate } from "react-router-dom";
import { UsageLimits } from "@/components/image-generation/UsageLimits";

const Account = () => {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usageCounts, setUsageCounts] = useState({ remainingImages: 0, remainingVideos: 0 });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast({
            title: "Not logged in",
            description: "Please log in to view your account",
            variant: "destructive",
          });
          setIsLoading(false);
          navigate('/login');
          return;
        }

        // Ensure profile exists before trying to get it
        await ensureUserProfileExists(user.id);

        // Get user's profile from the profiles table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          toast({
            title: "Error",
            description: "Failed to load account details. Creating new profile.",
            variant: "destructive",
          });
          
          // If we still have an error after ensuring profile exists,
          // at least show the default limits
          setUserProfile({
            id: user.id,
            email: user.email,
            image_credits: 100,
            video_credits: 100,
            created_at: new Date().toISOString()
          });
        } else if (profile) {
          setUserProfile(profile);
        }

        // Get usage counts
        const counts = await getRemainingCountsAsync();
        setUsageCounts(counts);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [toast, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
        <Header />
        <div className="flex-1 container py-8 px-4 md:px-6 mt-16 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
        <Header />
        <div className="flex-1 container py-8 px-4 md:px-6 mt-16">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Account Not Found</h2>
                <p className="mb-4">Please log in to view your account details.</p>
                <Button asChild>
                  <Link to="/login">Log In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate total credits from the profile
  const totalImageCredits = userProfile.image_credits || 100;
  const totalVideoCredits = userProfile.video_credits || 100;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6 mt-16">
        <h1 className="text-4xl font-bold mb-8 text-white">Your Account</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" /> 
                Credit Balance
              </CardTitle>
              <CardDescription>Your current credit balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Image Credits</div>
                    <div className="text-2xl font-bold">{usageCounts.remainingImages}</div>
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                    <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Video Credits</div>
                    <div className="text-2xl font-bold">{usageCounts.remainingVideos}</div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <UsageLimits 
                    remainingCredits={usageCounts.remainingImages} 
                    totalCredits={totalImageCredits}
                    type="image" 
                  />
                  <div className="h-2"></div>
                  <UsageLimits 
                    remainingCredits={usageCounts.remainingVideos} 
                    totalCredits={totalVideoCredits}
                    type="video" 
                  />
                </div>

                <div className="pt-2">
                  <BuyCreditButton />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="mr-2 h-5 w-5" /> 
                Account Activity
              </CardTitle>
              <CardDescription>Your recent activity and history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Account Created</div>
                  <div className="font-medium">
                    {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : "N/A"}
                  </div>
                </div>
                
                <Button asChild variant="outline" className="w-full">
                  <Link to="/history">
                    <Coins className="mr-2 h-4 w-4" />
                    View Content History
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Account;
