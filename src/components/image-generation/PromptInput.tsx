
import { useState, ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Languages } from "lucide-react";
import { LANGUAGES, translateText, LanguageOption } from "@/utils/translationUtils";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export interface PromptInputProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  disabled?: boolean;
}

export const PromptInput = ({ prompt, onPromptChange, disabled }: PromptInputProps) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const { toast } = useToast();

  const handleLanguageChange = async (language: LanguageOption) => {
    if (language === selectedLanguage || !prompt.trim()) {
      setSelectedLanguage(language);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translateText(prompt, selectedLanguage, language);
      onPromptChange(translatedText);
      setSelectedLanguage(language);
      toast({
        title: "Prompt Translated",
        description: `Translated to ${LANGUAGES[language]}`,
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Prompt</label>
        <Select 
          value={selectedLanguage} 
          onValueChange={(value: LanguageOption) => handleLanguageChange(value)}
          disabled={isTranslating || disabled}
        >
          <SelectTrigger className="h-7 w-36">
            <Languages className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(LANGUAGES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        placeholder="Describe the image you want to create... (e.g., A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage)"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        className="min-h-[120px]"
        disabled={isTranslating || disabled}
      />
      {isTranslating && (
        <div className="text-xs text-slate-500 mt-1 flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Translating...
        </div>
      )}
    </div>
  );
};
