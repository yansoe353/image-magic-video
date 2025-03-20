
import { useState } from "react";

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

  // In a real implementation, this would use a video processing library or API
  // For this demo, we'll simulate the combination process
  const combineVideos = async () => {
    if (videoClips.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // This is a placeholder for actual video processing logic
      // In a real implementation, you would send the clips to a server
      // or use a client-side library to combine the videos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we'll just use the URL of the first clip
      setCombinedVideoUrl(videoClips[0].url);
      
    } catch (error) {
      console.error("Failed to combine videos:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    videoClips,
    audioTrack,
    combinedVideoUrl,
    isProcessing,
    addVideoClip,
    removeVideoClip,
    reorderVideoClips,
    setAudio,
    combineVideos
  };
}
