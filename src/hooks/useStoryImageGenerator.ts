
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { falService } from "@/services/falService";
import { StoryScene } from "@/types";
import { incrementImageCount, getRemainingCountsAsync } from "@/utils/usageTracker";

export function useStoryImageGenerator() {
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generateImageForScene = async (
    scene: StoryScene,
    sceneIndex: number,
    isPublic: boolean,
    storyTitle: string,
    storyPrompt: string,
    onImageGenerated: (updatedStory: StoryScene[]) => void,
    onCountsUpdated: () => Promise<void>,
    story: StoryScene[]
  ) => {
    setCurrentGeneratingIndex(sceneIndex);

    try {
      const apiKey = localStorage.getItem("falApiKey");
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set your FAL.ai API key in the settings",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

      const canGenerate = await incrementImageCount();
      if (!canGenerate) {
        toast({
          title: "Limit Reached",
          description: "You've used all your image generations",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

      falService.initialize(apiKey);
      
      console.log("Generating image with prompt:", scene.imagePrompt);
      
      try {
        const result = await falService.generateImageWithImagen3(scene.imagePrompt, {
          aspect_ratio: "1:1",
          negative_prompt: "low quality, bad anatomy, distorted, ugly"
        });

        if (!result || !result.data || !result.data.images || result.data.images.length === 0) {
          throw new Error("No image was returned from the API");
        }

        if (result.data?.images?.[0]?.url) {
          const imageUrl = result.data.images[0].url;
          console.log("Successfully received image URL:", imageUrl);
          
          const updatedStory = [...story];
          updatedStory[sceneIndex] = { ...updatedStory[sceneIndex], imageUrl };
          onImageGenerated(updatedStory);

          await onCountsUpdated();

          await falService.saveToHistory(
            'image',
            imageUrl,
            scene.imagePrompt,
            isPublic,
            {
              story_title: storyTitle,
              scene_text: scene.text,
              story_prompt: storyPrompt
            }
          );

          toast({
            title: "Success",
            description: "Image generated successfully!",
          });
        }
      } catch (apiError) {
        console.error("API error during image generation:", apiError);
        throw new Error(`API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCurrentGeneratingIndex(null);
    }
  };

  return {
    currentGeneratingIndex,
    generateImageForScene
  };
}
