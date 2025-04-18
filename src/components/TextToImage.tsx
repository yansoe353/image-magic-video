
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
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";

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
  const [isPublic, setIsPublic] = useState(false);

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

  const getAspectRatio = (sizeOption: ImageSizeOption): string => {
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
          prompt: prompt,
          is_public: isPublic,
          metadata: {
            size: imageSize,
            original_url: originalUrl,
            loras: selectedLoras,
            model: "imagen3-fast",
            guidance_scale: guidanceScale
          }
        });

      if (error) {
        console.error("Error saving to history:", error);
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
          const detectedLanguage = await detectLanguage(prompt);
          if (detectedLanguage !== "en") {
            promptToUse = await translateText(prompt, detectedLanguage, "en");
          }
        } catch (error) {
          console.error("Failed to translate prompt:", error);
        }
      }

      fal.config({
        credentials: apiKey
      });

      // Remove guidance_scale which is not supported by the model
      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: promptToUse,
          aspect_ratio: getAspectRatio(imageSize) as "16:9" | "9:16" | "1:1",
          negative_prompt: selectedLoras.length > 0 ? "low quality, bad anatomy" : ""
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
      if (!response.ok) throw new Error(`Language detection API error: ${response.statusText}`);
      const data = await response.json();
      return data?.[2] || "en";
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

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
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
