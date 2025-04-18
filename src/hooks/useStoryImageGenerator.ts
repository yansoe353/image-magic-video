
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { StoryScene } from "@/types";
import { incrementImageCount, getRemainingCountsAsync } from "@/utils/usageTracker";
import { geminiImageService } from "@/services/geminiImageService";

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

      // Using the hardcoded API key in geminiImageService
      const imageUrl = await geminiImageService.generateImage(scene.imagePrompt, {
        style: "high quality, detailed, cinematic"
      });

      const updatedStory = [...story];
      updatedStory[sceneIndex] = { ...updatedStory[sceneIndex], imageUrl };
      onImageGenerated(updatedStory);

      await onCountsUpdated();

      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
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
