

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/components/ui/use-toast";
import { getUserId } from "@/utils/storageUtils";
import { incrementImageCount, incrementVideoCount } from "@/utils/usageTracker";
import { falService } from "@/services/falService";

// Image generation interfaces
type ImageGenerationInput = {
  prompt: string;
  negative_prompt?: string;
  height?: number;
  width?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  strength?: number;
};

interface ImageGenerationOutput {
  images: string[];
  seed: number;
}

interface TextToImageResult {
  imageUrl: string | null;
  seed: number | null;
  isGenerating: boolean;
  error: string | null;
  generate: (input: ImageGenerationInput) => Promise<void>;
}

// Image to Video interfaces
interface ImageToVideoResult {
  videoUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  generate: (input: ImageToVideoInput) => Promise<void>;
}

interface ImageToVideoInput {
  image_url: string;
  cameraMode?: string;
  framesPerSecond?: number;
  modelType?: string; 
  seed?: number;
}

// Hook for text-to-image generation
export function useTextToImage(): TextToImageResult {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [seed, setSeed] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  const generate = async (input: ImageGenerationInput) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log("Starting image generation with prompt:", input.prompt);
      
      // Check if user can generate more images before starting generation
      const canGenerate = await incrementImageCount();
      if (!canGenerate) {
        throw new Error("You have reached your image generation limit");
      }
      
      const result = await falService.generateImage(input.prompt, {
        negative_prompt: input.negative_prompt,
        height: input.height,
        width: input.width,
        guidance_scale: input.guidance_scale,
        num_inference_steps: input.num_inference_steps,
        seed: input.seed,
        strength: input.strength
      });
      
      if (result?.images?.[0]) {
        setImageUrl(result.images[0]);
        console.log("Image generated successfully");
        
        if (result.seed) {
          setSeed(result.seed);
        }
        
        // Store the generated image in user history if userId exists
        const userId = await getUserId();
        if (userId) {
          await falService.saveToHistory(
            'image',
            result.images[0],
            input.prompt,
            false, // isPublic
            {
              seed: result.seed,
              negative_prompt: input.negative_prompt,
              width: input.width,
              height: input.height
            }
          );
        }
      } else {
        throw new Error("No image was returned from the API");
      }
    } catch (e) {
      console.error("Error generating image:", e);
      setError(e instanceof Error ? e.message : "Unknown error occurred");
      toast({
        title: "Image Generation Failed",
        description: e instanceof Error ? e.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    imageUrl,
    seed,
    isGenerating,
    error,
    generate
  };
}

// Hook for image-to-video generation
export function useImageToVideo(): ImageToVideoResult {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generate = async (input: ImageToVideoInput) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log("Starting video generation from image:", input.image_url);
      
      // Check if user can generate more videos before starting generation
      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        throw new Error("You have reached your video generation limit");
      }
      
      const result = await falService.generateVideoFromImage(input.image_url, {
        cameraMode: input.cameraMode,
        framesPerSecond: input.framesPerSecond,
        modelType: input.modelType,
        seed: input.seed
      });
      
      if (result?.video_url) {
        setVideoUrl(result.video_url);
        console.log("Video generated successfully");
        
        // Store the generated video in user history if userId exists
        await falService.saveToHistory(
          'video',
          result.video_url,
          "Generated from image",
          false,
          {
            source_image_url: input.image_url,
            cameraMode: input.cameraMode,
            framesPerSecond: input.framesPerSecond,
            modelType: input.modelType
          }
        );
      } else {
        throw new Error("No video was returned from the API");
      }
    } catch (e) {
      console.error("Error generating video:", e);
      setError(e instanceof Error ? e.message : "Unknown error occurred");
      toast({
        title: "Video Generation Failed",
        description: e instanceof Error ? e.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    videoUrl,
    isGenerating,
    error,
    generate
  };
}
