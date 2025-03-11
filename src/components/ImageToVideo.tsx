
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { CheckCircle, Loader2, Upload, Play, Pause, Video } from "lucide-react";

// Mock function, in production you'd use actual API key
fal.config({
  credentials: "YOUR_FAL_KEY" // This should be set by server environment in production
});

const ImageToVideo = () => {
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

      // In a real app, you'd upload to fal.ai storage
      // For demo, we'll just use the local preview
      setTimeout(() => {
        setImageUrl(imagePreview);
        setIsUploading(false);
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      }, 1500);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  const generateVideo = async () => {
    if (!imagePreview || !prompt.trim()) {
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
      // For demo purposes, we're not actually calling the API
      // In a real app, you would make the API call here
      
      // Simulate API call with logs
      setGenerationLogs(prev => [...prev, "Initializing model..."]);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setGenerationLogs(prev => [...prev, "Processing input image..."]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationLogs(prev => [...prev, "Generating video frames..."]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGenerationLogs(prev => [...prev, "Enhancing frame quality..."]);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setGenerationLogs(prev => [...prev, "Creating final video..."]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Sample video URL for demo
      const sampleVideoUrl = "https://v3.fal.media/files/elephant/Nj4jZupkZvR7g0QkNueJZ_video-1740522225.mp4";
      setVideoUrl(sampleVideoUrl);
      
      toast({
        title: "Success",
        description: "Video generated successfully!",
      });
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
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
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
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe how you want the image to animate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
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
              disabled={isLoading || !imagePreview || !prompt.trim()}
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
                  style={{ width: `${Math.min(generationLogs.length * 20, 100)}%` }}
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
