
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { Loader2 } from "lucide-react";
import ApiKeyInput from "@/components/ApiKeyInput";
import { GeneratedImageDisplay } from "@/components/image-generation/GeneratedImageDisplay";
import { PromptInput } from "@/components/image-generation/PromptInput";
import { GuidanceScaleSlider } from "@/components/image-generation/GuidanceScaleSlider";
import { ImageSizeSelector } from "@/components/image-generation/ImageSizeSelector";
import { StyleModifiers } from "@/components/image-generation/StyleModifiers";
import { UsageLimits } from "@/components/image-generation/UsageLimits";
import { incrementImageCount, getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT } from "@/utils/usageTracker";
import { uploadUrlToStorage, getUserId, type StorageMetadata } from "@/utils/storageUtils";
import { isLoggedIn } from "@/utils/authUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import ProLabel from "./ProLabel";

// Initialize fal.ai client with proper environment variable handling for browser
try {
  const apiKey = import.meta.env.VITE_FAL_API_KEY;
  if (apiKey) {
    fal.config({
      credentials: apiKey
    });
  }
} catch (error) {
  console.error("Error initializing fal.ai client:", error);
}

interface TextToImageProps {
  onImageGenerated?: (imageUrl: string) => void;
}

type AspectRatio = "1:1" | "9:16" | "16:9" | "3:4" | "4:3";

const TextToImage: React.FC<TextToImageProps> = ({ onImageGenerated }) => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("ugly, blurry, poor quality, distorted, disfigured");
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");
  const [supabaseImageUrl, setSupabaseImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [styles, setStyles] = useState<string[]>([]);
  const [imageSize, setImageSize] = useState<string>("1024x1024");
  const [apiKeySet, setApiKeySet] = useState(false);
  const [counts, setCounts] = useState(getRemainingCounts());
  const [isPublic, setIsPublic] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    
    updateCounts();
  }, []);

  const handleApiKeySet = () => {
    setApiKeySet(true);
  };

  const getAspectRatio = (): AspectRatio => {
    switch (imageSize) {
      case "1024x1024":
        return "1:1";
      case "1024x1792":
        return "9:16";
      case "1792x1024":
        return "16:9";
      case "1024x1536":
        return "3:4";
      case "1536x1024":
        return "4:3";
      default:
        return "1:1";
    }
  };

  const getDimensions = () => {
    const [width, height] = imageSize.split('x').map(Number);
    return { width, height };
  };

  const generateImage = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt",
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
    setGeneratedImageUrl("");

    try {
      // Image generation call
      const result = await fal.subscribe("fal-ai/imagen-3-fast", {
        input: {
          prompt,
          negative_prompt: negativePrompt,
          guidance_scale: guidanceScale,
          aspect_ratio: getAspectRatio(),
          style_preset: styles.length > 0 ? styles.join(", ") : undefined
        },
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
      
      if (result.image && result.image.url) {
        setGeneratedImageUrl(result.image.url);
        
        // Upload to Supabase
        setIsStoring(true);
        try {
          // Get user ID if logged in
          const userId = await getUserId();
          
          const metadata: StorageMetadata = {
            isPublic,
            prompt,
            generationParams: {
              negativePrompt,
              guidanceScale,
              aspectRatio: getAspectRatio(),
              styles: styles
            }
          };
          
          const supabaseUrl = await uploadUrlToStorage(
            result.image.url, 
            'image', 
            userId,
            metadata
          );
          
          setSupabaseImageUrl(supabaseUrl);
          
          if (onImageGenerated) {
            onImageGenerated(supabaseUrl);
          }
          
          // Save to history if logged in
          if (isLoggedIn()) {
            try {
              const { error } = await supabase
                .from('user_content_history')
                .insert({
                  user_id: userId,
                  content_type: 'image',
                  content_url: supabaseUrl,
                  prompt,
                  metadata: {
                    negativePrompt,
                    guidanceScale,
                    imageSize,
                    styles,
                    isPublic
                  }
                });
              
              if (error) {
                console.error("Error saving to history:", error);
              }
            } catch (historyError) {
              console.error("Failed to save to history:", historyError);
            }
          }
          
        } catch (uploadError) {
          console.error("Failed to upload to Supabase:", uploadError);
          if (onImageGenerated) {
            onImageGenerated(result.image.url);
          }
        } finally {
          setIsStoring(false);
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

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Text to Image</h2>
            <ProLabel />
          </div>
          
          <UsageLimits 
            remainingImages={counts.remainingImages} 
            imageLimit={IMAGE_LIMIT}
            isPublic={isPublic}
            onPublicChange={setIsPublic}
          />
          
          <div className="space-y-4">
            {!apiKeySet && <ApiKeyInput onApiKeySet={handleApiKeySet} />}
            
            <PromptInput
              prompt={prompt}
              onPromptChange={setPrompt}
              disabled={isLoading}
            />
            
            <div>
              <Label htmlFor="negativePrompt">Negative Prompt</Label>
              <textarea
                id="negativePrompt"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                className="w-full p-2 mt-1 bg-transparent border border-slate-700 rounded-md h-20"
                placeholder="What to exclude from the image"
                disabled={isLoading}
              />
            </div>
            
            <ImageSizeSelector
              imageSize={imageSize}
              onSizeChange={setImageSize}
              disabled={isLoading}
            />
            
            <GuidanceScaleSlider 
              value={guidanceScale} 
              onChange={setGuidanceScale} 
              disabled={isLoading}
            />
            
            <StyleModifiers
              styles={styles}
              onStylesChange={setStyles}
              disabled={isLoading}
            />
            
            <Button
              onClick={generateImage}
              disabled={isLoading || !prompt.trim() || counts.remainingImages <= 0}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Image Preview</h2>
            {supabaseImageUrl && onImageGenerated && (
              <Button
                onClick={() => onImageGenerated(supabaseImageUrl)}
                disabled={isLoading || isStoring}
                variant="outline"
              >
                Continue to Video
              </Button>
            )}
          </div>
          
          <GeneratedImageDisplay
            imageUrl={supabaseImageUrl || generatedImageUrl}
            prompt={prompt}
            isLoading={isLoading || isStoring}
            isStoring={isStoring}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToImage;
