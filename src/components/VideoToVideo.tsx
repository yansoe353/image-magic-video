import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Video } from "lucide-react";
import VideoPreview from "@/components/VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import { falClient, isFalInitialized } from "@/hooks/useFalClient";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { incrementVideoCount } from "@/utils/usageTracker";
import { cn } from "@/lib/utils";

const VideoToVideo = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string>("");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [config, setConfig] = useState({
    numSteps: 25,
    duration: 8,
    cfgStrength: 4.5,
    seed: Math.floor(Math.random() * 1000000),
    maskAwayClip: false,
  });

  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith("video/")) {
        setError("Invalid file type. Please upload a video file.");
        toast({
          title: "Invalid file type",
          description: "Please upload a video file.",
          variant: "destructive",
        });
        return;
      }
      
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.type.startsWith("video/")) {
        setError("Invalid file type. Please upload a video file.");
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
    }
  };
  
  const checkRequestStatus = async (requestId: string) => {
    try {
      const status = await falClient.queue.status("fal-ai/mmaudio-v2", {
        requestId,
        logs: true,
      });
      
      if (status && status.logs && Array.isArray(status.logs)) {
        const newLogs = status.logs.map(log => log.message);
        setGenerationLogs(prev => [...prev, ...newLogs.filter(log => !prev.includes(log))]);
      }
      
      if (status.status === "COMPLETED") {
        const result = await falClient.queue.result("fal-ai/mmaudio-v2", { requestId });
        if (result.data?.video?.url) {
          handleGenerationSuccess(result.data.video.url);
        } else {
          throw new Error("No video URL in response");
        }
      } else if (status.status === "FAILED") {
        throw new Error("Video generation failed");
      } else if (status.status === "IN_PROGRESS" || status.status === "IN_QUEUE") {
        setTimeout(() => checkRequestStatus(requestId), 2000);
      }
    } catch (error) {
      handleGenerationError(error);
    }
  };
  
  const handleGenerationSuccess = async (resultUrl: string) => {
    setGeneratedVideoUrl(resultUrl);
    setProgress(100);
    
    const userId = await getUserId();
    if (userId) {
      await supabase.from('user_content_history').insert({
        user_id: userId,
        content_type: 'video',
        content_url: resultUrl,
        prompt: prompt,
        metadata: {
          model: 'fal-ai/mmaudio-v2',
          config: {
            ...config,
            negative_prompt: negativePrompt,
          }
        }
      });
    }
    
    await incrementVideoCount();
    
    toast({
      title: "Success",
      description: "Video generated successfully!",
    });
    
    setIsGenerating(false);
  };
  
  const handleGenerationError = (error: any) => {
    console.error("Video generation failed:", error);
    const errorMessage = error.message || "Failed to generate video. Please try again.";
    setError(errorMessage);
    setGenerationLogs(prev => [...prev, `Error: ${errorMessage}`]);
    
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    });
    
    setIsGenerating(false);
  };
  
  const handleGenerateVideo = async () => {
    if (!videoUrl) {
      setError("Please upload a video first.");
      return;
    }
    
    if (!prompt) {
      setError("Please enter a prompt for the video generation.");
      return;
    }

    if (!isFalInitialized) {
      toast({
        title: "API Key Required",
        description: "Please set your API key in the settings first",
        variant: "destructive",
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setGenerationLogs([]);
    setProgress(0);
    setRequestId(null);
    
    try {
      let uploadedVideoUrl = videoUrl;
      
      if (videoFile) {
        setGenerationLogs(prev => [...prev, "Uploading video file to fal.ai..."]);
        setIsUploading(true);
        
        try {
          uploadedVideoUrl = await falClient.storage.upload(videoFile);
          setGenerationLogs(prev => [...prev, "Video uploaded successfully."]);
        } catch (error) {
          console.error("Error uploading video:", error);
          throw new Error("Failed to upload video. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
      
      setGenerationLogs(prev => [...prev, "Starting video generation with fal.ai..."]);
      setProgress(10);
      
      const modelInput = {
        video_url: uploadedVideoUrl,
        prompt,
        negative_prompt: negativePrompt || "",
        num_steps: config.numSteps,
        duration: config.duration,
        cfg_strength: config.cfgStrength,
        seed: config.seed,
        mask_away_clip: config.maskAwayClip,
      };
      
      setGenerationLogs(prev => [...prev, "Submitting request to fal.ai..."]);
      setProgress(20);
      
      const result = await falClient.subscribe("fal-ai/mmaudio-v2", {
        input: modelInput,
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            const logs = update.logs.map((log) => log.message) || [];
            setGenerationLogs(prev => [...prev, ...logs.filter(log => !prev.includes(log))]);
            
            if (logs.some(log => log.includes("Generating"))) {
              setProgress(40);
            } else if (logs.some(log => log.includes("Processing"))) {
              setProgress(60);
            }
          }
        },
      });
      
      setRequestId(result.requestId);
      
      if (result.data?.video?.url) {
        await handleGenerationSuccess(result.data.video.url);
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error: any) {
      handleGenerationError(error);
    }
  };
  
  const handleConfigChange = <K extends keyof typeof config>(key: K, value: typeof config[K]) => {
    setConfig(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const handleGenerateRandomSeed = () => {
    handleConfigChange('seed', Math.floor(Math.random() * 1000000));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Video className="mr-2 h-6 w-6" />
            Video to Video Generation
          </h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUpload">Upload Video</Label>
              
              {!videoUrl ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Drag and drop a video file here, or click to select</p>
                  <input 
                    ref={videoInputRef}
                    type="file"
                    id="videoUpload"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    src={videoUrl} 
                    className="w-full h-full object-contain" 
                    controls 
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setVideoUrl("");
                      setVideoFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              
              <p className="text-xs text-slate-500 mt-1">
                Supported formats: MP4, WebM, AVI, MOV (max 50MB)
              </p>
            </div>
            
            <div>
              <Label htmlFor="prompt">Video Prompt</Label>
              <Input
                id="prompt"
                placeholder="e.g., 'A futuristic cityscape', 'Anime style animation', 'Watercolor painting coming to life'"
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
              <Input
                id="negativePrompt"
                placeholder="e.g., 'blurry', 'low quality', 'distorted'"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                Describe what you want to avoid in the generated video
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numSteps">Number of Steps: {config.numSteps}</Label>
                <Slider
                  id="numSteps"
                  value={[config.numSteps]}
                  min={10}
                  max={50}
                  step={1}
                  onValueChange={(value) => handleConfigChange('numSteps', value[0])}
                  className="my-2"
                />
                <p className="text-xs text-slate-500">
                  More steps = higher quality, but slower generation
                </p>
              </div>
              
              <div>
                <Label htmlFor="duration">Duration: {config.duration}s</Label>
                <Slider
                  id="duration"
                  value={[config.duration]}
                  min={1}
                  max={30}
                  step={0.5}
                  onValueChange={(value) => handleConfigChange('duration', value[0])}
                  className="my-2"
                />
                <p className="text-xs text-slate-500">
                  How long the generated video should be (in seconds)
                </p>
              </div>
              
              <div>
                <Label htmlFor="cfgStrength">CFG Strength: {config.cfgStrength}</Label>
                <Slider
                  id="cfgStrength"
                  value={[config.cfgStrength]}
                  min={1}
                  max={10}
                  step={0.1}
                  onValueChange={(value) => handleConfigChange('cfgStrength', value[0])}
                  className="my-2"
                />
                <p className="text-xs text-slate-500">
                  How closely to follow the prompt (higher = more precise)
                </p>
              </div>
              
              <div>
                <Label htmlFor="seed">Seed</Label>
                <div className="flex gap-2 my-2">
                  <Input
                    id="seed"
                    type="number"
                    value={config.seed}
                    onChange={(e) => handleConfigChange('seed', parseInt(e.target.value))}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleGenerateRandomSeed}
                    className="flex-shrink-0"
                  >
                    Random
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Use the same seed for reproducible results
                </p>
              </div>
              
              <div className="flex items-center space-x-2 col-span-2">
                <input
                  id="maskAwayClip"
                  type="checkbox"
                  checked={config.maskAwayClip}
                  onChange={(e) => handleConfigChange('maskAwayClip', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="maskAwayClip">Mask Away Original Content</Label>
              </div>
            </div>
            
            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !videoUrl || !prompt}
              className="w-full"
            >
              {isGenerating ? (
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

      {(isGenerating || generatedVideoUrl) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Video Preview</h3>
            
            {isGenerating && (
              <div className="mb-4">
                <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2">
                  <div 
                    className={cn("bg-brand-purple h-2.5 rounded-full", 
                      progress < 100 ? "animate-pulse" : ""
                    )} 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">
                  {isUploading ? "Uploading video..." : "Generating video..."}
                </p>
                
                <div className="mt-4 p-4 bg-slate-100 rounded-lg max-h-40 overflow-y-auto">
                  {generationLogs.map((log, index) => (
                    <p key={index} className="text-xs font-mono text-slate-700">
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}
            
            <VideoPreview
              videoUrl={generatedVideoUrl}
              isLoading={isGenerating}
              generationLogs={generationLogs}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoToVideo;
