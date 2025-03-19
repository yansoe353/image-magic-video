import franc from 'franc';

type SupportedLanguage = "en" | "my" | "th";

export const LANGUAGES = {
  en: "English",
  my: "Myanmar",
  th: "Thai"
};

export type LanguageOption = keyof typeof LANGUAGES;

export async function translateText(text: string, from: SupportedLanguage, to: SupportedLanguage): Promise<string> {
  // Don't translate if the languages are the same
  if (from === to) return text;
  if (!text.trim()) return "";

  try {
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if the response structure is as expected
    if (data && data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0]; // Return translated text
    } else {
      throw new Error("Unexpected response structure from translation API");
    }
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

export function detectLanguage(text: string): SupportedLanguage {
  const detectedLang = franc(text);
  if (detectedLang === 'mya') return 'my';
  if (detectedLang === 'tha') return 'th';
  return 'en';
}
