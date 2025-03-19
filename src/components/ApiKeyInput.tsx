
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import ApiKeyDialog from "./api-key/ApiKeyDialog";
import InvalidApiKeyAlert from "./api-key/InvalidApiKeyAlert";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [open, setOpen] = useState(false);
  const [invalidKeyAlert, setInvalidKeyAlert] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Try to initialize the fal client with the server's API key
  try {
    // Using environment variable for API key
    const apiKey = import.meta.env.VITE_FAL_API_KEY;
    
    if (apiKey) {
      fal.config({
        credentials: apiKey
      });
      onApiKeySet(true);
    }
  } catch (error) {
    console.error("Error initializing fal.ai client:", error);
  }

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

    setOpen(true);
  };

  return (
    <>
      <ApiKeyDialog 
        open={open}
        setOpen={setOpen}
      />

      <InvalidApiKeyAlert 
        open={invalidKeyAlert}
        setOpen={setInvalidKeyAlert}
      />

      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={checkApiAccess}
      >
        <Key className="h-4 w-4" />
        API Info
      </Button>
    </>
  );
};

export default ApiKeyInput;
