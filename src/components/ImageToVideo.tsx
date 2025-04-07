import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Film, Loader2, Upload, Camera, Move3d, ZoomIn } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import VideoPreview from "@/components/VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import { generateVideoFromImage } from "@/hooks/useFalClient";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { incrementVideoCount } from "@/utils/usageTracker";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { fal } from "@fal-ai/client";

// Initialize the fal.ai client with the API keyS
try {
  fal.config({
    credentials: 'd2c88ea6-dfa3-48d5-ae0e-40cdada5cc21:a8774078d2a121d5c023aad82e9a2ec5', // Replace with your actual API key
  });
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

type VideoModel = 'ltx' | 'kling';
type AspectRatio = "16:9" | "9:16" | "1:1";
type Duration = 5 | 10;
type CameraControl = "down_back" | "forward_up" | "right_turn_forward" | "left_turn_forward";

interface ImageToVideoProps {
  initialImageUrl: string | null;
  onVideoGenerated: (videoUrl: string, model: VideoModel) => void;
  onSwitchToEditor: () => void;
  userCredits: number;
}

const MODEL_CREDITS = {
  ltx: 1,
  kling: 8,
};

const MODEL_DETAILS = {
  ltx: {
    name: "LTX Video",
    description: "Fast generation (2-5 sec), good for quick iterations",
    credits: MODEL_CREDITS.ltx
  },
  kling: {
    name: "Kling Standard",
    description: "High quality generation (5-15 sec), cinematic results",
    credits: MODEL_CREDITS.kling
  },
};

const ImageToVideo: React.FC<ImageToVideoProps> = ({
  initialImageUrl,
  onVideoGenerated,
  onSwitchToEditor,
  userCredits
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<VideoModel>('ltx');
  const [duration, setDuration] = useState<Duration>(5);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [cfgScale, setCfgScale] = useState<number>(0.5);
  const [cameraControl, setCameraControl] = useState<CameraControl>("forward_up");
  const [zoomValue, setZoomValue] = useState<number>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();

  useEffect(() => {
    setImageUrl(initialImageUrl || null);
  }, [initialImageUrl]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCurrentModelDetails = () => {
    return MODEL_DETAILS[selectedModel];
  };

  const handleGenerateVideo = async () => {
    if (!imageUrl) {
      setError("Please upload an image first.");
      return;
    }

    if (!prompt) {
      setError("Please enter a prompt for the video generation.");
      return;
    }

    const modelDetails = getCurrentModelDetails();
    if (userCredits < modelDetails.credits) {
      setError(`Not enough credits. This generation requires ${modelDetails.credits} credits.`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateVideoFromImage({
        imageUrl: imageUrl,
        prompt: prompt,
        negativePrompt: negativePrompt,
        model: selectedModel,
        modelParams: {
          duration: duration,
          aspect_ratio: aspectRatio,
          cfg_scale: cfgScale,
          ...(selectedModel === 'kling' ? {
            camera_control: cameraControl,
            advanced_camera_control: {
              movement_type: "zoom",
              movement_value: zoomValue
            }
          } : {})
        },
        options: {
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              console.log("Generation progress:", update.logs);
            }
          }
        }
      });

      if (result.success && result.videoUrl) {
        setGeneratedVideoUrl(result.videoUrl);
        onVideoGenerated(result.videoUrl, selectedModel);

        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: result.videoUrl,
            prompt: prompt,
            is_public: isPublic,
            metadata: {
              model: selectedModel === 'ltx' ? 'fal-ai/ltx-video' : 'fal-ai/kling-video/v1/standard/image-to-video',
              negative_prompt: negativePrompt,
              duration: duration,
              aspect_ratio: aspectRatio,
              credits_used: modelDetails.credits
            }
          });
        }

        await incrementVideoCount(modelDetails.credits);

        toast({
          title: "Success",
          description: `Video generated successfully using ${modelDetails.name}!`,
        });
      } else {
        setError(result.error || "Failed to generate video.");
        toast({
          title: "Error",
          description: result.error || "Failed to generate video.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setError(error.message || "Failed to generate video. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const modelDetails = getCurrentModelDetails();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Film className="mr-2 h-6 w-6" />
            Image to Video
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Generation Model</Label>
                <Select
                  value={selectedModel}
                  onValueChange={(value: VideoModel) => setSelectedModel(value)}
                  disabled={isGenerating}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltx">
                      {MODEL_DETAILS.ltx.name} - {MODEL_DETAILS.ltx.description} ({MODEL_DETAILS.ltx.credits} credits)
                    </SelectItem>
                    <SelectItem value="kling">
                      {MODEL_DETAILS.kling.name} - {MODEL_DETAILS.kling.description} ({MODEL_DETAILS.kling.credits} credits)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="imageUpload">Upload Image</Label>
              <Input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>

            {imageUrl && (
              <div className="relative aspect-square rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                <img
                  src={imageUrl}
                  alt="Uploaded"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <Label htmlFor="prompt">Video Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="e.g., 'A futuristic cityscape', 'Anime style animation', 'Watercolor painting coming to life'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mb-2 min-h-[100px]"
              />
              <p className="text-xs text-slate-500">
                Describe the video style you want to generate
              </p>
            </div>

            <div>
              <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
              <Textarea
                id="negativePrompt"
                placeholder="e.g., 'blurry', 'low quality', 'distorted'"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="mb-2 min-h-[80px]"
              />
              <p className="text-xs text-slate-500">
                Describe what you want to avoid in the generated video
              </p>
            </div>

            {selectedModel === 'kling' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Duration (seconds)</Label>
                    <Select
                      value={duration.toString()}
                      onValueChange={(value) => setDuration(parseInt(value) as Duration)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 seconds</SelectItem>
                        <SelectItem value="10">10 seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Aspect Ratio</Label>
                    <Select
                      value={aspectRatio}
                      onValueChange={(value: AspectRatio) => setAspectRatio(value)}
                      disabled={isGenerating}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <span>CFG Scale: {cfgScale}</span>
                  </Label>
                  <Slider
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={[cfgScale]}
                    onValueChange={([value]) => setCfgScale(value)}
                    disabled={isGenerating}
                  />
                  <p className="text-xs text-slate-500">
                    Controls how closely the video follows your prompt (higher = more strict)
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Advanced Camera Controls</Label>
                    <Switch
                      checked={showAdvanced}
                      onCheckedChange={setShowAdvanced}
                    />
                  </div>

                  {showAdvanced && (
                    <div className="space-y-4 p-4 border rounded-lg">
                      <div>
                        <Label className="flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Camera Movement
                        </Label>
                        <Select
                          value={cameraControl}
                          onValueChange={(value: CameraControl) => setCameraControl(value)}
                          disabled={isGenerating}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select camera movement" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="forward_up">Forward & Up</SelectItem>
                            <SelectItem value="down_back">Down & Back</SelectItem>
                            <SelectItem value="right_turn_forward">Right Turn Forward</SelectItem>
                            <SelectItem value="left_turn_forward">Left Turn Forward</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          <ZoomIn className="h-4 w-4" />
                          Zoom Intensity: {zoomValue}
                        </Label>
                        <Slider
                          min={0.5}
                          max={3}
                          step={0.1}
                          value={[zoomValue]}
                          onValueChange={([value]) => setZoomValue(value)}
                          disabled={isGenerating}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            <div className="flex items-center justify-between p-3 bg-slate-100 rounded-lg">
              <span className="text-sm font-medium">Credits required: {modelDetails.credits}</span>
              <span className="text-sm font-medium">Your credits: {userCredits}</span>
            </div>

            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !imageUrl || !prompt || userCredits < modelDetails.credits}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video ({modelDetails.credits} credits)...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Video ({modelDetails.credits} credits)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedVideoUrl && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Video Preview</h3>
            <VideoPreview
              videoUrl={generatedVideoUrl}
              isLoading={isGenerating}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
              generationLogs={[]}
            />
            <Button onClick={onSwitchToEditor} className="w-full mt-4">
              Edit Video
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageToVideo;
