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
import { incrementVideoCount } from "@/utils/usageTracker";

interface ApiKeyListItem {
  key: string;
  name: string;
}

const RunwayVideo = () => {
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem("aiVideoApiKey") || "");
  const [apiKeyList, setApiKeyList] = useState<ApiKeyListItem[]>(
    JSON.parse(localStorage.getItem("aiVideoApiKeyList") || "[]")
  );
  const [selectedApiKey, setSelectedApiKey] = useState(0);
  const [videoConfig, setVideoConfig] = useState({
    seed: Math.floor(Math.random() * 10000),
    cfgScale: 10,
    steps: 30,
    interpolation: true,
  });
  
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();
  const { toast } = useToast();
  
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const saveApiKey = () => {
    if (apiKey) {
      const keyName = `Key ${apiKeyList.length + 1}`;
      const newKeyItem = { key: apiKey, name: keyName };
      
      const newApiKeyList = [...apiKeyList];
      if (!apiKeyList.some(item => item.key === apiKey)) {
        newApiKeyList.push(newKeyItem);
      }
      
      localStorage.setItem("aiVideoApiKey", apiKey);
      localStorage.setItem("aiVideoApiKeyList", JSON.stringify(newApiKeyList));
      
      setApiKeyList(newApiKeyList);
      setSelectedApiKey(newApiKeyList.findIndex(item => item.key === apiKey));
      
      toast({
        title: "API Key Saved",
        description: "Your API key has been saved successfully.",
      });
    } else {
      toast({
        title: "Empty API Key",
        description: "Please enter a valid API key.",
        variant: "destructive",
      });
    }
  };

  const selectApiKey = (index: number) => {
    if (index >= 0 && index < apiKeyList.length) {
      const selectedKey = apiKeyList[index].key;
      setApiKey(selectedKey);
      setSelectedApiKey(index);
      localStorage.setItem("aiVideoApiKey", selectedKey);
      
      toast({
        title: "API Key Selected",
        description: `${apiKeyList[index].name} is now active.`,
      });
    }
  };

  const removeApiKey = (indexToRemove: number) => {
    if (indexToRemove >= 0 && indexToRemove < apiKeyList.length) {
      const newApiKeyList = apiKeyList.filter((_, index) => index !== indexToRemove);
      setApiKeyList(newApiKeyList);
      localStorage.setItem("aiVideoApiKeyList", JSON.stringify(newApiKeyList));
      
      if (selectedApiKey === indexToRemove) {
        if (newApiKeyList.length > 0) {
          setApiKey(newApiKeyList[0].key);
          setSelectedApiKey(0);
          localStorage.setItem("aiVideoApiKey", newApiKeyList[0].key);
        } else {
          setApiKey("");
          setSelectedApiKey(-1);
          localStorage.removeItem("aiVideoApiKey");
        }
      } else if (selectedApiKey > indexToRemove) {
        setSelectedApiKey(selectedApiKey - 1);
      }
      
      toast({
        title: "API Key Removed",
        description: `${apiKeyList[indexToRemove].name} has been removed.`,
      });
    }
  };

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
        description: "Please enter your AI Video API key",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationLogs([]);
    setGeneratedVideoUrl("");

    try {
      setGenerationLogs(prev => [...prev, "Starting video generation with Runway..."]);
      
      // Prepare request body
      const requestBody = {
        image_url: imageUrl,
        description: prompt,
        seed: videoConfig.seed,
        cfg_scale: videoConfig.cfgScale,
        steps: videoConfig.steps,
        interpolation: videoConfig.interpolation,
      };

      setGenerationLogs(prev => [...prev, "Sending request to Runway API..."]);

      // Add timeout to the fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

      const response = await fetch("https://aivideoapi.com/api/v1/runway/generate/imagedescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      setGenerationLogs(prev => [...prev, "Video generation successful!"]);
      
      // Extract video URL from response
      const videoUrl = data.output?.url || data.url || data.video_url;
      if (!videoUrl) {
        throw new Error("No video URL found in response");
      }
      setGeneratedVideoUrl(videoUrl);

      // Store video generation history in Supabase
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
            image_url: imageUrl,
            config: videoConfig
          }
        });
      }

      // Update usage count
      await incrementVideoCount();
      
      toast({
        title: "Success",
        description: "Video generated successfully",
      });
    } catch (error: any) {
      console.error("Video generation failed:", error);
      const errorMessage = error.name === "AbortError" 
        ? "Request timed out. Please try again." 
        : error.message || "Failed to fetch. Check your network connection.";
      
      setGenerationLogs(prev => [...prev, `Error: ${errorMessage}`]);
      
      if (apiKeyList.length > 1) {
        const nextKeyIndex = (selectedApiKey + 1) % apiKeyList.length;
        setGenerationLogs(prev => [...prev, `Trying with ${apiKeyList[nextKeyIndex].name}...`]);
        
        selectApiKey(nextKeyIndex);
        
        toast({
          title: "Trying different API key",
          description: `Switched to ${apiKeyList[nextKeyIndex].name} after error`,
        });
      } else {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfigChange = (key: keyof typeof videoConfig, value: any) => {
    setVideoConfig(prev => ({
      ...prev,
      [key]: value
    }));
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
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="apiKey">AI Video API Key</Label>
                <div className="flex gap-2 flex-wrap">
                  {apiKeyList.map((item, index) => (
                    <Button 
                      key={index}
                      variant={selectedApiKey === index ? "default" : "outline"}
                      size="sm"
                      onClick={() => selectApiKey(index)}
                      className="truncate max-w-[100px]"
                      title={item.name}
                    >
                      {item.name}
                    </Button>
                  ))}
                  {selectedApiKey !== -1 && apiKeyList.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => removeApiKey(selectedApiKey)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your AI Video API key"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  className="flex-1"
                />
                <Button onClick={saveApiKey}>Save Key</Button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Get your API key from <a href="https://aivideoapi.readme.io" target="_blank" rel="noreferrer" className="underline">AI Video API</a>
              </p>
            </div>

            <div>
              <ImageUploader 
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                setImageUrl={setImageUrl}
                isUploading={isUploading}
                setIsUploading={setIsUploading}
                onImageSelected={(url) => setImageUrl(url)}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Video Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe how the image should animate..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="seed">Seed</Label>
                <Input
                  id="seed"
                  type="number"
                  value={videoConfig.seed}
                  onChange={(e) => handleConfigChange('seed', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="cfgScale">CFG Scale (1-20)</Label>
                <Input
                  id="cfgScale"
                  type="number"
                  min="1"
                  max="20"
                  value={videoConfig.cfgScale}
                  onChange={(e) => handleConfigChange('cfgScale', parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="steps">Steps (10-50)</Label>
                <Input
                  id="steps"
                  type="number"
                  min="10"
                  max="50"
                  value={videoConfig.steps}
                  onChange={(e) => handleConfigChange('steps', parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="interpolation"
                  type="checkbox"
                  checked={videoConfig.interpolation}
                  onChange={(e) => handleConfigChange('interpolation', e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="interpolation">Interpolation</Label>
              </div>
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
