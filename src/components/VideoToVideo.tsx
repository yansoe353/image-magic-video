import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { VideoUploader } from "./VideoUploader";
import { falClient } from "@/hooks/useFalClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Video, Music } from "lucide-react";
import { checkVideoCredits } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/utils/authUtils";
import { useNavigate } from "react-router-dom";
import { QueueStatus } from "@/hooks/useFalClient";

const VideoToVideo = () => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [seed, setSeed] = useState(42);
  const [numSteps, setNumSteps] = useState(50);
  const [duration, setDuration] = useState(3);
  const [cfgStrength, setCfgStrength] = useState(7);
  const [maskAwayClip, setMaskAwayClip] = useState(false);
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleVideoSelected = (url: string) => {
    setVideoUrl(url);
  };

  const handleGenerate = async () => {
    if (!videoUrl) {
      toast({
        title: "No Video Selected",
        description: "Please upload a video first.",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "No Prompt",
        description: "Please enter a prompt to guide the generation.",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough credits
    const hasCredits = await checkVideoCredits();
    if (!hasCredits) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough video credits. Please purchase more.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setStatus(null);
    setGeneratedVideoUrl(null);

    try {
      const result = await falClient.subscribe("mm-audio/mm-audio", {
        input: {
          video_url: videoUrl,
          prompt: prompt,
          negative_prompt: negativePrompt || undefined,
          seed: seed,
          num_steps: numSteps,
          duration: duration,
          cfg_strength: cfgStrength,
          mask_away_clip: maskAwayClip,
        },
        pollInterval: 1000,
        onQueueUpdate: (update) => {
          setStatus(update as QueueStatus);
        },
      });

      if (result.status !== "IN_PROGRESS" && result.status !== "IN_QUEUE") {
        toast({
          title: "Generation Failed",
          description: "Failed to generate video. Please try again.",
          variant: "destructive",
        });
        setIsGenerating(false);
        return;
      }

      if (result.data?.video?.url) {
        setGeneratedVideoUrl(result.data.video.url);
        
        // Save to history
        const user = await getCurrentUser();
        if (user) {
          await supabase.from("user_content_history").insert({
            user_id: user.id,
            content_type: "video",
            prompt: prompt,
            negative_prompt: negativePrompt || null,
            result_url: result.data.video.url,
            settings: {
              seed,
              numSteps,
              duration,
              cfgStrength,
              maskAwayClip,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Generation Error",
        description: "An error occurred during video generation.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span>Upload Video</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span>Audio Settings</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Video</CardTitle>
              <CardDescription>
                Upload a video to add AI-generated audio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VideoUploader onVideoSelected={(url) => handleVideoSelected(url)} />
              
              {videoUrl && (
                <div className="mt-4">
                  <video 
                    src={videoUrl} 
                    controls 
                    className="w-full rounded-md border border-gray-200"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="audio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Generation Settings</CardTitle>
              <CardDescription>
                Configure how the AI generates audio for your video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe the audio you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="negativePrompt">Negative Prompt (Optional)</Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="Describe what you want to avoid in the audio..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="seed">Seed: {seed}</Label>
                <Slider
                  id="seed"
                  min={0}
                  max={1000}
                  step={1}
                  value={[seed]}
                  onValueChange={(value) => setSeed(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="numSteps">Number of Steps: {numSteps}</Label>
                <Slider
                  id="numSteps"
                  min={10}
                  max={100}
                  step={1}
                  value={[numSteps]}
                  onValueChange={(value) => setNumSteps(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (seconds): {duration}</Label>
                <Slider
                  id="duration"
                  min={1}
                  max={10}
                  step={1}
                  value={[duration]}
                  onValueChange={(value) => setDuration(value[0])}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cfgStrength">CFG Strength: {cfgStrength}</Label>
                <Slider
                  id="cfgStrength"
                  min={1}
                  max={15}
                  step={0.1}
                  value={[cfgStrength]}
                  onValueChange={(value) => setCfgStrength(value[0])}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="maskAwayClip"
                  checked={maskAwayClip}
                  onChange={(e) => setMaskAwayClip(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="maskAwayClip">Mask Away Original Audio</Label>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !videoUrl}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Audio"
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {status && (
            <Card>
              <CardHeader>
                <CardTitle>Generation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Status: {status.status}</p>
                <div className="text-xs text-muted-foreground mt-2">
                  {status.logs && Array.isArray(status.logs) ? status.logs.map((log, i) => (
                    <p key={i}>{log.message}</p>
                  )) : null}
                </div>
              </CardContent>
            </Card>
          )}
          
          {generatedVideoUrl && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Result</CardTitle>
              </CardHeader>
              <CardContent>
                <video 
                  src={generatedVideoUrl} 
                  controls 
                  className="w-full rounded-md border border-gray-200"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => window.open(generatedVideoUrl, "_blank")}
                  variant="outline"
                  className="w-full"
                >
                  Open in New Tab
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoToVideo;
