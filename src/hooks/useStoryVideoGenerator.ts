
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { falService } from "@/services/falService";
import { StoryScene } from "@/types";
import { incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";

export function useStoryVideoGenerator() {
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const { toast } = useToast();

  const generateVideoForScene = async (
    scene: StoryScene,
    sceneIndex: number,
    isPublic: boolean,
    storyTitle: string,
    storyPrompt: string,
    onCountsUpdated: () => Promise<void>
  ) => {
    if (!scene?.imageUrl) {
      toast({
        title: "Error",
        description: "Please generate an image first",
        variant: "destructive"
      });
      return;
    }

    setCurrentGeneratingIndex(sceneIndex);

    try {
      const apiKey = localStorage.getItem("falApiKey");
      if (!apiKey) {
        toast({
          title: "Infinity API Key Required",
          description: "Please set your Infinity API key first",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        toast({
          title: "Limit Reached",
          description: "You've used all your video generations",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

      falService.initialize(apiKey);

      const result = await falService.generateVideoFromImage(scene.imageUrl, {
        prompt: scene.imagePrompt || "Animate this image with smooth motion"
      });

      const videoUrl = result.video_url || result.data?.video?.url;
      
      if (videoUrl) {
        const newVideoUrls = [...videoUrls];
        newVideoUrls[sceneIndex] = videoUrl;
        setVideoUrls(newVideoUrls);

        await falService.saveToHistory(
          'video',
          videoUrl,
          scene.imagePrompt,
          isPublic,
          {
            story_title: storyTitle,
            scene_text: scene.text,
            story_prompt: storyPrompt
          }
        );

        await onCountsUpdated();

        toast({
          title: "Success",
          description: "Video generated from scene!",
        });
        
        return videoUrl;
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Video generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate video",
        variant: "destructive"
      });
      return null;
    } finally {
      setCurrentGeneratingIndex(null);
    }
  };

  return {
    currentGeneratingIndex,
    videoUrls,
    setVideoUrls,
    generateVideoForScene
  };
}
