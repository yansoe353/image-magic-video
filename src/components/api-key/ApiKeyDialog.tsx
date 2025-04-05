
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  keyName: string;
  title: string;
  description: string;
  learnMoreLink?: string;
}

export const ApiKeyDialog = ({
  isOpen,
  onClose,
  keyName,
  title,
  description,
  learnMoreLink
}: ApiKeyDialogProps) => {
  const [apiKey, setApiKey] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    
    // Save the API key to localStorage
    localStorage.setItem(keyName, apiKey);
    
    toast({
      title: "API Key Saved",
      description: "Your API key has been saved successfully",
    });
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full"
            />
          </div>
          
          {learnMoreLink && (
            <div className="text-sm">
              <a
                href={learnMoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center"
              >
                Learn more about getting an API key <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          )}
          
          <DialogFooter className="sm:justify-start">
            <Button type="submit" className="mt-2 w-full">Save API Key</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
