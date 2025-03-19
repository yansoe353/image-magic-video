
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { Key, MessageCircle, Phone, Send, AlertTriangle } from "lucide-react";
import { initializeApiKeyUsage, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  const BuyApiKeyPopover = () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="link" 
          className="p-0 text-brand-blue hover:underline h-auto"
        >
          Get an API key from Infinity
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-center text-lg">Buy Infinity API Key</h3>
          <div className="text-center">
            <p className="font-bold text-xl mb-4">Price: 50000 Ks</p>
            <div className="grid grid-cols-1 gap-2">
              <a 
                href="viber://chat?number=+959740807009" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Phone className="h-4 w-4" />
                Viber Contact (09740807009)
              </a>
              <a 
                href="https://m.me/infinitytechmyanmar" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Messenger Contact
              </a>
              <a 
                href="https://t.me/+959740807009" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                <Send className="h-4 w-4" />
                Telegram Contact (09740807009)
              </a>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <>
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
              <p className="mt-1">Usage limits: {IMAGE_LIMIT} image generations and {VIDEO_LIMIT} video generations.</p>
              <p className="mt-2">
                <BuyApiKeyPopover />
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveApiKey}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={invalidKeyAlert} onOpenChange={setInvalidKeyAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Invalid API Key
            </AlertDialogTitle>
            <AlertDialogDescription>
              The API key you entered appears to be invalid or has expired. Would you like to purchase a new Infinity API key?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={() => setInvalidKeyAlert(false)}>
                <BuyApiKeyPopover />
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ApiKeyInput;
