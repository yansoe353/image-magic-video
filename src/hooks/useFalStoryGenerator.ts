
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { StoryScene, CharacterDetails } from "@/types";
import { falService } from "@/services/falService";

export function useFalStoryGenerator() {
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<StoryScene[]>([]);
  const [storyTitle, setStoryTitle] = useState("");
  const { toast } = useToast();

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
      const prompt = `Create detailed character descriptions for a story about: "${storyPrompt}". 
      Format as JSON with these fields:
      mainCharacter, secondaryCharacters, environment, styleNotes`;

      const response = await falService.generateCompletion(prompt);
      const parsedResponse = JSON.parse(response);

      if (typeof parsedResponse === 'object' && parsedResponse !== null) {
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
      }
      throw new Error("Invalid character template format");
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

      const prompt = `${characterContext}Create a ${sceneCount}-scene story about: "${storyPrompt}".
      Format as JSON array with scenes containing:
      text: scene narrative with character actions/dialogue
      imagePrompt: detailed visual description for ${imageStyle} style`;

      const response = await falService.generateCompletion(prompt);
      let parsedStory: StoryScene[] = [];

      try {
        parsedStory = JSON.parse(response);
      } catch (parseError) {
        console.error("Failed to parse story:", parseError);
        throw new Error("Failed to generate a valid story format");
      }

      if (!Array.isArray(parsedStory)) {
        throw new Error("Generated content is not in the correct format");
      }

      const enhancedStory = parsedStory.map(scene => ({
        text: scene.text,
        imagePrompt: characterDetails.mainCharacter 
          ? `${characterDetails.mainCharacter}. ${scene.imagePrompt} ${imageStyle} style.`
          : `${scene.imagePrompt} ${imageStyle} style.`
      }));

      setGeneratedStory(enhancedStory);
      return enhancedStory;
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
