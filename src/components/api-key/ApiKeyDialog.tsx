
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import BuyApiKeyPopover from "./BuyApiKeyPopover";

interface ApiKeyDialogProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const ApiKeyDialog = ({ open, setOpen }: ApiKeyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Usage Information</DialogTitle>
          <DialogDescription>
            Your account has access to our API for image and video generation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-slate-500">
            <p className="mt-1">Account limits: {IMAGE_LIMIT} image generations and {VIDEO_LIMIT} video generations.</p>
            <p className="mt-2">Your usage is tracked based on your user account.</p>
            <p className="mt-2">
              <BuyApiKeyPopover />
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
