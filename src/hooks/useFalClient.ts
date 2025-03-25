
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

// Define effect type enum to match the API requirements
export type EffectType = 
  | "squish" | "muscle" | "inflate" | "crush" | "rotate" | "cakeify"
  | "baby" | "disney-princess" | "painting" | "pirate-captain" 
  | "jungle" | "samurai" | "warrior" | "fire" | "super-saiyan"
  | "gun-shooting" | "deflate" | "hulk" | "bride" | "classy" | "puppy"
  | "snow-white" | "mona-lisa" | "princess" | "vip" | "zen" | "assassin"
  | "timelapse" | "tsunami" | "zoom-call" | "doom-fps" | "fus-ro-dah"
  | "hug-jesus" | "robot-face-reveal";

// Define aspect ratio enum
export type AspectRatio = "16:9" | "9:16" | "1:1";

export const falClient = fal;
