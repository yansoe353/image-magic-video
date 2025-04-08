import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getRemainingCounts, STORY_IMAGE_COST, STORY_VIDEO_COST, deductImageCredit, deductVideoCredit } from "@/utils/usageTracker";
import { UsageLimits } from "./image-generation/UsageLimits";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Additional imports would be here

const StoryToVideo = () => {
  const [story, setStory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("create");
  const { toast } = useToast();
  const [counts, setCounts] = useState<{remainingImages: number; remainingVideos: number}>({remainingImages: 0, remainingVideos: 0});

  useEffect(() => {
    const updateCounts = async () => {
      const freshCounts = await getRemainingCounts();
      setCounts(freshCounts);
    };
    updateCounts();
  }, []);

  // This is a placeholder for the actual implementation
  const generateVideoFromStory = async () => {
    if (!story.trim()) {
      toast({
        title: "Error",
        description: "Please enter a story first",
        variant: "destructive",
      });
      return;
    }

    // Check if user has enough credits
    if (counts.remainingImages < STORY_IMAGE_COST || counts.remainingVideos < STORY_VIDEO_COST) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 image credit and 1 video credit to generate a story video.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Placeholder for actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Deduct credits after successful generation
      await deductImageCredit(STORY_IMAGE_COST);
      await deductVideoCredit(STORY_VIDEO_COST);
      
      // Update counts
      const freshCounts = await getRemainingCounts();
      setCounts(freshCounts);
      
      toast({
        title: "Success",
        description: "Story video would be generated here (placeholder).",
      });
    } catch (error) {
      console.error("Failed to generate story video:", error);
      toast({
        title: "Error",
        description: "Failed to generate story video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid gap-8">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Story to Video</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <Label htmlFor="story">Your Story</Label>
                    <span className="text-xs text-slate-500">
                      {story.length} / 1000
                    </span>
                  </div>
                  <Textarea
                    id="story"
                    placeholder="Once upon a time..."
                    value={story}
                    onChange={(e) => setStory(e.target.value)}
                    className="min-h-[200px] mt-2"
                    disabled={isGenerating}
                    maxLength={1000}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="style">Visual Style</Label>
                    <Select disabled={isGenerating}>
                      <SelectTrigger id="style">
                        <SelectValue placeholder="Choose a style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realistic">Realistic</SelectItem>
                        <SelectItem value="anime">Anime/Cartoon</SelectItem>
                        <SelectItem value="watercolor">Watercolor</SelectItem>
                        <SelectItem value="3d">3D Animation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="length">Video Length</Label>
                    <Select disabled={isGenerating}>
                      <SelectTrigger id="length">
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short (15s)</SelectItem>
                        <SelectItem value="medium">Medium (30s)</SelectItem>
                        <SelectItem value="long">Long (60s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="musicType">Background Music</Label>
                  <Select disabled={isGenerating}>
                    <SelectTrigger id="musicType">
                      <SelectValue placeholder="Select music type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="romance">Romance</SelectItem>
                      <SelectItem value="suspense">Suspense</SelectItem>
                      <SelectItem value="comedy">Comedy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <UsageLimits 
                  remainingCredits={Math.min(counts.remainingImages, counts.remainingVideos)} 
                  creditType="story" 
                />
                
                <Button
                  onClick={generateVideoFromStory}
                  disabled={isGenerating || !story.trim() || counts.remainingImages < STORY_IMAGE_COST || counts.remainingVideos < STORY_VIDEO_COST}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Story Video...
                    </>
                  ) : (
                    "Generate Story Video"
                  )}
                </Button>
                
                <p className="text-xs text-slate-500 text-center">
                  This will use {STORY_IMAGE_COST} image credit and {STORY_VIDEO_COST} video credit
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <p className="text-center text-slate-500 py-10">
                Your generated story videos will appear here
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">Preview</h2>
          <div className="aspect-video bg-slate-800 rounded-lg flex items-center justify-center">
            <p className="text-slate-400">Story video preview will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoryToVideo;
