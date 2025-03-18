
import { callFalApi, uploadToFal } from "@/integrations/supabase/client";

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

// Service to handle Fal.ai operations
export const falService = {
  // Generate an image using the backend proxy
  async generateImage(params: GenerateImageParams) {
    try {
      const result = await callFalApi('fast-sdxl', {
        method: 'POST',
        body: {
          prompt: params.prompt,
          negative_prompt: params.negative_prompt || "blurry, bad quality, distorted",
          image_size: params.image_size || "square_hd",
          num_inference_steps: params.num_inference_steps || 30,
          guidance_scale: params.guidance_scale || 7.5,
        },
      });
      
      if (result && result.images && result.images[0]) {
        return result.images[0].url;
      }
      throw new Error("No image URL in response");
    } catch (error) {
      console.error("Failed to generate image:", error);
      throw error;
    }
  },

  // Generate a video using the backend proxy
  async generateVideo(params: GenerateVideoParams) {
    try {
      const result = await callFalApi('wan-i2v', {
        method: 'POST',
        body: {
          prompt: params.prompt,
          image_url: params.image_url,
          num_frames: params.num_frames || 81,
          frames_per_second: params.frames_per_second || 16,
          resolution: params.resolution || "720p",
          num_inference_steps: params.num_inference_steps || 30,
          enable_safety_checker: params.enable_safety_checker !== false,
        },
      });
      
      if (result && result.video && result.video.url) {
        return result.video.url;
      }
      throw new Error("No video URL in response");
    } catch (error) {
      console.error("Failed to generate video:", error);
      throw error;
    }
  },

  // Upload an image file
  async uploadImage(file: File) {
    try {
      return await uploadToFal(file);
    } catch (error) {
      console.error("Upload failed:", error);
      throw error;
    }
  },
};
