
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { GeneratedImageDisplay } from "./image-generation/GeneratedImageDisplay";
import { PromptInput } from "./image-generation/PromptInput";
import { GuidanceScaleSlider } from "./image-generation/GuidanceScaleSlider";
import { StyleModifiers } from "./image-generation/StyleModifiers";
import { ImageSizeSelector } from "./image-generation/ImageSizeSelector";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { incrementImageCount, getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT } from "@/utils/usageTracker";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import { usePromptTranslation } from "@/hooks/usePromptTranslation";
import { isLoggedIn } from "@/utils/authUtils";

interface TextToImageProps {
  onImageGenerated?: (imageUrl: string) => void;
}

type ImageSize = "square" | "portrait" | "landscape" | "widescreen";
type AspectRatio = "1:1" | "4:3" | "3:4" | "16:9" | "9:16";

const aspectRatioMap: Record<AspectRatio, string> = {
  "1:1": "1:1",
  "4:3": "4:3",
  "3:4": "3:4",
  "16:9": "16:9",
  "9:16": "9:16"
};

interface UserContent {
  user_id: string;
  content_type: "image" | "video";
  content_url: string;
  prompt: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

const imageSizes: Record<ImageSize, { label: string, aspectRatio: AspectRatio }> = {
  square: { label: "Square (1:1)", aspectRatio: "1:1" },
  portrait: { label: "Portrait (3:4)", aspectRatio: "3:4" },
  landscape: { label: "Landscape (4:3)", aspectRatio: "4:3" },
  widescreen: { label: "Widescreen (16:9)", aspectRatio: "16:9" }
};

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [imageSize, setImageSize] = useState<ImageSize>("square");
  const [guidanceScale, setGuidanceScale] = useState(8);
  const [styleModifier, setStyleModifier] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [customApiKey, setCustomApiKey] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [remainingImages, setRemainingImages] = useState(getRemainingCounts().remainingImages);
  
  const { toast } = useToast();
  const { prompt: translatedPrompt, setPrompt: setTranslatedPrompt, selectedLanguage, isTranslating, handleLanguageChange } = usePromptTranslation(prompt);
  
  useEffect(() => {
    const storedApiKey = localStorage.getItem("falApiKey");
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsApiKeyValid(true);
      fal.config({
        credentials: storedApiKey
      });
    }
    
    const updateImageCount = async () => {
      const counts = await getRemainingCountsAsync();
      setRemainingImages(counts.remainingImages);
    };
    
    updateImageCount();
    
    // Set up periodic check for usage limits
    const interval = setInterval(updateImageCount, 5000);
    return () => clearInterval(interval);
  }, []);
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomApiKey(e.target.value);
  };
  
  const saveApiKey = () => {
    if (!customApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }
    
    try {
      localStorage.setItem("falApiKey", customApiKey);
      setApiKey(customApiKey);
      setIsApiKeyValid(true);
      fal.config({
        credentials: customApiKey
      });
      toast({
        title: "Success",
        description: "API key saved successfully"
      });
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive"
      });
    }
  };
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, message]);
  };

  const generateImage = async () => {
    if (!isApiKeyValid) {
      toast({
        title: "API Key Required",
        description: "Please set your FAL.AI API key first",
        variant: "destructive"
      });
      return;
    }
    
    if (remainingImages < 1) {
      toast({
        title: "Image Limit Reached",
        description: `You've used all ${IMAGE_LIMIT} of your daily image generations.`,
        variant: "destructive"
      });
      return;
    }
    
    if (!prompt) {
      toast({
        title: "Prompt Required",
        description: "Please enter a prompt to generate an image",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setLogs([]);
    addLog(`Generating image with prompt: "${prompt}"`);
    
    try {
      // Add style modifier to prompt if selected
      let fullPrompt = prompt;
      if (styleModifier) {
        fullPrompt = `${prompt}, ${styleModifier}`;
        addLog(`Applied style: ${styleModifier}`);
      }
      
      // Use translated prompt if available
      if (translatedPrompt && translatedPrompt !== prompt) {
        addLog(`Using translated prompt: "${translatedPrompt}"`);
        fullPrompt = translatedPrompt;
      }
      
      addLog("Sending request to Fal.ai Imagen model...");
      
      // Get aspect ratio from selected size
      const { aspectRatio } = imageSizes[imageSize];
      
      const result = await fal.subscribe("fal-ai/imagen3/fast", {
        input: {
          prompt: fullPrompt,
          negative_prompt: negativePrompt || "low quality, bad anatomy, distorted, blurry",
          guidance_scale: guidanceScale,
          aspect_ratio: aspectRatio,
        },
      });
      
      if (result.data?.images?.[0]?.url) {
        const imageUrl = result.data.images[0].url;
        addLog("Image generated successfully!");
        setGeneratedImageUrl(imageUrl);
        
        // Store the image in Supabase if the user is logged in
        if (isLoggedIn()) {
          setIsStoring(true);
          addLog("Storing image in your personal cloud...");
          
          try {
            const userId = await getUserId();
            
            // Upload the image to storage
            const supabaseUrl = await uploadUrlToStorage(imageUrl, 'image', userId);
            
            // Update the UI with the stored image URL
            setGeneratedImageUrl(supabaseUrl);
            
            // Store the prompt and image URL in the user's history
            await supabase
              .from('user_content_history')
              .insert({
                user_id: userId,
                content_type: 'image',
                content_url: supabaseUrl,
                prompt: fullPrompt,
                metadata: {
                  negative_prompt: negativePrompt,
                  guidance_scale: guidanceScale,
                  size: imageSize,
                  style: styleModifier,
                  original_url: imageUrl
                }
              });
            
            addLog("Image stored successfully in your cloud storage.");
          } catch (error) {
            console.error("Failed to store image:", error);
            addLog("Failed to store image in cloud storage. Using temporary URL.");
          } finally {
            setIsStoring(false);
          }
        }
        
        // Increment the image count
        await incrementImageCount();
        
        // Update the remaining count
        const counts = await getRemainingCountsAsync();
        setRemainingImages(counts.remainingImages);
        
        toast({
          title: "Image Generated",
          description: "Your image has been generated successfully"
        });
      } else {
        throw new Error("No image URL in the response");
      }
    } catch (error) {
      console.error("Failed to generate image:", error);
      addLog(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    
    const link = document.createElement("a");
    link.href = generatedImageUrl;
    link.download = `ai-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download Started",
      description: "Your image download has started"
    });
  };

  const handleUseThisImage = () => {
    if (generatedImageUrl && onImageGenerated) {
      onImageGenerated(generatedImageUrl);
    }
  };

  // Update handlers for component props
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    setTranslatedPrompt(value);
  };

  const handleNegativePromptChange = (value: string) => {
    setNegativePrompt(value);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Text to Image</h2>
          
          {!isApiKeyValid && (
            <Alert className="mb-4">
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                <div className="space-y-4 mt-2">
                  <p>Please enter your FAL.AI API key to generate images</p>
                  <div>
                    <Label htmlFor="apiKey">FAL.AI API Key</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        id="apiKey"
                        type="password"
                        value={customApiKey}
                        onChange={handleApiKeyChange}
                        placeholder="Enter your API key"
                        className="flex-1 px-3 py-2 bg-background border border-input rounded-md"
                      />
                      <Button onClick={saveApiKey}>Save Key</Button>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <PromptInput
              prompt={prompt}
              onPromptChange={handlePromptChange}
              negativePrompt={negativePrompt}
              onNegativePromptChange={handleNegativePromptChange}
              isGenerating={isGenerating}
              language={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              isTranslating={isTranslating}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImageSizeSelector
                value={imageSize}
                onChange={setImageSize}
                options={imageSizes}
                disabled={isGenerating}
              />
              
              <GuidanceScaleSlider
                value={guidanceScale}
                onChange={setGuidanceScale}
                disabled={isGenerating}
              />
            </div>
            
            <StyleModifiers
              styleModifier={styleModifier}
              setStyleModifier={setStyleModifier}
              disabled={isGenerating}
            />
            
            <Button
              onClick={generateImage}
              disabled={isGenerating || !prompt || !isApiKeyValid || remainingImages < 1}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              {remainingImages} / {IMAGE_LIMIT} daily image generations remaining
            </p>
          </div>
          
          <div className="mt-4 h-[200px] overflow-y-auto p-2 text-xs bg-black/70 text-green-400 font-mono rounded border border-slate-700 shadow-inner">
            {logs.length > 0 ? logs.map((log, i) => (
              <div key={i} className="mb-1">
                <span className="opacity-50">[{new Date().toLocaleTimeString()}]:</span> {log}
              </div>
            )) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                <p>Generation logs will appear here</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <GeneratedImageDisplay
            imageUrl={generatedImageUrl}
            isLoading={isGenerating}
            isUploading={isStoring}
            onUseImage={handleUseThisImage}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToImage;
