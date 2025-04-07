import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useFalClient } from "@/hooks/useFalClient";
import { useNavigate } from "react-router-dom";
import { Loader2, Upload, Video } from "lucide-react";
import { UsageLimits } from "./image-generation/UsageLimits";
import { getCurrentUser } from "@/utils/authUtils";
import { AppUser } from "@/utils/authUtils";

const ImageToVideo = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const { toast } = useToast();
  const { generateVideoFromImage } = useFalClient();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    fetchUser();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVideo = async () => {
    if (!imageUrl) {
      toast({
        title: "No image selected",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to generate videos",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (user.videoCredits <= 0) {
      toast({
        title: "No video credits",
        description: "You don't have any video generation credits left",
        variant: "destructive",
      });
      navigate("/purchase-credits");
      return;
    }

    setIsGenerating(true);
    setVideoUrl(null);

    try {
      // Make sure to include the prompt property as required by the API
      const result = await generateVideoFromImage({
        imageUrl,
        prompt: prompt || "Animate this image naturally", // Provide a default prompt if empty
      });

      if (result.success && result.videoUrl) {
        setVideoUrl(result.videoUrl);
        toast({
          title: "Video generated",
          description: "Your video has been generated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to generate video");
      }
    } catch (error) {
      console.error("Error generating video:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your video",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Image</TabsTrigger>
          <TabsTrigger value="url">Image URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload an Image</CardTitle>
              <CardDescription>
                Upload an image to convert it into a short video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="image">Image</Label>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
              </div>
              
              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm mb-2">Preview:</p>
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="max-w-full h-auto max-h-[300px] rounded-md"
                  />
                </div>
              )}
              
              <div className="mt-4">
                <Label htmlFor="prompt">Prompt (Optional)</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe how you want the image to be animated..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              {user && (
                <UsageLimits 
                  remainingCredits={user.videoCredits || 0} 
                  totalCredits={100}
                />
              )}
              
              <Button 
                onClick={handleGenerateVideo} 
                disabled={!imageUrl || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="url" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Use Image URL</CardTitle>
              <CardDescription>
                Enter the URL of an image to convert it into a short video
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  type="text" 
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              
              {imageUrl && imageUrl.startsWith('http') && (
                <div className="mt-4">
                  <p className="text-sm mb-2">Preview:</p>
                  <img 
                    src={imageUrl} 
                    alt="Preview" 
                    className="max-w-full h-auto max-h-[300px] rounded-md"
                    onError={() => {
                      toast({
                        title: "Invalid image URL",
                        description: "Could not load the image from the provided URL",
                        variant: "destructive",
                      });
                      setImageUrl("");
                    }}
                  />
                </div>
              )}
              
              <div className="mt-4">
                <Label htmlFor="prompt-url">Prompt (Optional)</Label>
                <Textarea
                  id="prompt-url"
                  placeholder="Describe how you want the image to be animated..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-1"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              {user && (
                <UsageLimits 
                  remainingCredits={user.videoCredits || 0} 
                  totalCredits={100}
                />
              )}
              
              <Button 
                onClick={handleGenerateVideo} 
                disabled={!imageUrl || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Generate Video
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {videoUrl && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Generated Video</h2>
          <div className="aspect-video">
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="w-full h-full rounded-lg"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button asChild>
              <a href={videoUrl} download="generated-video.mp4">
                <Upload className="mr-2 h-4 w-4" />
                Download Video
              </a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageToVideo;
