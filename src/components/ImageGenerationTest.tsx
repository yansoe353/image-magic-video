
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ImageIcon } from "lucide-react";
import { falService } from "@/services/falService";
import { useToast } from "@/components/ui/use-toast";

const ImageGenerationTest = () => {
  const [prompt, setPrompt] = useState('A beautiful landscape with mountains and a lake');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const clearLogs = () => {
    setGenerationLogs([]);
  };

  const addLog = (message: string) => {
    setGenerationLogs(prev => [...prev, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
  };

  const generateImage = async () => {
    setIsLoading(true);
    setErrorMessage('');
    setImageUrl('');
    clearLogs();
    
    try {
      addLog("Starting image generation test...");
      
      if (apiKey) {
        addLog("Using custom API key");
        localStorage.setItem("falApiKey", apiKey);
        falService.setApiKey(apiKey);
      } else {
        addLog("Using default API key");
      }

      addLog(`Generating image with prompt: "${prompt}"`);
      
      const result = await falService.generateImageWithImagen3(prompt, {
        aspect_ratio: "1:1",
        negative_prompt: "low quality, blurry, distorted"
      });
      
      addLog("API request successful");
      addLog("Parsing response...");
      
      // Handle different response structures correctly
      let foundUrl = null;
      
      // Check for nested images array first
      if (result?.data?.images && result.data.images.length > 0) {
        foundUrl = result.data.images[0].url;
        addLog(`Found image URL in data.images[0].url`);
      } 
      // Check for top-level images array
      else if (result?.images && result.images.length > 0) {
        foundUrl = result.images[0].url;
        addLog(`Found image URL in images[0].url`);
      }
      // Check for other possible locations using type-safe property checks
      else {
        const dataObject = result?.data as Record<string, any>;
        const resultObject = result as Record<string, any>;
        
        if (dataObject && 'image_url' in dataObject) {
          foundUrl = dataObject.image_url;
          addLog(`Found image URL in data.image_url`);
        }
        else if (dataObject && 'url' in dataObject) {
          foundUrl = dataObject.url;
          addLog(`Found image URL in data.url`);
        }
        else if (resultObject && 'image_url' in resultObject) {
          foundUrl = resultObject.image_url;
          addLog(`Found image URL in image_url (from dynamic property)`);
        }
        else if (resultObject && 'url' in resultObject) {
          foundUrl = resultObject.url;
          addLog(`Found image URL in url (from dynamic property)`);
        }
      }
      
      if (foundUrl) {
        addLog(`Image URL found: ${foundUrl.substring(0, 50)}...`);
        setImageUrl(foundUrl);
        toast({
          title: "Success",
          description: "Image generated successfully!",
        });
      } else {
        addLog("ERROR: No image URL found in response");
        console.error("Response structure:", JSON.stringify(result));
        setErrorMessage("Failed to extract image URL from response");
        toast({
          title: "Error",
          description: "No image URL in response",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(errorMsg);
      addLog(`ERROR: ${errorMsg}`);
      toast({
        title: "Image Generation Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      addLog("Operation complete");
    }
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Image Generation Test</h2>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="apiKey">FAL.AI API Key (Optional)</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your FAL.AI API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">
                Leave blank to use default key
              </p>
            </div>
            
            <div>
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Enter your prompt here"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
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
                  Generate Test Image
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Result</h2>
          
          {errorMessage && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-medium">Error:</p>
              <p className="break-all">{errorMessage}</p>
            </div>
          )}
          
          <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Generated"
                className="w-full h-full object-contain"
              />
            ) : isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-slate-400 mb-2" />
                <span className="text-slate-500">Generating...</span>
              </div>
            ) : (
              <div className="text-slate-400 flex flex-col items-center">
                <ImageIcon className="h-12 w-12 mb-2" />
                <span>Generated image will appear here</span>
              </div>
            )}
          </div>
          
          <div className="bg-slate-800 rounded-lg p-4 overflow-auto max-h-[300px]">
            <h3 className="text-white mb-2 font-semibold">Generation Logs</h3>
            {generationLogs.length > 0 ? (
              <div className="space-y-1">
                {generationLogs.map((log, index) => (
                  <p key={index} className="text-sm font-mono text-slate-300">
                    {log}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No logs yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageGenerationTest;
