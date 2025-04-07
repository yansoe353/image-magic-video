
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { falClient } from "@/hooks/useFalClient";
import { QueueStatus, MMAudioInput } from "@/hooks/useFalClient";
import { useToast } from "@/hooks/use-toast";
import { Film, Loader2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import VideoPreview from "@/components/VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import VideoUploader from "@/components/VideoUploader";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { incrementVideoCount } from "@/utils/usageTracker";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";

const VideoToVideo: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [predictionId, setPredictionId] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();

  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  const handleGenerateVideo = async () => {
    if (!videoUrl) {
      toast({
        title: "Error",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setQueueStatus(null);
    setPredictionId(null);

    try {
      const input: MMAudioInput = {
        video_url: videoUrl,
        prompt: prompt,
        num_steps: 25,
        duration: 3,
      };

      // Start the generation
      const result = await falClient.subscribe("emmet-ai/mmaudio", {
        input,
        pollInterval: 5000,
        onQueueUpdate: (update) => {
          console.log("Queue update:", update);
          setQueueStatus(update as QueueStatus);
          
          // Check if logs exist before accessing them
          if (update && 'logs' in update && update.logs) {
            console.log("Processing log:", update.logs);
          }
        },
      });

      // Set the prediction ID for status checking
      if (result.id) {
        setPredictionId(result.id);
      }

      // Check if the operation was successful
      if (result.error) {
        throw new Error(result.error);
      }

      // If the status is "COMPLETED", set the video URL
      if (result.status !== "FAILED") {
        if (result.data?.video?.url) {
          setGeneratedVideoUrl(result.data.video.url);
          
          // Save to Supabase
          const userId = await getUserId();
          if (userId) {
            await supabase.from('user_content_history').insert({
              user_id: userId,
              content_type: 'video',
              content_url: result.data.video.url,
              prompt: prompt,
              is_public: isPublic,
              metadata: {
                model: 'emmet-ai/mmaudio',
              }
            });
          }
          
          // Increment video count
          await incrementVideoCount();
          
          toast({
            title: "Success",
            description: "Video generated successfully!",
          });
        } else {
          throw new Error("No video URL in response");
        }
      } else {
        throw new Error("Video generation failed");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate video",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setQueueStatus(null);
      setPredictionId(null);
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        setStatusCheckInterval(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Film className="mr-2 h-6 w-6" />
            Video to Video
          </h2>

          <div className="space-y-4">
            <VideoUploader onVideoSelected={(url) => setVideoUrl(url)} />

            {videoUrl && (
              <div className="relative rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-auto max-h-80 object-contain"
                />
              </div>
            )}

            <div>
              <Label htmlFor="prompt">Video Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe how you want to transform the video..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !videoUrl || !prompt}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>

            {queueStatus && (
              <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-md">
                <p>Status: {queueStatus.status}</p>
                {queueStatus && 'logs' in queueStatus && queueStatus.logs && queueStatus.logs.length > 0 && (
                  <p className="mt-1">Latest: {queueStatus.logs[queueStatus.logs.length - 1].message}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedVideoUrl && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Generated Video</h3>
            <VideoPreview
              videoUrl={generatedVideoUrl}
              isLoading={isGenerating}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
              generationLogs={[]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoToVideo;
