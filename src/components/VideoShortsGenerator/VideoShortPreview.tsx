
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VideoShort } from "@/types";
import { Download, Share2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VideoShortPreviewProps {
  videoShort: VideoShort;
}

export function VideoShortPreview({ videoShort }: VideoShortPreviewProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const handleDownload = () => {
    if (videoShort.videoUrl) {
      const a = document.createElement('a');
      a.href = videoShort.videoUrl;
      a.download = `video-short-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your video is being downloaded."
      });
    }
  };
  
  const handleShare = async () => {
    if (navigator.share && videoShort.videoUrl) {
      try {
        await navigator.share({
          title: videoShort.title || "My AI Generated Video Short",
          text: "Check out this AI-generated video short!",
          url: videoShort.videoUrl
        });
      } catch (err) {
        // Fallback to copy to clipboard
        copyToClipboard();
      }
    } else {
      // Fallback to copy to clipboard
      copyToClipboard();
    }
  };
  
  const copyToClipboard = () => {
    if (videoShort.videoUrl) {
      navigator.clipboard.writeText(videoShort.videoUrl);
      setCopied(true);
      toast({
        title: "URL Copied",
        description: "Video URL copied to clipboard!"
      });
      
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold">{videoShort.title || "Your Generated Video Short"}</h3>
        {videoShort.description && (
          <p className="text-sm text-slate-400 mt-1">{videoShort.description}</p>
        )}
      </div>
      
      <div className="relative aspect-[9/16] max-w-[400px] mx-auto bg-black rounded-lg overflow-hidden shadow-xl">
        {videoShort.videoUrl ? (
          <video 
            src={videoShort.videoUrl} 
            controls 
            className="w-full h-full object-contain"
            poster={videoShort.thumbnailUrl}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <p className="text-slate-400">Video not available</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center space-x-4 pt-4">
        <Button onClick={handleDownload} disabled={!videoShort.videoUrl}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button onClick={handleShare} variant="outline" disabled={!videoShort.videoUrl}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </>
          )}
        </Button>
      </div>
      
      {videoShort.script && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
          <h4 className="font-medium mb-2">Video Script</h4>
          <p className="text-sm text-slate-300 whitespace-pre-line">{videoShort.script}</p>
        </div>
      )}
    </div>
  );
}
