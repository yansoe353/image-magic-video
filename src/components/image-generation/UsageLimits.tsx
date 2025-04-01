
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface UsageLimitsProps {
  remainingImages: number;
  imageLimit: number;
  isPublic?: boolean;
  onPublicChange?: (isPublic: boolean) => void;
  className?: string;
}

export const UsageLimits = ({ 
  remainingImages, 
  imageLimit, 
  isPublic = false, 
  onPublicChange,
  className 
}: UsageLimitsProps) => {
  return (
    <div className={`mb-4 ${className || ''}`}>
      {remainingImages <= 10 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Usage Limit Warning</AlertTitle>
          <AlertDescription>
            You have {remainingImages} image generation{remainingImages === 1 ? '' : 's'} remaining.
          </AlertDescription>
        </Alert>
      )}
      
      {onPublicChange && (
        <div className="flex items-center space-x-2 mb-3">
          <Switch 
            id="public-mode" 
            checked={isPublic} 
            onCheckedChange={onPublicChange} 
          />
          <Label htmlFor="public-mode" className="flex items-center cursor-pointer">
            {isPublic ? (
              <>
                <Eye className="h-4 w-4 mr-1 text-green-500" />
                <span>Public Gallery</span>
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4 mr-1 text-slate-500" />
                <span>Private</span>
              </>
            )}
          </Label>
        </div>
      )}
      
      {remainingImages > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {remainingImages} of {imageLimit} image generations remaining
        </p>
      )}
    </div>
  );
};
