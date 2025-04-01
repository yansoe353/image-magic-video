
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
import { Slider } from "@/components/ui/slider";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { fal } from "@fal-ai/client";
import { incrementImageCount, incrementVideoCount, getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import VideoPreview from "./VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import ProLabel from "./ProLabel";
import KlingAILabel from "./KlingAILabel";
import { useVideoEditor, VideoClip } from "@/hooks/useVideoEditor";

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
  const [currentStep, setCurrentStep] = useState(1);
  const [storyFrames, setStoryFrames] = useState<StoryFrame[]>([]);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [storyTitle, setStoryTitle] = useState("");
  const [narratorVoice, setNarratorVoice] = useState("en-US-Neural2-F");
  const [voiceoverText, setVoiceoverText] = useState("");
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("falApiKey") || "");
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(!!localStorage.getItem("falApiKey"));
  const [progressPercent, setProgressPercent] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  const { generateResponse } = useGeminiAPI();
  const { toast } = useToast();
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const [counts, setCounts] = useState(getRemainingCounts());
  const { 
    videoClips,
    combinedVideoUrl,
    isProcessing,
    addVideoClip,
    combineVideos
  } = useVideoEditor();

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
        // Extract JSON from the response if it's wrapped in markdown or other text
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
              guidance_scale: 9,
              negative_prompt: "low quality, bad anatomy, distorted, blurry"
            },
          });

          if (result.data?.images?.[0]?.url) {
            const imageUrl = result.data.images[0].url;
            
            // Upload to storage if logged in
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

  const generateVideo = async () => {
    if (counts.remainingVideos < 1) {
      toast({
        title: "No Video Credits",
        description: "You don't have any video generations remaining",
        variant: "destructive",
      });
      return;
    }

    // Check if we have at least one image
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
    addLog("Creating slideshow video with narration...");

    try {
      // Reset video clips if any exist from previous attempts
      videoClips.forEach(clip => {
        addLog(`Preparing image: ${clip.name}`);
      });

      // Create a video clip for each story frame that has an image
      const framesWithImages = storyFrames.filter(frame => frame.imageUrl);
      for (let i = 0; i < framesWithImages.length; i++) {
        const frame = framesWithImages[i];
        if (frame.imageUrl) {
          addLog(`Adding slide ${i + 1}: ${frame.text.substring(0, 40)}...`);
          
          // Create a new video clip for each image
          const newClip: VideoClip = {
            id: Date.now().toString() + i,
            url: frame.imageUrl,
            name: `Scene ${i + 1}`,
          };
          
          addVideoClip(newClip);
        }
      }

      addLog("Combining images into slideshow video...");
      setProgressPercent(80);
      
      // Use the video editor's combine function to create the video
      await combineVideos();
      
      if (combinedVideoUrl) {
        setGeneratedVideoUrl(combinedVideoUrl);
        
        if (onVideoGenerated) {
          onVideoGenerated(combinedVideoUrl);
        }
        
        // Save to history if logged in
        if (isLoggedIn()) {
          const userId = await getUserId();
          await supabase
            .from('user_content_history')
            .insert({
              user_id: userId,
              content_type: 'video',
              content_url: combinedVideoUrl,
              prompt: storyPrompt,
              metadata: {
                title: storyTitle,
                frames: storyFrames.map(frame => ({
                  text: frame.text,
                  imagePrompt: frame.imagePrompt
                }))
              }
            });
        }
        
        await incrementVideoCount();
        const freshCounts = await getRemainingCountsAsync();
        setCounts(freshCounts);
        
        toast({
          title: "Slideshow Created",
          description: "Your story has been turned into a slideshow video!",
        });
      } else {
        throw new Error("Failed to create video slideshow");
      }
      
      setProgressPercent(100);
      
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast({
        title: "Video Generation Error",
        description: error instanceof Error ? error.message : "Failed to create video",
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="story">
                <BookOpenText className="h-4 w-4 mr-2" />
                Create Story
              </TabsTrigger>
              <TabsTrigger value="images" disabled={storyFrames.length === 0}>
                <ImageIcon className="h-4 w-4 mr-2" />
                Generate Images
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

            <TabsContent value="video" className="mt-4 space-y-4">
              <div>
                <Label htmlFor="voiceoverText">Narration Script</Label>
                <Textarea
                  id="voiceoverText"
                  value={voiceoverText}
                  onChange={(e) => setVoiceoverText(e.target.value)}
                  className="min-h-[150px]"
                  placeholder="Enter narration text for the video..."
                  disabled={isGeneratingVideo}
                />
              </div>

              <Button
                onClick={generateVideo}
                disabled={
                  isGeneratingVideo || 
                  !storyFrames.some(f => f.imageUrl) || 
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

          {(isGeneratingScript || isGeneratingImages || isGeneratingVideo || isProcessing) && (
            <div className="mt-4">
              <Progress value={progressPercent} className="h-2" />
              <p className="text-xs text-center mt-1 text-gray-500">
                {currentStep === 1 && "Generating story script..."}
                {currentStep === 2 && "Creating images for each scene..."}
                {currentStep === 3 && "Composing slideshow with narration..."}
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
