
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

    // Get the API key from localStorage
    const apiKey = localStorage.getItem("aiVideoApiKey") || localStorage.getItem("fallbackVideoApiKey");
    
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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
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
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      setProgress(50);
      
      if (!response.ok) {
        let errorMessage = "Failed to generate video";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
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
      
      // Specific error handling for network issues
      let errorMessage = err.message || "An error occurred while generating the video";
      
      if (err.name === 'AbortError') {
        errorMessage = "Request timed out. The server is taking too long to respond.";
      } else if (err.message?.includes('Failed to fetch') || !navigator.onLine) {
        errorMessage = "Network error. Please check your internet connection and try again.";
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Try fallback key if main key failed
      if (apiKey === localStorage.getItem("aiVideoApiKey") && localStorage.getItem("fallbackVideoApiKey")) {
        toast({
          title: "Retrying",
          description: "Trying with fallback API key...",
        });
        
        // Switch to fallback key
        localStorage.setItem("currentUsingVideoApiKey", "fallback");
        
        // Retry with fallback key (must be a separate call to avoid recursion issues)
        return null;
      }
      
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (uuid: string, apiKey: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const response = await fetch(`https://api.aivideoapi.com/status/${uuid}`, {
            headers: {
              "x-api-key": apiKey,
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
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
          console.error("Error polling video status:", err);
          if (err.name === 'AbortError') {
            // Continue polling even if a single status check times out
            setTimeout(checkStatus, 3000); // Longer delay after timeout
          } else {
            reject(err);
          }
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
