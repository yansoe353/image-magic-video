import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { VideoShort, VideoShortConfiguration } from "@/types";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { geminiImageService } from "@/services/geminiImageService";
import { pexelsService } from "@/services/pexelsService";
import { azureSpeechService } from "@/services/azureSpeechService";
import { assemblyAIService } from "@/services/assemblyAIService";
import { uploadUrlToStorage } from "@/utils/storageUtils";
import { incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";

export function useVideoShortsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<"script" | "images" | "audio" | "captions" | "video" | null>(null);
  const [videoShort, setVideoShort] = useState<VideoShort | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState(true);
  const { toast } = useToast();
  const { generateResponse } = useGeminiAPI();
  
  const checkApiKeys = async () => {
    setHasApiKeys(true);
  };
  
  const generateScript = async (topic: string): Promise<{script: string, title: string, description: string}> => {
    const prompt = `
      Generate a SHORT script for a social media video about the following topic: "${topic}"
      
      The script should:
      1. Be 30-60 seconds long when read aloud
      2. Be engaging and straight to the point
      3. Be written in a conversational tone
      4. Include an attention-grabbing intro and a clear call to action
      
      Format your response as a JSON object with:
      {
        "title": "Catchy title for the video",
        "description": "Brief description of the video",
        "script": "The full script text"
      }
      
      IMPORTANT: Keep the script SHORT - no more than 100-150 words total!
    `;
    
    const response = await generateResponse(prompt);
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scriptData = JSON.parse(jsonMatch[0]);
        return {
          script: scriptData.script,
          title: scriptData.title,
          description: scriptData.description
        };
      } else {
        throw new Error("Could not parse script from AI response");
      }
    } catch (error) {
      console.error("Error parsing script:", error);
      return {
        script: response,
        title: topic,
        description: "AI-generated video about " + topic
      };
    }
  };
  
  const generateImagePrompts = async (script: string): Promise<string[]> => {
    const prompt = `
      Based on this script for a short video:
      "${script}"
      
      Generate 3-5 descriptive image prompts that would work well for this video.
      Each prompt should describe a scene that complements different parts of the script.
      
      Format your response as a JSON array of strings, with each string being an image prompt.
      Example: ["image prompt 1", "image prompt 2", "image prompt 3"]
      
      Make the prompts descriptive enough for high-quality image generation.
    `;
    
    const response = await generateResponse(prompt);
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse image prompts from AI response");
      }
    } catch (error) {
      console.error("Error parsing image prompts:", error);
      const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 10);
      return sentences.slice(0, 4).map(s => s.trim());
    }
  };
  
  const fetchImages = async (imagePrompts: string[]): Promise<string[]> => {
    const images = await Promise.all(
      imagePrompts.map(async (prompt) => {
        try {
          return await pexelsService.getRandomImage(prompt);
        } catch (error) {
          console.error(`Error fetching image for prompt "${prompt}":`, error);
          const simplifiedPrompt = prompt.split(' ').slice(0, 2).join(' ');
          return await pexelsService.getRandomImage(simplifiedPrompt);
        }
      })
    );
    return images;
  };
  
  const generateAudio = async (script: string, voice: string): Promise<string> => {
    return await azureSpeechService.textToSpeech(script, voice);
  };
  
  const generateCaptions = async (audioUrl: string): Promise<string> => {
    return await assemblyAIService.generateSrtCaptions(audioUrl);
  };
  
  const generateShort = async (config: VideoShortConfiguration): Promise<void> => {
    try {
      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        toast({
          title: "Limit Reached",
          description: "You've used all your video generations for today",
          variant: "destructive",
        });
        return;
      }
      
      setIsGenerating(true);
      setProgress(0);
      setCurrentStep("script");
      
      const scriptData = await generateScript(config.topic);
      setProgress(20);
      
      setCurrentStep("images");
      const imagePrompts = await generateImagePrompts(scriptData.script);
      const imageUrls = await fetchImages(imagePrompts);
      setProgress(40);
      
      setCurrentStep("audio");
      const audioUrl = await generateAudio(scriptData.script, config.voiceOption);
      setProgress(60);
      
      let captionsText = "";
      if (config.addCaptions) {
        setCurrentStep("captions");
        captionsText = await generateCaptions(audioUrl);
        setProgress(80);
      }
      
      setCurrentStep("video");
      
      const newVideoShort: VideoShort = {
        id: Date.now().toString(),
        title: scriptData.title,
        description: scriptData.description,
        script: scriptData.script,
        videoUrl: audioUrl,
        thumbnailUrl: imageUrls[0],
        audioUrl,
        imageUrls,
        captionsText: config.addCaptions ? captionsText : undefined,
        isPublic: config.isPublic,
        createdAt: new Date().toISOString()
      };
      
      setVideoShort(newVideoShort);
      setProgress(100);
      
      await getRemainingCountsAsync();
      
      toast({
        title: "Video Short Generated",
        description: "Your video short has been created successfully!",
      });
    } catch (error) {
      console.error("Error generating video short:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video short",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
    }
  };
  
  return {
    generateShort,
    isGenerating,
    progress,
    currentStep,
    videoShort,
    hasApiKeys,
    checkApiKeys
  };
}
