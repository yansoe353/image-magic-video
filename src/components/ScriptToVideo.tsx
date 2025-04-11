
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { useToast } from "@/hooks/use-toast";
import { Wand2, FileText, Video, Download, Save, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { falService } from "@/services/falService";
import { StoryScene } from "@/types";
import { useFalClient } from "@/hooks/useFalClient";
import { getRemainingCountsAsync } from "@/utils/usageTracker";
import BuyApiKeyPopover from "./api-key/BuyApiKeyPopover";

interface ScriptItem {
  text: string;
  imagePrompt: string; // Changed from optional to required to match StoryScene
  imageUrl?: string;
  videoUrl?: string;
}

const ScriptToVideo = () => {
  const [title, setTitle] = useState<string>("");
  const [scriptIdea, setScriptIdea] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<ScriptItem[]>([]);
  const [generatingScript, setGeneratingScript] = useState<boolean>(false);
  const [generatingVideo, setGeneratingVideo] = useState<boolean>(false);
  const [scenesCount, setScenesCount] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<string>("script");
  const [scriptStyle, setScriptStyle] = useState<string>("cinematic");
  const [remainingImages, setRemainingImages] = useState<number>(0);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  
  const { generateResponse, isLoading } = useGeminiAPI({
    temperature: 0.7,
    maxOutputTokens: 2048,
  });
  
  const { toast } = useToast();
  
  // Check image generation limits on component mount
  useEffect(() => {
    const checkLimits = async () => {
      const limits = await getRemainingCountsAsync();
      setRemainingImages(limits.remainingImages);
      
      // Check if the FAL API key is available by testing localStorage
      const apiKey = localStorage.getItem("falApiKey");
      setHasApiKey(!!apiKey);
    };
    
    checkLimits();
  }, []);
  
  // Generate script based on idea
  const handleGenerateScript = async () => {
    if (!scriptIdea.trim()) {
      toast({
        title: "Please enter a script idea",
        description: "Add a brief description of what you want the script to be about.",
        variant: "destructive",
      });
      return;
    }
    
    setGeneratingScript(true);
    
    try {
      const prompt = `
        Act as a professional script writer and create a ${scriptStyle} script with ${scenesCount} scenes based on the following idea:
        "${scriptIdea}"
        
        Format your response as valid JSON like this:
        [
          {
            "text": "Scene description and script text for scene 1",
            "imagePrompt": "Visual description for generating an image for this scene"
          },
          {
            "text": "Scene description and script text for scene 2",
            "imagePrompt": "Visual description for generating an image for this scene"
          }
        ]
        
        Make each scene descriptive and visual, with the imagePrompt being a clear, detailed description for an AI image generator.
        Do not include any explanations, just return valid JSON.
      `;
      
      const response = await generateResponse(prompt);
      
      // Extract JSON from the response
      try {
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        const jsonStr = response.substring(jsonStart, jsonEnd);
        const parsedScript = JSON.parse(jsonStr) as ScriptItem[];
        
        // Ensure each script item has an imagePrompt to satisfy the type constraint
        const validatedScript = parsedScript.map(scene => ({
          ...scene,
          imagePrompt: scene.imagePrompt || scene.text // Use text as fallback if imagePrompt is missing
        }));
        
        setGeneratedScript(validatedScript);
        setActiveTab("preview");
        
        toast({
          title: "Script generated!",
          description: `Created ${validatedScript.length} scenes for your script.`,
        });
      } catch (jsonError) {
        console.error("Failed to parse script JSON:", jsonError, response);
        toast({
          title: "Error parsing script",
          description: "The generated script format was invalid. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to generate script:", error);
      toast({
        title: "Failed to generate script",
        description: "There was an error while generating your script. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingScript(false);
    }
  };
  
  // Generate images for scenes
  const generateImages = async () => {
    if (generatedScript.length === 0) return;
    
    // Check for API key and remaining image credits
    if (!hasApiKey) {
      toast({
        title: "API Key Required",
        description: "To generate images, buy an Infinity API key",
        variant: "destructive",
      });
      return;
    }
    
    // Check remaining image count
    const limits = await getRemainingCountsAsync();
    setRemainingImages(limits.remainingImages);
    
    if (limits.remainingImages < generatedScript.length) {
      toast({
        title: "Not enough image credits",
        description: `You need at least ${generatedScript.length} image credits, but only have ${limits.remainingImages} remaining.`,
        variant: "destructive",
      });
      return;
    }
    
    const updatedScript = [...generatedScript];
    
    for (let i = 0; i < updatedScript.length; i++) {
      const scene = updatedScript[i];
      
      if (!scene.imageUrl) {
        try {
          toast({
            title: "Generating image",
            description: `Creating image for scene ${i + 1}...`,
          });
          
          // Use falService to generate image
          const result = await falService.generateImageWithImagen3(
            scene.imagePrompt, // Now always available
            { aspect_ratio: "1:1" }
          );
          
          const imageUrl = result.data?.images?.[0]?.url || 
                          result.images?.[0]?.url ||
                          result.image_url || 
                          result.url;
          
          if (imageUrl) {
            updatedScript[i] = { ...scene, imageUrl };
          }
          
          // Save to history
          await falService.saveToHistory('image', imageUrl, scene.imagePrompt, false, {
            scriptTitle: title,
            sceneIndex: i
          });
          
        } catch (error) {
          console.error(`Error generating image for scene ${i + 1}:`, error);
          toast({
            title: `Error on scene ${i + 1}`,
            description: "Failed to generate image. Please check your API key.",
            variant: "destructive",
          });
        }
      }
    }
    
    setGeneratedScript(updatedScript);
    
    // Update remaining image count after generation
    const updatedLimits = await getRemainingCountsAsync();
    setRemainingImages(updatedLimits.remainingImages);
  };
  
  // Convert scenes to video
  const generateVideo = async () => {
    if (!hasApiKey) {
      toast({
        title: "API Key Required",
        description: "To generate videos, buy an Infinity API key",
        variant: "destructive",
      });
      return;
    }
    
    setGeneratingVideo(true);
    toast({
      title: "Video generation",
      description: "Starting video generation process...",
    });
    
    try {
      // We'll use the image-to-video generation functionality from falService
      const sceneWithImage = generatedScript.find(scene => scene.imageUrl);
      
      if (!sceneWithImage || !sceneWithImage.imageUrl) {
        throw new Error("No images available to create video");
      }
      
      // Get video limits
      const limits = await getRemainingCountsAsync();
      if (limits.remainingVideos <= 0) {
        throw new Error("You have reached your video generation limit");
      }
      
      // Use the first image with a URL to create a sample video
      const result = await falService.generateVideoFromImage(
        sceneWithImage.imageUrl, 
        { cameraMode: "zoom-out" }
      );
      
      const videoUrl = result?.video_url || result?.data?.video?.url;
      
      if (videoUrl) {
        // Update the scene with the video URL
        const updatedScript = generatedScript.map(scene => {
          if (scene === sceneWithImage) {
            return { ...scene, videoUrl };
          }
          return scene;
        });
        
        setGeneratedScript(updatedScript);
        
        toast({
          title: "Video created!",
          description: "Generated a sample video from your scene.",
        });
      } else {
        throw new Error("No video URL returned from the API");
      }
    } catch (error) {
      console.error("Failed to generate video:", error);
      toast({
        title: "Video generation failed",
        description: error instanceof Error ? error.message : "An error occurred during video generation",
        variant: "destructive",
      });
    } finally {
      setGeneratingVideo(false);
    }
  };
  
  // Handle script text file download
  const handleDownloadTextFile = () => {
    if (generatedScript.length === 0) {
      toast({
        title: "No script to download",
        description: "Please generate a script first.",
        variant: "destructive",
      });
      return;
    }
    
    const fileName = title.trim() ? `${title.trim().replace(/\s+/g, '_')}.txt` : 'script.txt';
    
    // Convert ScriptItem[] to StoryScene[] for the text file generator
    const storyScenes: StoryScene[] = generatedScript.map(item => ({
      text: item.text,
      imagePrompt: item.imagePrompt,
      imageUrl: item.imageUrl
    }));
    
    const content = generateStoryTextFile(title || "Untitled Script", storyScenes);
    downloadTextFile(content, fileName);
    
    toast({
      title: "Script downloaded",
      description: `Your script has been saved as ${fileName}.`,
    });
  };
  
  return (
    <div className="w-full">
      <Card className="mb-6 shadow-lg glass-morphism">
        <CardHeader>
          <CardTitle className="text-gradient">Script to Video Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="script">Write Script</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="script">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input 
                    id="title" 
                    placeholder="Enter a title for your script"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scriptIdea">Script Idea</Label>
                  <Textarea 
                    id="scriptIdea" 
                    placeholder="Describe your script idea here..."
                    value={scriptIdea}
                    onChange={(e) => setScriptIdea(e.target.value)}
                    className="min-h-32 mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Number of Scenes ({scenesCount})</Label>
                    <Slider
                      value={[scenesCount]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => setScenesCount(value[0])}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="scriptStyle">Script Style</Label>
                    <Select 
                      value={scriptStyle} 
                      onValueChange={setScriptStyle}
                    >
                      <SelectTrigger id="scriptStyle" className="mt-1">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cinematic">Cinematic</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="animated">Animated</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={handleGenerateScript} 
                  className="w-full"
                  disabled={generatingScript || !scriptIdea.trim()}
                >
                  {generatingScript ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Script...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate Script
                    </>
                  )}
                </Button>
                
                {!hasApiKey && (
                  <div className="mt-2 p-3 bg-amber-600/30 border border-amber-700/50 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div className="text-sm text-amber-200">
                      <p>To generate images, you need an Infinity API key.</p>
                      <p className="mt-1 text-amber-300">
                        <BuyApiKeyPopover />
                      </p>
                    </div>
                  </div>
                )}
                
                {hasApiKey && remainingImages <= 5 && (
                  <div className="mt-2 p-3 bg-amber-600/30 border border-amber-700/50 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div className="text-sm text-amber-200">
                      <p>You have {remainingImages} image credits remaining.</p>
                      <p className="mt-1 text-amber-300">
                        <BuyApiKeyPopover />
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="preview">
              {generatedScript.length > 0 ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h3 className="text-xl font-bold">{title || "Untitled Script"}</h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDownloadTextFile}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        Download Text
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={generateImages}
                        disabled={!hasApiKey || remainingImages < generatedScript.length}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Images
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={generateVideo}
                        disabled={generatingVideo || !hasApiKey || !generatedScript.some(scene => scene.imageUrl)}
                      >
                        {generatingVideo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Create Video
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {generatedScript.map((scene, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-slate-800/50">
                          <CardTitle className="text-sm">Scene {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                              <p className="whitespace-pre-line text-sm">{scene.text}</p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                <strong>Image prompt:</strong> {scene.imagePrompt}
                              </p>
                              
                              {scene.videoUrl && (
                                <div className="mt-4">
                                  <h4 className="text-xs font-semibold mb-2">Generated Video:</h4>
                                  <video
                                    controls
                                    src={scene.videoUrl}
                                    className="w-full h-auto rounded-md"
                                  />
                                </div>
                              )}
                            </div>
                            
                            <div className="flex justify-center items-center">
                              {scene.imageUrl ? (
                                <img 
                                  src={scene.imageUrl} 
                                  alt={`Scene ${index + 1}`} 
                                  className="rounded-md max-h-40 object-cover"
                                />
                              ) : (
                                <div className="w-full aspect-square bg-slate-700/30 rounded-md flex flex-col items-center justify-center p-4">
                                  {!hasApiKey ? (
                                    <>
                                      <p className="text-xs text-center text-slate-400 mb-2">API key required</p>
                                      <Button variant="link" size="sm" className="p-0 h-auto">
                                        <BuyApiKeyPopover />
                                      </Button>
                                    </>
                                  ) : (
                                    <p className="text-xs text-center text-slate-400">No image generated</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {hasApiKey && (
                    <p className="text-xs text-slate-500 text-center">
                      You have {remainingImages} image generation credits remaining
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No script generated yet. Go to the "Write Script" tab to create one.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScriptToVideo;
