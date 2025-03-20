
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

// Create a context to manage language across the app
import { createContext, useContext, useState, ReactNode } from 'react';

interface LanguageContextType {
  language: LanguageOption;
  setLanguage: (language: LanguageOption) => void;
  translate: (text: string, from?: LanguageOption) => Promise<string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageOption>(() => {
    // Try to get language from localStorage or default to English
    const savedLanguage = localStorage.getItem('preferredLanguage');
    return (savedLanguage as LanguageOption) || 'en';
  });

  // Update localStorage when language changes
  const changeLanguage = (newLanguage: LanguageOption) => {
    setLanguage(newLanguage);
    localStorage.setItem('preferredLanguage', newLanguage);
  };

  // Translate text from source language to current language
  const translate = async (text: string, from: LanguageOption = 'en'): Promise<string> => {
    if (from === language) return text;
    return translateText(text, from, language);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
