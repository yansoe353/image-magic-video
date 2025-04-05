import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { ApiKeyDialog } from "./api-key/ApiKeyDialog";
import InvalidApiKeyAlert from "./api-key/InvalidApiKeyAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [open, setOpen] = useState(false);
  const [invalidKeyAlert, setInvalidKeyAlert] = useState(false);
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("falApiKey") || "");
  const { toast } = useToast();
  const navigate = useNavigate();

  const storedApiKey = localStorage.getItem("falApiKey");
  if (storedApiKey) {
    try {
      fal.config({
        credentials: storedApiKey
      });
      onApiKeySet(true);
    } catch (error) {
      console.error("Error initializing fal.ai client:", error);
      onApiKeySet(false);
    }
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

    setApiKeyDialogOpen(true);
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
      localStorage.setItem("falApiKey", apiKey);

      fal.config({
        credentials: apiKey
      });

      onApiKeySet(true);
      setApiKeyDialogOpen(false);

      toast({
        title: "Success",
        description: "API key saved successfully",
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
    localStorage.removeItem("falApiKey");
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
        Set API Key
      </Button>

      <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Your Infinity API Key</DialogTitle>
            <DialogDescription>
              Enter your Infinity API key to generate images and videos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                id="apiKey"
                type="password"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Enter your Infinity API key"
              />
              <p className="text-xs text-slate-500">
                <a
                  href="https://m.me/infinitytechmyanmar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  Get your API key from Infinity Tech
                </a>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveApiKey}>Save API Key</Button>
            <Button variant="destructive" onClick={resetApiKey}>Reset API Key</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApiKeyDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        keyName="falApiKey"
        title="Set Your Infinity API Key"
        description="Enter your Infinity API key to generate images and videos."
        learnMoreLink="https://m.me/infinitytechmyanmar"
      />

      <InvalidApiKeyAlert
        open={invalidKeyAlert}
        setOpen={setInvalidKeyAlert}
      />
    </>
  );
};

export default ApiKeyInput;
