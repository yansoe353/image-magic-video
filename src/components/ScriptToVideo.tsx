
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useTextToVideo } from "@/hooks/useTextToVideo";
import VideoPreview from "./VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import { getRemainingCounts, getRemainingCountsAsync, VIDEO_LIMIT } from "@/utils/usageTracker";
import ProLabel from "./ProLabel";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";

const ScriptToVideo = () => {
  const [script, setScript] = useState<string>("");
  const [style, setStyle] = useState<string>("cinematic");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [counts, setCounts] = useState(getRemainingCounts());

  const { toast } = useToast();
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();

  const { 
    videoUrl, 
    isGenerating, 
    error: generationError, 
    generate 
  } = useTextToVideo();

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    updateCounts();
  }, []);

  useEffect(() => {
    if (generationError) {
      setGenerationLogs(prev => [...prev, `Error: ${generationError}`]);
    }
  }, [generationError]);

  const handleGenerateVideo = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script to generate a video",
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

    setGenerationLogs([
      "Initializing script to video generation...",
      "Analyzing script structure and scenes...",
      "This may take up to 60-90 seconds"
    ]);

    await generate({
      text: script,
      style,
      aspect_ratio: aspectRatio,
      isStory: false
    });

    // Update the logs based on success or failure
    if (!generationError) {
      setGenerationLogs(prev => [...prev, "Video generated successfully!"]);
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Script to Video</h2>
            <ProLabel />
          </div>

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
              <Label htmlFor="script">Your Script</Label>
              <Textarea
                id="script"
                placeholder="Write a script with scene descriptions and dialogue..."
                value={script}
                onChange={(e) => setScript(e.target.value)}
                className="min-h-[200px]"
              />
              <p className="text-xs text-slate-500 mt-1">
                Include scene descriptions, camera directions and dialogue for best results.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="style">Visual Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="vlog">Vlog Style</SelectItem>
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
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            <Button
              onClick={handleGenerateVideo}
              disabled={isGenerating || !script.trim() || counts.remainingVideos <= 0}
              className="w-full"
            >
              {isGenerating ? "Generating Video..." : "Generate Video"}
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
            <h2 className="text-2xl font-bold mb-4">Video Preview</h2>
            <VideoPreview
              videoUrl={videoUrl}
              isLoading={isGenerating}
              generationLogs={generationLogs}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScriptToVideo;
