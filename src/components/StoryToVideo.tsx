
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, BookText, Film, Sparkles } from "lucide-react";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { incrementImageCount, incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { fal } from "@fal-ai/client";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";

interface StoryScene {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}

const StoryToVideo = () => {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<StoryScene[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [counts, setCounts] = useState({ remainingImages: 0, remainingVideos: 0 });
  const [sceneCount, setSceneCount] = useState("3");
  
  const { generateResponse, isLoading: isGeminiLoading } = useGeminiAPI();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    
    fetchCounts();
  }, []);

  const generateStory = async () => {
    if (!storyPrompt) {
      toast({
        title: "Error",
        description: "Please enter a story prompt",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingStory(true);
    setGeneratedStory([]);
    setVideoUrls([]);
    
    try {
      const numScenes = parseInt(sceneCount);
      const geminiPrompt = `Create a short story based on this prompt: "${storyPrompt}".
Break it down into exactly ${numScenes} scenes. For each scene:
1. Write a paragraph of narrative
2. Create a detailed image prompt that visualizes that scene (for AI image generation)

Format your response as a JSON array with this structure:
[
  {
    "text": "Scene narrative text here",
    "imagePrompt": "Detailed image generation prompt for this scene"
  }
]
Only return valid JSON without any additional text, explanations or markdown.`;

      const response = await generateResponse(geminiPrompt);
      console.log("Gemini response:", response);
      
      // Parse the JSON response with improved error handling
      try {
        // Clean the response before parsing
        const cleanedResponse = response.trim();
        
        // Try to extract JSON if wrapped in backticks or other markdown
        let jsonString = cleanedResponse;
        
        // Check if response is wrapped in markdown code blocks
        const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
        }
        
        const jsonResponse = JSON.parse(jsonString);
        
        if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
          // Validate each scene has the required properties
          const validStory = jsonResponse.every(scene => 
            typeof scene === 'object' && 
            typeof scene.text === 'string' && 
            typeof scene.imagePrompt === 'string'
          );
          
          if (validStory) {
            setGeneratedStory(jsonResponse);
            setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);
          } else {
            throw new Error("Invalid scene structure in response");
          }
        } else {
          throw new Error("Invalid response format - not an array or empty array");
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        toast({
          title: "Error parsing story",
          description: "The AI returned an invalid format. Please try again with a different prompt.",
          variant: "destructive"
        });
        
        // Attempt to generate with a simplified prompt as fallback
        try {
          const fallbackPrompt = `Write a simple ${sceneCount}-scene story about "${storyPrompt}" with clear image descriptions for each scene. Format as JSON array with "text" and "imagePrompt" properties for each scene. Only return valid JSON.`;
          
          const fallbackResponse = await generateResponse(fallbackPrompt);
          console.log("Fallback response:", fallbackResponse);
          
          // Clean and parse fallback response
          const cleanedFallback = fallbackResponse.trim();
          let fallbackJson = cleanedFallback;
          
          const fallbackMatch = cleanedFallback.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (fallbackMatch) {
            fallbackJson = fallbackMatch[1].trim();
          }
          
          const parsedFallback = JSON.parse(fallbackJson);
          
          if (Array.isArray(parsedFallback) && parsedFallback.length > 0 && 
              parsedFallback.every(scene => typeof scene.text === 'string' && typeof scene.imagePrompt === 'string')) {
            setGeneratedStory(parsedFallback);
            setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);
          } else {
            throw new Error("Fallback response also invalid");
          }
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
        }
      }
    } catch (error) {
      console.error("Error generating story:", error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again with a different prompt.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const generateImageForScene = async (sceneIndex: number) => {
    if (counts.remainingImages <= 0) {
      toast({
        title: "Usage Limit Reached",
        description: `You've reached the limit of image generations.`,
        variant: "destructive",
      });
      return;
    }

    const scene = generatedStory[sceneIndex];
    if (!scene) return;

    setCurrentGeneratingIndex(sceneIndex);
    
    try {
      // Get API key from localStorage for fal.ai
      const apiKey = localStorage.getItem("falApiKey");
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set your Infinity API key first using the button in the header.",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

      // Configure fal.ai with the API key
      fal.config({
        credentials: apiKey
      });

      // Use fal.ai for image generation
      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: scene.imagePrompt,
          aspect_ratio: "1:1",
          negative_prompt: "low quality, bad anatomy, distorted"
        },
      });

      if (result.data?.images?.[0]?.url) {
        const imageUrl = result.data.images[0].url;
        
        // Update the generatedStory with the image URL
        const updatedStory = [...generatedStory];
        updatedStory[sceneIndex] = { ...updatedStory[sceneIndex], imageUrl };
        setGeneratedStory(updatedStory);
        
        await incrementImageCount();
        const freshCounts = await getRemainingCountsAsync();
        setCounts(freshCounts);
        
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCurrentGeneratingIndex(null);
    }
  };

  const generateVideoForScene = async (sceneIndex: number) => {
    if (counts.remainingVideos <= 0) {
      toast({
        title: "Usage Limit Reached",
        description: `You've reached the limit of video generations.`,
        variant: "destructive",
      });
      return;
    }

    const scene = generatedStory[sceneIndex];
    if (!scene || !scene.imageUrl) {
      toast({
        title: "Error",
        description: "Please generate an image first",
        variant: "destructive"
      });
      return;
    }
    
    setCurrentGeneratingIndex(sceneIndex);
    
    try {
      // Get API key from localStorage for fal.ai
      const apiKey = localStorage.getItem("falApiKey");
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set your Infinity API key first using the button in the header.",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

      // Configure fal.ai with the API key
      fal.config({
        credentials: apiKey
      });

      // Use fal.ai for video generation from image - using the Kling model
      const result = await fal.subscribe("fal-ai/kling-video/v1.6/standard/image-to-video", {
        input: {
          prompt: scene.imagePrompt,
          image_url: scene.imageUrl,
          duration: "5",
          aspect_ratio: "1:1",
          negative_prompt: "blur, distort, and low quality",
          cfg_scale: 0.5,
        },
        logs: true,
        onQueueUpdate: (update) => {
          console.log("Kling video queue update:", update);
        },
      });

      console.log("Video generation result:", result);

      if (result.data?.video?.url) {
        const videoUrl = result.data.video.url;
        
        // Save to user's content history
        const userId = await getUserId();
        if (userId) {
          const { error } = await supabase
            .from('user_content_history')
            .insert({
              user_id: userId,
              content_type: 'video',
              content_url: videoUrl,
              prompt: scene.imagePrompt,
              is_public: isPublic,
              metadata: {
                story_title: storyTitle,
                scene_text: scene.text,
                story_prompt: storyPrompt
              }
            });

          if (error) {
            console.error("Error saving to history:", error);
          }
        }
        
        // Update video URLs
        const newVideoUrls = [...videoUrls];
        newVideoUrls[sceneIndex] = videoUrl;
        setVideoUrls(newVideoUrls);
        
        await incrementVideoCount();
        const freshCounts = await getRemainingCountsAsync();
        setCounts(freshCounts);
        
        toast({
          title: "Success",
          description: "Video generated successfully!",
        });
      } else {
        throw new Error("No video URL in response");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Error",
        description: "Failed to generate video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCurrentGeneratingIndex(null);
    }
  };

  const renderSceneTabs = () => {
    return generatedStory.map((_, index) => (
      <TabsTrigger key={index} value={index.toString()}>Scene {index + 1}</TabsTrigger>
    ));
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BookText className="mr-2 h-6 w-6" />
            Story to Video Generator
          </h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="storyPrompt">Story Prompt</Label>
              <Textarea
                id="storyPrompt"
                placeholder="Enter a story idea like 'A detective in a cyberpunk city investigates a strange case'"
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                className="min-h-[80px]"
                disabled={isGeneratingStory}
              />
            </div>
            
            <div>
              <Label htmlFor="sceneCount">Number of Scenes</Label>
              <Select 
                value={sceneCount} 
                onValueChange={setSceneCount}
                disabled={isGeneratingStory}
              >
                <SelectTrigger className="w-full" id="sceneCount">
                  <SelectValue placeholder="Select number of scenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Scenes</SelectItem>
                  <SelectItem value="3">3 Scenes</SelectItem>
                  <SelectItem value="4">4 Scenes</SelectItem>
                  <SelectItem value="5">5 Scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <PublicPrivateToggle 
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGeneratingStory}
            />
            
            <Button
              onClick={generateStory}
              disabled={isGeneratingStory || !storyPrompt || isGeminiLoading}
              className="w-full"
            >
              {isGeneratingStory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Story...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Story
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {generatedStory.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">{storyTitle}</h2>
            
            <Tabs defaultValue="0" className="w-full">
              <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${generatedStory.length}, 1fr)` }}>
                {renderSceneTabs()}
              </TabsList>
              
              {generatedStory.map((scene, index) => (
                <TabsContent key={index} value={index.toString()} className="space-y-4">
                  <div className="p-4 bg-slate-800/50 rounded-md">
                    <p className="text-slate-200">{scene.text}</p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="mb-2 block">Scene Image</Label>
                      <div className="relative aspect-square rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                        {scene.imageUrl ? (
                          <img 
                            src={scene.imageUrl} 
                            alt={`Scene ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ImageIcon className="h-16 w-16 text-slate-600" />
                          </div>
                        )}
                        
                        {currentGeneratingIndex === index && !scene.imageUrl && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => generateImageForScene(index)}
                        disabled={!!currentGeneratingIndex || counts.remainingImages <= 0}
                        className="mt-2 w-full"
                        variant="outline"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generate Image
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Scene Video</Label>
                      <div className="relative aspect-square rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                        {videoUrls[index] ? (
                          <video
                            src={videoUrls[index]}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Film className="h-16 w-16 text-slate-600" />
                          </div>
                        )}
                        
                        {currentGeneratingIndex === index && scene.imageUrl && !videoUrls[index] && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                          </div>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => generateVideoForScene(index)}
                        disabled={!!currentGeneratingIndex || !scene.imageUrl || counts.remainingVideos <= 0}
                        className="mt-2 w-full"
                        variant={scene.imageUrl ? "default" : "outline"}
                      >
                        <Film className="mr-2 h-4 w-4" />
                        Generate Video
                      </Button>
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

export default StoryToVideo;
