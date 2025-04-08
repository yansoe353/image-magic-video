
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export interface UsageLimitsProps {
  remainingCredits: number;
  creditType: "image" | "video";
}

export const UsageLimits = ({ remainingCredits, creditType }: UsageLimitsProps) => {
  const navigate = useNavigate();

  return (
    <>
      {remainingCredits <= 10 && (
        <Alert variant="destructive" className="mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div className="ml-2">
                <AlertTitle>Credits Running Low</AlertTitle>
                <AlertDescription>
                  You have {remainingCredits} {creditType} credit{remainingCredits === 1 ? '' : 's'} remaining.
                </AlertDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="whitespace-nowrap"
              onClick={() => navigate('/buy-credits')}
            >
              Buy Credits
            </Button>
          </div>
        </Alert>
      )}
      
      {remainingCredits === 0 && (
        <Alert variant="destructive" className="mb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <div className="ml-2">
                <AlertTitle>No Credits Remaining</AlertTitle>
                <AlertDescription>
                  You don't have enough {creditType} credits to generate content.
                </AlertDescription>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/buy-credits')} 
              className="whitespace-nowrap"
            >
              Buy Credits Now
            </Button>
          </div>
        </Alert>
      )}
      
      {remainingCredits > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {remainingCredits} {creditType} credit{remainingCredits === 1 ? '' : 's'} remaining
        </p>
      )}
    </>
  );
};
