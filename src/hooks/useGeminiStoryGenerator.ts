
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { StoryScene, CharacterDetails } from "@/types";

export function useGeminiStoryGenerator() {
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<StoryScene[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const { generateResponse } = useGeminiAPI();
  const { toast } = useToast();

  const cleanJsonResponse = (response: string): string => {
    let cleaned = response.replace(/```json|```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  };

  const parseStoryResponse = (response: string): StoryScene[] => {
    try {
      const directParse = JSON.parse(response.trim());
      if (Array.isArray(directParse)) return directParse;
    } catch (e) {}

    try {
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const extracted = codeBlockMatch[1].trim();
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    try {
      const firstBracket = response.indexOf('[');
      const lastBracket = response.lastIndexOf(']');
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        const extracted = response.slice(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    throw new Error("Unable to parse story response");
  };

  const generateCharacterTemplate = async (storyPrompt: string): Promise<CharacterDetails | null> => {
    if (!storyPrompt) {
      toast({
        title: "Error",
        description: "Please enter a story prompt first",
        variant: "destructive"
      });
      return null;
    }

    setIsGeneratingStory(true);
    try {
      const response = await generateResponse(
        `Create detailed character descriptions for a story about: "${storyPrompt}". 
        Provide this information in valid JSON format only:
        {
          "mainCharacter": "Detailed description including age, gender, appearance, clothing and distinctive features",
          "secondaryCharacters": "Descriptions of other important characters",
          "environment": "Description of the main setting/environment",
          "styleNotes": "Specific visual style requirements"
        }
        
        Important: Only return valid JSON without any additional text or explanations.`
      );

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response.trim());
      } catch (e) {
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          parsedResponse = JSON.parse(codeBlockMatch[1].trim());
        } else {
          const firstBrace = response.indexOf('{');
          const lastBrace = response.lastIndexOf('}');
          if (firstBrace >= 0 && lastBrace > firstBrace) {
            parsedResponse = JSON.parse(response.slice(firstBrace, lastBrace + 1));
          } else {
            throw new Error("Could not extract valid JSON");
          }
        }
      }

      if (
        typeof parsedResponse === 'object' && 
        parsedResponse !== null &&
        (parsedResponse.mainCharacter || 
         parsedResponse.secondaryCharacters ||
         parsedResponse.environment ||
         parsedResponse.styleNotes)
      ) {
        const characterDetails = {
          mainCharacter: parsedResponse.mainCharacter || '',
          secondaryCharacters: parsedResponse.secondaryCharacters || '',
          environment: parsedResponse.environment || '',
          styleNotes: parsedResponse.styleNotes || ''
        };
        
        toast({
          title: "Character template created!",
          description: "Review and edit the character details before generating story."
        });
        
        return characterDetails;
      } else {
        throw new Error("Invalid character template format");
      }
    } catch (error) {
      console.error("Error generating character template:", error);
      toast({
        title: "Error",
        description: "Failed to generate character template. Please try again or enter details manually.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const generateStory = async (
    storyPrompt: string, 
    sceneCount: number, 
    characterDetails: CharacterDetails,
    imageStyle: string
  ): Promise<StoryScene[]> => {
    if (!storyPrompt) {
      toast({
        title: "Error",
        description: "Please enter a story prompt",
        variant: "destructive"
      });
      return [];
    }

    setIsGeneratingStory(true);
    setGeneratedStory([]);
    setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);

    try {
      const characterContext = characterDetails.mainCharacter 
        ? `Main Character: ${characterDetails.mainCharacter}\n` +
          `Secondary Characters: ${characterDetails.secondaryCharacters || 'none'}\n` +
          `Environment: ${characterDetails.environment || 'unspecified'}\n` +
          `Style: ${characterDetails.styleNotes || 'unspecified'}\n\n`
        : '';

      const geminiPrompt = `${characterContext}Create a ${sceneCount}-scene story about: "${storyPrompt}".

      Requirements:
      1. Maintain strict consistency with provided character details
      2. Each scene should naturally progress the story
      3. For each scene provide:
         - Narrative text (include character actions/dialogue)
         - Detailed image prompt that maintains visual consistency
      
      Image Prompt Guidelines:
      - Always reference the established character details
      - Maintain consistent clothing/hairstyles/features
      - Keep environment/style coherent
      - Use same character names if provided
      - The image style should be ${imageStyle}
      
      Format response as a JSON array following this exact structure:
      [
        {
          "text": "Scene narrative...",
          "imagePrompt": "Detailed prompt with consistent characters..."
        }
      ]
      
      Important: Only return valid JSON without any other text or markdown.`;

      const response = await generateResponse(geminiPrompt);
      console.log("Raw API response:", response);

      try {
        const parsedStory = parseStoryResponse(response);
        
        if (!Array.isArray(parsedStory)) {
          throw new Error("Response was not an array");
        }

        const isValidStory = parsedStory.every(scene => 
          typeof scene.text === 'string' && 
          typeof scene.imagePrompt === 'string'
        );

        if (!isValidStory) {
          throw new Error("Invalid scene structure");
        }

        const enhancedStory = parsedStory.map(scene => ({
          text: scene.text,
          imagePrompt: characterDetails.mainCharacter 
            ? `${characterDetails.mainCharacter}. ${scene.imagePrompt} ${imageStyle} style.`
            : `${scene.imagePrompt} ${imageStyle} style.`
        }));

        setGeneratedStory(enhancedStory);
        return enhancedStory;
      } catch (parseError) {
        console.error("Failed to parse story:", parseError);
        return await attemptFallbackStoryGeneration(storyPrompt, sceneCount, imageStyle);
      }
    } catch (error) {
      console.error("Story generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try a different prompt.",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const attemptFallbackStoryGeneration = async (storyPrompt: string, sceneCount: number, imageStyle: string): Promise<StoryScene[]> => {
    try {
      toast({
        title: "Trying alternative approach...",
        description: "Having trouble with the story format, attempting simplified version",
        variant: "default"
      });

      const fallbackPrompt = `Create a simple ${sceneCount}-scene story about "${storyPrompt}". 
        Each scene should have:
        1. A paragraph of story text
        2. An image description in ${imageStyle} style
        
        Return as JSON array like: [{"text":"...","imagePrompt":"..."}]`;

      const fallbackResponse = await generateResponse(fallbackPrompt);
      const parsedFallback = parseStoryResponse(fallbackResponse);

      if (Array.isArray(parsedFallback)) {
        setGeneratedStory(parsedFallback);
        toast({
          title: "Success",
          description: "Used simplified story format",
          variant: "default"
        });
        return parsedFallback;
      } else {
        throw new Error("Fallback parse failed");
      }
    } catch (fallbackError) {
      console.error("Fallback generation failed:", fallbackError);
      toast({
        title: "Error",
        description: "Completely failed to generate story. Please try a different prompt.",
        variant: "destructive"
      });
      return [];
    }
  };

  return {
    isGeneratingStory,
    generatedStory,
    storyTitle,
    setStoryTitle,
    generateCharacterTemplate,
    generateStory,
    setGeneratedStory
  };
}
