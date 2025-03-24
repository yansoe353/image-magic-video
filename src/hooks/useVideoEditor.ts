
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
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
    // Clear any previous errors when adding new clips
    setError(null);
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
      setError("No video clips to combine.");
      return;
    }
    
    setIsProcessing(true);
    setProgressPercent(0);
    setError(null);
    
    try {
      // Animate progress to simulate work happening
      const progressInterval = setInterval(() => {
        setProgressPercent(prev => {
          const newValue = prev + 5;
          return newValue < 90 ? newValue : prev;
        });
      }, 500);
      
      // Get current user ID for the request
      const userId = await getUserId();
      
      if (!userId) {
        throw new Error("User not authenticated");
      }
      
      // Prepare video URLs for the server
      const videoUrls = videoClips.map(clip => clip.url);
      const audioUrl = audioTrack?.url || null;
      
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('combine-videos', {
        body: { 
          videoUrls, 
          audioUrl, 
          userId 
        }
      });
      
      clearInterval(progressInterval);
      
      if (error) {
        throw new Error(`Error calling edge function: ${error.message}`);
      }
      
      // Set the combined video URL from the response
      setCombinedVideoUrl(data.combinedVideoUrl);
      setProgressPercent(100);
      
      // Display notification about server-side processing if needed
      if (videoClips.length > 1 && data.message) {
        toast({
          title: "Processing Update",
          description: data.message
        });
      }
      
      return true;
    } catch (error) {
      console.error("Failed to combine videos:", error);
      setError(error instanceof Error ? error.message : "Failed to combine videos");
      return false;
    } finally {
      setIsProcessing(false);
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
