import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StoryScene } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Globe, FileText, ImageIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, type LanguageOption } from "@/utils/translationUtils";
import { CharacterDetails } from "@/types";
import { generateStoryPDF } from "@/services/pdfService";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface StoryDisplayProps {
  storyTitle: string;
  generatedStory: StoryScene[];
  isGeneratingPDF: boolean;
  isDownloadingText: boolean;
  pdfLanguage: LanguageOption;
  characterDetails: CharacterDetails;
  onEditModeToggle: () => void;
  onSaveEdits: () => void;
  editMode: boolean;
  editedStory: StoryScene[];
  onEditedStoryChange: (index: number, field: 'text' | 'imagePrompt', value: string) => void;
  setPdfLanguage: (language: LanguageOption) => void;
  storyPrompt: string;
}

const StoryDisplay = ({
  storyTitle,
  generatedStory,
  isGeneratingPDF,
  isDownloadingText,
  pdfLanguage,
  characterDetails,
  onEditModeToggle,
  onSaveEdits,
  editMode,
  editedStory,
  onEditedStoryChange,
  setPdfLanguage,
  storyPrompt,
}: StoryDisplayProps) => {
  const { toast } = useToast();
  const [tabValue, setTabValue] = useState("0");
  const navigate = useNavigate();

  const downloadStoryPDF = async () => {
    if (generatedStory.length === 0) {
      toast({
        title: "No story to download",
        description: "Please generate a story first",
        variant: "destructive",
      });
      return;
    }

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
    }
  };

  const handleCreateImage = (sceneText: string) => {
    navigate('/create?tab=text-to-image', { state: { prompt: sceneText } });
  };

  if (generatedStory.length === 0) {
    return null;
  }

  return (
    <div>
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
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Button
              onClick={downloadStoryText}
              disabled={isDownloadingText || generatedStory.length === 0}
              variant="secondary"
              size="sm"
            >
              <FileText className="mr-2 h-4 w-4" />
              Text
            </Button>
          </div>
        </div>
      </div>

      <Button
        onClick={onEditModeToggle}
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
                onChange={(e) => onEditedStoryChange(index, 'text', e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          ))}
          <Button
            onClick={onSaveEdits}
            className="w-full"
          >
            Save Changes
          </Button>
        </div>
      ) : (
        <Tabs value={tabValue} onValueChange={setTabValue} className="w-full mt-4">
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${generatedStory.length}, 1fr)` }}>
            {generatedStory.map((_, index) => (
              <TabsTrigger key={index} value={index.toString()}>Scene {index + 1}</TabsTrigger>
            ))}
          </TabsList>

          {generatedStory.map((scene, index) => (
            <TabsContent key={index} value={index.toString()} className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-md">
                <p className="text-slate-200">{scene.text}</p>
              </div>
              
              <Button 
                onClick={() => handleCreateImage(scene.text)}
                className="w-full mt-4"
                variant="outline"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Create Image for this Scene
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default StoryDisplay;
