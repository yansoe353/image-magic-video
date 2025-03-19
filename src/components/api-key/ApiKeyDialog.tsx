
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key } from "lucide-react";
import { IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";

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
          Contact Support
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Key Management</DialogTitle>
          <DialogDescription>
            Your API key is managed by the system administrator.
            Please contact support if you need assistance.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-slate-500">
            <p className="mt-1">Usage limits: {IMAGE_LIMIT} image generations and {VIDEO_LIMIT} video generations.</p>
            <p className="mt-2">
              If you need to purchase an API key, please visit the Buy Account page.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ApiKeyDialog;
