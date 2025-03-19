
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";
import { Loader2, Download, Image as ImageIcon, Languages, AlertCircle } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { LANGUAGES, translateText } from "@/utils/translationUtils";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { incrementImageCount, getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";
import { isLoggedIn } from "@/utils/authUtils";
import { uploadUrlToStorage, getUserId } from "@/utils/storageUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface TextToImageProps {
  onImageGenerated: (imageUrl: string) => void;
}

const IMAGE_SIZES = {
  square: "Square (1:1)",
  square_hd: "Square HD (1:1)",
  portrait_4_3: "Portrait (4:3)",
  portrait_16_9: "Portrait (16:9)",
  landscape_4_3: "Landscape (4:3)",
  landscape_16_9: "Landscape (16:9)",
};

// Available LoRAs for flux-lora model
const AVAILABLE_LORAS = [
  { id: "anime", name: "Anime Style", description: "Anime art style" },
  { id: "photorealistic", name: "Photorealistic", description: "Ultra realistic photos" },
  { id: "illustration", name: "Illustration", description: "Illustrated art style" },
  { id: "concept", name: "Concept Art", description: "Professional concept art" },
  { id: "painting", name: "Painting", description: "Traditional painting style" },
  { id: "3d", name: "3D Render", description: "3D rendered models" },
];

type ImageSizeOption = keyof typeof IMAGE_SIZES;
type LanguageOption = keyof typeof LANGUAGES;
type LoraOption = typeof AVAILABLE_LORAS[number]['id'];

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSizeOption>("square_hd");
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCounts());
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [supabaseImageUrl, setSupabaseImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLoras, setSelectedLoras] = useState<LoraOption[]>([]);
  const [guidanceScale, setGuidanceScale] = useState(9);

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    updateCounts();
  }, []);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleLanguageChange = async (language: LanguageOption) => {
    if (language === selectedLanguage || !prompt.trim()) {
      setSelectedLanguage(language);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedText = await translateText(prompt, selectedLanguage, language);
      setPrompt(translatedText);
      setSelectedLanguage(language);
      toast({
        title: "Prompt Translated",
        description: `Translated to ${LANGUAGES[language]}`,
      });
    } catch (error) {
      toast({
        title: "Translation Error",
        description: "Failed to translate text",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleLora = (loraId: LoraOption) => {
    setSelectedLoras(current => 
      current.includes(loraId) 
        ? current.filter(id => id !== loraId) 
        : [...current, loraId]
    );
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
      if (selectedLanguage !== "en") {
        try {
          promptToUse = await translateText(prompt, selectedLanguage, "en");
        } catch (error) {
          console.error("Failed to translate to English:", error);
        }
      }

      // Map the image size to dimensions for flux-lora
      let width = 1024;
      let height = 1024;
      
      if (imageSize.includes('landscape')) {
        width = 1280;
        height = 768;
      } else if (imageSize.includes('portrait')) {
        width = 768;
        height = 1280;
      }

      const result = await fal.subscribe("fal-ai/flux-lora", {
        input: {
          prompt: promptToUse,
          negative_prompt: "blurry, bad quality, distorted, disfigured",
          loras: selectedLoras.map(lora => ({
            model_name: lora,
            strength: 0.8
          })),
          width,
          height,
          guidance_scale: guidanceScale,
          inference_steps: 30,
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

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Create an Image</h2>
          
          {counts.remainingImages <= 10 && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Usage Limit Warning</AlertTitle>
              <AlertDescription>
                You have {counts.remainingImages} image generation{counts.remainingImages === 1 ? '' : 's'} remaining.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Prompt</label>
                <Select 
                  value={selectedLanguage} 
                  onValueChange={(value: LanguageOption) => handleLanguageChange(value)}
                  disabled={isTranslating}
                >
                  <SelectTrigger className="h-7 w-36">
                    <Languages className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(LANGUAGES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Describe the image you want to create... (e.g., A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage)"
                value={prompt}
                onChange={handlePromptChange}
                className="min-h-[120px]"
                disabled={isTranslating}
              />
              {isTranslating && (
                <div className="text-xs text-slate-500 mt-1 flex items-center">
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  Translating...
                </div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Image Size</label>
              <Select 
                value={imageSize} 
                onValueChange={(value: ImageSizeOption) => setImageSize(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(IMAGE_SIZES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Guidance Scale: {guidanceScale}</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Creative</span>
                <span>Precise</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Style Modifiers (LoRAs)</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {AVAILABLE_LORAS.map((lora) => (
                  <div key={lora.id} className="flex items-start space-x-2">
                    <Checkbox 
                      id={`lora-${lora.id}`}
                      checked={selectedLoras.includes(lora.id as LoraOption)}
                      onCheckedChange={() => toggleLora(lora.id as LoraOption)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`lora-${lora.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {lora.name}
                      </label>
                      <p className="text-xs text-slate-500">
                        {lora.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedLoras.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedLoras.map(lora => (
                    <Badge key={lora} variant="outline" onClick={() => toggleLora(lora)} className="cursor-pointer">
                      {AVAILABLE_LORAS.find(l => l.id === lora)?.name}
                      <span className="ml-1">×</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <Button 
                onClick={generateImage} 
                disabled={isLoading || isTranslating || !prompt.trim() || counts.remainingImages <= 0} 
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
          <h2 className="text-2xl font-bold mb-4">Generated Image</h2>
          <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {generatedImage ? (
              <div className="relative w-full h-full">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-full object-contain"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <span className="ml-2 text-white">Storing...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span>Your image will appear here</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleUseImage}
              disabled={!generatedImage || isLoading || isUploading} 
              className="flex-1"
            >
              Use This Image
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={!generatedImage || isLoading || isUploading}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Stored in your personal cloud storage
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToImage;
