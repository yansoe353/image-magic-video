
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface UsageLimitsProps {
  remainingCredits: number;
  totalCredits: number;
  type: "image" | "video";
}

export const UsageLimits = ({ remainingCredits, totalCredits, type }: UsageLimitsProps) => {
  return (
    <>
      {remainingCredits <= 10 && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Credit Limit Warning</AlertTitle>
          <AlertDescription>
            You have {remainingCredits} {type} credit{remainingCredits === 1 ? '' : 's'} remaining.
          </AlertDescription>
        </Alert>
      )}
      
      {remainingCredits > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {remainingCredits} of {totalCredits} {type} credits remaining
        </p>
      )}
    </>
  );
};
