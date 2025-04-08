
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface UsageLimitsProps {
  remainingCredits: number;
  totalCredits: number;
}

export const UsageLimits = ({ remainingCredits, totalCredits }: UsageLimitsProps) => {
  return (
    <>
      {remainingCredits <= 10 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Credit Warning</AlertTitle>
          <AlertDescription>
            You have {remainingCredits} image generation credit{remainingCredits === 1 ? '' : 's'} remaining.
          </AlertDescription>
        </Alert>
      )}
      
      {remainingCredits > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {remainingCredits} of {totalCredits} image generation credits remaining
        </p>
      )}
    </>
  );
};
