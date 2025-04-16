
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
      console.error(`Translation API HTTP error: ${response.status}`);
      throw new Error(`Translation API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if the response structure is as expected
    if (!data || !Array.isArray(data) || !data[0]) {
      console.error("Unexpected translation API response structure:", data);
      throw new Error("Unexpected response structure from translation API");
    }
    
    // Extract the translated text from the response
    const translatedTextParts = data[0]
      .filter(part => Array.isArray(part) && part[0])
      .map(part => part[0]);
    
    if (translatedTextParts.length === 0) {
      throw new Error("No translated text found in API response");
    }
    
    return translatedTextParts.join(" ");
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}
