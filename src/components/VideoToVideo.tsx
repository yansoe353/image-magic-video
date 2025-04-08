
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const VideoToVideo = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Video to Video</h2>
          <p className="text-muted-foreground mb-4">
            This feature is coming soon. Stay tuned!
          </p>
          <Button
            disabled={true}
            className="w-full"
          >
            Coming Soon
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoToVideo;
