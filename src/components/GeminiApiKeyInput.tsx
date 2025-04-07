
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface GeminiApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const GeminiApiKeyInput = ({ onApiKeySet }: GeminiApiKeyInputProps) => {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("geminiApiKey") || "");
  const { toast } = useToast();
  const navigate = useNavigate();

  // Try to initialize with the stored API key
  const storedApiKey = localStorage.getItem("geminiApiKey");
  if (storedApiKey) {
    onApiKeySet(true);
  } else {
    onApiKeySet(false);
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

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      localStorage.setItem("geminiApiKey", apiKey);
      onApiKeySet(true);
      setOpen(false);

      toast({
        title: "Success",
        description: "Gemini API key saved successfully",
      });
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const resetApiKey = () => {
    localStorage.removeItem("geminiApiKey");
    setApiKey("");
    onApiKeySet(false);
    toast({
      title: "Success",
      description: "API key reset successfully",
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={checkApiAccess} className="flex items-center gap-2">
        <Key className="h-4 w-4" />
        Set Gemini API Key
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Your Gemini API Key</DialogTitle>
            <DialogDescription>
              Enter your Gemini API key to generate images and videos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your Gemini API key"
              />
              <p className="text-xs text-slate-500">
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Get your Gemini API key
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={saveApiKey}>Save API Key</Button>
            <Button variant="destructive" onClick={resetApiKey}>Reset API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GeminiApiKeyInput;
