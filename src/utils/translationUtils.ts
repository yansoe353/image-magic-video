
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
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data[0][0][0]; // Return translated text
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

