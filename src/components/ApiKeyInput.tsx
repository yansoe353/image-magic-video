
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { initializeApiKeyUsage } from "@/utils/usageTracker";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if API key exists in environment
    const apiKey = import.meta.env.VITE_FAL_API_KEY;
    const hasKey = !!apiKey;
    
    setHasApiKey(hasKey);
    onApiKeySet(hasKey);
    
    if (hasKey) {
      // Initialize usage tracking with the environment API key
      initializeApiKeyUsage(apiKey);
    }
  }, [onApiKeySet]);

  const handleBuyApiKey = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please login to buy an API key",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    
    navigate("/buy-account");
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="gap-2"
      onClick={handleBuyApiKey}
    >
      <Key className="h-4 w-4" />
      {hasApiKey ? "API Key Active" : "Get API Key"}
    </Button>
  );
};

export default ApiKeyInput;
