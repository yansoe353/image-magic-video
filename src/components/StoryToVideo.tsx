import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, BookOpenText, ImageIcon, Mic, Film } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { fal } from "@fal-ai/client";
import { incrementImageCount, incrementVideoCount, getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import VideoPreview from "./VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import { useVideoEditor } from "@/hooks/useVideoEditor";
import ProLabel from "./ProLabel";
import KlingAILabel from "./KlingAILabel";
import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';

interface StoryFrame {
  text: string;
  imagePrompt: string;
  imageUrl: string | null;
}

interface StoryToVideoProps {
  onVideoGenerated?: (videoUrl: string) => void;
}

const StoryToVideo = ({ onVideoGenerated }: StoryToVideoProps) => {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingVoiceover, setIsGeneratingVoiceover] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [storyFrames, setStoryFrames] = useState<StoryFrame[]>([]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const [narratorVoice, setNarratorVoice] = useState("alloy");
  const [voiceoverText, setVoiceoverText] = useState("");
  const [voiceoverUrl, setVoiceoverUrl] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("falApiKey") || "");
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(!!localStorage.getItem("falApiKey"));
  const [progressPercent, setProgressPercent] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [slideDuration, setSlideDuration] = useState(5);

  const { generateResponse } = useGeminiAPI();
  const { toast } = useToast();
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { createSlideshowFromImages, isProcessing } = useVideoEditor();
  const [counts, setCounts] = useState(getRemainingCounts());

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      localStorage.setItem("falApiKey", apiKey);
      fal.config({
        credentials: apiKey
      });
      setIsApiKeySet(true);
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const generateStoryScript = async () => {
    if (!storyPrompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a story prompt",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScript(true);
    setCurrentStep(1);
    setProgressPercent(10);
    setLogs([]);
    addLog("Generating story script...");

    try {
      const prompt = `
        Create a short visual story based on this prompt: "${storyPrompt}".

        Format your response as JSON with the following structure:
        {
          "title": "Story Title",
          "frames": [
            {
              "text": "Scene description for narration",
              "imagePrompt": "Detailed prompt for image generation"
            }
          ]
        }

        Create 5-7 frames that tell a coherent story. For each frame:
        - text: Write a clear, engaging narration (40-60 words)
        - imagePrompt: Create a detailed description for image generation (20-30 words)

        Make sure the JSON is valid and properly formatted.
      `;

      const response = await generateResponse(prompt);
      console.log("AI response:", response);

      let jsonResponse;
      try {
        const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) ||
                          response.match(/{[\s\S]*}/);

        const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json|```/g, '') : response;
        jsonResponse = JSON.parse(jsonStr);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        throw new Error("Failed to parse the generated story script. Please try again.");
      }

      if (!jsonResponse.title || !jsonResponse.frames || !Array.isArray(jsonResponse.frames)) {
        throw new Error("Invalid story format received. Please try again.");
      }

      setStoryTitle(jsonResponse.title);

      const frames = jsonResponse.frames.map((frame: any) => ({
        text: frame.text,
        imagePrompt: frame.imagePrompt,
        imageUrl: null
      }));

      setStoryFrames(frames);
      setVoiceoverText(frames.map(f => f.text).join("\n\n"));
      setProgressPercent(30);
      addLog(`Created story with ${frames.length} scenes`);

      toast({
        title: "Story Generated",
        description: `Created "${jsonResponse.title}" with ${frames.length} scenes`,
      });

    } catch (error) {
      console.error("Failed to generate story:", error);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "Failed to generate story script",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateImages = async () => {
    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your FAL.AI API key first",
        variant: "destructive",
      });
      return;
    }

    if (counts.remainingImages < storyFrames.length) {
      toast({
        title: "Not Enough Image Credits",
        description: `You need ${storyFrames.length} image credits, but only have ${counts.remainingImages}`,
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImages(true);
    setCurrentStep(2);
    setProgressPercent(40);
    addLog("Generating images for each scene...");

    try {
      fal.config({
        credentials: apiKey
      });

      const updatedFrames = [...storyFrames];
      let generatedCount = 0;

      for (let i = 0; i < updatedFrames.length; i++) {
        const frame = updatedFrames[i];
        addLog(`Generating image ${i + 1}/${updatedFrames.length}: "${frame.imagePrompt.substring(0, 40)}..."`);

        try {
          const result = await fal.subscribe("fal-ai/imagen3/fast", {
            input: {
              prompt: frame.imagePrompt,
              aspect_ratio: "16:9",
              negative_prompt: "low quality, bad anatomy, distorted, blurry"
            },
          });

          if (result.data?.images?.[0]?.url) {
            const imageUrl = result.data.images[0].url;

            try {
              const userId = await getUserId();
              const supabaseUrl = await uploadUrlToStorage(imageUrl, 'image', userId);
              updatedFrames[i] = { ...frame, imageUrl: supabaseUrl };
            } catch (uploadError) {
              console.error("Failed to upload to Supabase:", uploadError);
              updatedFrames[i] = { ...frame, imageUrl: imageUrl };
            }

            await incrementImageCount();
            generatedCount++;

            const freshCounts = await getRemainingCountsAsync();
            setCounts(freshCounts);

            setProgressPercent(40 + Math.round((i + 1) / updatedFrames.length * 20));
            addLog(`Generated image ${i + 1}/${updatedFrames.length} successfully`);
          }
        } catch (imageError) {
          console.error(`Failed to generate image for frame ${i + 1}:`, imageError);
          addLog(`Failed to generate image ${i + 1}. Continuing with remaining scenes...`);
        }
      }

      setStoryFrames(updatedFrames);

      toast({
        title: "Images Generated",
        description: `Successfully generated ${generatedCount} of ${updatedFrames.length} images`,
      });

      setProgressPercent(60);

    } catch (error) {
      console.error("Failed to generate images:", error);
      toast({
        title: "Generation Error",
        description: "Failed to generate images for the story",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImages(false);
    }
  };

  const generateVoiceover = async () => {
    if (!voiceoverText.trim()) {
      toast({
        title: "No Text to Narrate",
        description: "Please ensure there is narration text for the voiceover",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingVoiceover(true);
    addLog("Generating voiceover audio...");

    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: voiceoverText,
          voice: narratorVoice
        }
      });

      if (error) {
        throw new Error(`Voiceover generation failed: ${error.message}`);
      }

      if (!data || !data.audioContent) {
        throw new Error("No audio content received from the server");
      }

      // Convert base64 to URL
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mp3');
      const audioUrl = URL.createObjectURL(audioBlob);

      // Save to Supabase if possible
      try {
        const userId = await getUserId();
        const supabaseUrl = await uploadUrlToStorage(audioUrl, 'audio' as 'image' | 'video' | 'audio', userId);
        setVoiceoverUrl(supabaseUrl);
      } catch (uploadError) {
        console.error("Failed to upload audio to Supabase:", uploadError);
        setVoiceoverUrl(audioUrl);
      }

      toast({
        title: "Voiceover Generated",
        description: "AI narration has been created successfully",
      });

      addLog("Voiceover audio created successfully");

    } catch (error) {
      console.error("Failed to generate voiceover:", error);
      toast({
        title: "Voiceover Error",
        description: error instanceof Error ? error.message : "Failed to create voiceover",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingVoiceover(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string) => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  
const generateVideo = async () => {
  if (!isApiKeySet) {
    toast({
      title: "API Key Required",
      description: "Please set your FAL.AI API key first",
      variant: "destructive",
    });
    return;
  }

  if (counts.remainingVideos < 1) {
    toast({
      title: "No Video Credits",
      description: "You don't have any video generations remaining",
      variant: "destructive",
    });
    return;
  }

  const hasImages = storyFrames.some(frame => frame.imageUrl);
  if (!hasImages) {
    toast({
      title: "No Images Available",
      description: "Please generate images first",
      variant: "destructive",
    });
    return;
  }

  setIsGeneratingVideo(true);
  setCurrentStep(3);
  setProgressPercent(70);
  addLog("Creating slideshow with voiceover...");

  try {
    // Extract all image URLs
    const imageUrls = storyFrames
      .filter(frame => frame.imageUrl)
      .map(frame => frame.imageUrl as string);

    if (imageUrls.length === 0) {
      throw new Error("No images available to create slideshow");
    }

    // Call the serverless function to generate the video
    const response = await axios.post('/api/generate-video', {
      imageUrls,
      voiceoverUrl,
    }, {
      responseType: 'blob',
    });

    const generatedVideoUrl = URL.createObjectURL(response.data);
    setGeneratedVideoUrl(generatedVideoUrl);

    if (onVideoGenerated) {
      onVideoGenerated(generatedVideoUrl);
    }

    await incrementVideoCount();
    const freshCounts = await getRemainingCountsAsync();
    setCounts(freshCounts);

    toast({
      title: "Slideshow Created",
      description: "Your images have been turned into a video with narration!",
    });

    setProgressPercent(100);

  } catch (error) {
    console.error("Failed to generate slideshow:", error);
    toast({
      title: "Video Generation Error",
      description: error instanceof Error ? error.message : "Failed to create slideshow",
      variant: "destructive",
    });
  } finally {
    setIsGeneratingVideo(false);
  }
};


  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Story to Video</h2>
            <ProLabel />
          </div>

          {!isApiKeySet && (
            <Alert className="mb-4">
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                <div className="space-y-4 mt-2">
                  <p>Please enter your FAL.AI API key to generate stories and videos</p>
                  <div>
                    <Label htmlFor="storyApiKey">FAL.AI API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="storyApiKey"
                        type="password"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="Enter your API key"
                        className="flex-1"
                      />
                      <Button onClick={saveApiKey}>Save Key</Button>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Alert className="mb-4">
            <AlertDescription>
              This feature will use {storyFrames.length || 5} image credits and 1 video credit.
              You have {counts.remainingImages} image and {counts.remainingVideos} video credits remaining.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="story" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="story">
                <BookOpenText className="h-4 w-4 mr-2" />
                Create Story
              </TabsTrigger>
              <TabsTrigger value="images" disabled={storyFrames.length === 0}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Images
              </TabsTrigger>
              <TabsTrigger value="voiceover" disabled={storyFrames.length === 0}>
                <Mic className="h-4 w-4 mr-2" />
                Voiceover
              </TabsTrigger>
              <TabsTrigger value="video" disabled={!storyFrames.some(f => f.imageUrl)}>
                <Film className="h-4 w-4 mr-2" />
                Create Slideshow
              </TabsTrigger>
            </TabsList>

            <TabsContent value="story" className="mt-4 space-y-4">
              <div>
                <Label htmlFor="storyPrompt">Story Prompt</Label>
                <Textarea
                  id="storyPrompt"
                  placeholder="Describe the story you want to create... (e.g., A young explorer discovers an ancient map leading to a hidden temple in the jungle)"
                  value={storyPrompt}
                  onChange={(e) => setStoryPrompt(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isGeneratingScript}
                />
              </div>

              <Button
                onClick={generateStoryScript}
                disabled={isGeneratingScript || !storyPrompt.trim()}
                className="w-full"
              >
                {isGeneratingScript ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Story...
                  </>
                ) : (
                  <>
                    <BookOpenText className="mr-2 h-4 w-4" />
                    Generate Story Script
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="images" className="mt-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">{storyTitle}</h3>
                <div className="space-y-3">
                  {storyFrames.map((frame, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <p className="text-sm mb-2">{frame.text}</p>
                      <p className="text-xs text-slate-500">Image prompt: {frame.imagePrompt}</p>
                      {frame.imageUrl && (
                        <div className="mt-2 rounded-md overflow-hidden">
                          <img src={frame.imageUrl} alt={`Scene ${index + 1}`} className="w-full h-auto" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={generateImages}
                disabled={
                  isGeneratingImages ||
                  storyFrames.length === 0 ||
                  !isApiKeySet ||
                  counts.remainingImages < storyFrames.length
                }
                className="w-full"
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Images...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Images
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="voiceover" className="mt-4 space-y-4">
              <div>
                <Label htmlFor="voiceoverText">Narration Script</Label>
                <Textarea
                  id="voiceoverText"
                  value={voiceoverText}
                  onChange={(e) => setVoiceoverText(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Enter narration text for the video..."
                  disabled={isGeneratingVoiceover}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="narratorVoice">Narrator Voice</Label>
                <Select
                  value={narratorVoice}
                  onValueChange={setNarratorVoice}
                  disabled={isGeneratingVoiceover}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alloy">Alloy (Balanced)</SelectItem>
                    <SelectItem value="echo">Echo (Male)</SelectItem>
                    <SelectItem value="fable">Fable (Male)</SelectItem>
                    <SelectItem value="onyx">Onyx (Male)</SelectItem>
                    <SelectItem value="nova">Nova (Female)</SelectItem>
                    <SelectItem value="shimmer">Shimmer (Female)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={generateVoiceover}
                disabled={isGeneratingVoiceover || !voiceoverText.trim()}
                className="w-full"
              >
                {isGeneratingVoiceover ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Voiceover...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Generate Voiceover
                  </>
                )}
              </Button>

              {voiceoverUrl && (
                <div className="mt-2">
                  <p className="text-sm mb-2">Preview Voiceover:</p>
                  <audio controls className="w-full">
                    <source src={voiceoverUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </TabsContent>

            <TabsContent value="video" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="slideDuration">Slide Duration (seconds)</Label>
                <Input
                  id="slideDuration"
                  type="number"
                  min="2"
                  max="10"
                  value={slideDuration}
                  onChange={(e) => setSlideDuration(Number(e.target.value))}
                  disabled={isGeneratingVideo}
                />
              </div>

              <Button
                onClick={generateVideo}
                disabled={
                  isGeneratingVideo ||
                  !storyFrames.some(f => f.imageUrl) ||
                  !isApiKeySet ||
                  counts.remainingVideos < 1 ||
                  isProcessing
                }
                className="w-full"
              >
                {isGeneratingVideo || isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Slideshow...
                  </>
                ) : (
                  <>
                    <Film className="mr-2 h-4 w-4" />
                    Create Slideshow
                  </>
                )}
              </Button>
            </TabsContent>
          </Tabs>

          {(isGeneratingScript || isGeneratingImages || isGeneratingVideo || isGeneratingVoiceover || isProcessing) && (
            <div className="mt-4">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">
                {currentStep === 1 && "Generating story script..."}
                {currentStep === 2 && "Creating images for each scene..."}
                {currentStep === 3 && "Composing slideshow with voiceover..."}
                {isGeneratingVoiceover && "Generating voiceover..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Preview</h2>

          {generatedVideoUrl ? (
            <VideoPreview
              videoUrl={generatedVideoUrl}
              isLoading={isGeneratingVideo || isProcessing}
              generationLogs={[]}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
            />
          ) : (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 text-center flex flex-col items-center justify-center min-h-[300px]">
              <Film className="h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-500">Your story slideshow will appear here</p>
            </div>
          )}

          <div className="mt-4 h-[200px] overflow-y-auto p-2 text-xs bg-black/70 text-green-400 font-mono rounded border border-slate-700 shadow-inner">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  <span className="opacity-50">[{new Date().toLocaleTimeString()}]:</span> {log}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <p>Generation logs will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryToVideo;
