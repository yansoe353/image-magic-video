
import { useState, useEffect } from "react";
import { fal } from '@fal-ai/client';
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { getUserId } from "@/utils/storageUtils";

// Initialize the FAL client with the environment variable
const falApiKey = "fal_sandl_jg1a7uXaAtRiJAX6zeKtuGDbkY-lrcbfu9DqZ_J0GdA"; // Hardcoded API key
// Configure the client
fal.config({
  credentials: falApiKey,
});

// LTX Text to Image model
const ltxTextToImageProxyUrl = "110602490-lcm-sd15-i2i/fast"; // Lt. Create model

// LTX Image to Video model
const ltxImageToVideoUrl = "110602490-ltx-animation/run";

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
      
      // Use the ltxTextToImageProxyUrl endpoint
      const result = await fal.run(ltxTextToImageProxyUrl, input);
      
      if (result?.images?.[0]) {
        setImageUrl(result.images[0]);
        console.log("Image generated successfully");
        
        if (result.seed) {
          setSeed(result.seed);
        }
        
        // Store the generated image in user history if userId exists
        const userId = await getUserId();
        if (userId) {
          try {
            await supabase.from('user_content_history').insert({
              user_id: userId,
              content_type: 'image',
              content_url: result.images[0],
              prompt: input.prompt,
              metadata: {
                seed: result.seed,
                negative_prompt: input.negative_prompt,
                width: input.width,
                height: input.height
              }
            });
            console.log("Image saved to history");
          } catch (historyError) {
            console.error("Failed to save image to history:", historyError);
          }
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
      
      // Use the ltxImageToVideoUrl endpoint
      const result = await fal.run(ltxImageToVideoUrl, {
        image_url: input.image_url,
        cameraMode: input.cameraMode || "Default",
        framesPerSecond: input.framesPerSecond || 6,
        modelType: input.modelType || "svd",
        seed: input.seed || Math.floor(Math.random() * 1000000)
      });
      
      if (result?.video_url) {
        setVideoUrl(result.video_url);
        console.log("Video generated successfully");
        
        // Store the generated video in user history if userId exists
        const userId = await getUserId();
        if (userId) {
          try {
            await supabase.from('user_content_history').insert({
              user_id: userId,
              content_type: 'video',
              content_url: result.video_url,
              prompt: "Generated from image",
              metadata: {
                source_image_url: input.image_url,
                cameraMode: input.cameraMode,
                framesPerSecond: input.framesPerSecond,
                modelType: input.modelType
              }
            });
            console.log("Video saved to history");
          } catch (historyError) {
            console.error("Failed to save video to history:", historyError);
          }
        }
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
