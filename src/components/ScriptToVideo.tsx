
import React, { useState } from "react";
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
import { Wand2, FileText, Video, Download, Save, Loader2, RefreshCw } from "lucide-react";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { falService } from "@/services/falService";

interface ScriptItem {
  text: string;
  imagePrompt?: string;
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
  
  const { generateResponse, isLoading } = useGeminiAPI({
    temperature: 0.7,
    maxOutputTokens: 2048,
  });
  
  const { toast } = useToast();
  
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
        
        setGeneratedScript(parsedScript);
        setActiveTab("preview");
        
        toast({
          title: "Script generated!",
          description: `Created ${parsedScript.length} scenes for your script.`,
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
            scene.imagePrompt || scene.text,
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
          await falService.saveToHistory('image', imageUrl, scene.imagePrompt || scene.text, false, {
            scriptTitle: title,
            sceneIndex: i
          });
          
        } catch (error) {
          console.error(`Error generating image for scene ${i + 1}:`, error);
        }
      }
    }
    
    setGeneratedScript(updatedScript);
  };
  
  // Convert scenes to video (placeholder for future implementation)
  const generateVideo = async () => {
    setGeneratingVideo(true);
    toast({
      title: "Video generation",
      description: "Video generation will be implemented in a future update.",
    });
    
    // Future: Implement Remotion video generation logic here
    
    setTimeout(() => setGeneratingVideo(false), 2000);
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
    const content = generateStoryTextFile(title || "Untitled Script", generatedScript);
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
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate Images
                      </Button>
                      
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={generateVideo}
                        disabled={generatingVideo}
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
                            </div>
                            
                            <div className="flex justify-center items-center">
                              {scene.imageUrl ? (
                                <img 
                                  src={scene.imageUrl} 
                                  alt={`Scene ${index + 1}`} 
                                  className="rounded-md max-h-40 object-cover"
                                />
                              ) : (
                                <div className="w-full aspect-square bg-slate-700/30 rounded-md flex items-center justify-center">
                                  <p className="text-xs text-center text-slate-400">No image generated</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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
