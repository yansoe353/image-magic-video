
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
import VideoEditor from "./VideoEditor";

// Initialize fal.ai client with proper environment variable handling for browser
try {
  const apiKey = localStorage.getItem("falApiKey") || "";
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
  const [showEditor, setShowEditor] = useState(false);
  
  // Add the missing state variables for video generation parameters
  const [resolution, setResolution] = useState<string>("480p");
  const [fps, setFps] = useState<number>(15);
  const [frames, setFrames] = useState<number>(81);
  const [numInferenceSteps, setNumInferenceSteps] = useState<number>(25);
  
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCounts());
  
  // Update counts when component mounts
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

  const generateVideo = async () => {
    if (!imageUrl || !prompt.trim()) {
      toast({
        title: "Error",
        description: "Please upload an image and provide a prompt",
        variant: "destructive",
      });
      return;
    }

    // Check usage limits
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
      
      const result = await fal.subscribe("fal-ai/wan-i2v", {
        input: {
          prompt: promptToUse,
          image_url: imageUrl,
          num_frames: frames,
          frames_per_second: fps,
          resolution: resolution as "480p" | "720p",
          num_inference_steps: numInferenceSteps,
          enable_safety_checker: true
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
        setVideoUrl(result.data.video.url);
        
        // Increment usage count
        if (await incrementVideoCount()) {
          toast({
            title: "Success",
            description: "Video generated successfully!",
          });
          // Update counts after successful generation
          const freshCounts = await getRemainingCountsAsync();
          setCounts(freshCounts);
        } else {
          toast({
            title: "Usage Tracking Error",
            description: "Failed to update usage count.",
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
                <Label htmlFor="resolution">Resolution</Label>
                <Select value={resolution} onValueChange={setResolution}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="fps">Frames Per Second: {fps}</Label>
                <Slider
                  value={[fps]}
                  min={5}
                  max={24}
                  step={1}
                  onValueChange={(values) => setFps(values[0])}
                  className="py-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="frames">Frames: {frames}</Label>
                <Slider
                  value={[frames]}
                  min={81}
                  max={100}
                  step={1}
                  onValueChange={(values) => setFrames(values[0])}
                  className="py-2"
                />
              </div>
              
              <div>
                <Label htmlFor="steps">Inference Steps: {numInferenceSteps}</Label>
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
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditor(!showEditor)}
                >
                  {showEditor ? "Hide Editor" : "Edit Video"}
                </Button>
              )}
            </div>
            <VideoPreview
              videoUrl={videoUrl}
              isLoading={isLoading}
              generationLogs={generationLogs}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
            />
          </CardContent>
        </Card>

        {showEditor && videoUrl && (
          <VideoEditor generatedVideoUrl={videoUrl} />
        )}
      </div>
    </div>
  );
};

export default ImageToVideo;
