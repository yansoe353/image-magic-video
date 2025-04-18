
import { useState } from 'react';
import { StoryScene, CharacterDetails } from '@/types';
import { falService } from '@/services/falService';
import { useToast } from '@/hooks/use-toast';

export function useFalStoryGenerator() {
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<StoryScene[]>([]);
  const [storyTitle, setStoryTitle] = useState('');
  const { toast } = useToast();

  const generateCharacterTemplate = async (prompt: string) => {
    try {
      const templatePrompt = `Generate character details template for a story about: ${prompt}. Return a JSON object with name, age, background, and personality.`;
      
      const response = await falService.generateCompletion(templatePrompt);
      try {
        return JSON.parse(response);
      } catch {
        console.error('Failed to parse character template');
        return null;
      }
    } catch (error) {
      console.error('Error generating character template:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate character template',
        variant: 'destructive',
      });
      return null;
    }
  };

  const generateStory = async (
    prompt: string,
    numScenes: number,
    characterDetails: CharacterDetails,
    visualStyle: string
  ) => {
    setIsGeneratingStory(true);

    try {
      const storyPrompt = `
Create a ${numScenes}-scene story about: "${prompt}"
Include character details: ${JSON.stringify(characterDetails)}
Return a JSON array of scenes with format:
[{
  "sceneNumber": 1,
  "description": "Scene setting description",
  "dialogue": "CHARACTER: dialogue text",
  "imagePrompt": "Visual prompt for ${visualStyle} style image generation"
}]
Return ONLY the JSON array, no other text.`;

      const response = await falService.generateCompletion(storyPrompt);
      
      try {
        const parsedStory = JSON.parse(response);
        if (Array.isArray(parsedStory)) {
          setGeneratedStory(parsedStory);
          return parsedStory;
        }
      } catch (error) {
        console.error('Failed to parse story JSON:', error);
      }

      throw new Error('Failed to generate valid story format');
    } catch (error) {
      console.error('Story generation failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate story. Please try again.',
        variant: 'destructive',
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
    setGeneratedStory,
  };
}
