
import { Badge } from "@/components/ui/badge";

interface ProLabelProps {
  className?: string;
}

const ProLabel = ({ className }: ProLabelProps) => {
  return (
    <Badge 
      variant="default" 
      className={`bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-semibold ${className}`}
    >
      PRO
    </Badge>
  );
};

export default ProLabel;
