
import { useState } from "react";

interface GeminiAPIOptions {
  apiKey?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export function useGeminiAPI(options: GeminiAPIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async (prompt: string): Promise<string> => {
    const {
      apiKey = localStorage.getItem("GEMINI_API_KEY"),
      temperature = 0.7,
      maxOutputTokens = 1024,
    } = options;

    if (!apiKey) {
      throw new Error("Gemini API key is not set. Please set it in the settings.");
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature,
              maxOutputTokens,
              topP: 0.95,
              topK: 64,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || "Failed to generate response"
        );
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("No response generated");
      }
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateResponse,
    isLoading,
    error,
  };
}
