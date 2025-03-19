
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

interface TextToImageProps {
  onImageGenerated: (imageUrl: string) => void;
}

// Define the types of image sizes with their display values
const IMAGE_SIZES = {
  square: "Square (1:1)",
  square_hd: "Square HD (1:1)",
  portrait_4_3: "Portrait (4:3)",
  portrait_16_9: "Portrait (16:9)",
  landscape_4_3: "Landscape (4:3)",
  landscape_16_9: "Landscape (16:9)",
};

// Define the type for image size
type ImageSizeOption = keyof typeof IMAGE_SIZES;
type LanguageOption = keyof typeof LANGUAGES;

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSize, setImageSize] = useState<ImageSizeOption>("square_hd");
  const [isTranslating, setIsTranslating] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const { toast } = useToast();
  const [counts, setCounts] = useState(getRemainingCounts());
  
  // Update counts when component mounts
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

  const saveToHistory = async (imageUrl: string) => {
    if (!isLoggedIn()) return;
    
    try {
      // Get current user's ID from localStorage
      const user = localStorage.getItem("user");
      if (!user) return;
      
      const userData = JSON.parse(user);
      const userId = userData.id;
      
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
          metadata: { size: imageSize }
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

    // Check usage limits
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
      // If not in English, translate to English for better image generation
      let promptToUse = prompt;
      if (selectedLanguage !== "en") {
        try {
          promptToUse = await translateText(prompt, selectedLanguage, "en");
        } catch (error) {
          console.error("Failed to translate to English:", error);
          // Continue with original prompt if translation fails
        }
      }

      // Use Fal.ai API to generate image
      const result = await fal.subscribe("fal-ai/fast-sdxl", {
        input: {
          prompt: promptToUse,
          negative_prompt: "blurry, bad quality, distorted",
          image_size: imageSize,
          num_inference_steps: 30,
          guidance_scale: 7.5,
        },
      });
      
      if (result.data && result.data.images && result.data.images[0]) {
        const imageUrl = result.data.images[0].url;
        setGeneratedImage(imageUrl);
        
        // Save to history if user is logged in
        await saveToHistory(imageUrl);
        
        // Increment usage count
        if (await incrementImageCount()) {
          toast({
            title: "Success",
            description: "Image generated successfully!",
          });
          // Update counts after successful generation
          const freshCounts = await getRemainingCountsAsync();
          setCounts(freshCounts);
        } else {
          toast({
            title: "Usage Tracking Error",
            description: "Failed to update usage count.",
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
      onImageGenerated(generatedImage);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement("a");
      link.href = generatedImage;
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
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-contain"
              />
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
              disabled={!generatedImage || isLoading} 
              className="flex-1"
            >
              Use This Image
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={!generatedImage || isLoading}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TextToImage;
