
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ImageUploader from "@/components/ImageUploader";
import VideoPreview from "@/components/VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import { Loader2, Film } from "lucide-react";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";

const RunwayVideo = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState("");
  
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    localStorage.setItem("runwayApiKey", e.target.value);
  };

  // Load saved API key on component mount
  useState(() => {
    const savedKey = localStorage.getItem("runwayApiKey");
    if (savedKey) {
      setApiKey(savedKey);
    }
  });

  const generateVideo = async () => {
    if (!imageUrl) {
      toast({
        title: "Missing image",
        description: "Please upload an image first",
        variant: "destructive",
      });
      return;
    }

    if (!prompt) {
      toast({
        title: "Missing prompt",
        description: "Please enter a prompt for the video",
        variant: "destructive",
      });
      return;
    }

    if (!apiKey) {
      toast({
        title: "Missing API key",
        description: "Please enter your Runway API key",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationLogs([]);
    setGeneratedVideoUrl("");

    try {
      setGenerationLogs(prev => [...prev, "Starting video generation..."]);
      
      // Prepare request body
      const requestBody = {
        prompt,
        image_url: imageUrl,
        mode: "standard",
        aspect_ratio: "1:1"
      };

      setGenerationLogs(prev => [...prev, "Sending request to Runway API..."]);
      
      // Make API request to Runway
      const response = await fetch("https://api.runwayml.com/v1/runway/generate/image-description", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Runway API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      setGenerationLogs(prev => [...prev, "Video generation successful!"]);
      
      // Extract video URL from response
      const videoUrl = data.output;
      setGeneratedVideoUrl(videoUrl);

      // Store video generation history in Supabase if user is logged in
      const userId = await getUserId();
      if (userId) {
        await supabase.from('user_content_history').insert({
          user_id: userId,
          content_type: 'video',
          content_url: videoUrl,
          prompt: prompt,
          is_public: isPublic,
          metadata: {
            source: 'runway',
            image_url: imageUrl
          }
        });
      }

      // Update usage count
      await incrementVideoCount();
      
      toast({
        title: "Success",
        description: "Video generated successfully",
      });
    } catch (error) {
      console.error("Video generation failed:", error);
      setGenerationLogs(prev => [...prev, `Error: ${error.message}`]);
      toast({
        title: "Error",
        description: error.message || "Failed to generate video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <Film className="mr-2 h-6 w-6" />
            Runway Video Generator
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">Runway API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your Runway API key"
                value={apiKey}
                onChange={handleApiKeyChange}
              />
              <p className="text-xs text-slate-500 mt-1">
                Get your API key from the <a href="https://app.runwayml.com" target="_blank" rel="noreferrer" className="underline">Runway dashboard</a>
              </p>
            </div>

            <div>
              <ImageUploader 
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                setImageUrl={setImageUrl}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Video Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Describe how the image should animate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            <Button
              onClick={generateVideo}
              disabled={isGenerating || isUploading || !imageUrl || !prompt || !apiKey}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Generate Video
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isGenerating || generatedVideoUrl) && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-bold mb-4">Video Preview</h3>
            <VideoPreview
              videoUrl={generatedVideoUrl}
              isLoading={isGenerating}
              generationLogs={generationLogs}
              videoRef={videoRef}
              isPlaying={isPlaying}
              handlePlayPause={handlePlayPause}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RunwayVideo;
