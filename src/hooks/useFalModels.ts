
import { useState } from "react";
import { falClient, isFalInitialized } from "@/hooks/useFalClient";
import { useToast } from "@/hooks/use-toast";

export interface ModelResult {
  type: string;
  url: string;
  isLoading: boolean;
}

export function useFalModels() {
  const [isLoading, setIsLoading] = useState(false);
  const [modelResult, setModelResult] = useState<ModelResult | null>(null);
  const { toast } = useToast();
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);

  // Video style transfer using mmaudio model (formerly in VideoToVideo)
  const generateVideoWithPrompt = async (videoUrl: string, prompt: string, options: {
    negative_prompt?: string;
    num_steps?: number;
    duration?: number;
    cfg_strength?: number;
    seed?: number;
    mask_away_clip?: boolean;
  } = {}) => {
    if (!videoUrl || !prompt) {
      toast({
        title: "Error",
        description: "Please provide a video URL and prompt",
        variant: "destructive",
      });
      return null;
    }

    if (!isFalInitialized) {
      toast({
        title: "API Key Required",
        description: "Please set your API key in the settings first",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setGenerationLogs([]);
    setModelResult(null);
    
    try {
      setGenerationLogs(prev => [...prev, "Preparing to process video..."]);
      
      const result = await falClient.subscribe("fal-ai/mmaudio-v2", {
        input: {
          video_url: videoUrl,
          prompt: prompt,
          negative_prompt: options.negative_prompt || "",
          num_steps: options.num_steps || 25,
          duration: options.duration || 8,
          cfg_strength: options.cfg_strength || 4.5,
          seed: options.seed || Math.floor(Math.random() * 1000000),
          mask_away_clip: options.mask_away_clip || false
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      if (result.data?.video?.url) {
        const resultUrl = result.data.video.url;
        setModelResult({
          type: "video",
          url: resultUrl,
          isLoading: false
        });
        
        toast({
          title: "Success",
          description: "Video processed successfully",
        });
        
        return resultUrl;
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Failed to process video:", error);
      toast({
        title: "Error",
        description: "Failed to process video. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Image to Video conversion using kling-video
  const imageToVideo = async (imageUrl: string, prompt: string, options: {
    negative_prompt?: string;
    aspect_ratio?: "16:9" | "9:16" | "1:1";
    cfg_scale?: number;
  } = {}) => {
    if (!imageUrl || !prompt) {
      toast({
        title: "Error",
        description: "Please provide an image and prompt",
        variant: "destructive",
      });
      return null;
    }

    if (!isFalInitialized) {
      toast({
        title: "API Key Required",
        description: "Please set your API key in the settings first",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setGenerationLogs([]);
    setModelResult(null);
    
    try {
      setGenerationLogs(prev => [...prev, "Converting image to video..."]);
      
      const result = await falClient.subscribe("fal-ai/kling-video/v1.6/standard/image-to-video", {
        input: {
          prompt: prompt,
          image_url: imageUrl,
          duration: "5",
          aspect_ratio: options.aspect_ratio || "16:9",
          negative_prompt: options.negative_prompt || "blur, distort, and low quality",
          cfg_scale: options.cfg_scale || 0.5,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      if (result.data?.video?.url) {
        const resultUrl = result.data.video.url;
        setModelResult({
          type: "video",
          url: resultUrl,
          isLoading: false
        });
        
        toast({
          title: "Success",
          description: "Video generated successfully",
        });
        
        return resultUrl;
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Failed to convert image to video:", error);
      toast({
        title: "Error",
        description: "Failed to convert image to video. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    modelResult,
    generationLogs,
    generateVideoWithPrompt,
    imageToVideo
  };
}
