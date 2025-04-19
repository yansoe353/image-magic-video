
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { useToast } from "@/hooks/use-toast";
import { Wand2, FileText, Loader2, FileDown } from "lucide-react";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { StoryScene } from "@/types";
import { generateStoryPDF } from "@/services/pdfService";
import { LANGUAGES, LanguageOption } from "@/utils/translationUtils";
import MyanmarVpnWarning from "./MyanmarVpnWarning";

interface ScriptItem {
  text: string;
  imagePrompt: string;
}

const ScriptToVideo = () => {
  const [title, setTitle] = useState<string>("");
  const [scriptIdea, setScriptIdea] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<ScriptItem[]>([]);
  const [generatingScript, setGeneratingScript] = useState<boolean>(false);
  const [scenesCount, setScenesCount] = useState<number>(3);
  const [activeTab, setActiveTab] = useState<string>("script");
  const [scriptStyle, setScriptStyle] = useState<string>("cinematic");
  const [generatingPDF, setGeneratingPDF] = useState<boolean>(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  
  const { generateResponse } = useGeminiAPI({
    temperature: 0.7,
    maxOutputTokens: 2048,
  });
  
  const { toast } = useToast();
  
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
            "imagePrompt": "Visual description for this scene"
          }
        ]
        
        Make each scene descriptive and visual. Do not include any explanations, just return valid JSON.
      `;
      
      const response = await generateResponse(prompt);
      
      try {
        const jsonStart = response.indexOf('[');
        const jsonEnd = response.lastIndexOf(']') + 1;
        const jsonStr = response.substring(jsonStart, jsonEnd);
        const parsedScript = JSON.parse(jsonStr) as ScriptItem[];
        
        const validatedScript = parsedScript.map(scene => ({
          text: scene.text,
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
      imagePrompt: item.imagePrompt
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
        imagePrompt: item.imagePrompt
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
  
  return (
    <div className="w-full">
      <MyanmarVpnWarning className="mb-4" />
      
      <Card className="mb-6 shadow-lg glass-morphism">
        <CardHeader>
          <CardTitle className="text-gradient">Script Generator</CardTitle>
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
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    {generatedScript.map((scene, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardHeader className="bg-slate-800/50">
                          <CardTitle className="text-sm">Scene {index + 1}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-4">
                            <p className="whitespace-pre-line text-sm">{scene.text}</p>
                            <p className="text-xs text-muted-foreground">
                              <strong>Visual description:</strong> {scene.imagePrompt}
                            </p>
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
