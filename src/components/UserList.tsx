
import { useState, useEffect } from "react";
import { getAllUsers, AppUser, isAdmin, deleteUser, getCurrentUser } from "@/utils/authUtils";
import { getRemainingCountsForUser, refillUserLimits, addCustomAmountToUser } from "@/utils/usageTracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Plus, Shield, Pencil, Trash, BarChart, Search, RefreshCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

// Schema for custom credits form
const formSchema = z.object({
  imageCredits: z.coerce.number().int().min(0, "Must be a positive number"),
  videoCredits: z.coerce.number().int().min(0, "Must be a positive number")
});

const UserList = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [currentUserData, setCurrentUserData] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState("");
  const [userLimits, setUserLimits] = useState<Record<string, { remainingImages: number; remainingVideos: number }>>({});
  const [isRefilling, setIsRefilling] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  // Form for custom credits
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      imageCredits: 0,
      videoCredits: 0
    },
  });

  // Handle the form submission for adding credits
  const handleAddCredits = async (data: z.infer<typeof formSchema>) => {
    if (!selectedUserId) return;
    
    setIsAddingCredits(true);
    try {
      console.log(`Adding credits to user ${selectedUserId}: image=${data.imageCredits}, video=${data.videoCredits}`);
      
      const success = await addCustomAmountToUser(
        selectedUserId, 
        data.imageCredits, 
        data.videoCredits
      );
      
      if (success) {
        toast({
          title: "Success",
          description: "Credits added successfully",
        });
        await fetchUserLimits();
        setSelectedUserId(null);
        form.reset();
      } else {
        toast({
          title: "Error",
          description: "Failed to add credits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding credits:", error);
      toast({
        title: "Error",
        description: "An error occurred while adding credits",
        variant: "destructive",
      });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const loadUsers = async () => {
    try {
      console.log("Attempting to load users...");
      const loadedUsers = await getAllUsers();
      console.log("Users loaded:", loadedUsers);
      setUsers(loadedUsers);
      
      if (loadedUsers.length === 0) {
        try {
          const { data, error } = await supabase.auth.admin.listUsers();
          
          if (error) {
            if (error.message.includes("not_admin") || error.message.includes("service_role")) {
              setError("Admin API access error: " + error.message + 
                "\n\nThis indicates that your app may not be using the service role key when making admin requests. " +
                "Please check your Supabase service role key configuration.");
            } else {
              setError("Error accessing admin API: " + error.message);
            }
          } else if (!data || data.users.length === 0) {
            setError("No users found in the database. This could be because there are genuinely no users registered yet.");
          }
        } catch (testError) {
          console.error("Error testing admin API access:", testError);
          setError("Failed to test admin API access: " + (testError instanceof Error ? testError.message : String(testError)) + 
            "\n\nThis indicates that your service role key may not be correctly configured.");
        }
      }
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users. This could be due to insufficient permissions or service role key configuration issues.");
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUserData(user);
        
        const adminStatus = await isAdmin();
        setUserIsAdmin(adminStatus);
        
        console.log("Current user:", user);
        console.log("Is admin:", adminStatus);
        
        if (!adminStatus) {
          setError("You need admin privileges to view this page");
          toast({
            title: "Access Denied",
            description: "You need admin privileges to view this page",
            variant: "destructive",
          });
          navigate("/");
          return;
        }
        
        loadUsers();
      } catch (err) {
        console.error("Error checking admin status:", err);
        setError("Error checking admin status");
        setIsLoading(false);
      }
    };
    
    checkAdminAndLoadUsers();
  }, [navigate, toast]);

  useEffect(() => {
    if (users.length > 0) {
      fetchUserLimits();
    }
  }, [users]);

  const fetchUserLimits = async () => {
    const limits: Record<string, { remainingImages: number; remainingVideos: number }> = {};
    console.log("Fetching limits for", users.length, "users");
    
    for (const user of users) {
      try {
        console.log(`Fetching limits for user ${user.id}`);
        const counts = await getRemainingCountsForUser(user.id);
        console.log(`Got limits for user ${user.id}:`, counts);
        limits[user.id] = counts;
      } catch (error) {
        console.error(`Error fetching limits for user ${user.id}:`, error);
        limits[user.id] = { remainingImages: 0, remainingVideos: 0 };
      }
    }
    
    setUserLimits(limits);
    console.log("All user limits:", limits);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const success = await deleteUser(userId);
      
      if (success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        loadUsers();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the user",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRefillLimits = async (userId: string) => {
    if (!window.confirm("Are you sure you want to refill this user's generation limits?")) {
      return;
    }
    
    setIsRefilling(userId);
    try {
      const success = await refillUserLimits(userId);
      if (success) {
        toast({
          title: "Success",
          description: "Generation limits refilled successfully",
        });
        fetchUserLimits();
      } else {
        toast({
          title: "Error",
          description: "Failed to refill generation limits",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error refilling limits:", error);
      toast({
        title: "Error",
        description: "An error occurred while refilling limits",
        variant: "destructive",
      });
    } finally {
      setIsRefilling(null);
    }
  };

  const filteredUsers = users.filter(user => 
    searchEmail ? user.email.toLowerCase().includes(searchEmail.toLowerCase()) : true
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        {userIsAdmin && (
          <Button onClick={() => navigate("/add-user")} className="gap-2">
            <Plus className="h-4 w-4" />
            Add New User
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap">
            {error}
            {error.includes("permissions") || error.includes("service role") || error.includes("not_admin") ? (
              <div className="mt-2">
                <p><b>Troubleshooting Steps:</b></p>
                <ol className="list-decimal pl-4 space-y-1 mt-1">
                  <li>Verify your account has admin privileges in Supabase Auth</li>
                  <li>Check if the service role key is correctly set in your Supabase project settings</li>
                  <li>Ensure your application is using the service role key for admin operations</li>
                </ol>
                <p className="font-semibold mt-2">Current email: {currentUserData?.email}</p>
                <p className="text-sm mt-1">Admin status: {currentUserData?.isAdmin ? "Yes" : "No"}</p>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map(user => (
          <Card key={user.id} className={user.isAdmin ? "border-2 border-amber-500" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{user.name || "Unnamed User"}</CardTitle>
                {user.isAdmin && (
                  <Shield className="h-5 w-5 text-amber-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {user.id}</p>
              {user.isAdmin && (
                <p className="text-xs font-medium text-amber-600 mt-1">Administrator</p>
              )}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Image Generations:</span>
                  <div className="text-right">
                    <span className="text-sm">{userLimits[user.id]?.remainingImages || 0} remaining</span>
                    <span className="text-xs text-muted-foreground"> / {user.imageLimit || 100} total</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Video Generations:</span>
                  <div className="text-right">
                    <span className="text-sm">{userLimits[user.id]?.remainingVideos || 0} remaining</span>
                    <span className="text-xs text-muted-foreground"> / {user.videoLimit || 20} total</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-end gap-2">
              <Dialog open={selectedUserId === user.id} onOpenChange={(open) => {
                if (!open) setSelectedUserId(null);
                else setSelectedUserId(user.id);
                form.reset();
              }}>
                <DialogTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Credits
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Credits to {user.name || user.email}</DialogTitle>
                    <DialogDescription>
                      Enter the number of credits you want to add to this user's account.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddCredits)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="imageCredits"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image Credits</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} />
                            </FormControl>
                            <FormDescription>
                              Number of image generation credits to add
                            </FormDescription>
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
                            <FormDescription>
                              Number of video generation credits to add
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setSelectedUserId(null)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={isAddingCredits}
                        >
                          {isAddingCredits ? "Adding..." : "Add Credits"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleRefillLimits(user.id)}
                disabled={isRefilling === user.id}
                className="flex items-center"
              >
                <RefreshCcw className="h-4 w-4 mr-1" />
                {isRefilling === user.id ? "Refilling..." : "Full Refill"}
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/user-limits/${user.id}`)}
                className="flex items-center"
              >
                <BarChart className="h-4 w-4 mr-1" />
                Limits
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/edit-user/${user.id}`)}
                className="flex items-center"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button 
                size="sm" 
                variant="destructive"
                onClick={() => handleDeleteUser(user.id)}
                disabled={isDeleting || user.isAdmin}
                className="flex items-center"
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {!error && users.length === 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <p className="text-muted-foreground mb-2">No users found.</p>
              <p className="text-sm text-muted-foreground">Click to see potential solutions</p>
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>No Users Found</DialogTitle>
              <DialogDescription>
                Here are some possible reasons why no users are showing up:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">1. Administrator Status</h3>
                <p className="text-sm text-muted-foreground">
                  Your account ({currentUserData?.email || "unknown"}) might not have proper admin privileges in Supabase.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">2. Supabase Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Your application is not correctly configured to use the Supabase service_role key for admin operations.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Check that your service_role key is correctly set in the Supabase project settings.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium">3. No Registered Users</h3>
                <p className="text-sm text-muted-foreground">
                  There might not be any users registered in your system yet. Try adding a test user.
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
              <Button className="ml-2" onClick={() => navigate("/add-user")}>Add User</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserList;
