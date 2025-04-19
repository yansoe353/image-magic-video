
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, BookText, Film, Sparkles, User } from "lucide-react";
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

interface CharacterDetails {
  mainCharacter?: string;
  secondaryCharacters?: string;
  environment?: string;
  styleNotes?: string;
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
  const [imageStyle, setImageStyle] = useState("photorealism");
  const [editMode, setEditMode] = useState(false);
  const [editedStory, setEditedStory] = useState<StoryScene[]>([]);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails>({});
  const [showCharacterForm, setShowCharacterForm] = useState(false);

  const { generateResponse, isLoading: isGeminiLoading } = useGeminiAPI();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    fetchCounts();
  }, []);

  const generateCharacterTemplate = async () => {
    if (!storyPrompt) {
      toast({
        title: "Error",
        description: "Please enter a story prompt first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingStory(true);
    try {
      const response = await generateResponse(
        `Create detailed character descriptions for a story about: "${storyPrompt}". 
        Provide this information in valid JSON format only:
        {
          "mainCharacter": "Detailed description including age, gender, appearance, clothing and distinctive features",
          "secondaryCharacters": "Descriptions of other important characters",
          "environment": "Description of the main setting/environment",
          "styleNotes": "Specific visual style requirements"
        }
        
        Important: Only return valid JSON without any additional text or explanations.`
      );

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(response.trim());
      } catch (e) {
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          parsedResponse = JSON.parse(codeBlockMatch[1].trim());
        } else {
          const firstBrace = response.indexOf('{');
          const lastBrace = response.lastIndexOf('}');
          if (firstBrace >= 0 && lastBrace > firstBrace) {
            parsedResponse = JSON.parse(response.slice(firstBrace, lastBrace + 1));
          } else {
            throw new Error("Could not extract valid JSON");
          }
        }
      }

      if (
        typeof parsedResponse === 'object' && 
        parsedResponse !== null &&
        (parsedResponse.mainCharacter || 
         parsedResponse.secondaryCharacters ||
         parsedResponse.environment ||
         parsedResponse.styleNotes)
      ) {
        setCharacterDetails({
          mainCharacter: parsedResponse.mainCharacter || '',
          secondaryCharacters: parsedResponse.secondaryCharacters || '',
          environment: parsedResponse.environment || '',
          styleNotes: parsedResponse.styleNotes || ''
        });
        toast({
          title: "Character template created!",
          description: "Review and edit the character details before generating story."
        });
      } else {
        throw new Error("Invalid character template format");
      }
    } catch (error) {
      console.error("Error generating character template:", error);
      toast({
        title: "Error",
        description: "Failed to generate character template. Please try again or enter details manually.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const cleanJsonResponse = (response: string): string => {
    let cleaned = response.replace(/```json|```/g, '').trim();
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      cleaned = cleaned.slice(firstBrace, lastBrace + 1);
    }
    
    return cleaned;
  };

  const parseStoryResponse = (response: string): StoryScene[] => {
    try {
      const directParse = JSON.parse(response.trim());
      if (Array.isArray(directParse)) return directParse;
    } catch (e) {}

    try {
      const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        const extracted = codeBlockMatch[1].trim();
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    try {
      const firstBracket = response.indexOf('[');
      const lastBracket = response.lastIndexOf(']');
      if (firstBracket >= 0 && lastBracket > firstBracket) {
        const extracted = response.slice(firstBracket, lastBracket + 1);
        const parsed = JSON.parse(extracted);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}

    throw new Error("Unable to parse story response");
  };

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
      const characterContext = characterDetails.mainCharacter 
        ? `Main Character: ${characterDetails.mainCharacter}\n` +
          `Secondary Characters: ${characterDetails.secondaryCharacters || 'none'}\n` +
          `Environment: ${characterDetails.environment || 'unspecified'}\n` +
          `Style: ${characterDetails.styleNotes || 'unspecified'}\n\n`
        : '';

      const geminiPrompt = `${characterContext}Create a ${numScenes}-scene story about: "${storyPrompt}".

      Requirements:
      1. Maintain strict consistency with provided character details
      2. Each scene should naturally progress the story
      3. For each scene provide:
         - Narrative text (include character actions/dialogue)
         - Detailed image prompt that maintains visual consistency
      
      Image Prompt Guidelines:
      - Always reference the established character details
      - Maintain consistent clothing/hairstyles/features
      - Keep environment/style coherent
      - Use same character names if provided
      
      Format response as a JSON array following this exact structure:
      [
        {
          "text": "Scene narrative...",
          "imagePrompt": "Detailed prompt with consistent characters..."
        }
      ]
      
      Important: Only return valid JSON without any other text or markdown.`;

      const response = await generateResponse(geminiPrompt);
      console.log("Raw API response:", response);

      try {
        const parsedStory = parseStoryResponse(response);
        
        if (!Array.isArray(parsedStory)) {
          throw new Error("Response was not an array");
        }

        const isValidStory = parsedStory.every(scene => 
          typeof scene.text === 'string' && 
          typeof scene.imagePrompt === 'string'
        );

        if (!isValidStory) {
          throw new Error("Invalid scene structure");
        }

        const enhancedStory = parsedStory.map(scene => ({
          text: scene.text,
          imagePrompt: characterDetails.mainCharacter 
            ? `${characterDetails.mainCharacter}. ${scene.imagePrompt}`
            : scene.imagePrompt
        }));

        setGeneratedStory(enhancedStory);
        setEditedStory(enhancedStory);
        setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);

      } catch (parseError) {
        console.error("Failed to parse story:", parseError);
        await attemptFallbackStoryGeneration();
      }
    } catch (error) {
      console.error("Story generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try a different prompt.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const attemptFallbackStoryGeneration = async () => {
    try {
      toast({
        title: "Trying alternative approach...",
        description: "Having trouble with the story format, attempting simplified version",
        variant: "default"
      });

      const numScenes = parseInt(sceneCount);
      const fallbackPrompt = `Create a simple ${numScenes}-scene story about "${storyPrompt}". 
        Each scene should have:
        1. A paragraph of story text
        2. An image description
        
        Return as JSON array like: [{"text":"...","imagePrompt":"..."}]`;

      const fallbackResponse = await generateResponse(fallbackPrompt);
      const parsedFallback = parseStoryResponse(fallbackResponse);

      if (Array.isArray(parsedFallback)) {
        setGeneratedStory(parsedFallback);
        setEditedStory(parsedFallback);
        setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);
        toast({
          title: "Success",
          description: "Used simplified story format",
          variant: "default"
        });
      } else {
        throw new Error("Fallback parse failed");
      }
    } catch (fallbackError) {
      console.error("Fallback generation failed:", fallbackError);
      toast({
        title: "Error",
        description: "Completely failed to generate story. Please try a different prompt.",
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

    const scene = generatedStory[sceneIndex];
    if (!scene) return;

    setCurrentGeneratingIndex(sceneIndex);

    try {
      const apiKey = localStorage.getItem("falApiKey");
      if (!apiKey) {
        toast({
          title: "API Key Required",
          description: "Please set your API key first",
          variant: "destructive",
        });
        return;
      }

      const canGenerate = await incrementImageCount();
      if (!canGenerate) {
        toast({
          title: "Limit Reached",
          description: "You've used all your image generations",
          variant: "destructive",
        });
        return;
      }

      fal.config({ credentials: apiKey });

      const enhancedPrompt = characterDetails.mainCharacter 
        ? `${characterDetails.mainCharacter}. ${scene.imagePrompt} in ${imageStyle} style`
        : `${scene.imagePrompt} in ${imageStyle} style`;

      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: "1:1",
          negative_prompt: "low quality, bad anatomy, distorted"
        },
      });

      if (result.data?.images?.[0]?.url) {
        const updatedStory = [...generatedStory];
        updatedStory[sceneIndex] = { ...updatedStory[sceneIndex], imageUrl: result.data.images[0].url };
        setGeneratedStory(updatedStory);

        // Store the generated image in user history if userId exists
        const userId = await getUserId();
        if (userId) {
          try {
            await supabase.from('user_content_history').insert({
              user_id: userId,
              content_type: 'image',
              content_url: result.data.images[0].url,
              prompt: scene.imagePrompt,
              is_public: isPublic,
              metadata: {
                story_title: storyTitle,
                scene_text: scene.text,
                story_prompt: storyPrompt,
                image_style: imageStyle
              }
            });
            console.log("Image saved to history");
          } catch (historyError) {
            console.error("Failed to save image to history:", historyError);
          }
        }

        // Update counts after successful generation
        const freshCounts = await getRemainingCountsAsync();
        setCounts(freshCounts);

        toast({
          title: "Success",
          description: "Image generated with consistent characters!",
        });
      }
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate image",
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

    const scene = generatedStory[sceneIndex];
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
        return;
      }

      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        toast({
          title: "Limit Reached",
          description: "You've used all your video generations",
          variant: "destructive",
        });
        return;
      }

      fal.config({ credentials: apiKey });

      const result = await fal.subscribe("fal-ai/kling-video/v1.6/standard/image-to-video", {
        input: {
          prompt: scene.imagePrompt,
          image_url: scene.imageUrl,
          duration: "5",
          aspect_ratio: "1:1",
          negative_prompt: "blur, distort, low quality",
          cfg_scale: 0.5,
        },
        logs: true,
      });

      if (result.data?.video?.url) {
        const newVideoUrls = [...videoUrls];
        newVideoUrls[sceneIndex] = result.data.video.url;
        setVideoUrls(newVideoUrls);

        const userId = await getUserId();
        if (userId) {
          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'video',
            content_url: result.data.video.url,
            prompt: scene.imagePrompt,
            is_public: isPublic,
            metadata: {
              story_title: storyTitle,
              scene_text: scene.text,
              story_prompt: storyPrompt
            }
          });
        }

        // Update counts after successful generation
        setCounts(await getRemainingCountsAsync());

        toast({
          title: "Success",
          description: "Video generated from scene!",
        });
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

  const CharacterDetailsForm = () => (
    <Card className="mt-4">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-bold flex items-center">
          <User className="mr-2 h-5 w-5" />
          Character Details
        </h3>
        
        <div>
          <Label>Main Character</Label>
          <Textarea
            value={characterDetails.mainCharacter || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, mainCharacter: e.target.value})}
            placeholder="Detailed description of main character (appearance, clothing, etc.)"
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label>Secondary Characters</Label>
          <Textarea
            value={characterDetails.secondaryCharacters || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, secondaryCharacters: e.target.value})}
            placeholder="Descriptions of other important characters"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label>Environment</Label>
          <Textarea
            value={characterDetails.environment || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, environment: e.target.value})}
            placeholder="Description of the main setting/environment"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label>Style Notes</Label>
          <Textarea
            value={characterDetails.styleNotes || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, styleNotes: e.target.value})}
            placeholder="Any specific visual style requirements"
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCharacterForm(false)}
            variant="outline"
          >
            Done
          </Button>
          <Button 
            onClick={generateCharacterTemplate}
            disabled={!storyPrompt || isGeneratingStory}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Generate Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

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

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Character Consistency</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCharacterForm(!showCharacterForm)}
                >
                  {showCharacterForm ? "Hide Details" : "Add Character Details"}
                </Button>
              </div>
              {showCharacterForm && <CharacterDetailsForm />}
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
                  <SelectItem value="6">6 Scenes</SelectItem>
                  <SelectItem value="7">7 Scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageStyle">Image Style</Label>
              <Select
                value={imageStyle}
                onValueChange={setImageStyle}
                disabled={isGeneratingStory}
              >
                <SelectTrigger className="w-full" id="imageStyle">
                  <SelectValue placeholder="Select image style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealism">Photorealism</SelectItem>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="fantasy">Fantasy Art</SelectItem>
                  <SelectItem value="comic">Comic Book</SelectItem>
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

            <Button
              onClick={() => setEditMode(!editMode)}
              disabled={isGeneratingStory}
              className="w-full mt-4"
              variant={editMode ? "default" : "outline"}
            >
              {editMode ? "Cancel Editing" : "Edit Story"}
            </Button>

            {editMode ? (
              <div className="space-y-4 mt-4">
                {editedStory.map((scene, index) => (
                  <div key={index} className="space-y-2">
                    <Label>Scene {index + 1} Text</Label>
                    <Textarea
                      value={scene.text}
                      onChange={(e) => {
                        const updated = [...editedStory];
                        updated[index] = { ...updated[index], text: e.target.value };
                        setEditedStory(updated);
                      }}
                      className="min-h-[120px]"
                    />
                    <Label>Scene {index + 1} Image Prompt</Label>
                    <Textarea
                      value={scene.imagePrompt}
                      onChange={(e) => {
                        const updated = [...editedStory];
                        updated[index] = { ...updated[index], imagePrompt: e.target.value };
                        setEditedStory(updated);
                      }}
                      className="min-h-[120px]"
                    />
                  </div>
                ))}
                <Button
                  onClick={() => {
                    setGeneratedStory(editedStory);
                    setEditMode(false);
                    toast({
                      title: "Saved",
                      description: "Your story edits have been saved",
                    });
                  }}
                  className="w-full"
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="0" className="w-full mt-4">
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
                          disabled={currentGeneratingIndex !== null || counts.remainingImages <= 0}
                          className="mt-2 w-full"
                          variant="outline"
                        >
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Generate Image ({counts.remainingImages} remaining)
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
                          disabled={currentGeneratingIndex !== null || !scene.imageUrl || counts.remainingVideos <= 0}
                          className="mt-2 w-full"
                          variant={scene.imageUrl ? "default" : "outline"}
                        >
                          <Film className="mr-2 h-4 w-4" />
                          Generate Video ({counts.remainingVideos} remaining)
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryToVideo;
