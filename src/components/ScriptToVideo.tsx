import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { falService } from "@/services/falService";

interface ScriptScene {
  script: string;
  imagePrompt: string;
  imageUrl: string | null;
}

const ScriptToVideo = () => {
  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<ScriptScene[]>([
    { script: "", imagePrompt: "", imageUrl: null },
  ]);
  const [currentStep, setCurrentStep] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const addScene = () => {
    setScenes([...scenes, { script: "", imagePrompt: "", imageUrl: null }]);
  };

  const updateScene = (index: number, field: string, value: string) => {
    const updatedScenes = [...scenes];
    // Type assertion to tell TypeScript that field is a key of ScriptScene
    updatedScenes[index][field as keyof ScriptScene] = value;
    setScenes(updatedScenes);
  };

  const generateImagePrompts = async () => {
    setIsGenerating(true);
    setCurrentStep("Generating image prompts...");

    // Basic implementation for generating image prompts
    const generatedScenes = scenes.map((scene) => ({
      ...scene,
      imagePrompt: `A scenic view described as: ${scene.script}`,
    }));

    setScenes(generatedScenes);
    setIsGenerating(false);
    setCurrentStep("");
  };

  const generateImagesForScenes = async (scenes: ScriptScene[]) => {
    const updatedScenes = [...scenes];
    setIsGenerating(true);
    
    try {
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        setCurrentStep(`Generating image for scene ${i + 1}/${scenes.length}`);
        
        // Use the falService to generate image using imagen3
        const result = await falService.generateImage({
          prompt: scene.imagePrompt,
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

  const generateVideo = async () => {
    setIsGenerating(true);
    setCurrentStep("Generating video...");

    // Placeholder for video generation logic
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentStep("Video generated!");
      toast({
        title: "Success",
        description: "Video generated successfully!",
      });
    }, 5000);
  };

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="p-4">
          <Label htmlFor="script">Script</Label>
          <Textarea
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter your script here"
            className="mb-4"
          />

          {scenes.map((scene, index) => (
            <div key={index} className="mb-4 p-4 border rounded">
              <Label htmlFor={`script-${index}`}>Scene {index + 1} Script</Label>
              <Input
                type="text"
                id={`script-${index}`}
                value={scene.script}
                onChange={(e) =>
                  updateScene(index, "script", e.target.value)
                }
                placeholder="Enter scene script"
                className="mb-2"
              />

              <Label htmlFor={`imagePrompt-${index}`}>
                Scene {index + 1} Image Prompt
              </Label>
              <Input
                type="text"
                id={`imagePrompt-${index}`}
                value={scene.imagePrompt}
                onChange={(e) =>
                  updateScene(index, "imagePrompt", e.target.value)
                }
                placeholder="Enter image prompt"
                className="mb-2"
              />

              {scene.imageUrl && (
                <img
                  src={scene.imageUrl}
                  alt={`Scene ${index + 1}`}
                  className="mt-2 max-h-40"
                />
              )}
            </div>
          ))}

          <Button type="button" onClick={addScene} className="mb-4">
            Add Scene
          </Button>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={generateImagePrompts}
              disabled={isGenerating}
            >
              Generate Image Prompts
            </Button>

            <Button
              type="button"
              onClick={() => generateImagesForScenes(scenes)}
              disabled={isGenerating}
            >
              Generate Images
            </Button>

            <Button type="button" onClick={generateVideo} disabled={isGenerating}>
              Generate Video
            </Button>
          </div>

          {currentStep && (
            <p className="mt-4">
              {currentStep}
              {isGenerating && <Loader2 className="ml-2 inline-block animate-spin" />}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScriptToVideo;
