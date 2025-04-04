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
        Provide:
        1. Main character appearance (age, gender, clothing, distinctive features)
        2. Secondary characters if any
        3. Environment/setting details
        4. Visual style notes
        
        Format as JSON:
        {
          "mainCharacter": "...",
          "secondaryCharacters": "...",
          "environment": "...",
          "styleNotes": "..."
        }`
      );

      const cleaned = response.replace(/```json|```/g, '').trim();
      const details = JSON.parse(cleaned);
      setCharacterDetails(details);
      toast({
        title: "Character template created!",
        description: "Review and edit the character details before generating story."
      });
    } catch (error) {
      console.error("Error generating character template:", error);
      toast({
        title: "Error",
        description: "Failed to generate character template",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
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
      
      Format response as JSON array:
      [
        {
          "text": "Scene narrative...",
          "imagePrompt": "Detailed prompt with consistent characters..."
        }
      ]`;

      const response = await generateResponse(geminiPrompt);
      console.log("Gemini response:", response);

      try {
        const cleanedResponse = response.trim();
        let jsonString = cleanedResponse;
        const codeBlockMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonString = codeBlockMatch[1].trim();
        }

        const jsonResponse = JSON.parse(jsonString);

        if (Array.isArray(jsonResponse) && jsonResponse.length > 0) {
          // Enhance prompts with character details if they weren't included
          const enhancedStory = jsonResponse.map((scene, index) => {
            let enhancedPrompt = scene.imagePrompt;
            
            if (characterDetails.mainCharacter && 
                !scene.imagePrompt.includes(characterDetails.mainCharacter)) {
              enhancedPrompt = `Character: ${characterDetails.mainCharacter}. ${scene.imagePrompt}`;
            }

            return {
              ...scene,
              imagePrompt: enhancedPrompt
            };
          });

          setGeneratedStory(enhancedStory);
          setEditedStory(enhancedStory);
          setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        toast({
          title: "Error parsing story",
          description: "The AI returned an invalid format. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error generating story:", error);
      toast({
        title: "Error",
        description: "Failed to generate story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // ... (keep generateImageForScene and generateVideoForScene functions same as before, 
  // but ensure they use the enhanced prompts from generatedStory)

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
            disabled={!storyPrompt}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Generate Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ... (keep renderSceneTabs and other helper functions same as before)

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BookText className="mr-2 h-6 w-6" />
            Story to Video Generator
          </h2>

          <div className="space-y-4">
            {/* Story Prompt Input */}
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

            {/* Character Consistency Section */}
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

            {/* Scene Count Selector */}
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

            {/* Image Style Selector */}
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

      {/* Generated Story Display */}
      {generatedStory.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {/* ... (keep the rest of the generated story display same as before) */}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryToVideo;
