import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { AlertCircle, Film, Loader2, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PublicPrivateToggle } from "@/components/image-generation/PublicPrivateToggle";
import { GeneratedImageDisplay } from "@/components/image-generation/GeneratedImageDisplay";
import { useToast } from "@/hooks/use-toast";
import { incrementRunwayVideoCount } from "@/utils/usageTracker";
import { uploadUrlToStorage } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";

interface RunwayGenerationOptions {
  prompt: string;
  height?: number;
  width?: number;
  fps?: number;
  numFrames?: number;
  guidanceScale?: number;
}

const RunwayImageToVideo = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [fps, setFps] = useState(24);
  const [numFrames, setNumFrames] = useState(24);
  const [guidanceScale, setGuidanceScale] = useState(7);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(5);
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const resetForm = () => {
    setImagePreview(null);
    setImageFile(null);
    setPrompt("");
    setFps(24);
    setNumFrames(24);
    setGuidanceScale(7);
    setGeneratedVideoUrl(null);
    setError(null);
  };

  const canGenerate = !!apiKey && !!imagePreview && !!prompt && remainingGenerations > 0;

  const handleGenerateVideo = async () => {
    if (!canGenerate || !imageFile) return;

    setIsGenerating(true);
    setError(null);

    try {
      const canGenerateMore = await incrementRunwayVideoCount();
      if (!canGenerateMore) {
        throw new Error("You've reached your Runway video generation limit.");
      }

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const base64Image = await base64Promise;
      const imageData = base64Image.split(',')[1];

      const response = await fetch('https://api.aivideoapi.com/runway/generate/imageDescription', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text_prompt: prompt,
          img_prompt: `data:image/jpeg;base64,${imageData}`,
          model: "gen3",
          image_as_end_frame: false,
          flip: false,
          motion: guidanceScale,
          seed: 0,
          callback_url: "",
          time: 5
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status} - ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log("Video generation response:", data);

      if (!data.video) {
        throw new Error("No video was generated. Please try again.");
      }

      setGeneratedVideoUrl(data.video);
      setRemainingGenerations(prev => Math.max(0, prev - 1));

      toast({
        title: "Video generated successfully!",
        description: "Your video has been created and is ready to use.",
      });

      setIsUploading(true);
      try {
        const user = await supabase.auth.getUser();
        const userId = user.data.user?.id;

        if (userId) {
          const storedUrl = await uploadUrlToStorage(
            data.video,
            "video",
            userId,
            isPublic
          );

          await supabase.from("user_content_history").insert({
            user_id: userId,
            content_type: "video",
            content_url: storedUrl,
            prompt: prompt,
            is_public: isPublic,
            metadata: {
              source: "runway",
              fps,
              numFrames,
              guidanceScale
            }
          });

          toast({
            title: "Video saved",
            description: "Your video has been saved to your history.",
          });
        }
      } catch (error) {
        console.error("Error saving video:", error);
        toast({
          title: "Error saving video",
          description: "There was an error saving your video to storage.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    } catch (error) {
      console.error("Error generating video:", error);
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      toast({
        title: "Video generation failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideoUrl) return;

    const link = document.createElement('a');
    link.href = generatedVideoUrl;
    link.download = `runway-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <Card className="overflow-hidden border-0 shadow-lg glass-morphism">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Image & Settings</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key">Runway API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your Runway API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Your API key is required for video generation.
              </p>
            </div>

            <div>
              <Label>Upload Image</Label>
              <div
                onClick={handleImageClick}
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-slate-300 rounded-md cursor-pointer hover:border-slate-400 transition-colors"
              >
                <div className="space-y-1 text-center">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mx-auto h-32 object-contain"
                    />
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-slate-400" />
                      <p className="text-sm text-slate-500">
                        Click to upload an image or drag and drop
                      </p>
                    </>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe your video (e.g., 'A beautiful sunset over the ocean with waves crashing')"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24"
              />
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <Label htmlFor="fps">Frames Per Second: {fps}</Label>
                </div>
                <Slider
                  id="fps"
                  min={15}
                  max={30}
                  step={1}
                  value={[fps]}
                  onValueChange={(value) => setFps(value[0])}
                  className="mt-2"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label htmlFor="numFrames">Number of Frames: {numFrames}</Label>
                </div>
                <Slider
                  id="numFrames"
                  min={16}
                  max={48}
                  step={4}
                  value={[numFrames]}
                  onValueChange={(value) => setNumFrames(value[0])}
                  className="mt-2"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <Label htmlFor="guidanceScale">Guidance Scale: {guidanceScale}</Label>
                </div>
                <Slider
                  id="guidanceScale"
                  min={1}
                  max={20}
                  step={0.5}
                  value={[guidanceScale]}
                  onValueChange={(value) => setGuidanceScale(value[0])}
                  className="mt-2"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Higher values make the video adhere more closely to the prompt.
                </p>
              </div>
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGenerating}
            />

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={handleGenerateVideo}
                disabled={!canGenerate || isGenerating}
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
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={isGenerating}
                className="w-full"
              >
                Reset
              </Button>
              <p className="text-xs text-center text-slate-500 mt-1">
                {remainingGenerations} of 5 video generations remaining with this API key
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-0 shadow-lg glass-morphism">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Generated Video</h2>
          <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {generatedVideoUrl ? (
              <div className="relative w-full h-full">
                <video
                  src={generatedVideoUrl}
                  controls
                  loop
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
                <Film className="h-12 w-12 mb-2" />
                <span>Your video will appear here</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              disabled={!generatedVideoUrl || isGenerating || isUploading}
              className="w-full"
            >
              Download Video
            </Button>
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {generatedVideoUrl ? "Video stored in your personal cloud storage" : ""}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RunwayImageToVideo;
