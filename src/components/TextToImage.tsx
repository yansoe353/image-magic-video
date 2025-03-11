
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Image as ImageIcon } from "lucide-react";

interface TextToImageProps {
  onImageGenerated: (imageUrl: string) => void;
}

const TextToImage = ({ onImageGenerated }: TextToImageProps) => {
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // This is a mock function for now, as we don't have the actual text-to-image API integration
  // In a real app, you would call the API here
  const generateImage = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // For now, using a placeholder image
      const placeholderImage = "https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg";
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGeneratedImage(placeholderImage);
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
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
          <div className="space-y-4">
            <div>
              <Textarea
                placeholder="Describe the image you want to create... (e.g., A stylish woman walks down a Tokyo street filled with warm glowing neon and animated city signage)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <Button 
              onClick={generateImage} 
              disabled={isLoading || !prompt.trim()} 
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
