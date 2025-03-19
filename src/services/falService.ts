
import { createFalClient } from "@fal-ai/client";

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

// Create a Fal.ai client with the API key
// We're using a public key as this is client-side code
const falClient = createFalClient({
  credentials: "fal_live_cg8U0NmJuEJ0qTR54cntcbSEH1gzgG5mKw6dOK8FQdG2VDsrUQ"
});

// Service to handle Fal.ai operations
export const falService = {
  // Generate an image using direct Fal.ai API
  async generateImage(params: GenerateImageParams) {
    try {
      console.log("Generating image with params:", params);
      
      const result = await falClient.run("fast-sdxl", {
        input: {
          prompt: params.prompt,
          negative_prompt: params.negative_prompt || "blurry, bad quality, distorted",
          image_size: params.image_size || "square_hd",
          num_inference_steps: params.num_inference_steps || 30,
          guidance_scale: params.guidance_scale || 7.5,
        }
      });
      
      console.log("Image generation result:", result);
      
      // The result structure from Fal.ai fast-sdxl model
      // Access data correctly based on API response structure
      if (result && result.images && Array.isArray(result.images) && result.images.length > 0) {
        return result.images[0].url;
      }
      
      throw new Error("No image URL in response");
    } catch (error) {
      console.error("Failed to generate image:", error);
      throw error;
    }
  },

  // Generate a video using direct Fal.ai API
  async generateVideo(params: GenerateVideoParams) {
    try {
      console.log("Generating video with params:", params);
      
      const result = await falClient.run("wan-i2v", {
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
      
      // The result structure from Fal.ai wan-i2v model
      // Access data correctly based on API response structure
      if (result && result.video && result.video.url) {
        return result.video.url;
      }
      
      throw new Error("No video URL in response");
    } catch (error) {
      console.error("Failed to generate video:", error);
      throw error;
    }
  },

  // Upload an image using direct Fal.ai API
  async uploadImage(file: File) {
    try {
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
          'Authorization': 'Key fal_live_cg8U0NmJuEJ0qTR54cntcbSEH1gzgG5mKw6dOK8FQdG2VDsrUQ',
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
      throw error;
    }
  },
};
