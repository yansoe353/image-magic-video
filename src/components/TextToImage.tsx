
// Update to fix TypeScript errors
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { RotateCw, Download, ImageIcon, Loader2 } from "lucide-react";
import { fal } from "@fal-ai/client";
import ApiKeyInput from "@/components/ApiKeyInput";
import { PromptInput } from "@/components/image-generation/PromptInput";
import { GeneratedImageDisplay } from "@/components/image-generation/GeneratedImageDisplay";
import { ImageSizeSelector, ImageSizeOption } from "@/components/image-generation/ImageSizeSelector";
import { GuidanceScaleSlider } from "@/components/image-generation/GuidanceScaleSlider";
import { StyleModifiers, LoraOption } from "@/components/image-generation/StyleModifiers";
import { UsageLimits } from "@/components/image-generation/UsageLimits";
import { incrementImageCount, getRemainingCountsAsync, IMAGE_LIMIT } from "@/utils/usageTracker";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";

interface TextToImageProps {
  onImageGenerated?: (imageUrl: string) => void;
}

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(!!localStorage.getItem("falApiKey"));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSizeOption>("square");
  const [guidanceScale, setGuidanceScale] = useState<number>(7);
  const [styleModifiers, setStyleModifiers] = useState<LoraOption[]>([]);
  const [loraScale, setLoraScale] = useState<{ [key: string]: number }>({});

  const handlePromptChange = (newPrompt: string) => {
    setPrompt(newPrompt);
  };

  const handleToggleLora = (lora: LoraOption) => {
    if (styleModifiers.includes(lora)) {
      setStyleModifiers(styleModifiers.filter(style => style !== lora));
    } else {
      setStyleModifiers([...styleModifiers, lora]);
      // Initialize scale if not set
      if (!loraScale[lora]) {
        setLoraScale({ ...loraScale, [lora]: 1.0 });
      }
    }
  };

  const handleLoraScaleChange = (lora: LoraOption, scale: number) => {
    setLoraScale({ ...loraScale, [lora]: scale });
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt to generate an image",
        variant: "destructive",
      });
      return;
    }

    const apiKey = localStorage.getItem("falApiKey");
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your FAL.AI API key first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);

      // Configure client
      fal.config({
        credentials: apiKey
      });

      // Calculate dimensions based on selected size
      let aspectRatio = "1:1";
      
      if (imageSize === "portrait_16_9") {
        aspectRatio = "9:16";
      } else if (imageSize === "landscape_16_9") {
        aspectRatio = "16:9";
      } else if (imageSize === "portrait_4_3") {
        aspectRatio = "3:4";
      } else if (imageSize === "landscape_4_3") {
        aspectRatio = "4:3";
      }

      // Add style modifiers to prompt
      const enhancedPrompt = styleModifiers.length > 0 
        ? `${prompt}, ${styleModifiers.join(", ")}`
        : prompt;

      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: enhancedPrompt,
          aspect_ratio: aspectRatio,
          negative_prompt: "low quality, bad anatomy, distorted, blurry",
          cfg_scale: guidanceScale
        },
      });

      if (result.data?.images?.[0]?.url) {
        const generatedImageUrl = result.data.images[0].url;
        
        // Set the image URL for preview
        setImageUrl(generatedImageUrl);
        
        // Update usage stats
        await incrementImageCount();
        
        toast({
          title: "Image Generated",
          description: "Your image has been created successfully",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = async () => {
    if (!imageUrl) return;
    
    try {
      setIsUploading(true);
      
      // Upload to Supabase if user is logged in or we have userId
      const userId = await getUserId();
      if (userId) {
        const supabaseUrl = await uploadUrlToStorage(imageUrl, 'image', userId);
        
        if (onImageGenerated) {
          onImageGenerated(supabaseUrl);
        }
        
        // Save to history if user is logged in
        if (isLoggedIn()) {
          await supabase
            .from('user_content_history')
            .insert({
              user_id: userId,
              content_type: 'image',
              content_url: supabaseUrl,
              prompt: prompt,
              metadata: {
                guidance_scale: guidanceScale,
                styles: styleModifiers,
                original_url: imageUrl
              }
            });
        }
        
        toast({
          title: "Image Saved",
          description: "Image has been saved to your account",
        });
      } else if (onImageGenerated) {
        // If not logged in but we need to pass the image back
        onImageGenerated(imageUrl);
      }
    } catch (error) {
      console.error("Error using image:", error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `AI-generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Generate Image</h2>
          
          {!isApiKeySet && (
            <ApiKeyInput
              onApiKeySet={() => setIsApiKeySet(true)}
              className="mb-6"
            />
          )}
          
          <UsageLimits 
            remainingImages={IMAGE_LIMIT} 
            imageLimit={IMAGE_LIMIT} 
          />
          
          <div className="space-y-4">
            <PromptInput
              prompt={prompt}
              onPromptChange={handlePromptChange}
              disabled={isGenerating}
            />
            
            <div className="grid gap-4 sm:grid-cols-2">
              <ImageSizeSelector
                value={imageSize}
                onChange={setImageSize}
                disabled={isGenerating}
              />
              
              <GuidanceScaleSlider
                value={guidanceScale}
                onChange={setGuidanceScale}
                disabled={isGenerating}
              />
            </div>
            
            <StyleModifiers
              selectedLoras={styleModifiers}
              onToggleLora={handleToggleLora}
              loraScale={loraScale}
              onScaleChange={handleLoraScaleChange}
              disabled={isGenerating}
            />
            
            <Button
              onClick={generateImage}
              disabled={isGenerating || !prompt.trim() || !isApiKeySet}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RotateCw className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <GeneratedImageDisplay
            imageUrl={imageUrl}
            isLoading={isGenerating}
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
