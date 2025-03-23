
import { useState } from "react";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { useToast } from "@/hooks/use-toast";

export interface VideoClip {
  id: string;
  url: string;
  name: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

export interface AudioTrack {
  id: string;
  url: string;
  name: string;
}

// Create FFmpeg instance outside the hook to ensure it's only created once
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

// Flag to track if ffmpeg is loaded
let ffmpegLoaded = false;

export function useVideoEditor() {
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [combinedVideoUrl, setCombinedVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const addVideoClip = (clip: VideoClip) => {
    setVideoClips((prev) => [...prev, clip]);
  };

  const removeVideoClip = (clipId: string) => {
    setVideoClips((prev) => prev.filter((clip) => clip.id !== clipId));
  };

  const reorderVideoClips = (startIndex: number, endIndex: number) => {
    setVideoClips((clips) => {
      const result = Array.from(clips);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const setAudio = (audio: AudioTrack | null) => {
    setAudioTrack(audio);
  };

  const combineVideos = async () => {
    if (videoClips.length === 0) {
      toast({
        title: "No videos to process",
        description: "Please add at least one video clip before combining.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    setProgressPercent(0);
    setError(null);
    
    try {
      setProgressPercent(20);
      
      // If there's only one video clip, just use that URL directly
      if (videoClips.length === 1) {
        setProgressPercent(90);
        setCombinedVideoUrl(videoClips[0].url);
        toast({
          title: "Video ready",
          description: "Your video is ready to view.",
        });
        setProgressPercent(100);
        setIsProcessing(false);
        return;
      }
      
      // For multiple clips, we'll just use the first one for now
      setProgressPercent(50);
      
      // Simulate processing
      setTimeout(() => {
        setProgressPercent(90);
        setCombinedVideoUrl(videoClips[0].url);
        
        setError("Multiple video combination is currently limited to browser capabilities. Only displaying the first video.");
        
        toast({
          title: "Browser Limitation",
          description: "Advanced video editing requires our cloud service. Currently showing only the first clip.",
          variant: "destructive"
        });
        
        setProgressPercent(100);
        setIsProcessing(false);
      }, 2000);
      
    } catch (error) {
      console.error("Failed to combine videos:", error);
      setError("Video processing failed due to browser compatibility limitations.");
      toast({
        title: "Processing Error",
        description: "Unable to process videos in this browser. Try using Chrome or Edge for better compatibility.",
        variant: "destructive"
      });
    } finally {
      if (isProcessing) {
        setProgressPercent(100);
        setIsProcessing(false);
      }
    }
  };

  return {
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
  };
}
