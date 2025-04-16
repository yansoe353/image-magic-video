
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import ApiKeyDialog from "./api-key/ApiKeyDialog";
import InvalidApiKeyAlert from "./api-key/InvalidApiKeyAlert";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { falService } from "@/services/falService";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [open, setOpen] = useState(false);
  const [invalidKeyAlert, setInvalidKeyAlert] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check API key status on component mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // Initialize falService (which will try to get key from Supabase)
        await falService.initialize();
        onApiKeySet(true);
      } catch (error) {
        console.error("Error initializing fal.ai client:", error);
        onApiKeySet(false);
      }
    };
    
    checkApiKey();
  }, [onApiKeySet]);

  const checkApiAccess = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please login to access the API",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setApiKeyDialogOpen(true);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={checkApiAccess} className="flex items-center gap-2">
        <Key className="h-4 w-4" />
        API Info
      </Button>

      <ApiKeyDialog
        open={apiKeyDialogOpen}
        setOpen={setApiKeyDialogOpen}
      />

      <InvalidApiKeyAlert
        open={invalidKeyAlert}
        setOpen={setInvalidKeyAlert}
      />
    </>
  );
};

export default ApiKeyInput;
