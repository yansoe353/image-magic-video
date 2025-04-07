import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Film, Loader2, Upload, Bug, Info } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type VideoModel = 'ltx' | 'kling';

const MODEL_CREDITS = {
  ltx: 1,
  kling: 8
};

const MODEL_DETAILS = {
  ltx: {
    name: "LTX Video",
    description: "Fast generation (2-5 sec), good for quick iterations",
  },
  kling: {
    name: "Kling Video",
    description: "High quality generation (5-15 sec), cinematic results",
  }
};

interface ImageToVideoProps {
  initialImageUrl: string | null;
  onVideoGenerated: (videoUrl: string) => void;
  onSwitchToEditor: () => void;
}

const ImageToVideo: React.FC<ImageToVideoProps> = ({ 
  initialImageUrl, 
  onVideoGenerated,
  onSwitchToEditor
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<VideoModel>('ltx');
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
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

  const handleGenerateVideo = async () => {
    if (!imageUrl) {
      setError("Please upload an image first.");
      return;
    }

    if (!prompt) {
      setError("Please enter a prompt for the video generation.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGenerationLogs([]);

    try {
      const result = await generateVideoFromImage({
        imageUrl: imageUrl,
        prompt: prompt,
        negativePrompt: negativePrompt,
        model: selectedModel,
        options: {
          logs: true,
          onQueueUpdate: (update) => {
            if (update.logs) {
              const newLogs = update.logs.map(log => log.message);
              setGenerationLogs(prev => [...prev, ...newLogs]);
            }
          }
        }
      });

      if (result.success && result.videoUrl) {
        setGeneratedVideoUrl(result.videoUrl);
        onVideoGenerated(result.videoUrl);

        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: result.videoUrl,
            prompt: prompt,
            is_public: isPublic,
            metadata: {
              model: selectedModel === 'ltx' ? 'fal-ai/ltx-video' : 'fal-ai/kling-video',
              negative_prompt: negativePrompt,
              logs: generationLogs,
              success: true
            }
          });
        }

        await incrementVideoCount(MODEL_CREDITS[selectedModel]);

        toast({
          title: "Success",
          description: `Video generated successfully using ${MODEL_DETAILS[selectedModel].name}!`,
        });
      } else {
        const errorMessage = result.error || "Failed to generate video.";
        setError(errorMessage);
        
        // Log failed attempt
        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            prompt: prompt,
            is_public: isPublic,
            metadata: {
              model: selectedModel === 'ltx' ? 'fal-ai/ltx-video' : 'fal-ai/kling-video',
              negative_prompt: negativePrompt,
              logs: generationLogs,
              success: false,
              error: errorMessage
            }
          });
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || "Failed to generate video. Please try again.";
      setError(errorMessage);
      
      // Log error
      const userId = await getUserId();
      if (userId) {
        await supabase.from('user_content_history').insert({
          user_id: userId,
          content_type: 'video',
          prompt: prompt,
          is_public: isPublic,
          metadata: {
            model: selectedModel === 'ltx' ? 'fal-ai/ltx-video' : 'fal-ai/kling-video',
            negative_prompt: negativePrompt,
            logs: generationLogs,
            success: false,
            error: errorMessage
          }
        });
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Film className="mr-2 h-6 w-6" />
            Image to Video
          </h2>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <Bug className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                {selectedModel === 'kling' && (
                  <div className="mt-2">
                    <p className="text-sm">Kling model may fail with certain images. Try:</p>
                    <ul className="list-disc pl-5 text-sm">
                      <li>Using a different image</li>
                      <li>Simplifying your prompt</li>
                      <li>Switching to LTX model</li>
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {selectedModel === 'kling' && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Kling Model Notice</AlertTitle>
              <AlertDescription>
                The Kling model may take longer to generate videos and has higher failure rates with complex images.
                For more reliable results, try the LTX model first.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
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
                    {MODEL_DETAILS.ltx.name} - {MODEL_DETAILS.ltx.description} ({MODEL_CREDITS.ltx} credits)
                  </SelectItem>
                  <SelectItem value="kling">
                    {MODEL_DETAILS.kling.name} - {MODEL_DETAILS.kling.description} ({MODEL_CREDITS.kling} credits)
                  </SelectItem>
                </SelectContent>
              </Select>
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

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !imageUrl || !prompt}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video ({MODEL_CREDITS[selectedModel]} credits)...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Video ({MODEL_CREDITS[selectedModel]} credits)
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
              generationLogs={generationLogs}
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
