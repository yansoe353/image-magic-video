import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ApiKeyDialog } from "@/components/api-key/ApiKeyDialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ImageIcon, Film } from "lucide-react";
import ImageUploader from "./ImageUploader";
import VideoPreview from "./VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import { useAiVideoApi } from "@/hooks/useAiVideoApi";
import { getRemainingCounts } from "@/utils/usageTracker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";

interface ImageToVideoProps {
  initialImageUrl?: string | null;
  onVideoGenerated?: (videoUrl: string) => void;
  onSwitchToEditor?: () => void;
}

const ImageToVideo = ({ initialImageUrl, onVideoGenerated, onSwitchToEditor }: ImageToVideoProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [prompt, setPrompt] = useState("");
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [motion, setMotion] = useState<number>(5);
  const [videoDuration, setVideoDuration] = useState<number>(5);
  const [imageAsEndFrame, setImageAsEndFrame] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [isPublic, setIsPublic] = useState(false);
  const [model, setModel] = useState<string>("gen3");
  
  const { generateVideo, isGenerating, progress, videoUrl, error } = useAiVideoApi();
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  
  const counts = getRemainingCounts();
  const remainingVideos = counts.remainingVideos;
  
  const handleGenerateVideo = async () => {
    if (!imageUrl) {
      toast({
        title: "Missing Image",
        description: "Please upload or generate an image first",
        variant: "destructive",
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please provide a text description for your video",
        variant: "destructive",
      });
      return;
    }

    if (remainingVideos <= 0) {
      toast({
        title: "Usage Limit Reached",
        description: "You've reached your daily limit for video generations",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem("aiVideoApiKey");
    if (!apiKey) {
      setIsApiKeyDialogOpen(true);
      return;
    }
    
    const result = await generateVideo({
      textPrompt: prompt,
      imgPrompt: imageUrl,
      motion: motion,
      time: videoDuration,
      imageAsEndFrame: imageAsEndFrame,
      flip: isPortrait,
      model: model
    });
    
    if (result) {
      onVideoGenerated(result);
      
      try {
        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: result,
            prompt: prompt,
            is_public: isPublic,
            metadata: {
              source: 'aivideo',
              image_url: imageUrl,
              settings: {
                motion,
                duration: videoDuration,
                imageAsEndFrame,
                isPortrait,
                model
              }
            }
          });
        }
      } catch (error) {
        console.error("Error saving to history:", error);
      }
    }
  };

  const handleImageUploaded = (imageUrl: string) => {
    setImageUrl(imageUrl);
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Image to Video</h2>
          
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-upload">Upload or Select Image</Label>
                  <div className="mt-2">
                    {imageUrl ? (
                      <div className="relative aspect-square rounded-md overflow-hidden bg-slate-100">
                        <img
                          src={imageUrl}
                          alt="Uploaded"
                          className="w-full h-full object-cover"
                        />
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="absolute top-2 right-2"
                          onClick={() => setImageUrl(null)}
                        >
                          Replace
                        </Button>
                      </div>
                    ) : (
                      <ImageUploader onImageSelected={handleImageUploaded} />
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Text Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the motion and scene for your video..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Select 
                    value={model}
                    onValueChange={setModel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gen3">Gen3 (Higher Quality)</SelectItem>
                      <SelectItem value="gen2">Gen2 (Faster)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Motion Intensity: {motion}</Label>
                  <Slider 
                    value={[motion]} 
                    onValueChange={(values) => setMotion(values[0])} 
                    min={1} 
                    max={10} 
                    step={1} 
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label>Video Duration: {videoDuration}s</Label>
                  <Slider 
                    value={[videoDuration]} 
                    onValueChange={(values) => setVideoDuration(values[0])} 
                    min={model === "gen3" ? 5 : 4} 
                    max={10} 
                    step={model === "gen3" ? 5 : 1} 
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {model === "gen3" ? "Gen3 supports 5s or 10s duration" : "Gen2 supports 4-10s duration"}
                  </p>
                </div>
                
                <div className="flex items-center space-x-8">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="image-end-frame"
                      checked={imageAsEndFrame}
                      onCheckedChange={setImageAsEndFrame}
                    />
                    <Label htmlFor="image-end-frame">Use Image as End Frame</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="portrait-mode"
                      checked={isPortrait}
                      onCheckedChange={setIsPortrait}
                    />
                    <Label htmlFor="portrait-mode">Portrait Mode</Label>
                  </div>
                </div>
                
                <PublicPrivateToggle
                  isPublic={isPublic}
                  onChange={setIsPublic}
                  disabled={isGenerating}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <Button
                onClick={handleGenerateVideo}
                disabled={isGenerating || !imageUrl || !prompt.trim() || remainingVideos <= 0}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Video ({progress}%)
                  </>
                ) : (
                  <>
                    <Film className="mr-2 h-4 w-4" />
                    Generate Video ({remainingVideos} remaining)
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {videoUrl && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Generated Video</h3>
            <VideoPreview
              videoUrl={videoUrl}
              isLoading={false}
              generationLogs={[]}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
            />
            
            <div className="mt-4">
              <Button onClick={onSwitchToEditor} variant="outline" className="w-full">
                Open in Video Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <ApiKeyDialog 
        isOpen={isApiKeyDialogOpen} 
        onClose={() => setIsApiKeyDialogOpen(false)}
        keyName="aiVideoApiKey"
        title="AI Video API Key Required"
        description="Please enter your AI Video API key to generate videos."
        learnMoreLink="https://aivideoapi.readme.io/"
      />
    </div>
  );
};

export default ImageToVideo;
