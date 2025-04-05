
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { incrementVideoCount } from "@/utils/usageTracker";

export interface VideoGenerationOptions {
  textPrompt: string;
  imgPrompt: string;
  motion?: number;
  time?: number;
  imageAsEndFrame?: boolean;
  flip?: boolean;
  model?: string;
}

export const useAiVideoApi = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateVideo = async (options: VideoGenerationOptions) => {
    setIsGenerating(true);
    setProgress(10);
    setError(null);
    setVideoUrl(null);

    const apiKey = localStorage.getItem("aiVideoApiKey");
    
    if (!apiKey) {
      setIsGenerating(false);
      setError("API key not found. Please set your AI Video API key in settings.");
      toast({
        title: "API Key Required",
        description: "Please set your AI Video API key in settings",
        variant: "destructive",
      });
      return null;
    }

    try {
      setProgress(30);
      const response = await fetch("https://api.aivideoapi.com/runway/generate/imageDescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          text_prompt: options.textPrompt,
          img_prompt: options.imgPrompt,
          model: options.model || "gen3",
          image_as_end_frame: options.imageAsEndFrame || false,
          flip: options.flip || false,
          motion: options.motion || 5,
          seed: 0,
          time: options.time || 5
        }),
      });

      setProgress(50);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate video");
      }

      const data = await response.json();
      console.log("Video generation response:", data);
      
      if (!data.uuid) {
        throw new Error("No video UUID returned");
      }

      setProgress(60);
      
      // Poll for video status
      const videoUrl = await pollVideoStatus(data.uuid, apiKey);
      setVideoUrl(videoUrl);
      await incrementVideoCount();
      
      toast({
        title: "Video Generated",
        description: "Your video has been successfully generated!",
      });
      
      return videoUrl;
    } catch (err) {
      console.error("Error generating video:", err);
      setError(err.message || "An error occurred while generating the video");
      toast({
        title: "Error",
        description: err.message || "Failed to generate video",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (uuid: string, apiKey: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const response = await fetch(`https://api.aivideoapi.com/status/${uuid}`, {
            headers: {
              "x-api-key": apiKey,
            },
          });
          
          if (!response.ok) {
            throw new Error("Failed to check video status");
          }
          
          const data = await response.json();
          console.log("Video status:", data);
          
          if (data.status === "failed") {
            reject(new Error(data.message || "Video generation failed"));
            return;
          }
          
          if (data.status === "done" && data.result?.video_url) {
            setProgress(100);
            resolve(data.result.video_url);
            return;
          }
          
          // Update progress based on status
          if (data.status === "started") {
            setProgress(70);
          } else if (data.status === "processing") {
            setProgress(85);
          }
          
          // Check again after delay
          setTimeout(checkStatus, 2000);
        } catch (err) {
          reject(err);
        }
      };
      
      checkStatus();
    });
  };

  return { 
    generateVideo, 
    isGenerating, 
    progress, 
    videoUrl, 
    error 
  };
};
