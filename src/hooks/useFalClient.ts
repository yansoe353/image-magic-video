
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

export const falClient = fal;
