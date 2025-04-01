
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { translateText, type LanguageOption } from "@/utils/translationUtils";

export function usePromptTranslation(initialPrompt: string) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleLanguageChange = async (language: LanguageOption) => {
    if (language === selectedLanguage || !prompt.trim()) {
      setSelectedLanguage(language);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translateText(prompt, selectedLanguage, language);
      setPrompt(translatedText);
      setSelectedLanguage(language);
      toast({
        title: "Prompt Translated",
        description: `Translated to ${language}`,
      });
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate text",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    prompt,
    setPrompt,
    selectedLanguage,
    isTranslating,
    handleLanguageChange
  };
}
