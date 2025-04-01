
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages } from "lucide-react";
import { LANGUAGES, type LanguageOption } from "@/utils/translationUtils";

export interface PromptInputProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  negativePrompt: string;
  onNegativePromptChange: (value: string) => void;
  isGenerating?: boolean;
  language?: LanguageOption;
  onLanguageChange?: (language: LanguageOption) => void;
  isTranslating?: boolean;
}

export const PromptInput = ({
  prompt,
  onPromptChange,
  negativePrompt,
  onNegativePromptChange,
  isGenerating = false,
  language = "en",
  onLanguageChange,
  isTranslating = false
}: PromptInputProps) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="prompt">Prompt</Label>
          {onLanguageChange && (
            <Select
              value={language}
              onValueChange={(value: LanguageOption) => onLanguageChange(value)}
              disabled={isGenerating || isTranslating}
            >
              <SelectTrigger className="h-7 w-36">
                <Languages className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LANGUAGES).map(([value, label]) => (
                  <SelectItem key={value} value={value as LanguageOption}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Textarea
          id="prompt"
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          className="min-h-[100px]"
          disabled={isGenerating || isTranslating}
        />
      </div>

      <div>
        <Label htmlFor="negativePrompt">Negative Prompt</Label>
        <Textarea
          id="negativePrompt"
          placeholder="Describe what you don't want to see in the image..."
          value={negativePrompt}
          onChange={(e) => onNegativePromptChange(e.target.value)}
          className="min-h-[60px]"
          disabled={isGenerating}
        />
      </div>
    </div>
  );
};
