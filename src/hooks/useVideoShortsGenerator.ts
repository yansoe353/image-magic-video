
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
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const { toast } = useToast();
  const { generateResponse } = useGeminiAPI();
  
  const checkApiKeys = async () => {
    // Check if all necessary API keys are set
    // For demo purposes, we'll just check if we can use the main services
    const pexelsKey = localStorage.getItem("pexelsApiKey");
    const azureKey = localStorage.getItem("azureSpeechApiKey");
    const assemblyAIKey = localStorage.getItem("assemblyAIApiKey");
    
    // Initialize services with keys if available
    if (pexelsKey) {
      pexelsService.initialize(pexelsKey);
    }
    
    if (azureKey) {
      azureSpeechService.initialize(azureKey);
    }
    
    if (assemblyAIKey) {
      assemblyAIService.initialize(assemblyAIKey);
    }
    
    // Check if all keys are present
    setHasApiKeys(!!pexelsKey && !!azureKey && !!assemblyAIKey);
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
      // Extract JSON from the response
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
      // Fallback: If JSON parsing fails, use the raw text
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
      // Extract JSON array from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse image prompts from AI response");
      }
    } catch (error) {
      console.error("Error parsing image prompts:", error);
      // Fallback: If JSON parsing fails, create basic prompts from the script
      const sentences = script.split(/[.!?]+/).filter(s => s.trim().length > 10);
      return sentences.slice(0, 4).map(s => s.trim());
    }
  };
  
  const fetchImages = async (imagePrompts: string[]): Promise<string[]> => {
    // Check if we should use Gemini or Pexels
    const pexelsKey = localStorage.getItem("pexelsApiKey");
    
    if (pexelsKey) {
      // Use Pexels API
      pexelsService.initialize(pexelsKey);
      const images = await Promise.all(
        imagePrompts.map(async (prompt) => {
          try {
            return await pexelsService.getRandomImage(prompt);
          } catch (error) {
            console.error(`Error fetching image for prompt "${prompt}":`, error);
            // Fallback to a simpler search term
            const simplifiedPrompt = prompt.split(' ').slice(0, 2).join(' ');
            return await pexelsService.getRandomImage(simplifiedPrompt);
          }
        })
      );
      return images;
    } else {
      // Use Gemini for image generation
      const images = await Promise.all(
        imagePrompts.map(async (prompt) => {
          try {
            return await geminiImageService.generateImage(prompt, {
              style: "high quality, detailed, cinematic"
            });
          } catch (error) {
            console.error(`Error generating image for prompt "${prompt}":`, error);
            // Try with a simplified prompt
            const simplifiedPrompt = "High quality image of " + prompt.split(' ').slice(0, 3).join(' ');
            return await geminiImageService.generateImage(simplifiedPrompt, {
              style: "photorealistic, detailed"
            });
          }
        })
      );
      return images;
    }
  };
  
  const generateAudio = async (script: string, voice: string): Promise<string> => {
    const azureKey = localStorage.getItem("azureSpeechApiKey");
    
    if (azureKey) {
      azureSpeechService.initialize(azureKey);
      return await azureSpeechService.textToSpeech(script, voice);
    } else {
      throw new Error("Azure Speech API key not set");
    }
  };
  
  const generateCaptions = async (audioUrl: string): Promise<string> => {
    const assemblyAIKey = localStorage.getItem("assemblyAIApiKey");
    
    if (assemblyAIKey) {
      assemblyAIService.initialize(assemblyAIKey);
      return await assemblyAIService.generateSrtCaptions(audioUrl);
    } else {
      throw new Error("AssemblyAI API key not set");
    }
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
      
      // Step 1: Generate script
      const scriptData = await generateScript(config.topic);
      setProgress(20);
      
      // Step 2: Generate image prompts and fetch images
      setCurrentStep("images");
      const imagePrompts = await generateImagePrompts(scriptData.script);
      const imageUrls = await fetchImages(imagePrompts);
      setProgress(40);
      
      // Step 3: Generate audio
      setCurrentStep("audio");
      const audioUrl = await generateAudio(scriptData.script, config.voiceOption);
      setProgress(60);
      
      // Step 4: Generate captions if needed
      let captionsText = "";
      if (config.addCaptions) {
        setCurrentStep("captions");
        captionsText = await generateCaptions(audioUrl);
        setProgress(80);
      }
      
      // Step 5: Create a placeholder for the final video (in a real app, this would use a video rendering service)
      setCurrentStep("video");
      
      // For demo purposes, let's just use the audio as our "video" until we implement a real video renderer
      const videoUrl = audioUrl;
      const thumbnailUrl = imageUrls[0];
      
      // Upload to storage if needed
      // let finalVideoUrl = videoUrl;
      // if (config.isPublic) {
      //   finalVideoUrl = await uploadUrlToStorage(videoUrl, "video", null, true);
      // }
      
      // Create the video short object
      const newVideoShort: VideoShort = {
        id: Date.now().toString(),
        title: scriptData.title,
        description: scriptData.description,
        script: scriptData.script,
        videoUrl,
        thumbnailUrl,
        audioUrl,
        imageUrls,
        captionsText: config.addCaptions ? captionsText : undefined,
        isPublic: config.isPublic,
        createdAt: new Date().toISOString()
      };
      
      setVideoShort(newVideoShort);
      setProgress(100);
      
      // Update usage counts
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
