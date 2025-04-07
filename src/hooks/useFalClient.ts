
import { fal } from "@fal-ai/client";

// Initialize the fal.ai client
try {
  // Initialize with credentials - can be API key or 'include' for browser auth
  fal.config({
    credentials: 'include',
  });
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

// Define effect type enum to match the API requirements exactly as listed in the documentation
export type EffectType = 
  | "squish" | "muscle" | "inflate" | "crush" | "rotate" | "cakeify"
  | "baby" | "disney-princess" | "painting" | "pirate-captain" 
  | "jungle" | "samurai" | "warrior" | "fire" | "super-saiyan"
  | "gun-shooting" | "deflate" | "hulk" | "bride" | "princess" | "zen" | "assassin"
  | "classy" | "puppy" | "snow-white" | "mona-lisa" | "vip"
  | "timelapse" | "tsunami" | "zoom-call" | "doom-fps" | "fus-ro-dah"
  | "hug-jesus" | "robot-face-reveal"; 

// Define aspect ratio enum
export type AspectRatio = "16:9" | "9:16" | "1:1";

// Define Video Clip interface
export interface VideoClip {
  id: string;
  url: string;
  name: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

// Define MMAudio input interface
export interface MMAudioInput {
  video_url: string;
  prompt: string;
  negative_prompt?: string;
  seed?: number;
  num_steps?: number;
  duration?: number;
  cfg_strength?: number;
  mask_away_clip?: boolean;
}

// Define MMAudio output interface
export interface MMAudioOutput {
  video: {
    url: string;
    file_name: string;
    file_size: number;
    content_type: string;
  };
}

// Define LTXVideo input interface
export interface LTXVideoInput {
  image_url: string;
  prompt?: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
  seed?: number;
  motion_bucket_id?: number;
  noise_aug_strength?: number;
}

// Define LTXVideo output interface
export interface LTXVideoOutput {
  video: {
    url: string;
  };
}

export const falClient = fal;
