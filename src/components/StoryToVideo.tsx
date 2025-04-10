import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, BookText, Film, Sparkles, User, Download, Globe, FileText } from "lucide-react";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { incrementImageCount, incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { fal } from "@fal-ai/client";
import { uploadUrlToStorage } from "@/utils/storageUtils";
import { generateStoryPDF } from "@/services/pdfService";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { StoryScene, CharacterDetails } from "@/types";
import { LANGUAGES, type LanguageOption } from "@/utils/translationUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState<LanguageOption>("en");
  const [isDownloadingText, setIsDownloadingText] = useState(false);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("falApiKey") || "");
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(!!localStorage.getItem("falApiKey"));

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
        const codeBlockMatch = response.match(/```(?\:json)?\s*([\s\S]*?)\s*```/);
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
      const codeBlockMatch = response.match(/```(?\:json)?\s*([\s\S]*?)\s*```/);
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

  const getAspectRatio = (sizeOption: string): string => {
    if (sizeOption.includes('landscape')) return '16:9';
    if (sizeOption.includes('portrait')) return '9:16';
    return '1:1';
  };

  const saveToHistory = async (imageUrl: string, originalUrl: string) => {
    if (!isLoggedIn()) return;

    try {
      const userId = await getUserId();
      if (!userId) {
        console.error("No user ID found");
        return;
      }

      const { error } = await supabase
        .from('user_content_history')
        .insert({
          user_id: userId,
          content_type: 'image',
          content_url: imageUrl,
          prompt: storyPrompt,
          is_public: isPublic,
          metadata: {
            size: imageStyle,
            original_url: originalUrl,
            model: "imagen3-fast",
          }
        });

      if (error) {
        console.error("Error saving to history:", error);
      }
    } catch (err) {
      console.error("Failed to save to history:", err);
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
      if (!isApiKeySet) {
        toast({
          title: "API Key Required",
          description: "Please set your Infinity API key first",
          variant: "destructive",
        });
        setCurrentGeneratingIndex(null);
        return;
      }

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

      fal.config({
        credentials: apiKey
      });

      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: scene.imagePrompt,
          aspect_ratio: getAspectRatio(imageStyle) as "16:9" | "9:16" | "1:1",
          negative_prompt: "low quality, bad anatomy"
        },
      });

      if (result.data?.images?.[0]?.url) {
        const falImageUrl = result.data.images[0].url;
        setOriginalImageUrl(falImageUrl);
        setGeneratedImage("");

        setIsUploading(true);
        try {
          const userId = await getUserId();
          const supabaseUrl = await uploadUrlToStorage(falImageUrl, 'image', userId, isPublic);
          setSupabaseImageUrl(supabaseUrl);
          setGeneratedImage(supabaseUrl);

          // Save to history with the is_public flag
          await saveToHistory(supabaseUrl, falImageUrl);

          toast({
            title: "Image Stored",
            description: "Image uploaded to your storage",
          });
        } catch (uploadError) {
          console.error("Failed to upload to Supabase:", uploadError);
          setGeneratedImage(falImageUrl);

          // Even if upload fails, try to save to history
          await saveToHistory(falImageUrl, falImageUrl);
        } finally {
          setIsUploading(false);
        }

        // Increment the count after successful generation
        if (await incrementImageCount()) {
          toast({
            title: "Success",
            description: "Image generated successfully!",
          });
          const freshCounts = await getRemainingCountsAsync();
          setCounts(freshCounts);
        }

        const updatedStory = [...generatedStory];
        updatedStory[sceneIndex] = { ...updatedStory[sceneIndex], imageUrl: supabaseUrl || falImageUrl };
        setGeneratedStory(updatedStory);
      } else {
        throw new Error("No image URL in response");
      }
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
          title: "Infinity API Key Required",
          description: "Please set your Infinity API key first",
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

      fal.config({
        credentials: apiKey
      });

      const result = await fal.subscribe("fal-ai/video/generate", {
        input: {
          image_url: scene.imageUrl,
          seed: Math.floor(Math.random() * 1000000)
        },
      });

      const videoUrl = result.data?.video?.url;

      if (videoUrl) {
        const newVideoUrls = [...videoUrls];
        newVideoUrls[sceneIndex] = videoUrl;
        setVideoUrls(newVideoUrls);

        await saveToHistory(
          videoUrl,
          scene.imageUrl,
          {
            story_title: storyTitle,
            scene_text: scene.text,
            story_prompt: storyPrompt
          }
        );

        setCounts(await getRemainingCountsAsync());

        toast({
          title: "Success",
          description: "Video generated from scene!",
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

  const downloadStoryPDF = async () => {
    if (generatedStory.length === 0) {
      toast({
        title: "No story to download",
        description: "Please generate a story first",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingPDF(true);

    try {
      console.log("Generating PDF with language:", pdfLanguage);

      const pdfDataUri = await generateStoryPDF(
        storyTitle || `Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`,
        generatedStory,
        characterDetails,
        pdfLanguage
      );

      if (!pdfDataUri || typeof pdfDataUri !== 'string') {
        throw new Error("Failed to generate PDF data");
      }

      console.log("PDF generated successfully, creating download link");

      const link = document.createElement('a');
      link.href = pdfDataUri;
      link.download = `${storyTitle || 'story'}_${pdfLanguage}.pdf`.replace(/\s+/g, '_').toLowerCase();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: `Story downloaded as PDF in ${LANGUAGES[pdfLanguage]}`,
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const downloadStoryText = () => {
    if (generatedStory.length === 0) {
      toast({
        title: "No story to download",
        description: "Please generate a story first",
        variant: "destructive",
      });
      return;
    }

    setIsDownloadingText(true);

    try {
      const textContent = generateStoryTextFile(
        storyTitle || `Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`,
        generatedStory,
        characterDetails
      );

      const filename = `${storyTitle || 'story'}_${pdfLanguage}.txt`.replace(/\s+/g, '_').toLowerCase();

      downloadTextFile(textContent, filename);

      toast({
        title: "Success",
        description: "Story downloaded as text file",
      });
    } catch (error) {
      console.error("Text file generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate text file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingText(false);
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
            AI Story and Video Generator
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="storyPrompt">Story Prompt</Label>
              <Textarea
                id="storyPrompt"
                placeholder="Enter a story idea like ဥပမာ 'မြန်မာဆန်ဆန် သိပ္ပံစွန့်စားခန်း ပုံပြင်တစ်ပုဒ် မြန်မာလိုရေးပေးပါ'"
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{storyTitle}</h2>
              <div className="flex items-center space-x-2">
                <Select
                  value={pdfLanguage}
                  onValueChange={(value) => setPdfLanguage(value as LanguageOption)}
                >
                  <SelectTrigger className="w-32">
                    <Globe className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <SelectItem key={code} value={code}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex space-x-2">
                  <Button
                    onClick={downloadStoryPDF}
                    disabled={isGeneratingPDF || generatedStory.length === 0}
                    variant="secondary"
                    size="sm"
                  >
                    {isGeneratingPDF ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="mr-2 h-4 w-4" />
                    )}
                    PDF
                  </Button>

                  <Button
                    onClick={downloadStoryText}
                    disabled={isDownloadingText || generatedStory.length === 0}
                    variant="secondary"
                    size="sm"
                  >
                    {isDownloadingText ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Text
                  </Button>
                </div>
              </div>
            </div>

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
