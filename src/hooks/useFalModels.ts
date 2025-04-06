import { useState } from "react";
import { falClient, isFalInitialized } from "@/hooks/useFalClient";
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { incrementVideoCount } from "@/utils/usageTracker";

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

        // Store in content history
        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: resultUrl,
            prompt: prompt,
            metadata: {
              model: 'fal-ai/mmaudio-v2',
              config: {
                negative_prompt: options.negative_prompt,
                num_steps: options.num_steps,
                duration: options.duration,
                cfg_strength: options.cfg_strength,
                seed: options.seed,
                mask_away_clip: options.mask_away_clip
              }
            }
          });
        }

        // Increment video count for usage tracking
        await incrementVideoCount();
        
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

        // Store in content history
        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: resultUrl,
            prompt: prompt,
            metadata: {
              model: 'fal-ai/kling-video',
              config: {
                negative_prompt: options.negative_prompt,
                aspect_ratio: options.aspect_ratio,
                cfg_scale: options.cfg_scale
              }
            }
          });
        }

        // Increment video count for usage tracking
        await incrementVideoCount();
        
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

  // ControlNet for image-to-image processing using the correct ControlNext API
  const generateWithControlNet = async (
    imageUrl: string,
    prompt: string,
    controlNetType: string,
    options: {
      negative_prompt?: string;
      num_inference_steps?: number;
      guidance_scale?: number;
      seed?: number;
      controlnet_conditioning_scale?: number;
    } = {}
  ) => {
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
      setGenerationLogs(prev => [...prev, "Processing image with ControlNext..."]);

      const result = await falClient.subscribe("fal-ai/controlnext", {
        input: {
          image_url: imageUrl,
          prompt: prompt,
          negative_prompt: options.negative_prompt || "",
          num_inference_steps: options.num_inference_steps || 30,
          guidance_scale: options.guidance_scale || 7.5,
          seed: options.seed || Math.floor(Math.random() * 1000000),
          strength: options.controlnet_conditioning_scale || 0.8,
          control_mode: controlNetType
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS" && update.logs) {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });

      if (result.data?.image?.url) {
        const resultUrl = result.data.image.url;

        // Store in content history
        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: resultUrl,
            prompt: prompt,
            metadata: {
              model: 'fal-ai/controlnext',
              control_mode: controlNetType,
              config: {
                negative_prompt: options.negative_prompt,
                num_inference_steps: options.num_inference_steps,
                guidance_scale: options.guidance_scale,
                seed: options.seed,
                strength: options.controlnet_conditioning_scale
              }
            }
          });
        }

        // Increment video count for usage tracking
        await incrementVideoCount();

        setModelResult({
          type: "image",
          url: resultUrl,
          isLoading: false
        });

        toast({
          title: "Success",
          description: "Image processed successfully with ControlNext",
        });

        return resultUrl;
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Failed to process with ControlNext:", error);
      toast({
        title: "Error",
        description: "Failed to process image with ControlNext. Please try again.",
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
    imageToVideo,
    generateWithControlNet
  };
}
