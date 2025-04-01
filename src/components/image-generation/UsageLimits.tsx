
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface UsageLimitsProps {
  remainingImages: number;
  imageLimit: number;
}

export const UsageLimits = ({ remainingImages, imageLimit }: UsageLimitsProps) => {
  return (
    <div className="mb-4">
      {remainingImages <= 10 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Usage Limit Warning</AlertTitle>
          <AlertDescription>
            You have {remainingImages} image generation{remainingImages === 1 ? '' : 's'} remaining.
          </AlertDescription>
        </Alert>
      )}
      
      {remainingImages > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {remainingImages} of {imageLimit} image generations remaining
        </p>
      )}
    </div>
  );
};
