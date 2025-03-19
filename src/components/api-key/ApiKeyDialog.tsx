
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import BuyApiKeyPopover from "./BuyApiKeyPopover";

interface ApiKeyDialogProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  open: boolean;
  setOpen: (value: boolean) => void;
  saveApiKey: () => void;
}

const ApiKeyDialog = ({ apiKey, setApiKey, open, setOpen, saveApiKey }: ApiKeyDialogProps) => {
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
  );
};

export default ApiKeyDialog;
