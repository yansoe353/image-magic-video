import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { Loader2, ImageIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { incrementImageCount, getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { PromptInput } from "./image-generation/PromptInput";
import { ImageSizeSelector, ImageSizeOption } from "./image-generation/ImageSizeSelector";
import { StyleModifiers, LoraOption } from "./image-generation/StyleModifiers";
import { GuidanceScaleSlider } from "./image-generation/GuidanceScaleSlider";
import { GeneratedImageDisplay } from "./image-generation/GeneratedImageDisplay";
import { UsageLimits } from "./image-generation/UsageLimits";
import { translateText } from "@/utils/translationUtils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SupportedLanguage = "en" | "my" | "th";

const LANGUAGES = {
  en: "English",
  my: "Myanmar",
  th: "Thai"
};

type LanguageOption = {
  value: SupportedLanguage;
  label: string;
};

const TextToImage = () => {
  const [prompt, setPrompt] = useState("");
  const [imageSize, setImageSize] = useState<ImageSizeOption>("512x512");
  const [guidanceScale, setGuidanceScale] = useState(7);
  const [selectedLoras, setSelectedLoras] = useState<LoraOption[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [counts, setCounts] = useState({ remainingImages: 0 });
  const [apiKey, setApiKey] = useState("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCounts = async () => {
      const counts = await getRemainingCountsAsync();
      setCounts(counts);
    };

    fetchCounts();
  }, []);

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const toggleLora = (lora: LoraOption) => {
    setSelectedLoras((prevLoras) =>
      prevLoras.includes(lora) ? prevLoras.filter((l) => l !== lora) : [...prevLoras, lora]
    );
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    localStorage.setItem("apiKey", apiKey);
    setIsApiKeySet(true);
    toast({
      title: "API Key Saved",
      description: "Your API key has been saved successfully.",
    });
  };

  const generateImage = async () => {
    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please enter your API key to generate images.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fal.generateImage({
        prompt,
        imageSize,
        guidanceScale,
        loras: selectedLoras.map((lora) => lora.value),
      });
      setGeneratedImage(response.imageUrl);
      incrementImageCount();
      setCounts((prevCounts) => ({
        ...prevCounts,
        remainingImages: prevCounts.remainingImages - 1,
      }));
    } catch (error) {
      toast({
        title: "Image Generation Failed",
        description: "There was an error generating the image. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseImage = async () => {
    if (!generatedImage) return;

    setIsUploading(true);
    try {
      const userId = await getUserId();
      const url = await uploadUrlToStorage(generatedImage, userId);
      toast({
        title: "Image Uploaded",
        description: "Your generated image has been uploaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Image Upload Failed",
        description: "There was an error uploading the image. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
      link.download = "generated_image.png";
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          {!isApiKeySet && (
            <Alert variant="warning">
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor="apiKey">Enter your API key to generate images</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="Enter your Infinity API key"
                        className="flex-1"
                      />
                      <Button onClick={saveApiKey}>Save Key</Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <a
                        href="https://m.me/infinitytechmyanmar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Get your key here
                      </a>
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <UsageLimits
            remainingImages={counts.remainingImages}
            imageLimit={IMAGE_LIMIT}
          />

          <div className="space-y-4">
            <PromptInput
              prompt={prompt}
              onPromptChange={handlePromptChange}
              disabled={isLoading}
            />

            <ImageSizeSelector
              value={imageSize}
              onChange={setImageSize}
              disabled={isLoading}
            />

            <GuidanceScaleSlider
              value={guidanceScale}
              onChange={setGuidanceScale}
              disabled={isLoading}
            />

            <StyleModifiers
              selectedLoras={selectedLoras}
              onToggleLora={toggleLora}
              disabled={isLoading}
            />

            <div className="flex items-center justify-between">
              <Button
                onClick={generateImage}
                disabled={isLoading || !prompt.trim() || counts.remainingImages <= 0 || !isApiKeySet}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Image
                  </>
                )}
              </Button>
            </div>

            {counts.remainingImages > 0 && (
              <p className="text-xs text-slate-500 text-center">
                {counts.remainingImages} of {IMAGE_LIMIT} image generations remaining
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <GeneratedImageDisplay
            imageUrl={generatedImage}
            isLoading={isLoading}
            isUploading={isUploading}
            onUseImage={handleUseImage}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToImage;
