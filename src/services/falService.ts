
// Import fal-ai client properly
import { createFalClient } from '@fal-ai/client';
import { getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";

// Default API key - will be used as fallback only
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
  requestId?: string;
  data?: {
    images?: { url: string }[];
    video?: { url: string };
  };
  image_url?: string;
  url?: string;
}

// Generic type for handling different API response formats
type GenericApiResponse = {
  [key: string]: any;
  data?: {
    [key: string]: any;
    images?: { url: string }[];
  };
  images?: { url: string }[];
  image_url?: string;
  url?: string;
};

class FalService {
  private apiKey: string = DEFAULT_API_KEY;
  private isInitialized: boolean = false;
  private falClient: ReturnType<typeof createFalClient>;

  constructor() {
    // Initialize with default key until we can fetch from Supabase
    this.apiKey = DEFAULT_API_KEY;
    this.falClient = createFalClient({ credentials: this.apiKey });
    this.initialize();
  }

  async initialize(userProvidedKey?: string) {
    try {
      if (userProvidedKey) {
        // If a key is explicitly provided, use it
        this.apiKey = userProvidedKey;
      } else {
        // Try to get API key from Supabase first
        const { data } = await supabase
          .from('api_keys')
          .select('key_value')
          .eq('key_name', 'fal_api_key')
          .single();
        
        if (data?.key_value) {
          this.apiKey = data.key_value;
          console.log("Using Infinity API key from Supabase");
        } else {
          // Fallback to environment variable or default
          const envApiKey = typeof window !== 'undefined' ? window.ENV_FAL_API_KEY : undefined;
          this.apiKey = envApiKey || DEFAULT_API_KEY;
          console.log("Using fallback API key");
        }
      }
      
      // Initialize client with the right credentials
      this.falClient = createFalClient({ credentials: this.apiKey });
      
      this.isInitialized = true;
      console.log("Infinity API client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Infinity API client:", error);
      this.isInitialized = false;
    }
  }

  // Method to set API key (for admin use only)
  async setApiKey(apiKey: string) {
    // Update in Supabase if possible
    try {
      const { error } = await supabase
        .from('api_keys')
        .upsert({ 
          key_name: 'fal_api_key', 
          key_value: apiKey 
        }, { 
          onConflict: 'key_name' 
        });
      
      if (error) {
        console.error("Error saving API key to Supabase:", error);
      } else {
        console.log("API key saved to Supabase successfully");
      }
    } catch (e) {
      console.error("Error saving API key:", e);
    }
    
    // Update local instance
    this.apiKey = apiKey;
    await this.initialize(apiKey);
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
      await this.initialize();
    }

    try {
      console.log("Generating image with prompt:", prompt);
      
      const result = await this.falClient.run(TEXT_TO_IMAGE_MODEL, {
        input: {
          prompt,
          ...options
        }
      });

      console.log("Image generation result:", result);
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
      await this.initialize();
    }

    try {
      console.log("Generating video from image:", image_url);
      
      const result = await this.falClient.run(IMAGE_TO_VIDEO_MODEL, {
        input: {
          image_url,
          ...options
        }
      });

      console.log("Video generation result:", result);
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
      await this.initialize();
    }

    try {
      const result = await this.falClient.run(VIDEO_TO_VIDEO_MODEL, {
        input
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
      await this.initialize();
    }

    try {
      console.log("Generating image with Imagen3, prompt:", prompt);
      
      if (!prompt || prompt.trim() === '') {
        throw new Error("Prompt cannot be empty");
      }
      
      const result = await this.falClient.run(IMAGEN_3_MODEL, {
        input: {
          prompt,
          aspect_ratio: options.aspect_ratio || "1:1",
          negative_prompt: options.negative_prompt || "low quality, bad anatomy, distorted",
          ...options
        }
      }) as GenericApiResponse; // Cast to our generic type to handle response variations
      
      console.log("Imagen3 response received:", result);
      
      // Fix the type issue - handle the result properly based on actual structure
      if (!result) {
        throw new Error("Empty response from Imagen3 API");
      }
      
      // Access data first to ensure we're working with the correct structure
      if (result.data && result.data.images && result.data.images.length > 0) {
        // If we have a direct data.images structure, use it
        return result as FalRunResult;
      } else if (result.images && result.images.length > 0) {
        // If images are at the top level
        return result as FalRunResult;
      } else {
        // If there's no standard images structure, wrap any available URL in our expected format
        const imageUrl = result.image_url || result.url || 
                        // Access potential nested properties safely
                        result.data?.image_url || 
                        result.data?.url;
                        
        if (!imageUrl) {
          console.error("Unable to find image URL in response:", result);
          throw new Error("Could not extract image URL from API response");
        }
        
        return {
          data: {
            images: [{ url: imageUrl }]
          }
        };
      }
    } catch (error) {
      console.error("Error generating image with Imagen3:", error);
      throw error;
    }
  }

  // Upload file to FAL.ai
  async uploadFile(file: File) {
    if (!this.isInitialized) {
      await this.initialize();
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
