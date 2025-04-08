
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface UsageLimitsProps {
  remainingImages: number;
  imageLimit: number;
}

export const UsageLimits = ({ remainingImages, imageLimit }: UsageLimitsProps) => {
  return (
    <>
      {remainingImages <= 10 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Usage Limit Warning</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>
              You have {remainingImages} image generation{remainingImages === 1 ? '' : 's'} remaining.
            </span>
            <Button variant="outline" size="sm" className="self-start" asChild>
              <Link to="/buy-credits">Buy More Credits</Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {remainingImages > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">
            {remainingImages} of {imageLimit} image generations remaining
          </p>
          {remainingImages <= 20 && remainingImages > 10 && (
            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
              <Link to="/buy-credits">Buy More</Link>
            </Button>
          )}
        </div>
      )}
    </>
  );
};
