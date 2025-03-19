
import { createFalClient } from "@fal-ai/client";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Interface for image generation parameters
interface GenerateImageParams {
  prompt: string;
  negative_prompt?: string;
  image_size?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
}

// Interface for video generation parameters
interface GenerateVideoParams {
  prompt: string;
  image_url: string;
  num_frames?: number;
  frames_per_second?: number;
  resolution?: "480p" | "720p";
  num_inference_steps?: number;
  enable_safety_checker?: boolean;
}

// Initialize with null credentials - we'll set them after fetching the API key
let falClient = createFalClient({
  credentials: null
});

// Store the API key separately for upload requests
let falApiKey = "";
let isClientInitialized = false;

// Function to initialize the Fal client with the API key from Supabase
const initFalClient = async () => {
  try {
    if (isClientInitialized) return;
    
    // Get API key from Supabase secrets using RLS policy
    // Using 'any' type for the return to resolve the TS2345 error
    const { data, error } = await supabase.rpc('get_secret', { 
      secret_name: 'FAL_API_KEY' 
    } as any);
    
    if (error || !data) {
      console.error('Failed to retrieve FAL_API_KEY:', error);
      throw new Error('Could not retrieve API key');
    }
    
    // Store the API key for upload requests
    falApiKey = data;
    
    // Create new client with the retrieved key
    falClient = createFalClient({
      credentials: data
    });
    
    isClientInitialized = true;
  } catch (error) {
    console.error('Error initializing Fal client:', error);
    throw error;
  }
};

// Service to handle Fal.ai operations
export const falService = {
  // Generate an image using Fal.ai API
  async generateImage(params: GenerateImageParams) {
    try {
      await initFalClient();
      console.log("Generating image with params:", params);
      
      // Direct client-side API call
      const result = await falClient.run("fal-ai/sdxl", {
        input: {
          prompt: params.prompt,
          negative_prompt: params.negative_prompt || "blurry, bad quality, distorted",
          image_size: params.image_size || "square_hd",
          num_inference_steps: params.num_inference_steps || 30,
          guidance_scale: params.guidance_scale || 7.5,
        }
      });
      
      console.log("Image generation result:", result);
      
      // Cast the result to 'any' to access the properties safely
      const resultObj = result as any;
      if (resultObj && resultObj.images && Array.isArray(resultObj.images) && resultObj.images.length > 0) {
        return resultObj.images[0].url;
      }
      
      throw new Error("No image URL in response");
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error(`Image generation failed: ${error.message || "Unknown error"}`);
      throw error;
    }
  },

  // Generate a video using Fal.ai API
  async generateVideo(params: GenerateVideoParams) {
    try {
      await initFalClient();
      console.log("Generating video with params:", params);
      
      // Direct client-side API call
      const result = await falClient.run("fal-ai/i2v", {
        input: {
          prompt: params.prompt,
          image_url: params.image_url,
          num_frames: params.num_frames || 81,
          frames_per_second: params.frames_per_second || 16,
          resolution: params.resolution || "720p",
          num_inference_steps: params.num_inference_steps || 30,
          enable_safety_checker: params.enable_safety_checker !== false,
        }
      });
      
      console.log("Video generation result:", result);
      
      // Cast the result to 'any' to access the properties safely
      const resultObj = result as any;
      if (resultObj && resultObj.video && resultObj.video.url) {
        return resultObj.video.url;
      }
      
      throw new Error("No video URL in response");
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast.error(`Video generation failed: ${error.message || "Unknown error"}`);
      throw error;
    }
  },

  // Upload an image using Fal.ai API
  async uploadImage(file: File) {
    try {
      await initFalClient();
      console.log("Uploading image file:", file.name, file.type, file.size);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      
      // Create FormData for the upload
      const formData = new FormData();
      formData.append('file', blob, file.name);
      
      // Direct upload to Fal.ai storage
      const response = await fetch('https://rest.fal.ai/storage/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${falApiKey}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed (${response.status}): ${errorText}`);
      }
      
      const result = await response.json();
      console.log("Upload result:", result);
      
      if (result && result.url) {
        return result.url;
      }
      
      throw new Error("No URL in upload response");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error(`Upload failed: ${error.message || "Unknown error"}`);
      throw error;
    }
  },
};
