
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
import ProLabel from "./ProLabel";

type SupportedLanguage = "en" | "my" | "th";

const LANGUAGES = {
  en: "English",
  my: "Myanmar",
  th: "Thai"
};

type LanguageOption = keyof typeof LANGUAGES;

interface TextToImageProps {
  onImageGenerated: (imageUrl: string) => void;
}

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSizeOption>("square_hd");
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCounts());
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [supabaseImageUrl, setSupabaseImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLoras, setSelectedLoras] = useState<LoraOption[]>([]);
  const [guidanceScale, setGuidanceScale] = useState(9);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem("falApiKey") || "");
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(!!localStorage.getItem("falApiKey"));

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    updateCounts();
  }, []);

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const toggleLora = (loraId: LoraOption) => {
    setSelectedLoras(current =>
      current.includes(loraId)
        ? current.filter(id => id !== loraId)
        : [...current, loraId]
    );
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    try {
      localStorage.setItem("falApiKey", apiKey);

      // Configure fal client with the new API key
      fal.config({
        credentials: apiKey
      });

      setIsApiKeySet(true);

      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
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
          prompt: prompt,
          metadata: {
            size: imageSize,
            original_url: originalUrl,
            loras: selectedLoras,
            model: "flux-lora",
            guidance_scale: guidanceScale
          }
        });

      if (error) {
        console.error("Error saving to history:", error);
      } else {
        console.log("Successfully saved image to history");
      }
    } catch (err) {
      console.error("Failed to save to history:", err);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    if (!isApiKeySet) {
      toast({
        title: "API Key Required",
        description: "Please set your FAL.AI API key first",
        variant: "destructive",
      });
      return;
    }

    if (counts.remainingImages <= 0) {
      toast({
        title: "Usage Limit Reached",
        description: `You've reached the limit of ${IMAGE_LIMIT} image generations.`,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let promptToUse = prompt;
      if (prompt && prompt.length > 0) {
        try {
          // Translate the prompt to English if it's not already in English
          const detectedLanguage = await detectLanguage(prompt);
          if (detectedLanguage !== "en") {
            promptToUse = await translateText(prompt, detectedLanguage, "en");
          }
        } catch (error) {
          console.error("Failed to translate prompt:", error);
        }
      }

      // Map the image size to dimensions
      let width = 1024;
      let height = 1024;

      if (imageSize.includes('landscape')) {
        width = 1280;
        height = 768;
      } else if (imageSize.includes('portrait')) {
        width = 768;
        height = 1280;
      }

      // Configure fal client with the user's API key
      fal.config({
        credentials: apiKey
      });

      // Log parameters
      console.log("Image Size:", { width, height });
      console.log("Guidance Scale:", guidanceScale);

      // Now using the imagen3/fast model with correct properties
      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: promptToUse,
          width: width,
          height: height,
          enable_safety_filter: true,
        },
      });

      if (result.data && result.data.images && result.data.images[0]) {
        const falImageUrl = result.data.images[0].url;
        setOriginalImageUrl(falImageUrl);
        setGeneratedImage(""); // Clear any existing URL

        setIsUploading(true);
        try {
          const userId = await getUserId();
          const supabaseUrl = await uploadUrlToStorage(falImageUrl, 'image', userId);
          setSupabaseImageUrl(supabaseUrl);
          setGeneratedImage(supabaseUrl); // Set the Supabase URL as the image URL

          await saveToHistory(supabaseUrl, falImageUrl);

          toast({
            title: "Image Stored",
            description: "Image uploaded to your storage",
          });
        } catch (uploadError) {
          console.error("Failed to upload to Supabase:", uploadError);
          setGeneratedImage(falImageUrl);
          await saveToHistory(falImageUrl, falImageUrl);
        } finally {
          setIsUploading(false);
        }

        if (await incrementImageCount()) {
          toast({
            title: "Success",
            description: "Image generated successfully!",
          });
          const freshCounts = await getRemainingCountsAsync();
          setCounts(freshCounts);
        } else {
          toast({
            title: "Usage Limit Reached",
            description: "You've reached your image generation limit.",
            variant: "destructive",
          });
        }
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast({
        title: "Error",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      const imageUrlToUse = supabaseImageUrl || generatedImage;
      onImageGenerated(imageUrlToUse);
    }
  };

  const handleDownload = () => {
    const imageUrlToDownload = supabaseImageUrl || generatedImage;

    if (imageUrlToDownload) {
      const link = document.createElement("a");
      link.href = imageUrlToDownload;
      link.download = "generated-image.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  async function detectLanguage(text: string): Promise<SupportedLanguage> {
    try {
      const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Language detection API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data[2]) {
        return data[2];
      } else {
        throw new Error("Unexpected response structure from language detection API");
      }
    } catch (error) {
      console.error("Language detection error:", error);
      return "en";
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Create an Image</h2>
            <ProLabel />
          </div>

          {!isApiKeySet && (
            <Alert className="mb-4">
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                <div className="space-y-4 mt-2">
                  <p>ပုံတွေ ဗွီဒီယိုတွေ ထုတ်ဖို့ Infinity Tech မှဝယ်ယူထားသည့် Infinity API Key ထည့်ရပါမယ်</p>
                  <div>
                    <Label htmlFor="apiKey">Infinity API Key</Label>
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
