
import { Button } from "@/components/ui/button";
import { Play, Pause, Download, Video, Loader2 } from "lucide-react";

interface VideoPreviewProps {
  videoUrl: string;
  isLoading: boolean;
  generationLogs: string[];
  videoRef: React.RefObject<HTMLVideoElement>;
  isPlaying: boolean;
  handlePlayPause: () => void;
  isStoring?: boolean;
}

const VideoPreview = ({
  videoUrl,
  isLoading,
  generationLogs,
  videoRef,
  isPlaying,
  handlePlayPause,
  isStoring = false
}: VideoPreviewProps) => {
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

  if (isLoading) {
    return (
      <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center p-6 mb-4">
        <Loader2 className="h-10 w-10 text-brand-purple animate-spin mb-4" />
        <div className="w-full max-w-md bg-slate-200 rounded-full h-2.5 mb-2">
          <div 
            className="bg-brand-purple h-2.5 rounded-full animate-pulse-opacity" 
            style={{ width: `${Math.min(generationLogs.length * 10, 100)}%` }}
          ></div>
        </div>
        <div className="text-slate-600 text-sm mt-2 text-center">
          {isStoring 
            ? "Storing video to your personal cloud..." 
            : (generationLogs.length > 0 && generationLogs[generationLogs.length - 1])}
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4">
        <div className="text-slate-400 flex flex-col items-center">
          <Video className="h-12 w-12 mb-2" />
          <span className="text-center">Your video will appear here</span>
        </div>
      </div>
    );
  }

  return (
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
      {videoUrl.includes('supabase') && (
        <p className="text-xs text-slate-500 text-center">
          Stored in your personal cloud storage
        </p>
      )}
    </div>
  );
};

export default VideoPreview;
