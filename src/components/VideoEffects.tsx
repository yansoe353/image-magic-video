import { useState, useRef, ChangeEvent } from "react";
import { Loader2, Upload, RefreshCw, Video, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVideoControls } from "@/hooks/useVideoControls";
import VideoPreview from "./VideoPreview";
import { falClient } from "@/hooks/useFalClient";

// Effect options for the model
const effectOptions = [
  { value: "squish", label: "Squish" },
  { value: "muscle", label: "Muscle" },
  { value: "inflate", label: "Inflate" },
  { value: "crush", label: "Crush" },
  { value: "rotate", label: "Rotate" },
  { value: "cakeify", label: "Cakeify" },
  { value: "baby", label: "Baby" },
  { value: "disney-princess", label: "Disney Princess" },
  { value: "painting", label: "Painting" },
  { value: "pirate-captain", label: "Pirate Captain" },
  { value: "jungle", label: "Jungle" },
  { value: "samurai", label: "Samurai" },
  { value: "warrior", label: "Warrior" },
  { value: "fire", label: "Fire" },
  { value: "super-saiyan", label: "Super Saiyan" },
];

interface VideoEffectsProps {
  initialVideoUrl: string | null;
}

const VideoEffects = ({ initialVideoUrl }: VideoEffectsProps) => {
  const [inputVideoUrl, setInputVideoUrl] = useState<string | null>(initialVideoUrl || null);
  const [selectedEffect, setSelectedEffect] = useState<string>("cakeify");
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("input");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { isPlaying: isInputPlaying, videoRef: inputVideoRef, handlePlayPause: handleInputPlayPause } = useVideoControls();
  const { isPlaying: isOutputPlaying, videoRef: outputVideoRef, handlePlayPause: handleOutputPlayPause } = useVideoControls();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a video smaller than 50MB",
        variant: "destructive",
      });
      return;
    }

    // Check if it's a video file
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid video file",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setInputVideoUrl(url);
    setOutputVideoUrl(null);
    setActiveTab("input");
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const applyEffect = async () => {
    if (!inputVideoUrl) {
      toast({
        title: "No video selected",
        description: "Please upload a video first",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setProcessingTime(null);
    setOutputVideoUrl(null);

    const startTime = Date.now();

    try {
      // Prepare the video file for processing
      const response = await fetch(inputVideoUrl);
      const blob = await response.blob();
      const file = new File([blob], "video.mp4", { type: "video/mp4" });

      setProgressPercent(30);

      // Submit the video to fal.ai for processing using the queue API
      const { request_id } = await falClient.queue.submit("fal-ai/wan-effects", {
        input: {
          input_video: file,
          effect_type: selectedEffect,
          num_frames: 81,
          frames_per_second: 16,
          aspect_ratio: "16:9",
          num_inference_steps: 30,
          lora_scale: 1,
        },
      });

      setProgressPercent(50);

      // Poll for results
      let result = null;
      const checkInterval = setInterval(async () => {
        try {
          const status = await falClient.queue.check(request_id);
          if (status.status === "COMPLETED") {
            clearInterval(checkInterval);
            result = status.result;
            setProgressPercent(90);
            handleResults(result);
          }
        } catch (error) {
          console.error("Error checking status:", error);
        }
      }, 2000);

      const handleResults = (result: any) => {
        setProgressPercent(95);

        // Calculate processing time
        const endTime = Date.now();
        setProcessingTime((endTime - startTime) / 1000);

        // Get the output video URL
        if (result?.video) {
          setOutputVideoUrl(result.video);
          setActiveTab("output");
          toast({
            title: "Effect applied successfully",
            description: `Video processed with ${selectedEffect} effect`,
          });
        } else {
          throw new Error("No output video received");
        }

        setProgressPercent(100);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Error applying effect:", error);
      toast({
        title: "Processing failed",
        description: "Failed to apply the effect. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">AI Video Effects</h2>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="effect-select">Select Effect Style</Label>
              <Select
                value={selectedEffect}
                onValueChange={setSelectedEffect}
                disabled={isProcessing}
              >
                <SelectTrigger id="effect-select" className="w-full">
                  <SelectValue placeholder="Select an effect" />
                </SelectTrigger>
                <SelectContent>
                  {effectOptions.map((effect) => (
                    <SelectItem key={effect.value} value={effect.value}>
                      {effect.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <Button
                onClick={handleClickUpload}
                variant="outline"
                className="w-full"
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden"
              />
            </div>
          </div>

          <Button
            onClick={applyEffect}
            disabled={!inputVideoUrl || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Apply {selectedEffect} Effect
              </>
            )}
          </Button>

          {isProcessing && (
            <div>
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">
                {progressPercent < 30 ? "Preparing video..." :
                 progressPercent < 50 ? "Sending to AI model..." :
                 progressPercent < 90 ? "Applying effect - this may take a few minutes..." :
                 "Finalizing..."}
              </p>
            </div>
          )}

          {inputVideoUrl && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="input">
                  <Video className="h-4 w-4 mr-2" />
                  Input Video
                </TabsTrigger>
                <TabsTrigger value="output" disabled={!outputVideoUrl}>
                  <Video className="h-4 w-4 mr-2" />
                  Output Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="input" className="mt-2">
                <VideoPreview
                  videoUrl={inputVideoUrl}
                  isLoading={false}
                  generationLogs={[]}
                  videoRef={inputVideoRef}
                  isPlaying={isInputPlaying}
                  handlePlayPause={handleInputPlayPause}
                />
              </TabsContent>

              <TabsContent value="output" className="mt-2">
                {outputVideoUrl ? (
                  <>
                    <VideoPreview
                      videoUrl={outputVideoUrl}
                      isLoading={false}
                      generationLogs={[]}
                      videoRef={outputVideoRef}
                      isPlaying={isOutputPlaying}
                      handlePlayPause={handleOutputPlayPause}
                    />
                    {processingTime && (
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Processing time: {processingTime.toFixed(1)} seconds
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-lg overflow-hidden aspect-video bg-slate-100 flex items-center justify-center">
                    <Skeleton className="h-full w-full" />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {!inputVideoUrl && (
            <Alert>
              <AlertDescription>
                Upload a video to apply AI-powered effects. Transform your videos into different artistic styles with just one click.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoEffects;
