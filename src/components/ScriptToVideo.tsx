import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Film, ImageIcon, Loader2, PlayCircle, Sparkles, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { incrementImageCount, incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";
import { falService } from "@/services/falService";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { getUserId } from "@/utils/storageUtils";
import { geminiImageService } from "@/services/geminiImageService";

interface ScriptScene {
  sceneNumber: number;
  description: string;
  dialogue: string;
  imagePrompt: string;
  imageUrl?: string;
  videoUrl?: string;
}

const ScriptToVideo = () => {
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptPrompt, setScriptPrompt] = useState("");
  const [genre, setGenre] = useState("drama");
  const [numScenes, setNumScenes] = useState("3");
  const [visualStyle, setVisualStyle] = useState("cinematic");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptScene[]>([]);
  const [currentTab, setCurrentTab] = useState("0");
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [counts, setCounts] = useState({ remainingImages: 0, remainingVideos: 0 });

  const { generateResponse } = useGeminiAPI();
  const { toast } = useToast();

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    updateCounts();

    // Update counts every minute
    const interval = setInterval(updateCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const parseScriptResponse = (response: string): ScriptScene[] => {
    try {
      // Try parsing as direct JSON
      const directParse = JSON.parse(response.trim());
      if (Array.isArray(directParse)) return directParse;
    } catch (e) {}

    try {
      // Try finding JSON in code blocks
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const extracted = codeBlockMatch[1].trim();
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    try {
      // Try finding JSON between brackets
      const firstBracket = response.indexOf('[');
      const lastBracket = response.lastIndexOf(']');
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        const extracted = response.slice(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    throw new Error("Unable to parse script response");
  };

  const generateScript = async () => {
    if (!scriptPrompt) {
      toast({ 
        title: "Error", 
        description: "Please enter a script concept", 
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedScript([]);

    try {
      const scriptRequest = `Create a ${numScenes}-scene script for a ${genre} about: "${scriptPrompt}". 
      
      Format as a JSON array with scenes like:
      [
        {
          "sceneNumber": 1,
          "description": "Detailed scene setting description",
          "dialogue": "CHARACTER: Actual dialogue text with speaker names",
          "imagePrompt": "Detailed visual prompt for generating an image of this scene in ${visualStyle} style"
        }
      ]
      
      Return valid JSON only.`;

      console.log("Generating script with prompt:", scriptRequest);
      const response = await generateResponse(scriptRequest);
      
      try {
        const parsedScript = parseScriptResponse(response);
        
        if (Array.isArray(parsedScript) && parsedScript.length > 0) {
          // Add any missing fields to ensure consistent structure
          const formattedScript = parsedScript.map((scene, idx) => ({
            sceneNumber: scene.sceneNumber || idx + 1,
            description: scene.description || "",
            dialogue: scene.dialogue || "",
            imagePrompt: scene.imagePrompt ? `${scene.imagePrompt}, ${visualStyle} style.` : 
                          `Scene from ${genre} film showing ${scene.description}, ${visualStyle} style.`
          }));
          
          setGeneratedScript(formattedScript);
          setScriptTitle(scriptTitle || `${genre.charAt(0).toUpperCase() + genre.slice(1)} Script: ${scriptPrompt.slice(0, 30)}${scriptPrompt.length > 30 ? '...' : ''}`);
        } else {
          throw new Error("Generated script doesn't contain valid scenes");
        }
      } catch (parseError) {
        console.error("Failed to parse script:", parseError);
        await fallbackScriptGeneration();
      }
    } catch (error) {
      console.error("Script generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate script. Please try a different prompt.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const fallbackScriptGeneration = async () => {
    try {
      toast({
        title: "Trying alternative approach...",
        description: "Having trouble with the script format, attempting simplified version",
        variant: "default"
      });

      const fallbackPrompt = `Write a simple ${numScenes}-scene script for a ${genre} film about "${scriptPrompt}".
        For each scene include:
        1. Scene description (setting)
        2. Character dialogue
        3. Visual description for an image
        
        Format as simple JSON array: [{"sceneNumber":1,"description":"...","dialogue":"...","imagePrompt":"..."}]`;

      const fallbackResponse = await generateResponse(fallbackPrompt);
      
      try {
        const parsedFallback = parseScriptResponse(fallbackResponse);
        
        if (Array.isArray(parsedFallback) && parsedFallback.length > 0) {
          setGeneratedScript(parsedFallback);
          toast({
            title: "Success",
            description: "Used simplified script format",
            variant: "default"
          });
        } else {
          throw new Error("Fallback parse failed");
        }
      } catch (fallbackError) {
        // Create an emergency fallback with minimal structure
        const emergencyFallback: ScriptScene[] = [];
        for (let i = 1; i <= parseInt(numScenes); i++) {
          emergencyFallback.push({
            sceneNumber: i,
            description: `Scene ${i} from a ${genre} about "${scriptPrompt}"`,
            dialogue: "CHARACTER: (Unable to generate detailed dialogue)",
            imagePrompt: `Scene ${i} from a ${genre} film about "${scriptPrompt}" in ${visualStyle} style`,
          });
        }
        
        setGeneratedScript(emergencyFallback);
        toast({
          title: "Limited Script Generated",
          description: "Created a basic script structure. You may want to edit it.",
          variant: "warning"
        });
      }
    } catch (error) {
      console.error("Complete fallback generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate any usable script. Please try a different prompt.",
        variant: "destructive"
      });
    }
  };

  const generateImageForScene = async (sceneIndex: number) => {
    if (counts.remainingImages <= 0) {
      toast({
        title: "Limit Reached",
        description: "You've used all your image generations",
        variant: "destructive",
      });
      return;
    }

    const scene = generatedScript[sceneIndex];
    if (!scene) return;

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

      const imageUrl = await geminiImageService.generateImage(scene.imagePrompt, {
        style: visualStyle
      });

      const updatedScript = [...generatedScript];
      updatedScript[sceneIndex] = { ...updatedScript[sceneIndex], imageUrl };
      setGeneratedScript(updatedScript);

      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);

      const userId = await getUserId();
      if (userId) {
        await falService.saveToHistory(
          'image',
          imageUrl,
          scene.imagePrompt,
          isPublic,
          {
            script_title: scriptTitle,
            scene_number: scene.sceneNumber,
            script_prompt: scriptPrompt
          }
        );
      }

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

  const generateVideoForScene = async (sceneIndex: number) => {
    if (counts.remainingVideos <= 0) {
      toast({
        title: "Limit Reached",
        description: "You've used all your video generations",
        variant: "destructive",
      });
      return;
    }

    const scene = generatedScript[sceneIndex];
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
          title: "API Key Required",
          description: "Please set your API key first",
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
        prompt: scene.imagePrompt || "Animate this cinematic scene with camera movement"
      });

      const videoUrl = result.video_url || result.data?.video?.url;
      
      if (videoUrl) {
        const updatedScript = [...generatedScript];
        updatedScript[sceneIndex] = { ...updatedScript[sceneIndex], videoUrl };
        setGeneratedScript(updatedScript);

        const freshCounts = await getRemainingCountsAsync();
        setCounts(freshCounts);

        const userId = await getUserId();
        if (userId) {
          await falService.saveToHistory(
            'video',
            videoUrl,
            scene.imagePrompt,
            isPublic,
            {
              script_title: scriptTitle,
              scene_number: scene.sceneNumber,
              script_prompt: scriptPrompt
            }
          );
        }

        toast({
          title: "Success",
          description: "Video generated successfully!",
        });
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
    } finally {
      setCurrentGeneratingIndex(null);
    }
  };

  const exportScript = () => {
    if (generatedScript.length === 0) {
      toast({
        title: "No script to export",
        description: "Please generate a script first",
        variant: "destructive",
      });
      return;
    }

    let scriptText = `TITLE: ${scriptTitle || "Untitled Script"}\n\n`;
    scriptText += `GENRE: ${genre.toUpperCase()}\n\n`;
    
    generatedScript.forEach(scene => {
      scriptText += `SCENE ${scene.sceneNumber}\n\n`;
      scriptText += `SETTING: ${scene.description}\n\n`;
      scriptText += `${scene.dialogue}\n\n`;
      scriptText += `---\n\n`;
    });
    
    // Create and download the text file
    const element = document.createElement("a");
    const file = new Blob([scriptText], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${scriptTitle || "script"}.txt`.replace(/\s+/g, '_').toLowerCase();
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast({
      title: "Success",
      description: "Script exported as text file",
    });
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <FileText className="mr-2 h-6 w-6" />
            AI Script to Video
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="scriptTitle">Script Title (Optional)</Label>
              <Input
                id="scriptTitle"
                placeholder="Enter a title for your script"
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div>
              <Label htmlFor="scriptPrompt">Script Concept</Label>
              <Textarea
                id="scriptPrompt"
                placeholder="Describe your script idea, like 'A detective solving a mystery in a cyberpunk future'"
                value={scriptPrompt}
                onChange={(e) => setScriptPrompt(e.target.value)}
                className="min-h-[80px]"
                disabled={isGenerating}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="genre">Genre</Label>
                <Select value={genre} onValueChange={setGenre} disabled={isGenerating}>
                  <SelectTrigger id="genre">
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drama">Drama</SelectItem>
                    <SelectItem value="comedy">Comedy</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                    <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="romance">Romance</SelectItem>
                    <SelectItem value="thriller">Thriller</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="animation">Animation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="numScenes">Number of Scenes</Label>
                <Select value={numScenes} onValueChange={setNumScenes} disabled={isGenerating}>
                  <SelectTrigger id="numScenes">
                    <SelectValue placeholder="Select scenes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 Scenes</SelectItem>
                    <SelectItem value="3">3 Scenes</SelectItem>
                    <SelectItem value="4">4 Scenes</SelectItem>
                    <SelectItem value="5">5 Scenes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="visualStyle">Visual Style</Label>
                <Select value={visualStyle} onValueChange={setVisualStyle} disabled={isGenerating}>
                  <SelectTrigger id="visualStyle">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="film noir">Film Noir</SelectItem>
                    <SelectItem value="animation">Animation</SelectItem>
                    <SelectItem value="documentary">Documentary</SelectItem>
                    <SelectItem value="music video">Music Video</SelectItem>
                    <SelectItem value="horror">Horror</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            {(counts.remainingVideos <= 1 || counts.remainingImages <= 1) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Usage Limit Warning</AlertTitle>
                <AlertDescription>
                  You have {counts.remainingImages} image generation{counts.remainingImages !== 1 ? 's' : ''} and {counts.remainingVideos} video generation{counts.remainingVideos !== 1 ? 's' : ''} remaining.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={generateScript}
              disabled={isGenerating || !scriptPrompt}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Script
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedScript.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{scriptTitle || "Generated Script"}</h2>
              <Button onClick={exportScript} variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Export as Text
              </Button>
            </div>

            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${generatedScript.length}, 1fr)` }}>
                {generatedScript.map((scene) => (
                  <TabsTrigger key={scene.sceneNumber} value={scene.sceneNumber.toString()}>
                    Scene {scene.sceneNumber}
                  </TabsTrigger>
                ))}
              </TabsList>

              {generatedScript.map((scene) => (
                <TabsContent key={scene.sceneNumber} value={scene.sceneNumber.toString()} className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="font-bold">Setting</Label>
                      <div className="p-3 bg-slate-800/50 rounded-md mt-1">
                        <p className="text-slate-200">{scene.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="font-bold">Dialogue</Label>
                      <div className="p-3 bg-slate-800/50 rounded-md mt-1 whitespace-pre-line">
                        <p className="text-slate-200">{scene.dialogue}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                      <div className="space-y-2">
                        <Label className="font-bold flex items-center">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Scene Visualization
                        </Label>
                        <div className="relative aspect-video rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                          {scene.imageUrl ? (
                            <img
                              src={scene.imageUrl}
                              alt={`Scene ${scene.sceneNumber}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ImageIcon className="h-16 w-16 text-slate-600" />
                            </div>
                          )}
                          {currentGeneratingIndex === scene.sceneNumber - 1 && !scene.imageUrl && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => generateImageForScene(scene.sceneNumber - 1)}
                          disabled={currentGeneratingIndex !== null || counts.remainingImages <= 0}
                          className="w-full"
                          variant={scene.imageUrl ? "secondary" : "default"}
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          {scene.imageUrl ? "Regenerate Image" : "Generate Image"} 
                          ({counts.remainingImages} remaining)
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label className="font-bold flex items-center">
                          <Film className="mr-2 h-4 w-4" />
                          Animated Scene
                        </Label>
                        <div className="relative aspect-video rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                          {scene.videoUrl ? (
                            <video
                              src={scene.videoUrl}
                              controls
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <PlayCircle className="h-16 w-16 text-slate-600" />
                            </div>
                          )}
                          {currentGeneratingIndex === scene.sceneNumber - 1 && scene.imageUrl && !scene.videoUrl && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => generateVideoForScene(scene.sceneNumber - 1)}
                          disabled={currentGeneratingIndex !== null || !scene.imageUrl || counts.remainingVideos <= 0}
                          className="w-full"
                          variant={scene.videoUrl ? "secondary" : "default"}
                        >
                          <Film className="mr-2 h-4 w-4" />
                          {scene.videoUrl ? "Regenerate Video" : "Generate Video"} 
                          ({counts.remainingVideos} remaining)
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScriptToVideo;
