
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useIsFromMyanmar } from "@/utils/locationUtils";

interface MyanmarVpnWarningProps {
  className?: string;
}

const MyanmarVpnWarning: React.FC<MyanmarVpnWarningProps> = ({ className }) => {
  const isFromMyanmar = useIsFromMyanmar();
  
  if (!isFromMyanmar) return null;
  
  return (
    <Alert variant="warning" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>For Myanmar Users</AlertTitle>
      <AlertDescription>
        Due to connection restrictions in Myanmar, we recommend using a VPN for the best experience with our AI-powered features.
      </AlertDescription>
    </Alert>
  );
};

export default MyanmarVpnWarning;
