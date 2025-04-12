
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isAdmin } from "@/utils/authUtils";
import { useToast } from "@/hooks/use-toast";
import AdminUserTable from "@/components/AdminUserTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, BarChart } from "lucide-react";
import Header from "@/components/Header";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdmin();
      setIsAdminUser(adminStatus);
      
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to access the admin dashboard",
          variant: "destructive",
        });
        navigate("/");
      }
      
      setIsLoading(false);
    };
    
    checkAdminStatus();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-center">Checking permissions...</p>
      </div>
    );
  }

  if (!isAdminUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => navigate("/add-user")} className="flex items-center gap-2">
            <Plus size={16} />
            Add New User
          </Button>
        </div>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users size={16} />
              User Management
            </TabsTrigger>
            <TabsTrigger value="limits" className="flex items-center gap-2">
              <BarChart size={16} />
              Usage Limits
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <AdminUserTable />
            </div>
          </TabsContent>
          <TabsContent value="limits">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h2 className="text-2xl font-semibold mb-4">Global Limit Settings</h2>
              <p className="text-muted-foreground">
                This feature allows you to set generation limits that apply to all users.
                Coming soon in a future update.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
