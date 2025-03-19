
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { Key } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [apiKey, setApiKey] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

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
      // Configure fal.ai client with the API key
      fal.config({
        credentials: apiKey
      });
      
      // Save API key to localStorage
      localStorage.setItem("falApiKey", apiKey);
      
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
      
      onApiKeySet(true);
      setOpen(false);
    } catch (error) {
      console.error("Error saving API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="h-4 w-4" />
          Set API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Your Fal.ai API Key</DialogTitle>
          <DialogDescription>
            Enter your Fal.ai API key to enable image and video generation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Fal.ai API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500">
            <p>Your API key is stored locally in your browser and not sent to our servers.</p>
            <p className="mt-2">
              <a 
                href="https://www.fal.ai/dashboard" 
                target="_blank" 
                rel="noreferrer"
                className="text-brand-blue hover:underline"
              >
                Get an API key from Fal.ai
              </a>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={saveApiKey}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyInput;
