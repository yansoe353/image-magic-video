
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Video, Image, Wand2 } from "lucide-react";
import { useFalModels } from "@/hooks/useFalModels";
import ImageUploader from "./ImageUploader";
import VideoPreview from "./VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import ProLabel from "./ProLabel";
import { isFalInitialized } from "@/hooks/useFalClient";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AITools = () => {
  const [activeTab, setActiveTab] = useState<string>("image-to-video");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<string>("16:9");
  const [controlNetType, setControlNetType] = useState<string>("canny");
  const [settings, setSettings] = useState({
    numSteps: 30,
    guidanceScale: 7.5,
    seed: Math.floor(Math.random() * 1000000),
    conditioningScale: 0.8,
  });
  
  const { 
    isLoading, 
    modelResult, 
    generationLogs,
    imageToVideo,
    generateVideoWithPrompt,
    generateWithControlNet
  } = useFalModels();
  
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();

  const handleGenerate = async () => {
    switch (activeTab) {
      case "image-to-video":
        if (!imageUrl) {
          return;
        }
        await imageToVideo(imageUrl, prompt, {
          negative_prompt: negativePrompt,
          aspect_ratio: aspectRatio as "16:9" | "9:16" | "1:1"
        });
        break;
      case "video-effects":
        if (!videoUrl) {
          return;
        }
        await generateVideoWithPrompt(videoUrl, prompt, {
          negative_prompt: negativePrompt
        });
        break;
      case "controlnet":
        if (!imageUrl) {
          return;
        }
        await generateWithControlNet(imageUrl, prompt, controlNetType, {
          negative_prompt: negativePrompt,
          num_inference_steps: settings.numSteps,
          guidance_scale: settings.guidanceScale,
          seed: settings.seed,
          controlnet_conditioning_scale: settings.conditioningScale
        });
        break;
      default:
        break;
    }
  };

  const handleSettingsChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRandomizeSeed = () => {
    handleSettingsChange('seed', Math.floor(Math.random() * 1000000));
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">AI Video Tools</h2>
            <ProLabel />
          </div>
          
          {!isFalInitialized && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>API Key Required</AlertTitle>
              <AlertDescription>
                Please set your API key in the settings first to use these features
              </AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-3 gap-1">
              <TabsTrigger value="image-to-video" className="flex items-center gap-1">
                <Image className="w-4 h-4" /> Image to Video
              </TabsTrigger>
              <TabsTrigger value="video-effects" className="flex items-center gap-1">
                <Video className="w-4 h-4" /> Video Effects
              </TabsTrigger>
              <TabsTrigger value="controlnet" className="flex items-center gap-1">
                <Wand2 className="w-4 h-4" /> ControlNet
              </TabsTrigger>
            </TabsList>
            
            {/* Image to Video Tab */}
            <TabsContent value="image-to-video" className="space-y-4">
              <div>
                <Label className="mb-2 block">Upload Image</Label>
                <ImageUploader
                  imagePreview={imagePreview}
                  setImagePreview={setImagePreview}
                  setImageUrl={setImageUrl}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
                <p className="text-sm text-slate-400 mt-2">
                  Upload an image to convert into a short video
                </p>
              </div>
              
              <div>
                <Label htmlFor="prompt" className="mb-2 block">Prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Describe how you want the image to animate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="negativePrompt" className="mb-2 block">Negative Prompt (Optional)</Label>
                <Textarea
                  id="negativePrompt"
                  placeholder="Describe what you want to avoid in the video..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              
              <div>
                <Label htmlFor="aspectRatio" className="mb-2 block">Aspect Ratio</Label>
                <Select value={aspectRatio} onValueChange={setAspectRatio}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                    <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                    <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !imageUrl || !prompt.trim() || !isFalInitialized}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Generate Video"} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </TabsContent>
            
            {/* Video Effects Tab */}
            <TabsContent value="video-effects" className="space-y-4">
              <div>
                <Label className="mb-2 block">Upload Video</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    id="video-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setVideoUrl(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <label htmlFor="video-upload" className="cursor-pointer">
                    <Video className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      {videoUrl ? "Change video" : "Click to upload a video"}
                    </p>
                  </label>
                </div>
                
                {videoUrl && (
                  <div className="mt-4 relative">
                    <video 
                      src={videoUrl} 
                      controls 
                      className="w-full h-auto rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setVideoUrl("")}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="videoPrompt" className="mb-2 block">Effect Prompt</Label>
                <Textarea
                  id="videoPrompt"
                  placeholder="Describe the effect you want to apply to the video..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="videoNegativePrompt" className="mb-2 block">Negative Prompt (Optional)</Label>
                <Textarea
                  id="videoNegativePrompt"
                  placeholder="Describe what you want to avoid in the processed video..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !videoUrl || !prompt.trim() || !isFalInitialized}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Apply Effect"} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </TabsContent>
            
            {/* ControlNet Tab */}
            <TabsContent value="controlnet" className="space-y-4">
              <div>
                <Label className="mb-2 block">Upload Reference Image</Label>
                <ImageUploader
                  imagePreview={imagePreview}
                  setImagePreview={setImagePreview}
                  setImageUrl={setImageUrl}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
                <p className="text-sm text-slate-400 mt-2">
                  Upload an image to use as a structural reference
                </p>
              </div>
              
              <div>
                <Label htmlFor="controlNetType" className="mb-2 block">Control Type</Label>
                <Select value={controlNetType} onValueChange={setControlNetType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select control type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="canny">Canny Edge Detection</SelectItem>
                    <SelectItem value="depth">Depth Map</SelectItem>
                    <SelectItem value="mlsd">MLSD Line Detection</SelectItem>
                    <SelectItem value="normal">Normal Map</SelectItem>
                    <SelectItem value="openpose">OpenPose Skeleton</SelectItem>
                    <SelectItem value="scribble">Scribble</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-400 mt-1">
                  Different control types extract different features from your image
                </p>
              </div>
              
              <div>
                <Label htmlFor="controlnetPrompt" className="mb-2 block">Generation Prompt</Label>
                <Textarea
                  id="controlnetPrompt"
                  placeholder="Describe what you want to generate with your reference structure..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="controlnetNegativePrompt" className="mb-2 block">Negative Prompt (Optional)</Label>
                <Textarea
                  id="controlnetNegativePrompt"
                  placeholder="Describe what you want to avoid in the generated image..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numSteps">Inference Steps: {settings.numSteps}</Label>
                  <Input
                    id="numSteps"
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={settings.numSteps}
                    onChange={(e) => handleSettingsChange('numSteps', Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="guidanceScale">Guidance Scale: {settings.guidanceScale}</Label>
                  <Input
                    id="guidanceScale"
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={settings.guidanceScale}
                    onChange={(e) => handleSettingsChange('guidanceScale', Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="conditioningScale">Conditioning Scale: {settings.conditioningScale}</Label>
                  <Input
                    id="conditioningScale"
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={settings.conditioningScale}
                    onChange={(e) => handleSettingsChange('conditioningScale', Number(e.target.value))}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <Label htmlFor="seed">Seed</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="seed"
                      type="number"
                      value={settings.seed}
                      onChange={(e) => handleSettingsChange('seed', Number(e.target.value))}
                      className="w-full"
                    />
                    <Button onClick={handleRandomizeSeed} variant="outline" size="sm">
                      Random
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !imageUrl || !prompt.trim() || !isFalInitialized}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Generate with ControlNet"} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="space-y-8">
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-4">Result Preview</h2>
            
            {modelResult?.type === "video" && (
              <div className="relative border border-slate-200/20 rounded-lg overflow-hidden bg-slate-900/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  modelResult?.url && (
                    <VideoPreview
                      videoUrl={modelResult.url}
                      isLoading={isLoading}
                      generationLogs={[]}
                      videoRef={videoRef}
                      isPlaying={isPlaying}
                      handlePlayPause={handlePlayPause}
                    />
                  )
                )}
              </div>
            )}
            
            {modelResult?.type === "image" && (
              <div className="relative border border-slate-200/20 rounded-lg overflow-hidden bg-slate-900/50">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  modelResult?.url && (
                    <img 
                      src={modelResult.url} 
                      alt="Generated with ControlNet" 
                      className="w-full h-auto"
                    />
                  )
                )}
              </div>
            )}
            
            {!modelResult && !isLoading && (
              <div className="bg-slate-800/60 rounded-lg p-6 text-center">
                <p className="text-slate-400">
                  Select a tool and generate content to see results here
                </p>
              </div>
            )}
            
            {isLoading && (
              <div className="mt-4 p-2 bg-slate-800/60 rounded-lg max-h-[200px] overflow-y-auto">
                <h3 className="font-medium text-sm mb-2">Processing Logs:</h3>
                <div className="space-y-1">
                  {generationLogs.map((log, idx) => (
                    <p key={idx} className="text-xs text-slate-400 font-mono">
                      &gt; {log}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AITools;
