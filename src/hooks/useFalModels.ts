
import { useState } from "react";
import { falClient } from "@/hooks/useFalClient";
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

  // Image upscaler using real-esrgan model
  const upscaleImage = async (imageUrl: string) => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Please provide an image to upscale",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setGenerationLogs([]);
    setModelResult(null);
    
    try {
      setGenerationLogs(prev => [...prev, "Preparing to upscale image..."]);
      
      const result = await falClient.subscribe("fal-ai/real-esrgan", {
        input: {
          image_url: imageUrl,
          scale: 4,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      if (result.data?.image?.url) {
        const resultUrl = result.data.image.url;
        setModelResult({
          type: "image",
          url: resultUrl,
          isLoading: false
        });
        
        toast({
          title: "Success",
          description: "Image upscaled successfully",
        });
        
        return resultUrl;
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Failed to upscale image:", error);
      toast({
        title: "Error",
        description: "Failed to upscale image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Remove background using remove-bg model
  const removeBackground = async (imageUrl: string) => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Please provide an image to process",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setGenerationLogs([]);
    setModelResult(null);
    
    try {
      setGenerationLogs(prev => [...prev, "Removing background from image..."]);
      
      const result = await falClient.subscribe("fal-ai/remove-bg", {
        input: {
          image_url: imageUrl,
          format: "png",
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      if (result.data?.image?.url) {
        const resultUrl = result.data.image.url;
        setModelResult({
          type: "image",
          url: resultUrl,
          isLoading: false
        });
        
        toast({
          title: "Success",
          description: "Background removed successfully",
        });
        
        return resultUrl;
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Failed to remove background:", error);
      toast({
        title: "Error",
        description: "Failed to remove background. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech using bark model
  const textToSpeech = async (text: string, speakerIdentity: string = "en_speaker_1") => {
    if (!text) {
      toast({
        title: "Error",
        description: "Please provide text to convert to speech",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setGenerationLogs([]);
    setModelResult(null);
    
    try {
      setGenerationLogs(prev => [...prev, "Converting text to speech..."]);
      
      const result = await falClient.subscribe("fal-ai/bark", {
        input: {
          prompt: text,
          speaker_identity: speakerIdentity,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      if (result.data?.audio?.url) {
        const resultUrl = result.data.audio.url;
        setModelResult({
          type: "audio",
          url: resultUrl,
          isLoading: false
        });
        
        toast({
          title: "Success",
          description: "Audio generated successfully",
        });
        
        return resultUrl;
      } else {
        throw new Error("No audio URL in response");
      }
    } catch (error) {
      console.error("Failed to generate speech:", error);
      toast({
        title: "Error",
        description: "Failed to generate speech. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Image inpainting model using sden-inpainting
  const inpaintImage = async (imageUrl: string, maskUrl: string, prompt: string) => {
    if (!imageUrl || !maskUrl) {
      toast({
        title: "Error",
        description: "Please provide both an image and a mask",
        variant: "destructive",
      });
      return null;
    }

    setIsLoading(true);
    setGenerationLogs([]);
    setModelResult(null);
    
    try {
      setGenerationLogs(prev => [...prev, "Starting image inpainting..."]);
      
      const result = await falClient.subscribe("fal-ai/sd-inpainting", {
        input: {
          image_url: imageUrl,
          mask_url: maskUrl,
          prompt: prompt || "Fix this area",
          negative_prompt: "bad quality, blurry, distortion",
          guidance_scale: 7.5,
          num_inference_steps: 25,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            const newLogs = update.logs.map(log => log.message);
            setGenerationLogs(prev => [...prev, ...newLogs]);
          }
        },
      });
      
      if (result.data?.image?.url) {
        const resultUrl = result.data.image.url;
        setModelResult({
          type: "image",
          url: resultUrl,
          isLoading: false
        });
        
        toast({
          title: "Success",
          description: "Image inpainting completed successfully",
        });
        
        return resultUrl;
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Failed to inpaint image:", error);
      toast({
        title: "Error",
        description: "Failed to inpaint image. Please try again.",
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
    upscaleImage,
    removeBackground,
    textToSpeech,
    inpaintImage
  };
}
