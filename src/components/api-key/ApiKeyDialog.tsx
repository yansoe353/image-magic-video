
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DEFAULT_IMAGE_CREDITS, DEFAULT_VIDEO_CREDITS, IMAGE_COST, VIDEO_COST } from "@/utils/usageTracker";
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
          <DialogTitle>Credits Information</DialogTitle>
          <DialogDescription>
            YoteShin AI operates on a credit-based system for content generation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-slate-500">
            <p className="mt-1">Default account credits: {DEFAULT_IMAGE_CREDITS} image credits and {DEFAULT_VIDEO_CREDITS} video credits.</p>
            <p className="mt-2">Image generation uses {IMAGE_COST} image credit per image.</p>
            <p className="mt-2">Video generation uses {VIDEO_COST} video credits per video.</p>
            <p className="mt-2">Story to video uses 1 image credit per image and 1 video credit per video.</p>
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
