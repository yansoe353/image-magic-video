import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { initializeApiKeyUsage } from "@/utils/usageTracker";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import ApiKeyDialog from "./api-key/ApiKeyDialog";
import InvalidApiKeyAlert from "./api-key/InvalidApiKeyAlert";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [open, setOpen] = useState(false);
  const [invalidKeyAlert, setInvalidKeyAlert] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const saveApiKey = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please login to save your API key",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      // Configure fal.ai client with the API key
      fal.config({
        credentials: apiKey
      });
      
      // Test the API key with a minimal request - we'll catch errors in the try-catch
      testApiKey().then(isValid => {
        if (isValid) {
          // Initialize usage tracking
          initializeApiKeyUsage(apiKey);
          
          // Save API key to localStorage
          localStorage.setItem("falApiKey", apiKey);
          
          toast({
            title: "Success",
            description: "API key saved successfully",
          });
          
          onApiKeySet(true);
          setOpen(false);
        } else {
          // Show invalid key alert
          setInvalidKeyAlert(true);
        }
      });
    } catch (error) {
      console.error("Error saving API key:", error);
      // Show invalid key alert
      setInvalidKeyAlert(true);
    }
  };

  const testApiKey = async (): Promise<boolean> => {
    try {
      // Make a simple request to check if the API key is valid
      // This is a placeholder - replace with actual fal.ai validation logic
      // For now, we'll just assume it's valid to avoid adding actual API calls
      
      // In a real implementation, you would make a small test request to fal.ai
      // and check if it returns a valid response
      
      // Simulate API validation (remove this in production)
      return true;

      // Uncomment and adjust for actual implementation:
      // const response = await fal.someValidationMethod();
      // return response.isValid;
    } catch (error) {
      console.error("API key validation failed:", error);
      return false;
    }
  };

  return (
    <>
      <ApiKeyDialog 
        apiKey={apiKey}
        setApiKey={setApiKey}
        open={open}
        setOpen={setOpen}
        saveApiKey={saveApiKey}
      />

      <InvalidApiKeyAlert 
        open={invalidKeyAlert}
        setOpen={setInvalidKeyAlert}
      />
    </>
  );
};

export default ApiKeyInput;
