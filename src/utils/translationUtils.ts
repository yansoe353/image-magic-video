
import { fal } from "@fal-ai/client";

type SupportedLanguage = "en" | "my" | "th";

export const LANGUAGES = {
  en: "English",
  my: "Myanmar",
  th: "Thai"
};

export async function translateText(text: string, from: SupportedLanguage, to: SupportedLanguage): Promise<string> {
  // Don't translate if the languages are the same
  if (from === to) return text;
  if (!text.trim()) return "";
  
  try {
    // Use fal.ai's text translation capabilities
    const result = await fal.subscribe("fal-ai/text-translation", {
      input: {
        text: text,
        source_language: from,
        target_language: to
      },
    });
    
    return result.data?.translated_text || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}
