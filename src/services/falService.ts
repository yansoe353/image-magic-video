import { createFalClient } from '@fal-ai/client';
import { getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";

// Default API key
const DEFAULT_API_KEY = "fal_sandl_jg1a7uXaAtRiJAX6zeKtuGDbkY-lrcbfu9DqZ_J0GdA";

// Model URLs/IDs - Updated with latest models
export const TEXT_TO_IMAGE_MODEL = "fal-ai/imagen3/fast";
export const IMAGE_TO_VIDEO_MODEL = "fal-ai/kling-video/v1.6/standard/image-to-video";
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
  private proxyEnabled: boolean = true;  // Enable proxy by default for production

  constructor() {
    // Try to get API key from environment first, then localStorage, then default
    const envApiKey = typeof window !== 'undefined' ? window.ENV_FAL_API_KEY : undefined;
    this.apiKey = envApiKey || localStorage.getItem("falApiKey") || DEFAULT_API_KEY;
    
    // Create fal client with API key
    this.falClient = createFalClient({ 
      credentials: this.apiKey
    });
    this.initialize();
  }

  initialize(apiKey?: string) {
    try {
      // Use provided key or try to get from environment or localStorage
      if (apiKey) {
        this.apiKey = apiKey;
      } else {
        const envApiKey = typeof window !== 'undefined' ? window.ENV_FAL_API_KEY : undefined;
        this.apiKey = envApiKey || localStorage.getItem("falApiKey") || this.apiKey || DEFAULT_API_KEY;
      }
      
      console.log("Initializing Infinity API client with key:", this.apiKey ? "API key present" : "No API key");
      
      // Initialize client with the right credentials
      this.falClient = createFalClient({ 
        credentials: this.apiKey
      });
      
      this.isInitialized = true;
      console.log("Infinity API client initialized successfully");
    } catch (error) {
      console.error("Failed to initialize Infinity API client:", error);
      this.isInitialized = false;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem("falApiKey", apiKey);
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

  // Image generation with Imagen 3
  async generateImageWithImagen3(prompt: string, options: any = {}): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      console.log("Generating image with Imagen3, prompt:", prompt);
      
      if (!prompt || prompt.trim() === '') {
        throw new Error("Prompt cannot be empty");
      }
      
      // Always try the proxy method first for better CORS handling
      try {
        return await this.generateImageViaProxy(prompt, options);
      } catch (proxyError) {
        console.error("Proxy approach failed, trying direct API call:", proxyError);
        
        // Fall back to direct API call if proxy fails
        // Fix: Remove the third argument as it's causing the TypeScript error
        const result = await this.falClient.run(IMAGEN_3_MODEL, {
          input: {
            prompt,
            aspect_ratio: options.aspect_ratio || "1:1",
            negative_prompt: options.negative_prompt || "low quality, bad anatomy, distorted",
            ...options
          }
        }) as GenericApiResponse;
        
        console.log("Direct API call response:", result);
        
        // Format the response to match our expected structure
        if (result.data?.images?.[0]?.url) {
          return result as FalRunResult;
        } else if (result.images?.[0]?.url) {
          return {
            data: {
              images: result.images
            }
          };
        } else {
          const imageUrl = result.image_url || result.url || result.data?.url;
          if (!imageUrl) {
            throw new Error("Could not extract image URL from API response");
          }
          return {
            data: {
              images: [{ url: imageUrl }]
            }
          };
        }
      }
    } catch (error) {
      console.error("Error generating image with Imagen3:", error);
      throw error;
    }
  }
  
  // Proxy approach to avoid CORS
  private async generateImageViaProxy(prompt: string, options: any = {}): Promise<FalRunResult> {
    try {
      console.log("Using proxy for image generation with prompt:", prompt);
      
      const input = {
        prompt,
        aspect_ratio: options.aspect_ratio || "1:1",
        negative_prompt: options.negative_prompt || "low quality, bad anatomy, distorted",
        ...options
      };

      console.log("Sending proxy request with input:", JSON.stringify(input).substring(0, 100) + "...");
      
      // Using fetch with proper error handling
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: IMAGEN_3_MODEL,
          input
        })
      });
      
      // Log response status for debugging
      console.log(`Proxy response status: ${response.status}`);
      
      // Check if response is ok
      if (!response.ok) {
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || errorData.message || `HTTP error ${response.status}`);
        } else {
          const errorText = await response.text();
          throw new Error(`HTTP error ${response.status}: ${errorText.substring(0, 100)}`);
        }
      }
      
      // Check content type to ensure it's JSON
      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error("Received non-JSON response:", text.substring(0, 200));
        throw new Error("Invalid response format from proxy");
      }
      
      // Parse the JSON response
      const result = await response.json();
      console.log("Proxy response received:", result);
      
      // Format the response to match the expected structure
      if (result.data?.images?.[0]?.url) {
        return result;
      } else if (result.images?.[0]?.url) {
        return {
          data: {
            images: result.images
          }
        };
      } else if (result.image_url || result.url) {
        return {
          data: {
            images: [{ url: result.image_url || result.url }]
          }
        };
      } else {
        console.error("Unexpected response format:", result);
        throw new Error("Could not extract image URL from proxy response");
      }
    } catch (error) {
      console.error("Error in proxy image generation:", error);
      throw error;
    }
  }

  // Image to Video generation - improved implementation
  async generateVideoFromImage(
    image_url: string,
    options: {
      prompt?: string;
    } = {}
  ): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      console.log("Generating video from image:", image_url);
      
      // Validate image URL
      if (!image_url || typeof image_url !== 'string' || !image_url.startsWith('http')) {
        throw new Error("Invalid image URL format");
      }
      
      // Try the primary model
      try {
        console.log("Attempting video generation with Kling model");
        const result = await this.falClient.run(IMAGE_TO_VIDEO_MODEL, {
          input: {
            image_url,
            prompt: options.prompt || "Animate this image with smooth motion"
          }
        });
        
        console.log("Primary model result:", result);
        return result;
      } catch (primaryError) {
        console.error("Error with primary model, falling back to backup:", primaryError);
        
        // Fallback to original model if primary fails
        const fallbackModel = "110602490-ltx-animation/run";
        const result = await this.falClient.run(fallbackModel, {
          input: {
            image_url,
            ...options
          }
        });
        
        console.log("Fallback model result:", result);
        return result;
      }
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
      const result = await this.falClient.run(VIDEO_TO_VIDEO_MODEL, {
        input
      });

      return result;
    } catch (error) {
      console.error("Error processing video:", error);
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

  async generateCompletion(prompt: string): Promise<string> {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
      const result = await this.falClient.run("fal-ai/text-generation", {
        input: {
          prompt: prompt,
          max_length: 1000,
          temperature: 0.7,
        }
      });

      if (!result || !result.response) {
        throw new Error('No valid response from FAL API');
      }

      return result.response;
    } catch (error) {
      console.error('Error generating completion with FAL:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const falService = new FalService();

// Re-export the createFalClient function for direct access when needed
export { createFalClient };
