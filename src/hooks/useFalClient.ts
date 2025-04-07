import { fal } from "@fal-ai/client";

// Initialize the fal.ai client
try {
  fal.config({
    credentials: 'include',
  });
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

// Define model types and versions
export type VideoModel = 'ltx' | 'kling';
export type KlingVersion = '1.6' | '1.6-pro';
export type Duration = 5 | 10;
export type AspectRatio = "16:9" | "9:16" | "1:1";

// Model credit costs
export const MODEL_CREDITS: Record<VideoModel, number> = {
  ltx: 1,
  kling: 8
};

// Effect type enum
export type EffectType = 
  | "squish" | "muscle" | "inflate" | "crush" | "rotate" | "cakeify"
  | "baby" | "disney-princess" | "painting" | "pirate-captain" 
  | "jungle" | "samurai" | "warrior" | "fire" | "super-saiyan"
  | "gun-shooting" | "deflate" | "hulk" | "bride" | "princess" | "zen" | "assassin"
  | "classy" | "puppy" | "snow-white" | "mona-lisa" | "vip"
  | "timelapse" | "tsunami" | "zoom-call" | "doom-fps" | "fus-ro-dah"
  | "hug-jesus" | "robot-face-reveal";

// Video Clip interface
export interface VideoClip {
  id: string;
  url: string;
  name: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

// Kling API specific interfaces
export interface KlingVideoInput {
  prompt: string;
  image_url: string;
  duration?: Duration;
  aspect_ratio?: AspectRatio;
  negative_prompt?: string;
  cfg_scale?: number;
  tail_image_url?: string;
  static_mask_url?: string;
  dynamic_masks?: DynamicMask[];
  version?: KlingVersion;
}

export interface DynamicMask {
  mask_url: string;
  trajectories: Trajectory[];
}

export interface Trajectory {
  x: number;
  y: number;
}

export interface KlingProVideoInput extends KlingVideoInput {
  camera_control?: CameraControlEnum;
  advanced_camera_control?: CameraControl;
}

export type CameraControlEnum = 
  | "down_back" | "forward_up" | "right_turn_forward" | "left_turn_forward";

export interface CameraControl {
  movement_type: MovementTypeEnum;
  movement_value: number;
}

export type MovementTypeEnum = 
  | "horizontal" | "vertical" | "pan" | "tilt" | "roll" | "zoom";

// LTX Video interfaces
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

// Common output interface
export interface VideoOutput {
  video: {
    url: string;
    file_name?: string;
    file_size?: number;
    content_type?: string;
  };
}

// Queue status interfaces
export interface QueueLogs {
  message: string;
}

export interface QueueUpdate {
  status: "IN_PROGRESS" | "IN_QUEUE" | "COMPLETED" | "FAILED";
  logs?: QueueLogs[];
}

// Generation options
export interface GenerationOptions {
  logs?: boolean;
  onQueueUpdate?: (update: QueueUpdate) => void;
  webhookUrl?: string;
}

// Main generation function
export const generateVideoFromImage = async (params: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  model?: VideoModel;
  modelParams?: {
    // Common params
    duration?: Duration;
    aspect_ratio?: AspectRatio;
    cfg_scale?: number;
    
    // LTX specific
    num_inference_steps?: number;
    guidance_scale?: number;
    motion_bucket_id?: number;
    noise_aug_strength?: number;
    
    // Kling specific
    version?: KlingVersion;
    tail_image_url?: string;
    static_mask_url?: string;
    dynamic_masks?: DynamicMask[];
    camera_control?: CameraControlEnum;
    advanced_camera_control?: CameraControl;
  };
  options?: GenerationOptions;
}): Promise<{
  success: boolean;
  videoUrl?: string;
  error?: string;
  modelUsed: VideoModel;
  requestId?: string;
}> => {
  try {
    const baseInput = {
      image_url: params.imageUrl,
      prompt: params.prompt,
      negative_prompt: params.negativePrompt || "low quality, bad anatomy, worst quality, deformed, distorted, disfigured",
    };

    const model = params.model || 'ltx';
    const modelPath = model === 'ltx' 
      ? "fal-ai/ltx-video/image-to-video" 
      : `fal-ai/kling-video/${params.modelParams?.version || '1.6'}/standard/image-to-video`;

    const input = model === 'ltx' ? {
      ...baseInput,
      guidance_scale: params.modelParams?.guidance_scale ?? 8.5,
      num_inference_steps: params.modelParams?.num_inference_steps ?? 50,
      motion_bucket_id: params.modelParams?.motion_bucket_id ?? 127,
      noise_aug_strength: params.modelParams?.noise_aug_strength ?? 0.02
    } : {
      ...baseInput,
      duration: params.modelParams?.duration ?? 5,
      aspect_ratio: params.modelParams?.aspect_ratio ?? "16:9",
      cfg_scale: params.modelParams?.cfg_scale ?? 0.5,
      tail_image_url: params.modelParams?.tail_image_url,
      static_mask_url: params.modelParams?.static_mask_url,
      dynamic_masks: params.modelParams?.dynamic_masks,
      ...(params.modelParams?.version === '1.6-pro' ? {
        camera_control: params.modelParams?.camera_control,
        advanced_camera_control: params.modelParams?.advanced_camera_control
      } : {})
    };

    const result = await fal.subscribe(modelPath, {
      input,
      logs: params.options?.logs ?? true,
      onQueueUpdate: params.options?.onQueueUpdate,
      webhookUrl: params.options?.webhookUrl
    });

    if (result.data?.video?.url) {
      return {
        success: true,
        videoUrl: result.data.video.url,
        modelUsed: model,
        requestId: result.requestId
      };
    } else {
      return {
        success: false,
        error: "No video URL in response",
        modelUsed: model,
        requestId: result.requestId
      };
    }
  } catch (error: any) {
    console.error("Error generating video:", error);
    return {
      success: false,
      error: error.message,
      modelUsed: params.model || 'ltx'
    };
  }
};

// Additional utility functions
export const getQueueStatus = async (requestId: string, model: VideoModel = 'ltx') => {
  const modelPath = model === 'ltx' 
    ? "fal-ai/ltx-video/image-to-video" 
    : "fal-ai/kling-video/v1.6/standard/image-to-video";
  
  return await fal.queue.status(modelPath, { requestId });
};

export const getResult = async (requestId: string, model: VideoModel = 'ltx') => {
  const modelPath = model === 'ltx' 
    ? "fal-ai/ltx-video/image-to-video" 
    : "fal-ai/kling-video/v1.6/standard/image-to-video";
  
  return await fal.queue.result(modelPath, { requestId });
};

export const falClient = fal;

// Custom hook for FAL client operations
export const useFalClient = () => {
  return {
    falClient,
    generateVideoFromImage,
    getQueueStatus,
    getResult
  };
};
