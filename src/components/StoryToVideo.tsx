import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ImageIcon, BookText, Film, Sparkles, User, Download } from "lucide-react";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { incrementImageCount, incrementVideoCount, getRemainingCountsAsync } from "@/utils/usageTracker";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { PublicPrivateToggle } from "./image-generation/PublicPrivateToggle";
import { fal } from "@fal-ai/client";
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface StoryScene {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  videoUrl?: string;
}

interface CharacterDetails {
  mainCharacter?: string;
  secondaryCharacters?: string;
  environment?: string;
  styleNotes?: string;
}

const StoryToVideo = () => {
  const [storyPrompt, setStoryPrompt] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [generatedStory, setGeneratedStory] = useState<StoryScene[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [currentGeneratingIndex, setCurrentGeneratingIndex] = useState<number | null>(null);
  const [counts, setCounts] = useState({ remainingImages: 0, remainingVideos: 0 });
  const [sceneCount, setSceneCount] = useState("3");
  const [imageStyle, setImageStyle] = useState("photorealism");
  const [editMode, setEditMode] = useState(false);
  const [editedStory, setEditedStory] = useState<StoryScene[]>([]);
  const [characterDetails, setCharacterDetails] = useState<CharacterDetails>({});
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [generationLogs, setGenerationLogs] = useState<string[]>([]);
  const [isCombiningVideos, setIsCombiningVideos] = useState(false);
  const [combinedVideoUrl, setCombinedVideoUrl] = useState<string | null>(null);
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false);

  const ffmpegRef = useRef(new FFmpeg());
  const { generateResponse, isLoading: isGeminiLoading } = useGeminiAPI();
  const { toast } = useToast();

  useEffect(() => {
    const loadFfmpeg = async () => {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.2/dist/umd';
      const ffmpeg = ffmpegRef.current;
      
      ffmpeg.on('log', ({ message }) => {
        setGenerationLogs(prev => [...prev, message]);
      });

      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        setFfmpegLoaded(true);
      } catch (error) {
        console.error('FFmpeg loading error:', error);
        toast({
          title: "Error",
          description: "Failed to load video processor",
          variant: "destructive"
        });
      }
    };

    const fetchCounts = async () => {
      const freshCounts = await getRemainingCountsAsync();
      setCounts(freshCounts);
    };

    fetchCounts();
    loadFfmpeg();
  }, [toast]);

  const combineVideos = async () => {
    if (generatedStory.some(scene => !scene.videoUrl)) {
      toast({
        title: "Error",
        description: "Please generate videos for all scenes first",
        variant: "destructive"
      });
      return;
    }

    if (!ffmpegLoaded) {
      toast({
        title: "Error",
        description: "Video processor is still loading",
        variant: "destructive"
      });
      return;
    }

    setIsCombiningVideos(true);
    setGenerationLogs(prev => [...prev, "Starting video combination..."]);

    try {
      const ffmpeg = ffmpegRef.current;
      
      // Write all input videos to FFmpeg's virtual file system
      for (let i = 0; i < generatedStory.length; i++) {
        const scene = generatedStory[i];
        if (scene.videoUrl) {
          setGenerationLogs(prev => [...prev, `Downloading scene ${i + 1} video...`]);
          const data = await fetchFile(scene.videoUrl);
          await ffmpeg.writeFile(`input${i}.mp4`, data);
        }
      }

      // Create concat file
      const concatContent = Array.from({ length: generatedStory.length }, (_, i) => 
        `file 'input${i}.mp4'`
      ).join('\n');
      await ffmpeg.writeFile('concat.txt', concatContent);

      // Run FFmpeg command
      setGenerationLogs(prev => [...prev, "Combining videos..."]);
      await ffmpeg.exec([
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat.txt',
        '-c', 'copy',
        'output.mp4'
      ]);

      // Read the result
      const data = await ffmpeg.readFile('output.mp4');
      const blob = new Blob([data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      setCombinedVideoUrl(url);

      // Upload to Supabase Storage
      const userId = await getUserId();
      if (userId) {
        setGenerationLogs(prev => [...prev, "Uploading combined video..."]);
        const fileName = `combined-${Date.now()}.mp4`;
        const { error } = await supabase.storage
          .from('user-videos')
          .upload(fileName, blob);

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('user-videos')
            .getPublicUrl(fileName);

          await supabase.from('user_content_history').insert({
            user_id: userId,
            content_type: 'combined-video',
            content_url: publicUrl,
            is_public: isPublic,
            metadata: {
              story_title: storyTitle,
              story_prompt: storyPrompt,
              scenes: generatedStory.map(scene => ({
                text: scene.text,
                imagePrompt: scene.imagePrompt
              }))
            }
          });
        }
      }

      toast({
        title: "Success",
        description: "Videos combined successfully!",
      });
    } catch (error) {
      console.error("Video combination failed:", error);
      setGenerationLogs(prev => [...prev, `Error: ${error.message}`]);
      toast({
        title: "Error",
        description: "Failed to combine videos",
        variant: "destructive"
      });
    } finally {
      setIsCombiningVideos(false);
    }
  };

  // ... (Keep all your existing functions like generateCharacterTemplate, cleanJsonResponse, 
  // parseStoryResponse, generateStory, attemptFallbackStoryGeneration, generateImageForScene, 
  // generateVideoForScene exactly the same as in your original code)

  const CharacterDetailsForm = () => (
    <Card className="mt-4">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-bold flex items-center">
          <User className="mr-2 h-5 w-5" />
          Character Details
        </h3>
        
        <div>
          <Label>Main Character</Label>
          <Textarea
            value={characterDetails.mainCharacter || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, mainCharacter: e.target.value})}
            placeholder="Detailed description of main character (appearance, clothing, etc.)"
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label>Secondary Characters</Label>
          <Textarea
            value={characterDetails.secondaryCharacters || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, secondaryCharacters: e.target.value})}
            placeholder="Descriptions of other important characters"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label>Environment</Label>
          <Textarea
            value={characterDetails.environment || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, environment: e.target.value})}
            placeholder="Description of the main setting/environment"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label>Style Notes</Label>
          <Textarea
            value={characterDetails.styleNotes || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, styleNotes: e.target.value})}
            placeholder="Any specific visual style requirements"
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCharacterForm(false)}
            variant="outline"
          >
            Done
          </Button>
          <Button 
            onClick={generateCharacterTemplate}
            disabled={!storyPrompt || isGeneratingStory}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Generate Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderSceneTabs = () => {
    return generatedStory.map((_, index) => (
      <TabsTrigger key={index} value={index.toString()}>Scene {index + 1}</TabsTrigger>
    ));
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <BookText className="mr-2 h-6 w-6" />
            Story to Video Generator
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="storyPrompt">Story Prompt</Label>
              <Textarea
                id="storyPrompt"
                placeholder="Enter a story idea like 'A detective in a cyberpunk city investigates a strange case'"
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                className="min-h-[80px]"
                disabled={isGeneratingStory}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Character Consistency</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCharacterForm(!showCharacterForm)}
                >
                  {showCharacterForm ? "Hide Details" : "Add Character Details"}
                </Button>
              </div>
              {showCharacterForm && <CharacterDetailsForm />}
            </div>

            <div>
              <Label htmlFor="sceneCount">Number of Scenes</Label>
              <Select
                value={sceneCount}
                onValueChange={setSceneCount}
                disabled={isGeneratingStory}
              >
                <SelectTrigger className="w-full" id="sceneCount">
                  <SelectValue placeholder="Select number of scenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Scenes</SelectItem>
                  <SelectItem value="3">3 Scenes</SelectItem>
                  <SelectItem value="4">4 Scenes</SelectItem>
                  <SelectItem value="5">5 Scenes</SelectItem>
                  <SelectItem value="6">6 Scenes</SelectItem>
                  <SelectItem value="7">7 Scenes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="imageStyle">Image Style</Label>
              <Select
                value={imageStyle}
                onValueChange={setImageStyle}
                disabled={isGeneratingStory}
              >
                <SelectTrigger className="w-full" id="imageStyle">
                  <SelectValue placeholder="Select image style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="photorealism">Photorealism</SelectItem>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="fantasy">Fantasy Art</SelectItem>
                  <SelectItem value="comic">Comic Book</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <PublicPrivateToggle
              isPublic={isPublic}
              onChange={setIsPublic}
              disabled={isGeneratingStory}
            />

            <Button
              onClick={generateStory}
              disabled={isGeneratingStory || !storyPrompt || isGeminiLoading}
              className="w-full"
            >
              {isGeneratingStory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Story...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Story
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedStory.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">{storyTitle}</h2>

            <Button
              onClick={() => setEditMode(!editMode)}
              disabled={isGeneratingStory}
              className="w-full mt-4"
              variant={editMode ? "default" : "outline"}
            >
              {editMode ? "Cancel Editing" : "Edit Story"}
            </Button>

            {editMode ? (
              <div className="space-y-4 mt-4">
                {editedStory.map((scene, index) => (
                  <div key={index} className="space-y-2">
                    <Label>Scene {index + 1} Text</Label>
                    <Textarea
                      value={scene.text}
                      onChange={(e) => {
                        const updated = [...editedStory];
                        updated[index] = { ...updated[index], text: e.target.value };
                        setEditedStory(updated);
                      }}
                      className="min-h-[120px]"
                    />
                    <Label>Scene {index + 1} Image Prompt</Label>
                    <Textarea
                      value={scene.imagePrompt}
                      onChange={(e) => {
                        const updated = [...editedStory];
                        updated[index] = { ...updated[index], imagePrompt: e.target.value };
                        setEditedStory(updated);
                      }}
                      className="min-h-[120px]"
                    />
                  </div>
                ))}
                <Button
                  onClick={() => {
                    setGeneratedStory(editedStory);
                    setEditMode(false);
                    toast({
                      title: "Saved",
                      description: "Your story edits have been saved",
                    });
                  }}
                  className="w-full"
                >
                  Save Changes
                </Button>
              </div>
            ) : (
              <>
                <Tabs defaultValue="0" className="w-full mt-4">
                  <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${generatedStory.length}, 1fr)` }}>
                    {renderSceneTabs()}
                  </TabsList>

                  {generatedStory.map((scene, index) => (
                    <TabsContent key={index} value={index.toString()} className="space-y-4">
                      <div className="p-4 bg-slate-800/50 rounded-md">
                        <p className="text-slate-200">{scene.text}</p>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label className="mb-2 block">Scene Image</Label>
                          <div className="relative aspect-square rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                            {scene.imageUrl ? (
                              <img
                                src={scene.imageUrl}
                                alt={`Scene ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ImageIcon className="h-16 w-16 text-slate-600" />
                              </div>
                            )}
                            {currentGeneratingIndex === index && !scene.imageUrl && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => generateImageForScene(index)}
                            disabled={currentGeneratingIndex !== null || counts.remainingImages <= 0}
                            className="mt-2 w-full"
                            variant="outline"
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate Image ({counts.remainingImages} remaining)
                          </Button>
                        </div>

                        <div>
                          <Label className="mb-2 block">Scene Video</Label>
                          <div className="relative aspect-square rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                            {scene.videoUrl ? (
                              <video
                                src={scene.videoUrl}
                                controls
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Film className="h-16 w-16 text-slate-600" />
                              </div>
                            )}
                            {currentGeneratingIndex === index && scene.imageUrl && !scene.videoUrl && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                              </div>
                            )}
                          </div>

                          <Button
                            onClick={() => generateVideoForScene(index)}
                            disabled={currentGeneratingIndex !== null || !scene.imageUrl || counts.remainingVideos <= 0}
                            className="mt-2 w-full"
                            variant={scene.imageUrl ? "default" : "outline"}
                          >
                            <Film className="mr-2 h-4 w-4" />
                            Generate Video ({counts.remainingVideos} remaining)
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Final Combined Video</h3>
                  
                  <div className="relative aspect-video rounded-md overflow-hidden bg-slate-800/50 border border-slate-700/50">
                    {combinedVideoUrl ? (
                      <video
                        src={combinedVideoUrl}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
                        <Film className="h-16 w-16 text-slate-600" />
                        <p className="text-center text-slate-400">
                          {isCombiningVideos 
                            ? "Combining your scenes..." 
                            : "Combine all scenes into one video"}
                        </p>
                      </div>
                    )}
                    {isCombiningVideos && !combinedVideoUrl && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-brand-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={combineVideos}
                      disabled={isCombiningVideos || !ffmpegLoaded || generatedStory.some(scene => !scene.videoUrl)}
                      className="flex-1"
                    >
                      {isCombiningVideos ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Combining...
                        </>
                      ) : (
                        <>
                          <Film className="mr-2 h-4 w-4" />
                          Combine All Videos
                        </>
                      )}
                    </Button>
                    
                    {combinedVideoUrl && (
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                      >
                        <a 
                          href={combinedVideoUrl} 
                          download={`${storyTitle.replace(/\s+/g, '-')}-combined.mp4`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </Button>
                    )}
                  </div>

                  {generationLogs.length > 0 && (
                    <div className="mt-4 p-4 bg-slate-800/50 rounded-md max-h-40 overflow-y-auto">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold">Processing Logs</h4>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setGenerationLogs([])}
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="font-mono text-xs space-y-1">
                        {generationLogs.map((log, index) => (
                          <div key={index} className="text-slate-300 break-all">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StoryToVideo;
