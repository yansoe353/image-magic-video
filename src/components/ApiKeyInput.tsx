
import { useState, useEffect } from "react";
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

  // Correct format for FAL API key - using key_id:key_secret format
  const falApiKey = "key_YneSFqPk:x6QQRD2WhLWR4J2Z72e6u39I3IlQ2YPO";

  useEffect(() => {
    // Initialize with the hardcoded API key
    try {
      fal.config({
        credentials: falApiKey
      });
      
      // Store in localStorage for other components that might be using it
      localStorage.setItem("falApiKey", falApiKey);
      
      onApiKeySet(true);
      console.log("FAL API initialized with hardcoded key");
    } catch (error) {
      console.error("Error initializing fal.ai client:", error);
      onApiKeySet(false);
    }
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

    toast({
      title: "API Key Information",
      description: "The API key is already configured for you.",
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={checkApiAccess} className="flex items-center gap-2">
        <Key className="h-4 w-4" />
        API Info
      </Button>

      <ApiKeyDialog
        open={open}
        setOpen={setOpen}
      />

      <InvalidApiKeyAlert
        open={invalidKeyAlert}
        setOpen={setInvalidKeyAlert}
      />
    </>
  );
};

export default ApiKeyInput;
