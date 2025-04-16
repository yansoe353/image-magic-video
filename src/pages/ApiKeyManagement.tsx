
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAdmin } from "@/utils/authUtils";
import { useToast } from "@/hooks/use-toast";
import ApiKeyManager from "@/components/admin/ApiKeyManager";

const ApiKeyManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkPermissions = async () => {
      const userIsAdmin = await isAdmin();
      if (!userIsAdmin) {
        toast({
          title: "Access Denied",
          description: "You need administrator privileges to access this page",
          variant: "destructive",
        });
        navigate("/");
      }
    };
    
    checkPermissions();
  }, [navigate, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">API Key Management</h1>
      <p className="text-slate-600 mb-8">
        Manage the FAL API key used for image and video generation features.
      </p>
      
      <ApiKeyManager />
    </div>
  );
};

export default ApiKeyManagement;
