
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { StoryScene } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Film, Loader2, Download, Globe, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LANGUAGES, type LanguageOption } from "@/utils/translationUtils";
import { CharacterDetails } from "@/types";
import { generateStoryPDF } from "@/services/pdfService";
import { generateStoryTextFile, downloadTextFile } from "@/services/textFileService";
import { useToast } from "@/hooks/use-toast";

interface StoryDisplayProps {
  storyTitle: string;
  generatedStory: StoryScene[];
  videoUrls: string[];
  currentGeneratingIndex: number | null;
  isGeneratingPDF: boolean;
  isDownloadingText: boolean;
  pdfLanguage: LanguageOption;
  characterDetails: CharacterDetails;
  counts: {
    remainingImages: number;
    remainingVideos: number;
  };
  onEditModeToggle: () => void;
  onSaveEdits: () => void;
  editMode: boolean;
  editedStory: StoryScene[];
  onEditedStoryChange: (index: number, field: 'text' | 'imagePrompt', value: string) => void;
  generateImageForScene: (index: number) => void;
  generateVideoForScene: (index: number) => void;
  setPdfLanguage: (language: LanguageOption) => void;
  storyPrompt: string;
}

const StoryDisplay = ({
  storyTitle,
  generatedStory,
  videoUrls,
  currentGeneratingIndex,
  isGeneratingPDF,
  isDownloadingText,
  pdfLanguage,
  characterDetails,
  counts,
  onEditModeToggle,
  onSaveEdits,
  editMode,
  editedStory,
  onEditedStoryChange,
  generateImageForScene,
  generateVideoForScene,
  setPdfLanguage,
  storyPrompt,
}: StoryDisplayProps) => {
  const { toast } = useToast();
  const [tabValue, setTabValue] = useState("0");

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

  const renderSceneTabs = () => {
    return generatedStory.map((_, index) => (
      <TabsTrigger key={index} value={index.toString()}>Scene {index + 1}</TabsTrigger>
    ));
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
              <Label>Scene {index + 1} Image Prompt</Label>
              <Textarea
                value={scene.imagePrompt}
                onChange={(e) => onEditedStoryChange(index, 'imagePrompt', e.target.value)}
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
    </div>
  );
};

export default StoryDisplay;
