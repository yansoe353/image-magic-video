import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Film, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useVideoControls } from "@/hooks/useVideoControls";
import VideoPreview from "@/components/VideoPreview";
import { generateVideoFromImage } from "@/hooks/useFalClient";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { incrementVideoCount } from "@/utils/usageTracker";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";

interface ImageToVideoProps {
  initialImageUrl: string | null;
  onVideoGenerated: (videoUrl: string) => void;
  onSwitchToEditor: () => void;
}

const presetNegativePrompts = [
  "blurry, low quality, distorted, bad anatomy, worst quality, poorly drawn",
  "low contrast, noisy, pixelated, bad lighting",
  "extra limbs, extra fingers, mutated, ugly, messy background",
];

const ImageToVideo: React.FC<ImageToVideoProps> = ({
  initialImageUrl,
  onVideoGenerated,
  onSwitchToEditor,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null);
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>(presetNegativePrompts[0]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    try {
      const result = await generateVideoFromImage({
        imageUrl,
        prompt,
        negativePrompt,
        motion_strength: 2.8,
        guidance_scale: 30,
        num_frames: 24,
        fps: 12,
        seed: Math.floor(Math.random() * 100000),
      });

      if (result.success && result.videoUrl) {
        setGeneratedVideoUrl(result.videoUrl);
        onVideoGenerated(result.videoUrl);

        const userId = await getUserId();
        if (userId) {
          await supabase.from("user_content_history").insert({
            user_id: userId,
            content_type: "video",
            content_url: result.videoUrl,
            prompt,
            is_public: isPublic,
            metadata: {
              model: "fal-ai/ltx-video/image-to-video",
              negative_prompt: negativePrompt,
            },
          });
        }

        await incrementVideoCount();

        toast({
          title: "Success",
          description: "Video generated successfully!",
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
              <Input
                id="prompt"
                placeholder="e.g., A futuristic cityscape"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                Describe the video style you want to generate
              </p>
            </div>

            <div>
              <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
              <select
                className="w-full mb-2 border rounded px-3 py-2 text-sm bg-white text-black"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              >
                {presetNegativePrompts.map((preset, idx) => (
                  <option key={idx} value={preset}>
                    {preset}
                  </option>
                ))}
              </select>
              <Input
                id="negativePrompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="mb-1"
              />
              <p className="text-xs text-slate-500">
                You can pick a preset or enter your own custom negative prompt
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
                  Generating Video...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Video
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
