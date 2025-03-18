import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { CheckCircle, Loader2, Upload, Play, Pause, Video, Download, Languages } from "lucide-react";
import { LANGUAGES, translateText } from "@/utils/translationUtils";

// Initialize fal.ai client
try {
  fal.config({
    // This would be replaced with an environment variable in production
    credentials: process.env.FAL_KEY || "fal_key_placeholder"
  });
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

interface ImageToVideoProps {
  initialImageUrl?: string | null;
}

const ImageToVideo = ({ initialImageUrl }: ImageToVideoProps) => {
  const [prompt, setPrompt] = useState("A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage.");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [frames, setFrames] = useState(81);
  const [fps, setFps] = useState(16);
  const [resolution, setResolution] = useState("720p");
  const [numInferenceSteps, setNumInferenceSteps] = useState(30);
  const [isUploading, setIsUploading] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Use effect to handle initialImageUrl changes
  useEffect(() => {
    if (initialImageUrl) {
      setImagePreview(initialImageUrl);
      setImageUrl(initialImageUrl);
    }
  }, [initialImageUrl]);

  // Handle video play/pause when isPlaying state changes
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(error => {
          console.error("Error playing video:", error);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, videoUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      // Create a preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload to fal.ai storage
      const uploadedUrl = await fal.storage.upload(file);
      setImageUrl(uploadedUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLanguageChange = async (language: LanguageOption) => {
    if (language === selectedLanguage || !prompt.trim()) {
      setSelectedLanguage(language);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translateText(prompt, selectedLanguage, language);
      setPrompt(translatedText);
      setSelectedLanguage(language);
      toast({
        title: "Prompt Translated",
        description: `Translated to ${LANGUAGES[language]}`,
      });
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate text",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
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

    setIsLoading(true);
    setGenerationLogs([]);
    
    try {
      setGenerationLogs(prev => [...prev, "Initializing model..."]);
      
      // Translate to English for better results if not already in English
      let promptToUse = prompt;
      if (selectedLanguage !== "en") {
        try {
          promptToUse = await translateText(prompt, selectedLanguage, "en");
          setGenerationLogs(prev => [...prev, "Translated prompt to English for better results."]);
        } catch (error) {
          console.error("Failed to translate to English:", error);
          // Continue with original prompt if translation fails
        }
      }
      
      // Call the Fal.ai API using subscribe for real-time updates
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
            // Add new logs to our state
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      // Set the video URL from the API response
      if (result.data && result.data.video && result.data.video.url) {
        setVideoUrl(result.data.video.url);
        toast({
          title: "Success",
          description: "Video generated successfully!",
        });
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

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = "generated-video.mp4";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Image to Video</h2>
          
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
              {isTranslating && (
                <div className="text-xs text-slate-500 mt-1 flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Translating...
                </div>
              )}
            </div>
            
            <div>
              <Label>Upload Image</Label>
              <div 
                className="border-2 border-dashed border-slate-200 rounded-lg p-4 mt-1 cursor-pointer text-center hover:bg-slate-50 transition-colors"
                onClick={triggerFileInput}
              >
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="h-40 object-contain mx-auto" 
                    />
                    <div className="absolute top-0 right-0 bg-white rounded-full p-1">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-10 w-10 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
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
              disabled={isLoading || !imagePreview || !prompt.trim() || isTranslating}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Video Preview</h2>

          {isLoading ? (
            <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center p-6 mb-4">
              <Loader2 className="h-10 w-10 text-brand-purple animate-spin mb-4" />
              <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 mb-2">
                <div 
                  className="bg-brand-purple h-2.5 rounded-full animate-pulse-opacity" 
                  style={{ width: `${Math.min(generationLogs.length * 10, 100)}%` }}
                ></div>
              </div>
              <div className="text-slate-600 text-sm mt-2 text-center">
                {generationLogs.length > 0 && generationLogs[generationLogs.length - 1]}
              </div>
            </div>
          ) : videoUrl ? (
            <div className="space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls={false}
                  autoPlay
                  loop
                  muted
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={handlePlayPause}>
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Video
                </Button>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <div className="text-slate-400 flex flex-col items-center">
                <Video className="h-12 w-12 mb-2" />
                <span className="text-center">Your video will appear here</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageToVideo;
