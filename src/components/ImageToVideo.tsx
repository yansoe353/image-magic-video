
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
import { checkVideoCredits, getRemainingCredits, getRemainingCreditsAsync, DEFAULT_VIDEO_CREDITS } from "@/utils/usageTracker";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import ImageUploader from "./ImageUploader";
import VideoPreview from "./VideoPreview";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import ProLabel from "./ProLabel";
import KlingAILabel from "./KlingAILabel";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { LTXVideoInput } from "@/hooks/useFalClient";

// Initialize fal.ai client with proper environment variable handling for browser
try {
  const apiKey = import.meta.env.VITE_FAL_API_KEY || localStorage.getItem("falApiKey");
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
  onVideoGenerated?: (videoUrl: string) => void;
  onSwitchToEditor?: (videoUrl: string) => void;
}

const ImageToVideo = ({ initialImageUrl, onVideoGenerated, onSwitchToEditor }: ImageToVideoProps) => {
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
  const [isPublic, setIsPublic] = useState(false);

  const [duration] = useState<string>("5");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [negativePrompt, setNegativePrompt] = useState<string>("low quality, worst quality, deformed, distorted, disfigured, motion smear, motion artifacts, fused fingers, bad anatomy, weird hand, ugly");
  const [guidanceScale, setGuidanceScale] = useState<number>(8.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState<number>(50);
  const [motionBucketId, setMotionBucketId] = useState<number>(127);

  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCredits());

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCreditsAsync();
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

  const resizeImageToAspectRatio = async (imageUrl: string, aspectRatio: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        let targetWidth = img.width;
        let targetHeight = img.height;

        // Calculate target dimensions based on aspect ratio
        const [ratioW, ratioH] = aspectRatio.split(':').map(Number);
        const targetRatio = ratioW / ratioH;
        const currentRatio = img.width / img.height;

        if (currentRatio > targetRatio) {
          // Image is wider than target aspect ratio
          targetWidth = img.height * targetRatio;
        } else {
          // Image is taller than target aspect ratio
          targetHeight = img.width / targetRatio;
        }

        // Set canvas dimensions
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw image centered and cropped to aspect ratio
        ctx.drawImage(
          img,
          (img.width - targetWidth) / 2,
          (img.height - targetHeight) / 2,
          targetWidth,
          targetHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );

        // Convert to data URL
        const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(resizedImageUrl);
      };

      img.onerror = () => {
        resolve(imageUrl); // Fallback to original if resizing fails
      };
    });
  };

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
          is_public: isPublic,
          metadata: {
            duration,
            aspectRatio,
            negativePrompt,
            guidanceScale,
            model: "fal-ai/ltx-video/image-to-video",
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

    if (counts.videoCredits <= 0) {
      toast({
        title: "No Credits",
        description: "You've used all your video generation credits. Please purchase more to continue.",
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

      // Resize image to match selected aspect ratio
      setGenerationLogs(prev => [...prev, `Resizing image to ${aspectRatio} aspect ratio...`]);
      const resizedImageUrl = await resizeImageToAspectRatio(imageUrl, aspectRatio);

      setGenerationLogs(prev => [...prev, "Sending request to fal.ai/ltx-video..."]);
      
      // Create the input object
      const input: LTXVideoInput = {
        image_url: resizedImageUrl,
        prompt: promptToUse,
        negative_prompt: negativePrompt,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        motion_bucket_id: motionBucketId
      };
      
      const result = await fal.subscribe("fal-ai/ltx-video/image-to-video", {
        input,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
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
          const supabaseUrl = await uploadUrlToStorage(falVideoUrl, 'video', userId, isPublic);
          setSupabaseVideoUrl(supabaseUrl);
          setVideoUrl(supabaseUrl); // Set the Supabase URL as the video URL

          await saveToHistory(supabaseUrl, falVideoUrl);

          if (onVideoGenerated) {
            onVideoGenerated(supabaseUrl);
          }

          toast({
            title: "Video Stored",
            description: "Video uploaded to your storage",
          });
        } catch (uploadError) {
          console.error("Failed to upload to Supabase:", uploadError);
          setVideoUrl(falVideoUrl);
          
          if (onVideoGenerated) {
            onVideoGenerated(falVideoUrl);
          }
          
          await saveToHistory(falVideoUrl, falVideoUrl);
        } finally {
          setIsStoringVideo(false);
        }

        if (await checkVideoCredits()) {
          toast({
            title: "Success",
            description: "Video generated successfully!",
          });
          const freshCounts = await getRemainingCreditsAsync();
          setCounts(freshCounts);
        } else {
          toast({
            title: "Last Credit Used",
            description: "You've used your last video generation credit.",
            variant: "default"
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
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Image to Video</h2>
            <ProLabel />
            <KlingAILabel />
          </div>

          {counts.videoCredits <= 5 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Credit Warning</AlertTitle>
              <AlertDescription>
                You have {counts.videoCredits} video generation credit{counts.videoCredits === 1 ? '' : 's'} remaining.
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

              <div>
                <Label htmlFor="motionBucketId">Motion Intensity: {motionBucketId}</Label>
                <Slider
                  value={[motionBucketId]}
                  min={1}
                  max={255}
                  step={1}
                  onValueChange={(values) => setMotionBucketId(values[0])}
                  className="py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="guidanceScale">Guidance Scale: {guidanceScale}</Label>
                <Slider
                  value={[guidanceScale]}
                  min={1}
                  max={15}
                  step={0.5}
                  onValueChange={(values) => setGuidanceScale(values[0])}
                  className="py-2"
                />
              </div>

              <div>
                <Label htmlFor="numInferenceSteps">Inference Steps: {numInferenceSteps}</Label>
                <Slider
                  value={[numInferenceSteps]}
                  min={10}
                  max={50}
                  step={1}
                  onValueChange={(values) => setNumInferenceSteps(values[0])}
                  className="py-2"
                />
              </div>
            </div>

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

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isLoading}
            />

            <Button
              onClick={generateVideo}
              disabled={isLoading || !imagePreview || !prompt.trim() || isTranslating || counts.videoCredits <= 0}
              className="w-full"
            >
              Generate Video
            </Button>

            {counts.videoCredits > 0 && (
              <p className="text-xs text-slate-500 text-center">
                {counts.videoCredits} of {DEFAULT_VIDEO_CREDITS} video generation credits remaining
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
                <Button 
                  variant="outline" 
                  onClick={() => onSwitchToEditor && onSwitchToEditor(videoUrl)}
                >
                  Edit in Video Editor
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
