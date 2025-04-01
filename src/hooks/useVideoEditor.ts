
import { useState } from "react";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";

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

  const createSlideshowFromImages = async (
    imageUrls: string[],
    voiceoverAudioUrl?: string,
    slideDuration: number = 5
  ) => {
    if (imageUrls.length === 0) {
      toast({
        title: "No images to process",
        description: "Please provide at least one image for the slideshow.",
        variant: "destructive"
      });
      return null;
    }
    
    setIsProcessing(true);
    setProgressPercent(10);
    setError(null);
    
    try {
      // Get current user ID if available
      const userId = await getUserId();
      
      // Prepare images and parameters for the server
      setProgressPercent(40);
      
      // Call our Supabase Edge Function for slideshow creation
      const { data, error } = await supabase.functions.invoke('create-slideshow', {
        body: { 
          imageUrls, 
          voiceoverUrl: voiceoverAudioUrl,
          slideDuration,
          userId 
        }
      });
      
      if (error) {
        throw new Error(`Server processing failed: ${error.message}`);
      }
      
      setProgressPercent(90);
      
      // Return the slideshow video URL from the server response
      setCombinedVideoUrl(data.url);
      
      toast({
        title: "Slideshow Created",
        description: "Your image slideshow with narration has been created.",
      });
      
      setProgressPercent(100);
      return data.url;
      
    } catch (error) {
      console.error("Failed to create slideshow:", error);
      setError("Video processing failed on the server. Please try again later.");
      toast({
        title: "Processing Error",
        description: "Server-side slideshow creation encountered an error. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
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
      
      // For multiple clips, use the server-side processing
      setProgressPercent(20);
      
      // Get current user ID if available
      const userId = await getUserId();
      
      // Prepare video URLs for the server
      const videoUrls = videoClips.map(clip => clip.url);
      
      setProgressPercent(40);
      
      // Call our Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('combine-videos', {
        body: { videoUrls, userId }
      });
      
      if (error) {
        throw new Error(`Server processing failed: ${error.message}`);
      }
      
      setProgressPercent(80);
      
      // Set the combined video URL from the server response
      setCombinedVideoUrl(data.url);
      
      toast({
        title: "Videos Combined",
        description: "Your videos have been processed on our server.",
      });
      
      setProgressPercent(100);
      
    } catch (error) {
      console.error("Failed to combine videos:", error);
      setError("Video processing failed on the server. Please try again later.");
      toast({
        title: "Processing Error",
        description: "Server-side video processing encountered an error. Please try again.",
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
    combineVideos,
    createSlideshowFromImages
  };
}
