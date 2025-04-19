import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookText, Download, FileText } from "lucide-react";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
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
import MyanmarVpnWarning from "./MyanmarVpnWarning";

const StoryToVideo = () => {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<StoryScene[]>([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [sceneCount, setSceneCount] = useState("3");
  const [editMode, setEditMode] = useState(false);
  const [editedStory, setEditedStory] = useState<StoryScene[]>([]);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails>({});
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [pdfLanguage, setPdfLanguage] = useState<LanguageOption>("en");
  const [isDownloadingText, setIsDownloadingText] = useState(false);

  const { generateResponse, isLoading: isGeminiLoading } = useGeminiAPI();
  const { toast } = useToast();

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
      3. Each scene should be a descriptive narrative text
      
      Return each scene as a separate paragraph, numbered and describing the progression of the story.`;

      const response = await generateResponse(geminiPrompt);

      // Split response into scenes
      const scenes = response.split('\n')
        .filter(scene => scene.trim() !== '')
        .slice(0, numScenes)
        .map(scene => ({ 
          text: scene.trim(), 
          imagePrompt: "" // Remove image prompt
        }));

      setGeneratedStory(scenes);
      setEditedStory(scenes);
      setStoryTitle(`Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`);

      toast({
        title: "Success",
        description: "Story generated successfully",
        variant: "default"
      });
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
      const pdfDataUri = await generateStoryPDF(
        storyTitle || `Story: ${storyPrompt.slice(0, 30)}${storyPrompt.length > 30 ? '...' : ''}`, 
        generatedStory.map(scene => ({
          ...scene, 
          imagePrompt: "" // Remove image prompt
        })),
        characterDetails, 
        pdfLanguage
      );
      
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
        generatedStory.map(scene => ({
          ...scene, 
          imagePrompt: "" // Remove image prompt
        })),
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

  return (
    <div className="space-y-8">
      <MyanmarVpnWarning className="mb-4" />
      
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BookText className="mr-2 h-6 w-6" />
            Story Generator
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="storyPrompt">Story Prompt</Label>
              <Textarea
                id="storyPrompt"
                placeholder="Enter a story idea..."
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
                  {['2', '3', '4', '5', '6', '7'].map((num) => (
                    <SelectItem key={num} value={num}>{num} Scenes</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
                
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
                  <BookText className="mr-2 h-4 w-4" />
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
              <div className="space-y-4">
                {generatedStory.map((scene, index) => (
                  <div key={index} className="p-4 bg-slate-800/50 rounded-md">
                    <p className="text-slate-200">{scene.text}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryToVideo;
