
// Import fal-ai client properly
import { createFalClient } from '@fal-ai/client';
import { getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";

// Default API key
const DEFAULT_API_KEY = "fal_sandl_jg1a7uXaAtRiJAX6zeKtuGDbkY-lrcbfu9DqZ_J0GdA";

// Model URLs/IDs
export const TEXT_TO_IMAGE_MODEL = "110602490-lcm-sd15-i2i/fast"; // Lt. Create model
export const IMAGE_TO_VIDEO_MODEL = "110602490-ltx-animation/run"; 
export const VIDEO_TO_VIDEO_MODEL = "fal-ai/mmaudio-v2";
export const IMAGEN_3_MODEL = "fal-ai/imagen3/fast";

interface FalRunResult {
  images?: { url: string }[];
  seed?: number;
  video_url?: string;
  data?: {
    images?: { url: string }[];
    video?: { url: string };
  };
}

class FalService {
  private apiKey: string = DEFAULT_API_KEY;
  private isInitialized: boolean = false;
  private falClient: ReturnType<typeof createFalClient>;

  constructor() {
    // Create fal client with default API key
    this.falClient = createFalClient({ credentials: this.apiKey });
    this.initialize();
  }

  initialize(apiKey?: string) {
    try {
      // Use provided key or try to get from localStorage
      this.apiKey = apiKey || localStorage.getItem("falApiKey") || DEFAULT_API_KEY;
      
      // Initialize client with the right credentials
      this.falClient = createFalClient({ credentials: this.apiKey });
      
      this.isInitialized = true;
      console.log("FAL client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize FAL client:", error);
      this.isInitialized = false;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    this.initialize(apiKey);
  }

  // Text to Image generation
  async generateImage(
    prompt: string, 
    options: {
      negative_prompt?: string;
      height?: number;
      width?: number;
      guidance_scale?: number;
      num_inference_steps?: number;
      seed?: number;
      strength?: number;
    } = {}
  ): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const result = await this.falClient.run({
        model_id: TEXT_TO_IMAGE_MODEL,
        input: {
          prompt,
          ...options
        },
        connection_key: `text-to-image-${Date.now()}`
      });

      return result;
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  }

  // Image to Video generation
  async generateVideoFromImage(
    image_url: string,
    options: {
      cameraMode?: string;
      framesPerSecond?: number;
      modelType?: string;
      seed?: number;
    } = {}
  ): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const result = await this.falClient.run({
        model_id: IMAGE_TO_VIDEO_MODEL,
        input: {
          image_url,
          ...options
        },
        connection_key: `image-to-video-${Date.now()}`
      });

      return result;
    } catch (error) {
      console.error("Error generating video from image:", error);
      throw error;
    }
  }

  // Video to Video generation
  async generateVideoFromVideo(input: {
    video_url: string;
    prompt: string;
    negative_prompt?: string;
    num_steps?: number;
    duration?: number;
    cfg_strength?: number;
    seed?: number;
    mask_away_clip?: boolean;
  }): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const result = await this.falClient.run({
        model_id: VIDEO_TO_VIDEO_MODEL,
        input,
        connection_key: `video-to-video-${Date.now()}`
      });

      return result;
    } catch (error) {
      console.error("Error processing video:", error);
      throw error;
    }
  }

  // Image generation with Imagen 3
  async generateImageWithImagen3(prompt: string, options: any = {}): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const result = await this.falClient.run({
        model_id: IMAGEN_3_MODEL,
        input: {
          prompt,
          aspect_ratio: options.aspect_ratio || "1:1",
          negative_prompt: options.negative_prompt || "low quality, bad anatomy, distorted",
          ...options
        },
        connection_key: `imagen3-${Date.now()}`
      });

      return result;
    } catch (error) {
      console.error("Error generating image with Imagen3:", error);
      throw error;
    }
  }

  // Upload file to FAL.ai
  async uploadFile(file: File) {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      // Use the file-upload specific endpoint
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://gateway.fal.ai/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`);
      }

      const data = await response.json();
      return data.url; // Return the URL of the uploaded file
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

  // Save content to history
  async saveToHistory(
    contentType: 'image' | 'video', 
    contentUrl: string, 
    prompt: string,
    isPublic: boolean = false,
    metadata: any = {}
  ) {
    try {
      const userId = await getUserId();
      if (!userId) return;

      await supabase.from('user_content_history').insert({
        user_id: userId,
        content_type: contentType,
        content_url: contentUrl,
        prompt: prompt,
        is_public: isPublic,
        metadata: metadata
      });
      
      console.log(`${contentType} saved to history`);
      return true;
    } catch (error) {
      console.error(`Failed to save ${contentType} to history:`, error);
      return false;
    }
  }
}

// Create and export a singleton instance
export const falService = new FalService();

// Re-export the createFalClient function for direct access when needed
export { createFalClient };
