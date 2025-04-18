
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";

interface ScriptScene {
  sceneNumber: number;
  description: string;
  dialogue: string;
}

const ScriptToVideo = () => {
  const [scriptTitle, setScriptTitle] = useState("");
  const [scriptPrompt, setScriptPrompt] = useState("");
  const [genre, setGenre] = useState("drama");
  const [numScenes, setNumScenes] = useState("3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScript, setGeneratedScript] = useState<ScriptScene[]>([]);
  const [currentTab, setCurrentTab] = useState("0");

  const { generateResponse } = useGeminiAPI();
  const { toast } = useToast();

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
      [{
        "sceneNumber": 1,
        "description": "Detailed scene setting description",
        "dialogue": "CHARACTER: Actual dialogue text with speaker names"
      }]
      
      Return valid JSON only.`;

      console.log("Generating script with prompt:", scriptRequest);
      const response = await generateResponse(scriptRequest);
      
      try {
        const parsedScript = parseScriptResponse(response);
        
        if (Array.isArray(parsedScript) && parsedScript.length > 0) {
          const formattedScript = parsedScript.map((scene, idx) => ({
            sceneNumber: scene.sceneNumber || idx + 1,
            description: scene.description || "",
            dialogue: scene.dialogue || ""
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
        
        Format as simple JSON array: [{"sceneNumber":1,"description":"...","dialogue":"..."}]`;

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
            Script Generator
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

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
