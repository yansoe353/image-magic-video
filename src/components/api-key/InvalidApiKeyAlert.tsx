
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import BuyApiKeyPopover from "./BuyApiKeyPopover";

interface InvalidApiKeyAlertProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const InvalidApiKeyAlert = ({ open, setOpen }: InvalidApiKeyAlertProps) => {
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
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
            <div>
              <BuyApiKeyPopover />
            </div>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default InvalidApiKeyAlert;
