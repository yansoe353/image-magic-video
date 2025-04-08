
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Coins } from "lucide-react";

export const BuyCreditButton = () => {
  return (
    <Button asChild variant="outline" className="w-full">
      <Link to="/buy-credits">
        <Coins className="mr-2 h-4 w-4" />
        Buy More Credits
      </Link>
    </Button>
  );
};
