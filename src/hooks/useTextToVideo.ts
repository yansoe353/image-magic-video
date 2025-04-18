
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { falService } from "@/services/falService";
import { getUserId } from "@/utils/storageUtils";
import { incrementVideoCount, getRemainingCounts } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";

interface TextToVideoInput {
  text: string;
  style?: string;
  aspect_ratio?: string;
  duration?: number;
  isStory?: boolean;
}

interface TextToVideoResult {
  videoUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  generate: (input: TextToVideoInput) => Promise<void>;
}

export function useTextToVideo(): TextToVideoResult {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const saveToHistory = async (videoUrl: string, text: string, isStory: boolean) => {
    try {
      const userId = await getUserId();
      if (!userId) return;

      await falService.saveToHistory(
        'video',
        videoUrl,
        text.substring(0, 200),
        false,
        {
          type: isStory ? 'story-to-video' : 'script-to-video',
        }
      );

      console.log(`${isStory ? 'Story' : 'Script'} video saved to history`);
    } catch (error) {
      console.error(`Failed to save ${isStory ? 'story' : 'script'} video to history:`, error);
    }
  };

  const generate = async (input: TextToVideoInput) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log(`Starting ${input.isStory ? 'story' : 'script'} to video generation`);
      
      // Check if user can generate more videos
      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        throw new Error("You have reached your video generation limit");
      }
      
      // Make sure falService is initialized with latest key
      falService.initialize();
      
      // Generate the video based on input type
      const result = input.isStory 
        ? await falService.generateStoryVideo(input.text, {
            style: input.style,
            aspect_ratio: input.aspect_ratio,
            duration: input.duration
          })
        : await falService.generateScriptVideo(input.text, {
            style: input.style,
            aspect_ratio: input.aspect_ratio,
            duration: input.duration
          });
      
      // Handle response format from API
      let videoData = result?.video_url || 
          result?.data?.video?.url || 
          result?.url || 
          (result?.output && typeof result.output === 'string' ? result.output : null);
      
      if (!videoData && result?.data?.images?.[0]?.url) {
        // If we got an image instead of video, set that
        videoData = result.data.images[0].url;
        console.log("Received image instead of video:", videoData);
      }
      
      if (videoData) {
        setVideoUrl(videoData);
        console.log(`${input.isStory ? 'Story' : 'Script'} video generated successfully`);
        
        // Store the generated video in user history
        await saveToHistory(videoData, input.text, input.isStory || false);
      } else {
        console.error("Unexpected API response format:", result);
        throw new Error(`No video was returned from the API. Check console for details.`);
      }
    } catch (e) {
      console.error(`Error generating ${input.isStory ? 'story' : 'script'} video:`, e);
      setError(e instanceof Error ? e.message : "Unknown error occurred");
      toast({
        title: "Video Generation Failed",
        description: e instanceof Error ? e.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    videoUrl,
    isGenerating,
    error,
    generate
  };
}
