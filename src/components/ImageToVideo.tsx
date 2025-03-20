import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { Languages, AlertCircle } from "lucide-react";
import { LANGUAGES, translateText, type LanguageOption } from "@/utils/translationUtils";
import { useVideoControls } from "@/hooks/useVideoControls";
import { usePromptTranslation } from "@/hooks/usePromptTranslation";
import { incrementVideoCount, getRemainingCounts, getRemainingCountsAsync, VIDEO_LIMIT } from "@/utils/usageTracker";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ImageUploader from "./ImageUploader";
import VideoPreview from "./VideoPreview";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";

// Initialize fal.ai client with proper environment variable handling for browser
try {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (apiKey) {
    fal.config({
      credentials: apiKey
    });
  }
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

interface ImageToVideoProps {
  initialImageUrl?: string | null;
}

const ImageToVideo = ({ initialImageUrl }: ImageToVideoProps) => {
  const { prompt, setPrompt, selectedLanguage, isTranslating, handleLanguageChange } =
    usePromptTranslation("A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage.");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [originalVideoUrl, setOriginalVideoUrl] = useState("");
  const [supabaseVideoUrl, setSupabaseVideoUrl] = useState("");
  const [isStoringVideo, setIsStoringVideo] = useState(false);

  const [duration, setDuration] = useState<string>("5");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [negativePrompt, setNegativePrompt] = useState<string>("blur, distort, and low quality");
  const [cfgScale, setCfgScale] = useState<number>(0.5);

  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCounts());

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    updateCounts();
  }, []);

  useEffect(() => {
    if (initialImageUrl) {
      setImagePreview(initialImageUrl);
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  const saveToHistory = async (videoUrl: string, originalUrl: string) => {
    if (!isLoggedIn()) return;

    try {
      const userId = await getUserId();
      if (!userId) {
        console.error("No user ID found");
        return;
      }

      const { error } = await supabase
        .from('user_content_history')
        .insert({
          user_id: userId,
          content_type: 'video',
          content_url: videoUrl,
          prompt: prompt,
          metadata: {
            duration,
            aspectRatio,
            negativePrompt,
            cfgScale,
            original_url: originalUrl
          }
        });

      if (error) {
        console.error("Error saving to history:", error);
      } else {
        console.log("Successfully saved video to history");
      }
    } catch (err) {
      console.error("Failed to save to history:", err);
    }
  };

  const generateVideo = async () => {
    if (!imageUrl || !prompt.trim()) {
      toast({
        title: "Error",
        description: "Please upload an image and provide a prompt",
        variant: "destructive",
      });
      return;
    }

    if (counts.remainingVideos <= 0) {
      toast({
        title: "Usage Limit Reached",
        description: `You've reached the limit of ${VIDEO_LIMIT} video generations.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setGenerationLogs([]);

    try {
      setGenerationLogs(prev => [...prev, "Initializing model..."]);

      let promptToUse = prompt;
      if (selectedLanguage !== "en") {
        try {
          promptToUse = await translateText(prompt, selectedLanguage, "en");
          setGenerationLogs(prev => [...prev, "Translated prompt to English for better results."]);
        } catch (error) {
          console.error("Failed to translate to English:", error);
        }
      }

      const result = await fal.subscribe("fal-ai/kling-video/v1.6/standard/image-to-video", {
        input: {
          prompt: promptToUse,
          image_url: imageUrl,
          duration: duration as "5" | "10",
          aspect_ratio: aspectRatio as "16:9" | "9:16" | "1:1",
          negative_prompt: negativePrompt,
          cfg_scale: cfgScale,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });

      if (result.data?.video?.url) {
        const falVideoUrl = result.data.video.url;
        setOriginalVideoUrl(falVideoUrl);
        setVideoUrl(""); // Clear any existing URL

        setIsStoringVideo(true);
        try {
          const userId = await getUserId();
          const supabaseUrl = await uploadUrlToStorage(falVideoUrl, 'video', userId);
          setSupabaseVideoUrl(supabaseUrl);
          setVideoUrl(supabaseUrl); // Set the Supabase URL as the video URL

          await saveToHistory(supabaseUrl, falVideoUrl);

          toast({
            title: "Video Stored",
            description: "Video uploaded to your storage",
          });
        } catch (uploadError) {
          console.error("Failed to upload to Supabase:", uploadError);
          setVideoUrl(falVideoUrl);
          await saveToHistory(falVideoUrl, falVideoUrl);
        } finally {
          setIsStoringVideo(false);
        }

        if (await incrementVideoCount()) {
          toast({
            title: "Success",
            description: "Video generated successfully!",
          });
          const freshCounts = await getRemainingCountsAsync();
          setCounts(freshCounts);
        } else {
          toast({
            title: "Usage Limit Reached",
            description: "You've reached your video generation limit.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Image to Video</h2>

          {counts.remainingVideos <= 5 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Usage Limit Warning</AlertTitle>
              <AlertDescription>
                You have {counts.remainingVideos} video generation{counts.remainingVideos === 1 ? '' : 's'} remaining.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Select
                  value={selectedLanguage}
                  onValueChange={(value: LanguageOption) => handleLanguageChange(value)}
                  disabled={isTranslating}
                >
                  <SelectTrigger className="h-7 w-36">
                    <Languages className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                id="prompt"
                placeholder="Describe how you want the image to animate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
                disabled={isTranslating}
              />
            </div>

            <ImageUploader
              imagePreview={imagePreview}
              setImagePreview={setImagePreview}
              setImageUrl={setImageUrl}
              isUploading={isUploading}
              setIsUploading={setIsUploading}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="aspectRatio">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="negativePrompt">Negative Prompt</Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="Enter negative prompt..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[50px]"
                />
              </div>

              <div>
                <Label htmlFor="cfgScale">CFG Scale</Label>
                <Slider
                  value={[cfgScale]}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  onValueChange={(values) => setCfgScale(values[0])}
                  className="py-2"
                />
              </div>
            </div>

            <Button
              onClick={generateVideo}
              disabled={isLoading || !imagePreview || !prompt.trim() || isTranslating || counts.remainingVideos <= 0}
              className="w-full"
            >
              Generate Video
            </Button>

            {counts.remainingVideos > 0 && (
              <p className="text-xs text-slate-500 text-center">
                {counts.remainingVideos} of {VIDEO_LIMIT} video generations remaining
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Video Preview</h2>
              {videoUrl && (
                <Button variant="outline" disabled>
                  Edit Video (Coming Soon)
                </Button>
              )}
            </div>
            <VideoPreview
              videoUrl={supabaseVideoUrl || videoUrl}
              isLoading={isLoading || isStoringVideo}
              generationLogs={generationLogs}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
              isStoring={isStoringVideo}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageToVideo;
