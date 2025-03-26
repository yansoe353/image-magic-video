import { useState, useRef, ChangeEvent } from "react";
import { Loader2, Upload, RefreshCw, Video, Clock, Image as ImageIcon } from "lucide-react";
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
import { falClient, EffectType } from "@/hooks/useFalClient";

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
  { value: "gun-shooting", label: "Gun Shooting" },
  { value: "deflate", label: "Deflate" },
  { value: "hulk", label: "Hulk" },
  { value: "bride", label: "Bride" },
  { value: "princess", label: "Princess" },
  { value: "zen", label: "Zen" },
  { value: "assassin", label: "Assassin" },
];

interface VideoEffectsProps {
  initialVideoUrl: string | null;
}

const VideoEffects = ({ initialVideoUrl }: VideoEffectsProps) => {
  const [inputImageUrl, setInputImageUrl] = useState<string | null>(null);
  const [inputImageFile, setInputImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<EffectType>("cakeify");
  const [outputVideoUrl, setOutputVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [processingTime, setProcessingTime] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("input");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { isPlaying: isOutputPlaying, videoRef: outputVideoRef, handlePlayPause: handleOutputPlayPause } = useVideoControls();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload a valid image file (JPEG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setInputImageFile(file);
    setOutputVideoUrl(null);
    setActiveTab("input");
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  const applyEffect = async () => {
    if (!inputImageFile && !imagePreview) {
      toast({
        title: "No image selected",
        description: "Please upload an image first",
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
      setProgressPercent(30);

      let imageUrl;
      if (inputImageFile) {
        imageUrl = await falClient.storage.upload(inputImageFile);
      } else if (imagePreview) {
        imageUrl = imagePreview;
      } else {
        throw new Error("No image to process");
      }

      const { request_id } = await falClient.queue.submit("fal-ai/wan-effects", {
        input: {
          image_url: imageUrl,
          effect_type: selectedEffect,
          num_frames: 81,
          frames_per_second: 16,
          aspect_ratio: "16:9",
          num_inference_steps: 30,
          lora_scale: 1,
        },
      });

      setProgressPercent(50);

      let result = null;
      const checkInterval = setInterval(async () => {
        try {
          const status = await falClient.queue.status("fal-ai/wan-effects", {
            requestId: request_id,
            logs: true,
          });
          
          if (status.status === "COMPLETED") {
            clearInterval(checkInterval);
            result = status.output;
            setProgressPercent(90);
            handleResults(result);
          }
        } catch (error) {
          console.error("Error checking status:", error);
        }
      }, 2000);

      const handleResults = (result: any) => {
        setProgressPercent(95);

        const endTime = Date.now();
        setProcessingTime((endTime - startTime) / 1000);

        if (result?.video?.url) {
          setOutputVideoUrl(result.video.url);
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
                onValueChange={(value) => setSelectedEffect(value as EffectType)}
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
                Upload Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <Button
            onClick={applyEffect}
            disabled={!imagePreview || isProcessing}
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
                {progressPercent < 30 ? "Preparing image..." :
                 progressPercent < 50 ? "Sending to AI model..." :
                 progressPercent < 90 ? "Applying effect - this may take a few minutes..." :
                 "Finalizing..."}
              </p>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">
                <ImageIcon className="h-4 w-4 mr-2" />
                Input Image
              </TabsTrigger>
              <TabsTrigger value="output" disabled={!outputVideoUrl}>
                <Video className="h-4 w-4 mr-2" />
                Output Video
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="mt-2">
              {imagePreview ? (
                <div className="rounded-lg overflow-hidden aspect-video bg-slate-100 flex items-center justify-center">
                  <img 
                    src={imagePreview} 
                    alt="Input" 
                    className="max-w-full max-h-full object-contain" 
                  />
                </div>
              ) : (
                <div className="rounded-lg overflow-hidden aspect-video bg-slate-100 flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p>Upload an image to apply effects</p>
                </div>
              )}
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

          {!imagePreview && (
            <Alert>
              <AlertDescription>
                Upload an image to apply AI-powered effects. Transform your image into a video with different effects like squish, inflate, cakeify, and more.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoEffects;
