import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, PlayIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { falService } from "@/services/falService";
import { incrementVideoCount, VIDEO_LIMIT, getRemainingCounts, getRemainingCountsAsync } from "@/utils/usageTracker";
import { UsageLimits } from "./image-generation/UsageLimits";
import { isLoggedIn } from "@/utils/authUtils";
import { getUserId } from "@/utils/storageUtils";
import { supabase } from "@/integrations/supabase/client";
import ProLabel from "./ProLabel";

interface Scene {
  text: string;
  imagePrompt: string;
  imageUrl: string | null;
}

const StoryToVideo = () => {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isCreatingVideo, setIsCreatingVideo] = useState(false);
  const [cameraMode, setCameraMode] = useState("zoom in");
  const [framesPerSecond, setFramesPerSecond] = useState(8);
  const [counts, setCounts] = useState(getRemainingCounts());
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };
    updateCounts();
  }, []);

  const generateScenes = async () => {
    if (!title.trim() || !story.trim()) {
      toast({
        title: "Error",
        description: "Please enter both title and story.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setCurrentStep("Generating scenes from story...");

    try {
      // Basic scene splitting logic - split by paragraphs
      const paragraphs = story.split('\n').filter(p => p.trim() !== '');
      const newScenes: Scene[] = paragraphs.map((paragraph, index) => ({
        text: paragraph,
        imagePrompt: `A visually stunning scene from the story "${title}": ${paragraph}`,
        imageUrl: null
      }));
      setScenes(newScenes);
      setCurrentStep("Scenes generated. Generating images...");

      const updatedScenes = await generateImagesForScenes(newScenes);
      if (updatedScenes) {
        setScenes(updatedScenes);
        setCurrentStep("Images generated. Ready to create video.");
      }
    } catch (error) {
      console.error("Error generating scenes:", error);
      toast({
        title: "Error",
        description: "Failed to generate scenes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImagesForScenes = async (scenes: Scene[]) => {
    const updatedScenes = [...scenes];
    setIsGenerating(true);
    
    try {
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        setCurrentStep(`Generating image for scene ${i + 1}/${scenes.length}`);
        
        const result = await falService.generateImage(scene.imagePrompt, {
          negative_prompt: "low quality, bad anatomy, distorted",
          width: 1024,
          height: 1024
        });

        if (result.images?.[0]?.url) {
          updatedScenes[i] = {
            ...scene,
            imageUrl: result.images[0].url
          };
          setScenes(updatedScenes);
        } else {
          throw new Error("Failed to generate image for scene");
        }
      }
      return updatedScenes;
    } catch (error) {
      console.error("Error generating images:", error);
      toast({
        title: "Error",
        description: "Failed to generate images. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const createVideoFromScenes = async () => {
    if (counts.remainingVideos <= 0) {
      toast({
        title: "Usage Limit Reached",
        description: `You've reached the limit of ${VIDEO_LIMIT} video generations.`,
        variant: "destructive",
      });
      return;
    }

    if (!scenes.every(scene => scene.imageUrl)) {
      toast({
        title: "Error",
        description: "Please generate images for all scenes first.",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingVideo(true);
    setCurrentStep("Creating video from images...");

    try {
      const videoUrls = scenes.map(scene => scene.imageUrl).filter(url => url !== null) as string[];
      if (videoUrls.length === 0) {
        throw new Error("No image URLs available to create video.");
      }

      const firstImageUrl = videoUrls[0];

      if (!firstImageUrl || typeof firstImageUrl !== 'string' || !firstImageUrl.startsWith('http')) {
        throw new Error("Invalid image URL provided. Please ensure you have a valid image.");
      }

      const canGenerate = await incrementVideoCount();
      if (!canGenerate) {
        throw new Error("You have reached your video generation limit");
      }

      falService.initialize();

      const result = await falService.generateVideoFromImage(firstImageUrl, {
        prompt: `Animate this image with ${cameraMode} motion for the story "${title}"`
      });

      if (result?.video_url) {
        setVideoUrl(result.video_url);

        if (isLoggedIn()) {
          const userId = await getUserId();
          if (userId) {
            await supabase.from('user_content_history').insert({
              user_id: userId,
              content_type: 'video',
              content_url: result.video_url,
              prompt: `Video generated from story: ${title}`,
              is_public: isPublic,
              metadata: {
                title: title,
                cameraMode: cameraMode,
                framesPerSecond: framesPerSecond
              }
            });
          }
        }

        toast({
          title: "Success",
          description: "Video created successfully!",
        });
      } else {
        throw new Error("Failed to create video.");
      }
    } catch (error) {
      console.error("Error creating video:", error);
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingVideo(false);
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-1">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Story to Video</h2>
            <ProLabel />
          </div>

          <UsageLimits
            remainingImages={counts.remainingVideos}
            imageLimit={VIDEO_LIMIT}
          />

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="Enter story title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isGenerating || isCreatingVideo}
              />
            </div>
            <div>
              <Label htmlFor="story">Story</Label>
              <Textarea
                id="story"
                placeholder="Enter your story"
                value={story}
                onChange={(e) => setStory(e.target.value)}
                rows={4}
                disabled={isGenerating || isCreatingVideo}
              />
            </div>

            <div className="flex items-center justify-between">
              <Button
                onClick={generateScenes}
                disabled={isGenerating || isCreatingVideo || !title.trim() || !story.trim()}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {currentStep}
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generate Scenes
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {scenes.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Generated Scenes</h3>
            <div className="space-y-4">
              {scenes.map((scene, index) => (
                <div key={index} className="border rounded-md p-4">
                  <p className="text-sm text-gray-500 mb-2">Scene {index + 1}</p>
                  <p className="mb-2">{scene.text}</p>
                  {scene.imageUrl && (
                    <div className="relative">
                      <img
                        src={scene.imageUrl}
                        alt={`Scene ${index + 1}`}
                        className="w-full rounded-md aspect-video object-cover"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {scenes.length > 0 && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Create Video</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cameraMode">Camera Motion</Label>
                <Select value={cameraMode} onValueChange={setCameraMode}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select camera motion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom in">Zoom In</SelectItem>
                    <SelectItem value="zoom out">Zoom Out</SelectItem>
                    <SelectItem value="pan left">Pan Left</SelectItem>
                    <SelectItem value="pan right">Pan Right</SelectItem>
                    <SelectItem value="slow">Slow Motion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="framesPerSecond">Animation Speed</Label>
                <Slider
                  id="framesPerSecond"
                  defaultValue={[framesPerSecond]}
                  max={24}
                  min={1}
                  step={1}
                  onValueChange={(value) => setFramesPerSecond(value[0])}
                  disabled={isCreatingVideo}
                />
                <p className="text-sm text-gray-500 mt-1">Selected: {framesPerSecond}</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="isPublic">Make video public</Label>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={createVideoFromScenes}
                  disabled={isCreatingVideo || counts.remainingVideos <= 0}
                  className="w-full"
                >
                  {isCreatingVideo ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {currentStep}
                    </>
                  ) : (
                    <>
                      <PlayIcon className="mr-2 h-4 w-4" />
                      Create Video
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {videoUrl && (
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold mb-4">Generated Video</h3>
            <div className="relative">
              <video controls className="w-full rounded-md aspect-video">
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryToVideo;
