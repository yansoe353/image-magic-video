
import * as fal from "@fal-ai/client";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { incrementImageCount, incrementVideoCount } from "@/utils/usageTracker";

fal.config({
  credentials: process.env.FAL_KEY || "fal_key_not_configured"
});

export interface TextToImageParams {
  prompt: string;
  negative_prompt?: string;
  guidance_scale?: number;
  size?: string;
  model_name?: string;
}

export interface ImageToVideoParams {
  image_url: string;
  prompt?: string;
  negative_prompt?: string;
  strength?: number;
  motion_bucket_id?: number;
  model_name?: string;
}

export interface StoryToVideoParams {
  story: string;
  model_name?: string;
}

export interface VideoToVideoParams {
  video_url: string;
  prompt?: string;
  negative_prompt?: string;
  strength?: number;
  model_name?: string;
}

export const useFalClient = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const generateImage = async (params: TextToImageParams): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user has enough credits
      const canGenerate = await incrementImageCount();
      if (!canGenerate) {
        throw new Error("You have reached your image generation limit for this account");
      }

      const { prompt, negative_prompt = "", guidance_scale = 7, size = "768x768", model_name = "stable-diffusion-xl" } = params;

      const result = await fal.run("fal-ai/fast-sd-image-generator", {
        input: {
          prompt,
          negative_prompt,
          guidance_scale,
          width: parseInt(size.split("x")[0]),
          height: parseInt(size.split("x")[1]),
          model_name
        }
      });

      if (!result.images?.length) {
        throw new Error("No images were generated");
      }

      const imageUrl = result.images[0].url;
      setResult({ url: imageUrl });

      // Store in history
      const user = await supabase.auth.getUser();
      if (user.data?.user) {
        await supabase.from('user_content_history').insert({
          user_id: user.data.user.id,
          content_type: 'image',
          content_url: imageUrl,
          prompt,
          metadata: {
            model: model_name,
            negative_prompt,
            guidance_scale,
            size
          }
        });
      }

      return imageUrl;
    } catch (err: any) {
      console.error("Error generating image:", err);
      setError(err.message || "Failed to generate image");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateImageToVideo = async (params: ImageToVideoParams): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user has enough credits
      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        throw new Error("You have reached your video generation limit for this account");
      }

      const { image_url, prompt = "", negative_prompt = "", strength = 0.6, motion_bucket_id = 127, model_name = "kling-video/v1/standard" } = params;

      const result = await fal.run("fal-ai/kling-video", {
        input: {
          image_url,
          prompt,
          negative_prompt,
          strength,
          motion_bucket_id,
        }
      });

      if (!result.video) {
        throw new Error("No video was generated");
      }

      const videoUrl = result.video;
      setResult({ url: videoUrl });

      // Store in history
      const user = await supabase.auth.getUser();
      if (user.data?.user) {
        await supabase.from('user_content_history').insert({
          user_id: user.data.user.id,
          content_type: 'video',
          content_url: videoUrl,
          prompt: prompt || "Image to video conversion",
          metadata: {
            model: model_name,
            negative_prompt,
            strength,
            source_image: image_url,
            source: 'image'
          }
        });
      }

      return videoUrl;
    } catch (err: any) {
      console.error("Error generating video:", err);
      setError(err.message || "Failed to generate video");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateImage,
    generateImageToVideo,
    isLoading,
    error,
    result
  };
};
