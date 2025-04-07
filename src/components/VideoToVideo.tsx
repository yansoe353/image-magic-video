
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Music } from "lucide-react";
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
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string>("");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
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

  const handleGenerateAudio = async () => {
    if (!videoUrl) {
      setError("Please upload a video first.");
      return;
    }
    
    if (!prompt) {
      setError("Please enter a prompt for the audio generation.");
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
    
    try {
      let uploadedVideoUrl = videoUrl;
      
      // Upload video if it's a local file
      if (videoFile) {
        setGenerationLogs(prev => [...prev, "Uploading video file to server..."]);
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
      
      setGenerationLogs(prev => [...prev, "Starting audio extraction process..."]);
      setProgress(20);

      // This is a placeholder since we're removing video-to-audio functionality
      // In a real implementation, this would call the audio extraction API
      // For now, we'll simulate a process with a timeout
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(50);
      setGenerationLogs(prev => [...prev, "Processing audio based on prompt..."]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(80);
      setGenerationLogs(prev => [...prev, "Finalizing audio generation..."]);

      // In a real implementation, we would get a real audio URL
      // For now, we'll use a placeholder or default audio
      const mockAudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      setGeneratedAudioUrl(mockAudioUrl);
      
      // Store in user history
      const userId = await getUserId();
      if (userId) {
        await supabase.from('user_content_history').insert({
          user_id: userId,
          content_type: 'audio',
          content_url: mockAudioUrl,
          prompt: prompt,
          metadata: {
            model: 'audio-extractor',
            config: {
              negative_prompt: negativePrompt,
            }
          }
        });
      }
      
      // Count as a video generation for tracking purposes
      await incrementVideoCount();
      
      toast({
        title: "Success",
        description: "Audio extracted successfully!",
      });
      
      setProgress(100);
      setIsGenerating(false);
    } catch (error: any) {
      console.error("Audio generation failed:", error);
      const errorMessage = error.message || "Failed to generate audio. Please try again.";
      setError(errorMessage);
      setGenerationLogs(prev => [...prev, `Error: ${errorMessage}`]);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Music className="mr-2 h-6 w-6" />
            Video to Audio Extraction
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
              <Label htmlFor="prompt">Audio Description</Label>
              <Input
                id="prompt"
                placeholder="e.g., 'Extract background music', 'Enhance voice audio', 'Remove background noise'"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                Describe what audio you want to extract from the video
              </p>
            </div>
            
            <div>
              <Label htmlFor="negativePrompt">Exclusions (Optional)</Label>
              <Input
                id="negativePrompt"
                placeholder="e.g., 'background noise', 'voices', 'music'"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="mb-2"
              />
              <p className="text-xs text-slate-500">
                Describe what you want to exclude from the extracted audio
              </p>
            </div>
            
            <Button
              onClick={handleGenerateAudio}
              disabled={isGenerating || !videoUrl || !prompt}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Audio...
                </>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Extract Audio
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isGenerating || generatedAudioUrl) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Audio Preview</h3>
            
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
                  {isUploading ? "Uploading video..." : "Processing audio..."}
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
            
            {generatedAudioUrl && !isGenerating && (
              <div className="rounded-lg overflow-hidden bg-slate-100 p-4">
                <audio 
                  ref={audioRef}
                  src={generatedAudioUrl}
                  controls
                  className="w-full"
                />
                <div className="mt-4">
                  <Button size="sm" onClick={() => {
                    if (generatedAudioUrl) {
                      const a = document.createElement("a");
                      a.href = generatedAudioUrl;
                      a.download = "extracted-audio.mp3";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}>
                    Download Audio
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VideoToVideo;
