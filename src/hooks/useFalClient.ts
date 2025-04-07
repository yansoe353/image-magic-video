import { fal } from "@fal-ai/client";

// Initialize the fal.ai client
try {
  fal.config({
    credentials: process.env.FAL_KEY || 'include',
  });
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

// Type definitions
export type VideoModel = 'ltx' | 'kling';
export type KlingVersion = '1.6' | '1.6-pro';
export type Duration = 5 | 10;
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type CameraControl = 
  | "down_back" | "forward_up" | "right_turn_forward" | "left_turn_forward";

interface DynamicMask {
  mask_url: string;
  trajectories: {
    x: number;
    y: number;
  }[];
}

interface CameraMovement {
  movement_type: "horizontal" | "vertical" | "pan" | "tilt" | "roll" | "zoom";
  movement_value: number;
}

interface GenerationOptions {
  logs?: boolean;
  onQueueUpdate?: (update: QueueUpdate) => void;
  webhookUrl?: string;
}

interface QueueUpdate {
  status: "IN_PROGRESS" | "IN_QUEUE" | "COMPLETED" | "FAILED";
  logs?: { message: string }[];
}

interface VideoOutput {
  video: {
    url: string;
    file_name?: string;
    file_size?: number;
    content_type?: string;
  };
}

interface GenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  modelUsed: VideoModel;
  requestId?: string;
  logs?: string[];
}

// Main generation function with full parameter support
export const generateVideoFromImage = async ({
  imageUrl,
  prompt,
  negativePrompt = "",
  model = 'ltx',
  modelParams = {},
  options = {}
}: {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  model?: VideoModel;
  modelParams?: {
    // Common parameters
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
    camera_control?: CameraControl;
    advanced_camera_control?: CameraMovement;
  };
  options?: GenerationOptions;
}): Promise<GenerationResult> => {
  const startTime = Date.now();
  const logs: string[] = [];
  
  try {
    // Validate input
    if (!imageUrl) {
      throw new Error("Image URL is required");
    }
    if (!prompt) {
      throw new Error("Prompt is required");
    }

    const modelPath = model === 'ltx' 
      ? "fal-ai/ltx-video/image-to-video" 
      : `fal-ai/kling-video/${modelParams.version || '1.6'}/${modelParams.version === '1.6-pro' ? 'pro' : 'standard'}/image-to-video`;

    logs.push(`Starting ${model.toUpperCase()} video generation`);
    logs.push(`Model path: ${modelPath}`);
    logs.push(`Image: ${imageUrl.substring(0, 50)}...`);
    logs.push(`Prompt: ${prompt.substring(0, 100)}...`);

    const baseInput = {
      image_url: imageUrl,
      prompt: prompt,
      negative_prompt: negativePrompt || "low quality, bad anatomy, worst quality, deformed, distorted, disfigured",
    };

    const input = model === 'ltx' ? {
      ...baseInput,
      guidance_scale: modelParams.guidance_scale ?? 8.5,
      num_inference_steps: modelParams.num_inference_steps ?? 50,
      motion_bucket_id: modelParams.motion_bucket_id ?? 127,
      noise_aug_strength: modelParams.noise_aug_strength ?? 0.02
    } : {
      ...baseInput,
      duration: modelParams.duration ?? 5,
      aspect_ratio: modelParams.aspect_ratio ?? "16:9",
      cfg_scale: modelParams.cfg_scale ?? 0.5,
      ...(modelParams.tail_image_url && { tail_image_url: modelParams.tail_image_url }),
      ...(modelParams.static_mask_url && { static_mask_url: modelParams.static_mask_url }),
      ...(modelParams.dynamic_masks && { dynamic_masks: modelParams.dynamic_masks }),
      ...(modelParams.version === '1.6-pro' && modelParams.camera_control && { 
        camera_control: modelParams.camera_control 
      }),
      ...(modelParams.version === '1.6-pro' && modelParams.advanced_camera_control && { 
        advanced_camera_control: modelParams.advanced_camera_control 
      })
    };

    logs.push(`Generation parameters: ${JSON.stringify(input, null, 2)}`);

    const result = await fal.subscribe(modelPath, {
      input,
      logs: options.logs ?? true,
      onQueueUpdate: (update) => {
        if (options.onQueueUpdate) {
          options.onQueueUpdate(update);
        }
        if (update.logs) {
          update.logs.forEach(log => logs.push(log.message));
        }
      },
      webhookUrl: options.webhookUrl
    });

    const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);
    logs.push(`Generation completed in ${generationTime} seconds`);

    if (result?.data?.video?.url) {
      logs.push(`Video generated successfully: ${result.data.video.url}`);
      return {
        success: true,
        videoUrl: result.data.video.url,
        modelUsed: model,
        requestId: result.requestId,
        logs
      };
    } else {
      const errorMsg = result?.error?.message || "No video URL in response";
      logs.push(errorMsg);
      return {
        success: false,
        error: errorMsg,
        modelUsed: model,
        requestId: result?.requestId,
        logs
      };
    }
  } catch (error: any) {
    const errorMsg = error?.response?.data?.error?.message || 
                    error?.message || 
                    "Failed to generate video";
    logs.push(`Error: ${errorMsg}`);
    console.error("Video generation error:", error);
    return {
      success: false,
      error: errorMsg,
      modelUsed: model,
      logs
    };
  }
};

// Queue management functions
export const getQueueStatus = async (
  requestId: string, 
  model: VideoModel = 'ltx', 
  version: KlingVersion = '1.6'
): Promise<QueueUpdate> => {
  const modelPath = model === 'ltx' 
    ? "fal-ai/ltx-video/image-to-video" 
    : `fal-ai/kling-video/${version}/${version === '1.6-pro' ? 'pro' : 'standard'}/image-to-video`;

  try {
    const status = await fal.queue.status(modelPath, { requestId });
    return {
      status: status.status,
      logs: status.logs
    };
  } catch (error: any) {
    console.error("Error getting queue status:", error);
    throw new Error(`Failed to get queue status: ${error.message}`);
  }
};

export const getResult = async (
  requestId: string, 
  model: VideoModel = 'ltx', 
  version: KlingVersion = '1.6'
): Promise<VideoOutput> => {
  const modelPath = model === 'ltx' 
    ? "fal-ai/ltx-video/image-to-video" 
    : `fal-ai/kling-video/${version}/${version === '1.6-pro' ? 'pro' : 'standard'}/image-to-video`;

  try {
    const result = await fal.queue.result(modelPath, { requestId });
    if (!result.data?.video?.url) {
      throw new Error("No video URL in response");
    }
    return {
      video: {
        url: result.data.video.url,
        file_name: result.data.video.file_name,
        file_size: result.data.video.file_size,
        content_type: result.data.video.content_type
      }
    };
  } catch (error: any) {
    console.error("Error getting result:", error);
    throw new Error(`Failed to get result: ${error.message}`);
  }
};

// File upload utility
export const uploadFile = async (file: File): Promise<string> => {
  try {
    const result = await fal.storage.upload(file);
    if (!result.url) {
      throw new Error("No URL returned from upload");
    }
    return result.url;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw new Error(`File upload failed: ${error.message}`);
  }
};

// Custom hook
export const useFalClient = () => {
  return {
    generateVideoFromImage,
    getQueueStatus,
    getResult,
    uploadFile,
    falClient: fal
  };
};
