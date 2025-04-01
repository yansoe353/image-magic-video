import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, Paintbrush } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { PromptInput } from "@/components/image-generation/PromptInput";
import { GuidanceScaleSlider } from "@/components/image-generation/GuidanceScaleSlider";
import { ImageSizeSelector, ImageSizeOption } from "@/components/image-generation/ImageSizeSelector";
import { GeneratedImageDisplay } from "@/components/image-generation/GeneratedImageDisplay";
import { usageTracker, incrementImageCount, getRemainingCounts } from "@/utils/usageTracker";
import { fal } from "@fal-ai/client";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import ProLabel from "./ProLabel";

interface TextToImageProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const initialPrompt = "A futuristic cityscape at sunset, neon lights, flying vehicles";

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [enhancedPrompt, setEnhancedPrompt] = useState(initialPrompt);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<ImageSizeOption>("square");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCounts());

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCounts();
      setCounts(freshCounts);
    };

    updateCounts();
  }, []);

  const getAspectRatio = (size: ImageSizeOption) => {
    switch (size) {
      case "square": return "1:1";
      case "square_hd": return "1:1";
      case "portrait_4_3": return "4:3";
      case "portrait_16_9": return "16:9";
      case "landscape_4_3": return "3:4";
      case "landscape_16_9": return "16:9";
      default: return "1:1";
    }
  };

  const enhancePrompt = async (inputPrompt: string) => {
    return inputPrompt;
  };

  const generateImage = async () => {
    if (!isLoggedIn()) {
      toast({
        title: "Login Required",
        description: "You must be logged in to generate images",
        variant: "destructive",
      });
      return;
    }

    if (counts.remainingImages <= 0) {
      toast({
        title: "No Image Credits",
        description: "You don't have any image generations remaining",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setApiError(null);

    try {
      const enhanced = await enhancePrompt(prompt);
      setEnhancedPrompt(enhanced);

      fal.config({
        credentials: localStorage.getItem("falApiKey") || ""
      });

      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: getAspectRatio(imageSize),
          enable_safety_filter: true,
          negative_prompt: "low quality, bad anatomy, distorted, blurry"
        },
      });

      if (result.data?.images?.[0]?.url) {
        const imageUrl = result.data.images[0].url;

        // Upload to storage if logged in
        try {
          const userId = await getUserId();
          const supabaseUrl = await uploadUrlToStorage(imageUrl, 'image', userId);
          setGeneratedImageUrl(supabaseUrl);

          // Save to history if logged in
          if (isLoggedIn()) {
            await supabase
              .from('user_content_history')
              .insert({
                user_id: userId,
                content_type: 'image',
                content_url: supabaseUrl,
                prompt: prompt,
                metadata: {
                  enhancedPrompt: enhancedPrompt,
                  imageSize: imageSize,
                  guidanceScale: guidanceScale
                }
              });
          }

          if (onImageGenerated) {
            onImageGenerated(supabaseUrl);
          }
        } catch (uploadError) {
          console.error("Failed to upload to Supabase:", uploadError);
          setGeneratedImageUrl(imageUrl);

          if (onImageGenerated) {
            onImageGenerated(imageUrl);
          }
        }

        await incrementImageCount();
        const freshCounts = await getRemainingCounts();
        setCounts(freshCounts);

        toast({
          title: "Image Generated",
          description: "Your image has been generated!",
        });
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error: any) {
      console.error("Failed to generate image:", error);
      setApiError(error.message || "Failed to generate image");
      toast({
        title: "Generation Error",
        description: error.message || "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Text to Image</h2>
            <ProLabel />
          </div>

          <Alert className="mb-4">
            <AlertDescription>
              This feature will use 1 image credit. You have {counts.remainingImages} remaining.
            </AlertDescription>
          </Alert>

          {apiError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <PromptInput
                id="prompt"
                placeholder="Enter a detailed prompt to generate an image"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <ImageSizeSelector 
              value={imageSize} 
              onChange={(newSize: ImageSizeOption) => setImageSize(newSize)} 
              disabled={isGenerating}
            />
            <GuidanceScaleSlider
              value={guidanceScale}
              onChange={setGuidanceScale}
              disabled={isGenerating}
            />
          </div>

          <Button
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
          >
            {isGenerating ? (
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
        </CardContent>
      </Card>

      <GeneratedImageDisplay
        generatedImageUrl={generatedImageUrl}
        prompt={prompt}
        isGenerating={isGenerating}
        icon={ImageIcon}
      />
    </div>
  );
};

export default TextToImage;
