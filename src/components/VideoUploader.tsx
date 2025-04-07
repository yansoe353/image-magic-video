
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { type VideoClip } from "@/hooks/useVideoEditor";

interface VideoUploaderProps {
  onVideoUploaded: (clip: VideoClip) => void;
  disabled?: boolean;
}

const VideoUploader = ({ onVideoUploaded, disabled = false }: VideoUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 50MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Invalid file type",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create a blob URL for the video file
      const url = URL.createObjectURL(file);
      
      // Create a video element to get the duration
      const video = document.createElement('video');
      
      // Create a promise to handle the video metadata loading
      const getDuration = new Promise<number>((resolve) => {
        video.onloadedmetadata = () => {
          resolve(video.duration);
        };
      });
      
      video.src = url;
      const duration = await getDuration;
      
      // Create the clip object
      const newClip: VideoClip = {
        id: uuidv4(),
        url,
        name: file.name,
        duration
      };
      
      onVideoUploaded(newClip);
      
      toast({
        title: "Video uploaded",
        description: `${file.name} added to your clips`,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the input field
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <Label 
        htmlFor="video-upload" 
        className={`flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-md transition-colors cursor-pointer ${
          isUploading ? "bg-gray-100" : "hover:bg-gray-50"
        }`}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        ) : (
          <Upload className="h-6 w-6 text-gray-500" />
        )}
        <span className="mt-2 text-sm text-gray-500">
          {isUploading ? "Uploading..." : "Upload video from device"}
        </span>
      </Label>
      <input
        id="video-upload"
        type="file"
        accept="video/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
};

export default VideoUploader;
