import { createFalClient } from '@fal-ai/client';
import { getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_API_KEY = "fal_sandl_jg1a7uXaAtRiJAX6zeKtuGDbkY-lrcbfu9DqZ_J0GdA";

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
    const envApiKey = typeof window !== 'undefined' ? window.ENV_FAL_API_KEY : undefined;
    this.apiKey = envApiKey || localStorage.getItem("falApiKey") || DEFAULT_API_KEY;

    this.falClient = createFalClient({ 
      credentials: this.apiKey,
    });
    this.initialize();
  }

  initialize(apiKey?: string) {
    try {
      if (apiKey) {
        this.apiKey = apiKey;
      } else {
        const envApiKey = typeof window !== 'undefined' ? window.ENV_FAL_API_KEY : undefined;
        this.apiKey = envApiKey || localStorage.getItem("falApiKey") || this.apiKey || DEFAULT_API_KEY;
      }

      console.log("Initializing Infinity API client with key:", this.apiKey ? "API key present" : "No API key");

      this.falClient = createFalClient({ 
        credentials: this.apiKey,
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

      if (!image_url || typeof image_url !== 'string' || !image_url.startsWith('http')) {
        throw new Error("Invalid image URL format");
      }

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

  async generateImageWithImagen3(prompt: string, options: any = {}): Promise<FalRunResult> {
    if (!this.isInitialized) {
      this.initialize();
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
      }) as GenericApiResponse;

      console.log("Imagen3 response received:", result);

      if (!result) {
        throw new Error("Empty response from Imagen3 API");
      }

      if (result.data && result.data.images && result.data.images.length > 0) {
        return result as FalRunResult;
      } else if (result.images && result.images.length > 0) {
        return result as FalRunResult;
      } else {
        const imageUrl = result.image_url || result.url ||
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

  async uploadFile(file: File) {
    if (!this.isInitialized) {
      this.initialize();
    }

    try {
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
      return data.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  }

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

export const falService = new FalService();
export { createFalClient };
