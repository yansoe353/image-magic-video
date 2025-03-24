
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Film, Cloud, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useVideoEditor, type VideoClip } from "@/hooks/useVideoEditor";
import { useVideoControls } from "@/hooks/useVideoControls";
import VideoClipsList from "./VideoClipsList";
import AudioSelector from "./AudioSelector";
import VideoPreview from "./VideoPreview";
import VideoUploader from "./VideoUploader";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface VideoEditorProps {
  generatedVideoUrl: string | null;
}

const VideoEditor = ({ generatedVideoUrl }: VideoEditorProps) => {
  const { 
    videoClips, 
    audioTrack, 
    combinedVideoUrl, 
    isProcessing,
    progressPercent,
    error,
    addVideoClip, 
    removeVideoClip, 
    reorderVideoClips, 
    setAudio,
    combineVideos 
  } = useVideoEditor();
  
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();

  const handleAddGeneratedVideo = () => {
    if (!generatedVideoUrl) {
      toast({
        title: "No video available",
        description: "Generate a video first before adding it to the editor.",
        variant: "destructive"
      });
      return;
    }

    const newClip: VideoClip = {
      id: Date.now().toString(),
      url: generatedVideoUrl,
      name: `Clip ${videoClips.length + 1}`,
    };

    addVideoClip(newClip);
    
    toast({
      title: "Video added",
      description: "Video clip added to the editor."
    });
  };

  const handleCombineVideos = async () => {
    if (videoClips.length === 0) {
      toast({
        title: "No clips to combine",
        description: "Add at least one video clip before combining.",
        variant: "destructive"
      });
      return;
    }

    await combineVideos();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-4">Video Editor</h2>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Video Clips</h3>
            <Button 
              variant="outline" 
              onClick={handleAddGeneratedVideo}
              disabled={!generatedVideoUrl}
              className="flex items-center"
            >
              <Film className="h-4 w-4 mr-2" />
              Add Current Video
            </Button>
          </div>
          
          <VideoClipsList 
            clips={videoClips}
            onRemoveClip={removeVideoClip}
            onReorderClips={reorderVideoClips}
          />
          
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {videoClips.length > 1 && (
            <Alert>
              <Cloud className="h-4 w-4" />
              <AlertTitle>Cloud Processing</AlertTitle>
              <AlertDescription>
                Multiple videos will be combined using our server-side FFmpeg processing pipeline.
                This may take a few moments depending on the size and number of videos.
              </AlertDescription>
            </Alert>
          )}
          
          <Separator />
          
          <VideoUploader 
            onVideoUploaded={addVideoClip} 
            disabled={isProcessing}
          />
          
          <AudioSelector 
            audioTrack={audioTrack}
            onSetAudio={setAudio}
          />
          
          <Button 
            onClick={handleCombineVideos} 
            disabled={isProcessing || videoClips.length === 0}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing Video{videoClips.length > 1 ? 's' : ''}...
              </>
            ) : (
              videoClips.length > 1 ? 'Combine Videos via Cloud' : 'Process Video'
            )}
          </Button>
          
          {isProcessing && (
            <div className="mt-2">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">
                {progressPercent < 20 ? "Uploading video files..." : 
                 progressPercent < 40 ? "Preparing FFmpeg environment..." : 
                 progressPercent < 60 ? "Processing videos..." : 
                 progressPercent < 80 ? "Applying audio track..." : 
                 "Finalizing and storing your video..."}
              </p>
            </div>
          )}
          
          {combinedVideoUrl && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Preview</h3>
              <VideoPreview 
                videoUrl={combinedVideoUrl}
                isLoading={false}
                generationLogs={[]}
                videoRef={videoRef}
                isPlaying={isPlaying}
                handlePlayPause={handlePlayPause}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoEditor;
