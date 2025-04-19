
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { isLoggedIn } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import ApiKeyDialog from "./api-key/ApiKeyDialog";
import { Button } from "@/components/ui/button";
import { Key } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApiKeyInputProps {
  onApiKeySet: (isSet: boolean) => void;
}

const ApiKeyInput = ({ onApiKeySet }: ApiKeyInputProps) => {
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkApiAccess = () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "Please login to access the API",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setApiKeyDialogOpen(true);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={checkApiAccess} className="flex items-center gap-2">
        <Key className="h-4 w-4" />
        API Info
      </Button>

      <ApiKeyDialog
        open={apiKeyDialogOpen}
        setOpen={setApiKeyDialogOpen}
      />
    </>
  );
};

export default ApiKeyInput;
