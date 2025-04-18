
import { geminiImagePromptTemplate } from "@/utils/promptTemplates";

export class GeminiImageService {
  private apiKey: string = "";

  initialize(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      const envApiKey = localStorage.getItem("geminiApiKey");
      if (envApiKey) {
        this.apiKey = envApiKey;
      }
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem("geminiApiKey", apiKey);
  }

  async generateImage(prompt: string, options: {
    negative_prompt?: string;
    style?: string;
  } = {}): Promise<string> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not set");
    }

    const enhancedPrompt = geminiImagePromptTemplate(prompt, options);

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: enhancedPrompt
              }]
            }],
            generationConfig: {
              temperature: 0.4,
              topK: 32,
              topP: 1,
              maxOutputTokens: 2048,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType?.startsWith('image/')) {
        throw new Error("No image generated");
      }

      const base64Image = data.candidates[0].content.parts[0].inlineData.data;
      return `data:image/png;base64,${base64Image}`;
    } catch (error) {
      console.error("Error generating image with Gemini:", error);
      throw error;
    }
  }
}

export const geminiImageService = new GeminiImageService();
