
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Video, Film, Mic, Image, Subtitles } from "lucide-react";
import { VideoShortPreview } from "./VideoShortPreview";
import { useVideoShortsGenerator } from "@/hooks/useVideoShortsGenerator";
import { VideoShortConfiguration } from "@/types";

export default function VideoShortsGenerator() {
  const [topic, setTopic] = useState("");
  const [activeTab, setActiveTab] = useState("configure");
  const [voiceOption, setVoiceOption] = useState("en-US-JennyNeural");
  const [videoStyle, setVideoStyle] = useState("vertical");
  const [addCaptions, setAddCaptions] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const { generateResponse, isLoading: isGeminiLoading } = useGeminiAPI();
  const {
    generateShort,
    isGenerating,
    progress,
    currentStep,
    videoShort,
    hasApiKeys,
    checkApiKeys
  } = useVideoShortsGenerator();
  
  useEffect(() => {
    checkApiKeys();
  }, []);
  
  const voices = [
    { value: "en-US-JennyNeural", label: "Jenny (US Female)" },
    { value: "en-US-GuyNeural", label: "Guy (US Male)" },
    { value: "en-GB-SoniaNeural", label: "Sonia (UK Female)" },
    { value: "en-GB-RyanNeural", label: "Ryan (UK Male)" },
    { value: "en-AU-NatashaNeural", label: "Natasha (Australian Female)" },
    { value: "en-AU-WilliamNeural", label: "William (Australian Male)" }
  ];
  
  const videoStyles = [
    { value: "vertical", label: "Vertical (9:16)" },
    { value: "horizontal", label: "Horizontal (16:9)" },
    { value: "square", label: "Square (1:1)" }
  ];
  
  const handleGenerateShort = async () => {
    if (!topic.trim()) {
      toast({
        title: "Missing topic",
        description: "Please enter a topic for your short video.",
        variant: "destructive"
      });
      return;
    }
    
    // Check if API keys are set
    if (!hasApiKeys) {
      toast({
        title: "API Keys Required",
        description: "Please set all required API keys in the settings.",
        variant: "destructive"
      });
      return;
    }

    try {
      const config: VideoShortConfiguration = {
        topic,
        voiceOption,
        videoStyle,
        addCaptions,
        isPublic
      };
      
      await generateShort(config);
      setActiveTab("preview");
    } catch (error) {
      console.error("Error generating video short:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate video short. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border shadow-lg overflow-hidden bg-slate-900/50 backdrop-blur-sm">
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              AI Video Shorts Generator
            </h2>
            <TabsList className="grid grid-cols-2 bg-slate-800">
              <TabsTrigger value="configure">Configure</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="configure" className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic" className="text-sm font-medium mb-2 block">
                  Video Topic or Idea
                </Label>
                <Textarea
                  id="topic"
                  placeholder="Enter a topic or idea for your video short (e.g., 'The benefits of meditation for stress relief')"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="h-24"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voice" className="text-sm font-medium mb-2 block">
                    Voice
                  </Label>
                  <Select value={voiceOption} onValueChange={setVoiceOption}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.value} value={voice.value}>
                          {voice.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="style" className="text-sm font-medium mb-2 block">
                    Video Format
                  </Label>
                  <Select value={videoStyle} onValueChange={setVideoStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select video style" />
                    </SelectTrigger>
                    <SelectContent>
                      {videoStyles.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="captions" 
                  checked={addCaptions} 
                  onCheckedChange={setAddCaptions} 
                />
                <Label htmlFor="captions">Generate Captions</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="public" 
                  checked={isPublic} 
                  onCheckedChange={setIsPublic} 
                />
                <Label htmlFor="public">Save to Public Gallery</Label>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleGenerateShort}
                  className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  size="lg"
                  disabled={isGenerating || isGeminiLoading || !topic.trim()}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Video Short...
                    </>
                  ) : (
                    <>
                      <Film className="mr-2 h-5 w-5" />
                      Generate Video Short
                    </>
                  )}
                </Button>
              </div>
              
              {!hasApiKeys && (
                <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-yellow-200 text-sm">
                  <p className="font-medium">API Keys Required</p>
                  <p className="mt-1">Please set all required API keys in the settings to use this feature.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="p-0">
            {isGenerating ? (
              <div className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-center">Generating Video Short</h3>
                <Progress value={progress} className="h-2" />
                <div className="text-center text-sm text-slate-400">
                  {currentStep === "script" && (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Writing script with Gemini AI...
                    </div>
                  )}
                  {currentStep === "images" && (
                    <div className="flex items-center justify-center gap-2">
                      <Image className="h-4 w-4" />
                      Finding images with Pexels...
                    </div>
                  )}
                  {currentStep === "audio" && (
                    <div className="flex items-center justify-center gap-2">
                      <Mic className="h-4 w-4" />
                      Generating audio with Azure Speech...
                    </div>
                  )}
                  {currentStep === "captions" && (
                    <div className="flex items-center justify-center gap-2">
                      <Subtitles className="h-4 w-4" />
                      Creating captions with AssemblyAI...
                    </div>
                  )}
                  {currentStep === "video" && (
                    <div className="flex items-center justify-center gap-2">
                      <Video className="h-4 w-4" />
                      Rendering final video...
                    </div>
                  )}
                </div>
              </div>
            ) : videoShort ? (
              <VideoShortPreview videoShort={videoShort} />
            ) : (
              <div className="p-6 text-center">
                <p>No video generated yet. Configure and generate a video first.</p>
                <Button 
                  onClick={() => setActiveTab("configure")}
                  variant="outline" 
                  className="mt-4"
                >
                  Go to Configuration
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
