
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { setUserLimits } from "@/utils/usageTracker";
import Header from "@/components/Header";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  imageCredits: z.coerce.number().min(0, "Image credits must be a positive number"),
  videoCredits: z.coerce.number().min(0, "Video credits must be a positive number")
});

const EditUser = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      imageCredits: 0,
      videoCredits: 0
    }
  });

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return;
      
      try {
        // Get user details
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
        
        if (userError) throw userError;
        
        if (userData.user) {
          const name = userData.user.user_metadata?.name || "";
          form.setValue("name", name);
        }
        
        // Get user credits
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('image_credits, video_credits')
          .eq('id', userId)
          .single();
        
        if (!profileError && profileData) {
          form.setValue("imageCredits", profileData.image_credits || 0);
          form.setValue("videoCredits", profileData.video_credits || 0);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      } finally {
        setFetchingUser(false);
      }
    };
    
    fetchUser();
  }, [userId, form, toast]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!userId) return;
    
    setIsLoading(true);
    
    try {
      // Update user metadata if name has changed
      if (values.name) {
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { name: values.name }
        });
        
        if (updateError) throw updateError;
      }
      
      // Update user limits
      await setUserLimits(userId, values.imageCredits, values.videoCredits);
      
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      
      navigate("/users");
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex py-4">
        <Header />
      </div>
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-2xl">Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingUser ? (
            <div className="text-center py-8">Loading user data...</div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="imageCredits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image Credits</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="videoCredits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Video Credits</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/users")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EditUser;
