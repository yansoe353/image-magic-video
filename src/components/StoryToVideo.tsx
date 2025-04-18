
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookText, Sparkles, User } from "lucide-react";
import { Alert, AlertCircle, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { getRemainingCountsAsync } from "@/utils/usageTracker";
import { StoryScene, CharacterDetails } from "@/types";
import { type LanguageOption } from "@/utils/translationUtils";
import CharacterDetailsForm from "./story-generator/CharacterDetailsForm";
import StoryDisplay from "./story-generator/StoryDisplay";
import { useGeminiStoryGenerator } from "@/hooks/useGeminiStoryGenerator";
import { useStoryImageGenerator } from "@/hooks/useStoryImageGenerator";
import { useStoryVideoGenerator } from "@/hooks/useStoryVideoGenerator";

const StoryToVideo = () => {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(false);
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

  const { 
    isGeneratingStory, 
    generatedStory, 
    storyTitle, 
    setStoryTitle,
    generateCharacterTemplate: generateCharacterTemplateFromHook, 
    generateStory,
    setGeneratedStory
  } = useGeminiStoryGenerator();

  const { 
    currentGeneratingIndex: imageGeneratingIndex,
    generateImageForScene: generateImageForSceneFromHook 
  } = useStoryImageGenerator();

  const {
    currentGeneratingIndex: videoGeneratingIndex,
    videoUrls,
    setVideoUrls,
    generateVideoForScene: generateVideoForSceneFromHook
  } = useStoryVideoGenerator();

  const { toast } = useToast();

  const currentGeneratingIndex = imageGeneratingIndex ?? videoGeneratingIndex;

  useEffect(() => {
    const fetchCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    fetchCounts();
  }, []);

  useEffect(() => {
    setEditedStory(generatedStory);
  }, [generatedStory]);

  const generateCharacterTemplate = async () => {
    const details = await generateCharacterTemplateFromHook(storyPrompt);
    if (details) {
      setCharacterDetails(details);
    }
  };

  const handleGenerateStory = async () => {
    const story = await generateStory(storyPrompt, parseInt(sceneCount), characterDetails, imageStyle);
    setEditedStory(story);
    setVideoUrls([]);
  };

  const handleEditedStoryChange = (index: number, field: 'text' | 'imagePrompt', value: string) => {
    const updated = [...editedStory];
    updated[index] = { ...updated[index], [field]: value };
    setEditedStory(updated);
  };

  const handleSaveEdits = () => {
    setGeneratedStory(editedStory);
    setEditMode(false);
    toast({
      title: "Saved",
      description: "Your story edits have been saved",
    });
  };

  const updateCounts = async () => {
    const freshCounts = await getRemainingCountsAsync();
    setCounts(freshCounts);
  };

  const generateImageForScene = async (sceneIndex: number) => {
    const scene = generatedStory[sceneIndex];
    if (!scene) return;

    await generateImageForSceneFromHook(
      scene,
      sceneIndex,
      isPublic,
      storyTitle,
      storyPrompt,
      setGeneratedStory,
      updateCounts,
      generatedStory
    );
  };

  const generateVideoForScene = async (sceneIndex: number) => {
    const scene = generatedStory[sceneIndex];
    if (!scene) return;

    const videoUrl = await generateVideoForSceneFromHook(
      scene,
      sceneIndex,
      isPublic,
      storyTitle,
      storyPrompt,
      updateCounts
    );

    if (videoUrl) {
      const newVideoUrls = [...videoUrls];
      newVideoUrls[sceneIndex] = videoUrl;
      setVideoUrls(newVideoUrls);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BookText className="mr-2 h-6 w-6" />
            AI Story Generator
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="storyPrompt">Story Prompt</Label>
              <Textarea
                id="storyPrompt"
                placeholder="Enter a story idea like 'A cyberpunk adventure with a rogue AI' or 'A fairy tale about a princess who saves a dragon'"
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
              {showCharacterForm && (
                <CharacterDetailsForm
                  characterDetails={characterDetails}
                  setCharacterDetails={setCharacterDetails}
                  setShowCharacterForm={setShowCharacterForm}
                  generateCharacterTemplate={generateCharacterTemplate}
                  storyPrompt={storyPrompt}
                  isGeneratingStory={isGeneratingStory}
                />
              )}
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
                  <SelectItem value="oil painting">Oil Painting</SelectItem>
                  <SelectItem value="watercolor">Watercolor</SelectItem>
                  <SelectItem value="digital art">Digital Art</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGeneratingStory}
            />

            {counts.remainingVideos <= 1 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Low Usage Warning</AlertTitle>
                <AlertDescription>
                  You only have {counts.remainingVideos} video generation{counts.remainingVideos === 1 ? '' : 's'} remaining.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleGenerateStory}
              disabled={isGeneratingStory || !storyPrompt}
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
            <StoryDisplay
              storyTitle={storyTitle}
              generatedStory={generatedStory}
              videoUrls={videoUrls}
              currentGeneratingIndex={currentGeneratingIndex}
              isGeneratingPDF={isGeneratingPDF}
              isDownloadingText={isDownloadingText}
              pdfLanguage={pdfLanguage}
              characterDetails={characterDetails}
              counts={counts}
              onEditModeToggle={() => setEditMode(!editMode)}
              onSaveEdits={handleSaveEdits}
              editMode={editMode}
              editedStory={editedStory}
              onEditedStoryChange={handleEditedStoryChange}
              generateImageForScene={generateImageForScene}
              generateVideoForScene={generateVideoForScene}
              setPdfLanguage={setPdfLanguage}
              storyPrompt={storyPrompt}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryToVideo;
