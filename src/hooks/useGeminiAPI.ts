
import { useState } from "react";

interface GeminiAPIOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

// Hardcoded API key (provided by the application)
const GEMINI_API_KEY = "AIzaSyBAJJLHI8kwwmNJwfuTInH2KYIGs9Nnhbc";

export function useGeminiAPI(options: GeminiAPIOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async (prompt: string): Promise<string> => {
    const {
      temperature = 0.7,
      maxOutputTokens = 1024,
    } = options;

    setIsLoading(true);
    setError(null);
    
    // Add delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Add a small delay to avoid rate-limiting issues
      await delay(300);
      
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
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
        const errorMessage = errorData.error?.message || `HTTP error ${response.status}`;
        console.error("Gemini API error:", errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0 && 
          data.candidates[0].content && 
          data.candidates[0].content.parts && 
          data.candidates[0].content.parts.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        console.error("Unexpected Gemini API response structure:", data);
        throw new Error("No response generated");
      }
    } catch (err) {
      const errorMessage = (err as Error).message || "Unknown error";
      console.error("Gemini API error:", err);
      setError(errorMessage);
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
