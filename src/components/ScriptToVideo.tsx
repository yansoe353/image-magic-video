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
import { Wand2, FileText, Video, Download, Save, Loader2, RefreshCw, AlertTriangle, FileDown, CreditCard } from "lucide-react";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { falService } from "@/services/falService";
import { StoryScene } from "@/types";
import { getRemainingCountsAsync } from "@/utils/usageTracker";
import BuyApiKeyPopover from "./api-key/BuyApiKeyPopover";
import { generateStoryPDF } from "@/services/pdfService";
import { LANGUAGES, LanguageOption } from "@/utils/translationUtils";
import { useNavigate } from "react-router-dom";
import { Alert } from "./ui/alert";
import MyanmarVpnWarning from "./MyanmarVpnWarning";

interface ScriptItem {
  text: string;
  imagePrompt: string;
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
  const [remainingVideos, setRemainingVideos] = useState<number>(0);
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [generatingPDF, setGeneratingPDF] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  
  const { generateResponse, isLoading } = useGeminiAPI({
    temperature: 0.7,
    maxOutputTokens: 2048,
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkLimits = async () => {
      const limits = await getRemainingCountsAsync();
      setRemainingImages(limits.remainingImages);
      setRemainingVideos(limits.remainingVideos);
      
      try {
        await falService.initialize();
        setHasApiKey(true);
      } catch (error) {
        console.error("Failed to initialize FAL service:", error);
        setHasApiKey(false);
      }
    };
    
    checkLimits();
  }, []);
  
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
      
      try {
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        const jsonStr = response.substring(jsonStart, jsonEnd);
        const parsedScript = JSON.parse(jsonStr) as ScriptItem[];
        
        const validatedScript = parsedScript.map(scene => ({
          ...scene,
          imagePrompt: scene.imagePrompt || scene.text
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
  
  const generateImages = async () => {
    if (generatedScript.length === 0) return;
    
    if (!hasApiKey) {
      toast({
        title: "API Key Required",
        description: "Unable to connect to the image generation service. Please try again later.",
        variant: "destructive",
      });
      return;
    }
    
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
          
          const result = await falService.generateImageWithImagen3(
            scene.imagePrompt,
            { aspect_ratio: "1:1" }
          );
          
          const imageUrl = result.data?.images?.[0]?.url || 
                          result.images?.[0]?.url ||
                          result.image_url || 
                          result.url;
          
          if (imageUrl) {
            updatedScript[i] = { ...scene, imageUrl };
          }
          
          await falService.saveToHistory('image', imageUrl, scene.imagePrompt, false, {
            scriptTitle: title,
            sceneIndex: i
          });
        } catch (error) {
          console.error(`Error generating image for scene ${i + 1}:`, error);
          toast({
            title: `Error on scene ${i + 1}`,
            description: "Failed to generate image. Please try again later.",
            variant: "destructive",
          });
        }
      }
    }
    
    setGeneratedScript(updatedScript);
    
    const updatedLimits = await getRemainingCountsAsync();
    setRemainingImages(updatedLimits.remainingImages);
  };
  
  const generateVideo = async () => {
    if (!hasApiKey) {
      toast({
        title: "Service Unavailable",
        description: "Unable to connect to the video generation service. Please try again later.",
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
      const sceneWithImage = generatedScript.find(scene => scene.imageUrl);
      
      if (!sceneWithImage || !sceneWithImage.imageUrl) {
        throw new Error("No images available to create video");
      }
      
      const limits = await getRemainingCountsAsync();
      setRemainingVideos(limits.remainingVideos);
      
      if (limits.remainingVideos <= 0) {
        throw new Error("You have reached your video generation limit");
      }
      
      try {
        await falService.initialize();
      } catch (error) {
        throw new Error("Failed to connect to video service: " + error.message);
      }
      
      const result = await falService.generateVideoFromImage(
        sceneWithImage.imageUrl, 
        { cameraMode: "zoom-out" }
      );
      
      const videoUrl = result?.video_url || 
                      result?.data?.video?.url || 
                      (result as any)?.url;
      
      if (videoUrl) {
        const updatedScript = generatedScript.map(scene => {
          if (scene === sceneWithImage) {
            return { ...scene, videoUrl };
          }
          return scene;
        });
        
        setGeneratedScript(updatedScript);
        
        await falService.saveToHistory(
          'video',
          videoUrl,
          sceneWithImage.imagePrompt,
          false,
          {
            scriptTitle: title,
            sourceImageUrl: sceneWithImage.imageUrl
          }
        );
        
        toast({
          title: "Video created!",
          description: "Generated a sample video from your scene.",
        });
        
        const updatedLimits = await getRemainingCountsAsync();
        setRemainingVideos(updatedLimits.remainingVideos);
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
  
  const handleDownloadPDF = async () => {
    if (generatedScript.length === 0) {
      toast({
        title: "No script to download",
        description: "Please generate a script first.",
        variant: "destructive",
      });
      return;
    }
    
    setGeneratingPDF(true);
    
    try {
      const storyScenes: StoryScene[] = generatedScript.map(item => ({
        text: item.text,
        imagePrompt: item.imagePrompt,
        imageUrl: item.imageUrl
      }));
      
      const characterDetails = {
        title: title || "Untitled Script",
        scriptStyle: scriptStyle,
        scenesCount: scenesCount.toString(),
      };
      
      const pdfDataUri = await generateStoryPDF(
        title || "Untitled Script", 
        storyScenes,
        characterDetails,
        selectedLanguage
      );
      
      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${title.trim() ? title.trim().replace(/\s+/g, '_') : 'script'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "PDF downloaded",
        description: `Your script has been saved as a PDF.`,
      });
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast({
        title: "PDF generation failed",
        description: error instanceof Error ? error.message : "An error occurred while generating the PDF",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };
  
  const navigateToBuyCredits = () => {
    navigate("/buy-credits");
  };
  
  return (
    <div className="w-full">
      <MyanmarVpnWarning className="mb-4" />
      
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
                
                <div>
                  <Label htmlFor="language">PDF Language</Label>
                  <Select 
                    value={selectedLanguage} 
                    onValueChange={(value) => setSelectedLanguage(value as LanguageOption)}
                  >
                    <SelectTrigger id="language" className="mt-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LANGUAGES).map(([code, name]) => (
                        <SelectItem key={code} value={code}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <p>To generate images, buy an Infinity API key.</p>
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
                      <div className="mt-1 text-amber-300 flex gap-2">
                        <BuyApiKeyPopover />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={navigateToBuyCredits}
                          className="text-amber-300 hover:text-amber-100 border-amber-400"
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Buy Credits
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {hasApiKey && remainingVideos <= 3 && (
                  <div className="mt-2 p-3 bg-amber-600/30 border border-amber-700/50 rounded-md flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <div className="text-sm text-amber-200">
                      <p>You have {remainingVideos} video credits remaining.</p>
                      <div className="mt-1 text-amber-300 flex gap-2">
                        <BuyApiKeyPopover />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={navigateToBuyCredits}
                          className="text-amber-300 hover:text-amber-100 border-amber-400"
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Buy Credits
                        </Button>
                      </div>
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
                        onClick={handleDownloadPDF}
                        disabled={generatingPDF}
                      >
                        {generatingPDF ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating PDF...
                          </>
                        ) : (
                          <>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download PDF
                          </>
                        )}
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
                        disabled={generatingVideo || !hasApiKey || !generatedScript.some(scene => scene.imageUrl) || remainingVideos <= 0}
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
                  
                  {hasApiKey && (remainingImages <= 5 || remainingVideos <= 3) && (
                    <Alert variant="warning" className="bg-amber-600/30 border border-amber-700/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                          <span className="text-amber-200">
                            {remainingImages <= 5 && remainingVideos <= 3 
                              ? `Low credits: ${remainingImages} images, ${remainingVideos} videos remaining.` 
                              : remainingImages <= 5 
                                ? `${remainingImages} image credits remaining.` 
                                : `${remainingVideos} video credits remaining.`}
                          </span>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={navigateToBuyCredits}
                          className="text-amber-300 hover:text-amber-100 border-amber-400"
                        >
                          <CreditCard className="mr-1 h-3 w-3" />
                          Buy Credits
                        </Button>
                      </div>
                    </Alert>
                  )}
                  
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
                      You have {remainingImages} image generation credits and {remainingVideos} video credits remaining
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
