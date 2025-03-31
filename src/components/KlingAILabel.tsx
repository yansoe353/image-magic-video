
import { Badge } from "@/components/ui/badge";

interface KlingAILabelProps {
  className?: string;
}

const KlingAILabel = ({ className }: KlingAILabelProps) => {
  return (
    <Badge 
      variant="default" 
      className={`bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-semibold ${className}`}
    >
      KLING AI
    </Badge>
  );
};

export default KlingAILabel;
