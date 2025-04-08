
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import ApiKeyDialog from "./api-key/ApiKeyDialog";
import InvalidApiKeyAlert from "./api-key/InvalidApiKeyAlert";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [open, setOpen] = useState(false);
  const [invalidKeyAlert, setInvalidKeyAlert] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Initialize the app by default
  onApiKeySet(true);

  const checkCredits = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please login to check your credits",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setOpen(true);
  };

  const buyCredits = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please login to buy credits",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    navigate("/buy-credits");
  };

  return (
    <>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={checkCredits} className="flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Credits Info
        </Button>
        
        <Button variant="default" size="sm" onClick={buyCredits} className="flex items-center gap-2">
          <Coins className="h-4 w-4" />
          Buy Credits
        </Button>
      </div>

      <ApiKeyDialog
        open={open}
        setOpen={setOpen}
      />

      <InvalidApiKeyAlert
        open={invalidKeyAlert}
        setOpen={setInvalidKeyAlert}
      />
    </>
  );
};

export default ApiKeyInput;
