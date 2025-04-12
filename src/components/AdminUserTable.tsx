
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin, AppUser, getCurrentUser } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { Edit, BarChart, Search, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdminUserTable = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch all users from Supabase
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First check if current user is an admin
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
      
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access this page",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      // Get current user
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        setError("Unable to fetch current user information");
        return;
      }

      try {
        // Fetch all users from Supabase auth
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        
        if (authError) {
          console.error("Error fetching users:", authError);
          setError("Failed to load users. You may not have admin privileges in Supabase.");
          toast({
            title: "Error",
            description: "Failed to load users. Check console for details.",
            variant: "destructive",
          });
          return;
        }

        // Format user data with limits
        const formattedUsers = authUsers.users.map(user => {
          const isAdminUser = user.user_metadata?.isAdmin === true;
          return {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
            isAdmin: isAdminUser,
            imageLimit: user.user_metadata?.imageLimit || 100,
            videoLimit: user.user_metadata?.videoLimit || 20
          };
        });

        setUsers(formattedUsers);
      } catch (error) {
        console.error("Error in admin API:", error);
        setError("Failed to access admin API. Make sure your Supabase instance has the correct permissions set up.");
        
        // Fallback: Show at least the current user in the list
        if (currentUser) {
          setUsers([currentUser]);
        }
      }
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      setError("An unexpected error occurred while loading users");
      toast({
        title: "Error",
        description: "An error occurred while loading users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [navigate, toast]);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdminUser) {
    return null; // Don't render anything if not an admin
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">User Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <p>Loading users...</p>
        </div>
      ) : (
        <Table>
          <TableCaption>All registered users and their generation limits</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Image Limit</TableHead>
              <TableHead>Video Limit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || "Unnamed"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.isAdmin ? "Admin" : "User"}</TableCell>
                  <TableCell>{user.imageLimit}</TableCell>
                  <TableCell>{user.videoLimit}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mr-2"
                      onClick={() => navigate(`/edit-user/${user.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/user-limits/${user.id}`)}
                    >
                      <BarChart className="h-4 w-4 mr-1" />
                      Limits
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  {searchQuery ? "No users match your search" : "No users found"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminUserTable;
