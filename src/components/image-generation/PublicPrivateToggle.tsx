
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LockOpen, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PublicPrivateToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
  disabled?: boolean;
}

export const PublicPrivateToggle = ({ isPublic, onChange, disabled }: PublicPrivateToggleProps) => {
  return (
    <div className="flex items-center justify-between space-x-2 rounded-md border p-3 shadow-sm">
      <div className="flex items-center space-x-2">
        {isPublic ? (
          <LockOpen className="h-4 w-4 text-green-500" />
        ) : (
          <Lock className="h-4 w-4 text-slate-500" />
        )}
        <Label htmlFor="public-toggle" className="flex cursor-pointer items-center gap-1">
          <span>{isPublic ? "Public" : "Private"}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button" className="inline-flex">
                <span className="ml-1 text-xs text-slate-400">(i)</span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs text-xs">
                  {isPublic 
                    ? "Public generations will be visible in the User Gallery for everyone to see." 
                    : "Private generations are only visible to you."}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
      </div>
      <Switch
        id="public-toggle"
        checked={isPublic}
        onCheckedChange={onChange}
        disabled={disabled}
      />
    </div>
  );
};
