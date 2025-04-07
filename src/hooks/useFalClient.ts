
import { fal } from "@fal-ai/client";

// Initialize the fal.ai client with the hardcoded API key
const FAL_API_KEY = "fal-RBHZWVhklNMw6Rw9ar9gGg"; // Default public API key for testing

// Initialize the fal.ai client
try {
  // Initialize with the API key
  fal.config({
    credentials: FAL_API_KEY,
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

// Updated LTXVideo input interface to match the required parameters
export interface LTXVideoInput {
  image_url: string;
  prompt: string;
  negative_prompt?: string;
  num_inference_steps?: number;
  guidance_scale?: number;
  width?: number;
  height?: number;
  seed?: number;
  motion_bucket_id?: number;
  noise_aug_strength?: number;
}

// Updated LtxVideoImageToVideoInput interface to match required parameters
export interface LtxVideoImageToVideoInput {
  image_url: string;
  prompt: string;
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

// Define queue status interfaces
export interface QueueLogs {
  message: string;
}

export interface InProgressQueueStatus {
  status: "IN_PROGRESS";
  logs?: QueueLogs[];
}

export interface InQueueQueueStatus {
  status: "IN_QUEUE";
  logs?: QueueLogs[];
}

export type QueueStatus = InProgressQueueStatus | InQueueQueueStatus;

// Create a function to generate video from image using the fal client
export const generateVideoFromImage = async (params: { 
  imageUrl: string; 
  prompt: string;
  negativePrompt?: string;
}) => {
  try {
    const result = await fal.subscribe("fal-ai/ltx-video/image-to-video", {
      input: {
        image_url: params.imageUrl,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || "low quality, bad anatomy, worst quality, deformed, distorted, disfigured",
        guidance_scale: 8.5,
        num_inference_steps: 50,
        // motion_bucket_id is a parameter accepted by the API
        motion_bucket_id: 127
      },
    });

    if (result.data?.video?.url) {
      return {
        success: true,
        videoUrl: result.data.video.url
      };
    } else {
      return {
        success: false,
        error: "No video URL in response"
      };
    }
  } catch (error) {
    console.error("Error generating video:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

export const falClient = fal;

// Export a custom hook for FAL client operations
export const useFalClient = () => {
  return {
    falClient,
    generateVideoFromImage
  };
};
