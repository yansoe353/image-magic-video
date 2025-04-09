import { FalClient } from "@fal.ai/client";
import { v4 as uuidv4 } from 'uuid';

interface FalServiceInterface {
  apiKey: string | null;
  falClient: FalClient | null;
  initialize: (apiKey: string) => void;
  generateImage: (prompt: string, additionalOptions?: any) => Promise<any>;
  generateImageWithImagen: (prompt: string, additionalOptions?: any) => Promise<any>;
  generateAudio: (text: string, additionalOptions?: any) => Promise<any>;
  generateVideoFromImage: (imageUrl: string, additionalOptions?: any) => Promise<any>;
  generateImageWithImagen3: (prompt: string, additionalOptions?: any) => Promise<any>;
  saveToHistory: (type: string, url: string, prompt: string, isPublic: boolean, metadata?: any) => Promise<void>;
}

const falService: FalServiceInterface = {
  apiKey: null,
  falClient: null,

  initialize: function (apiKey: string) {
    this.apiKey = apiKey;
    this.falClient = new FalClient({ apiKey });
  },

  generateImage: async function (prompt: string, additionalOptions: any = {}) {
    if (!this.falClient) {
      throw new Error("FalClient not initialized. Call initialize() first.");
    }

    const falClient = this.falClient;

    const result = await falClient.run({
      data: {
        prompt,
        ...additionalOptions,
      },
    });

    return result;
  },

  generateImageWithImagen: async function (prompt: string, additionalOptions: any = {}) {
    if (!this.falClient) {
      throw new Error("FalClient not initialized. Call initialize() first.");
    }

    const falClient = this.falClient;

    const result = await falClient.run({
      data: {
        prompt,
        ...additionalOptions,
      },
    });

    return result;
  },

  generateAudio: async function (text: string, additionalOptions: any = {}) {
    if (!this.falClient) {
      throw new Error("FalClient not initialized. Call initialize() first.");
    }

    const falClient = this.falClient;

    const result = await falClient.run({
      data: {
        text,
        ...additionalOptions,
      },
    });

    return result;
  },

  generateVideoFromImage: async function (imageUrl: string, additionalOptions: any = {}) {
    if (!this.falClient) {
      throw new Error("FalClient not initialized. Call initialize() first.");
    }

    const falClient = this.falClient;

    try {
      const result = await falClient.submit({
        input: {
          image_url: imageUrl,
          seed: additionalOptions?.seed || Math.floor(Math.random() * 1000000)
        },
        workerId: "playground-video-stable-diffusion"
      }, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      return result;
    } catch (error) {
      console.error("Error generating video:", error);
      throw error;
    }
  },

  generateImageWithImagen3: async function (prompt: string, additionalOptions: any = {}) {
    if (!this.falClient) {
      throw new Error("FalClient not initialized. Call initialize() first.");
    }

    const falClient = this.falClient;

    const result = await falClient.run({
      data: {
        prompt,
        seed: additionalOptions?.seed || Math.floor(Math.random() * 1000000),
      },
    });

    return result;
  },

  saveToHistory: async function (type: string, url: string, prompt: string, isPublic: boolean = false, metadata: any = {}) {
    const userId = localStorage.getItem("userId") || sessionStorage.getItem("userId");
    const falApiKey = localStorage.getItem("falApiKey");

    if (!userId) {
      console.warn("User ID not found. Cannot save to history.");
      return;
    }

    if (!falApiKey) {
      console.warn("Fal API key not found. Cannot save to history.");
      return;
    }

    const historyItem = {
      id: uuidv4(),
      created_at: new Date().toISOString(),
      user_id: userId,
      type: type,
      url: url,
      prompt: prompt,
      is_public: isPublic,
      api_key: falApiKey,
      metadata: metadata,
    };

    try {
      const response = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(historyItem),
      });

      if (!response.ok) {
        console.error('Failed to save to history:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  }
};

export { falService };
