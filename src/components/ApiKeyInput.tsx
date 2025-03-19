
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

// Define interface for usage tracking
interface ApiKeyUsage {
  key: string;
  imageCount: number;
  videoCount: number;
}

const IMAGE_LIMIT = 100;
const VIDEO_LIMIT = 50;

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
      
      // Initialize usage tracking
      const usage: ApiKeyUsage = {
        key: apiKey,
        imageCount: 0,
        videoCount: 0
      };
      
      // Save API key and usage to localStorage
      localStorage.setItem("falApiKey", apiKey);
      localStorage.setItem("apiKeyUsage", JSON.stringify(usage));
      
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
          <DialogTitle>Set Your Infinity API Key</DialogTitle>
          <DialogDescription>
            Enter your Infinity API key to enable image and video generation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Infinity API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500">
            <p>Your API key is stored locally in your browser and not sent to our servers.</p>
            <p className="mt-1">Usage limits: {IMAGE_LIMIT} image generations and {VIDEO_LIMIT} video generations.</p>
            <p className="mt-2">
              <a 
                href="https://www.fal.ai/dashboard" 
                target="_blank" 
                rel="noreferrer"
                className="text-brand-blue hover:underline"
              >
                Get an API key from Infinity
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
