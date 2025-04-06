import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, Image, Wand2, Volume2, VolumeX, Highlighter } from "lucide-react";
import { useFalModels } from "@/hooks/useFalModels";
import ImageUploader from "./ImageUploader";
import VideoPreview from "./VideoPreview";
import { useVideoControls } from "@/hooks/useVideoControls";
import ProLabel from "./ProLabel";

const AITools = () => {
  const [activeTab, setActiveTab] = useState<string>("upscaler");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [maskUrl, setMaskUrl] = useState("");
  const [maskPreview, setMaskPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [text, setText] = useState("");
  const [prompt, setPrompt] = useState("");
  const [speakerIdentity, setSpeakerIdentity] = useState("en_speaker_1");
  
  const { 
    isLoading, 
    modelResult, 
    generationLogs, 
    upscaleImage, 
    removeBackground, 
    textToSpeech,
    inpaintImage
  } = useFalModels();
  
  const { isPlaying, videoRef, handlePlayPause } = useVideoControls();

  const handleGenerate = async () => {
    switch (activeTab) {
      case "upscaler":
        await upscaleImage(imageUrl);
        break;
      case "remove-bg":
        await removeBackground(imageUrl);
        break;
      case "text-to-speech":
        await textToSpeech(text, speakerIdentity);
        break;
      case "inpainting":
        await inpaintImage(imageUrl, maskUrl, prompt);
        break;
      default:
        break;
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">AI Tools</h2>
            <ProLabel />
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 gap-1">
              <TabsTrigger value="upscaler" className="flex items-center gap-1">
                <Image className="w-4 h-4" /> Upscaler
              </TabsTrigger>
              <TabsTrigger value="remove-bg" className="flex items-center gap-1">
                <Wand2 className="w-4 h-4" /> Remove BG
              </TabsTrigger>
              <TabsTrigger value="text-to-speech" className="flex items-center gap-1">
                <Volume2 className="w-4 h-4" /> TTS
              </TabsTrigger>
              <TabsTrigger value="inpainting" className="flex items-center gap-1">
                <Highlighter className="w-4 h-4" /> Inpaint
              </TabsTrigger>
            </TabsList>
            
            {/* Upscaler Tab */}
            <TabsContent value="upscaler" className="space-y-4">
              <div>
                <Label className="mb-2 block">Upload Image to Enhance</Label>
                <ImageUploader
                  imagePreview={imagePreview}
                  setImagePreview={setImagePreview}
                  setImageUrl={setImageUrl}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
                <p className="text-sm text-slate-400 mt-2">
                  Enhance image quality with AI upscaling (4x)
                </p>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !imageUrl}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Upscale Image"} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </TabsContent>
            
            {/* Remove Background Tab */}
            <TabsContent value="remove-bg" className="space-y-4">
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
                  Automatically remove the background from any image
                </p>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !imageUrl}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Remove Background"} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </TabsContent>
            
            {/* Text to Speech Tab */}
            <TabsContent value="text-to-speech" className="space-y-4">
              <div>
                <Label htmlFor="text" className="mb-2 block">Text</Label>
                <Textarea
                  id="text"
                  placeholder="Enter text to convert to speech..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="speaker" className="mb-2 block">Speaker Voice</Label>
                <Select
                  value={speakerIdentity}
                  onValueChange={(value) => setSpeakerIdentity(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en_speaker_1">English (Male)</SelectItem>
                    <SelectItem value="en_speaker_2">English (Female)</SelectItem>
                    <SelectItem value="en_speaker_3">English (Male 2)</SelectItem>
                    <SelectItem value="en_speaker_4">English (Female 2)</SelectItem>
                    <SelectItem value="en_speaker_5">English (Male 3)</SelectItem>
                    <SelectItem value="en_speaker_6">English (Male 4)</SelectItem>
                    <SelectItem value="en_speaker_7">English (Female 3)</SelectItem>
                    <SelectItem value="en_speaker_8">English (Female 4)</SelectItem>
                    <SelectItem value="en_speaker_9">English (Male 5)</SelectItem>
                    <SelectItem value="zh_speaker_1">Chinese (Female)</SelectItem>
                    <SelectItem value="zh_speaker_2">Chinese (Male)</SelectItem>
                    <SelectItem value="zh_speaker_3">Chinese (Female 2)</SelectItem>
                    <SelectItem value="fr_speaker_1">French (Male)</SelectItem>
                    <SelectItem value="fr_speaker_2">French (Female)</SelectItem>
                    <SelectItem value="de_speaker_1">German (Male)</SelectItem>
                    <SelectItem value="de_speaker_2">German (Female)</SelectItem>
                    <SelectItem value="hi_speaker_1">Hindi (Female)</SelectItem>
                    <SelectItem value="hi_speaker_2">Hindi (Male)</SelectItem>
                    <SelectItem value="it_speaker_1">Italian (Male)</SelectItem>
                    <SelectItem value="it_speaker_2">Italian (Female)</SelectItem>
                    <SelectItem value="ja_speaker_1">Japanese (Female)</SelectItem>
                    <SelectItem value="ja_speaker_2">Japanese (Male)</SelectItem>
                    <SelectItem value="ko_speaker_1">Korean (Male)</SelectItem>
                    <SelectItem value="ko_speaker_2">Korean (Female)</SelectItem>
                    <SelectItem value="pl_speaker_1">Polish (Female)</SelectItem>
                    <SelectItem value="pl_speaker_2">Polish (Male)</SelectItem>
                    <SelectItem value="pt_speaker_1">Portuguese (Female)</SelectItem>
                    <SelectItem value="pt_speaker_2">Portuguese (Male)</SelectItem>
                    <SelectItem value="ru_speaker_1">Russian (Female)</SelectItem>
                    <SelectItem value="ru_speaker_2">Russian (Male)</SelectItem>
                    <SelectItem value="es_speaker_1">Spanish (Male)</SelectItem>
                    <SelectItem value="es_speaker_2">Spanish (Female)</SelectItem>
                    <SelectItem value="tr_speaker_1">Turkish (Male)</SelectItem>
                    <SelectItem value="tr_speaker_2">Turkish (Female)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !text.trim()}
                className="w-full"
              >
                {isLoading ? "Generating..." : "Generate Speech"} 
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </TabsContent>
            
            {/* Inpainting Tab */}
            <TabsContent value="inpainting" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Upload Original Image</Label>
                  <ImageUploader
                    imagePreview={imagePreview}
                    setImagePreview={setImagePreview}
                    setImageUrl={setImageUrl}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                  />
                </div>
                
                <div>
                  <Label className="mb-2 block">Upload Mask Image (white areas will be edited)</Label>
                  <ImageUploader
                    imagePreview={maskPreview}
                    setImagePreview={setMaskPreview}
                    setImageUrl={setMaskUrl}
                    isUploading={isUploading}
                    setIsUploading={setIsUploading}
                  />
                  <p className="text-sm text-slate-400 mt-2">
                    Upload a black and white mask where white areas will be replaced
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="prompt" className="mb-2 block">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe what should replace the masked area..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isLoading || !imageUrl || !maskUrl}
                className="w-full"
              >
                {isLoading ? "Processing..." : "Generate Inpainting"} 
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
                      alt="Generated result"
                      className="w-full object-contain max-h-[500px]"
                    />
                  )
                )}
              </div>
            )}
            
            {modelResult?.type === "audio" && (
              <div className="border border-slate-200/20 rounded-lg overflow-hidden bg-slate-900/50 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-[100px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                ) : (
                  modelResult?.url && (
                    <div className="flex flex-col items-center">
                      <audio
                        src={modelResult.url}
                        controls
                        className="w-full mt-2"
                      />
                      <a 
                        href={modelResult.url} 
                        download="generated_audio.mp3"
                        className="mt-4 text-sm text-blue-400 hover:text-blue-300"
                      >
                        Download Audio File
                      </a>
                    </div>
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
