
import { fal } from "@fal-ai/client";

// Initialize the fal.ai client
const initializeFalClient = () => {
  try {
    // Check for API key in localStorage first
    const storedApiKey = localStorage.getItem("falApiKey");
    
    if (storedApiKey) {
      fal.config({
        credentials: storedApiKey
      });
      console.log("fal.ai client initialized with stored API key");
      return true;
    } else {
      console.log("No API key found in localStorage");
      return false;
    }
  } catch (error) {
    console.error("Error initializing fal.ai client:", error);
    return false;
  }
};

// Initialize the client
const isInitialized = initializeFalClient();

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

export const falClient = fal;
export const isFalInitialized = isInitialized;
