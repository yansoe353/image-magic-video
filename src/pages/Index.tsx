
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImage from "@/components/TextToImage";
import ImageToVideo from "@/components/ImageToVideo";
import StoryToVideo from "@/components/StoryToVideo";
import RunwayImageToVideo from "@/components/RunwayImageToVideo";
import Header from "@/components/Header";
import { getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIAssistant } from "@/components/AIAssistant";

interface SelectedContent {
  url: string;
  type: 'image' | 'video';
}

const Index = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<string>("text-to-image");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [usageCounts, setUsageCounts] = useState(getRemainingCounts());
  const isMobile = useIsMobile();

  useEffect(() => {
    const initialize = async () => {
      setHasApiKey(true);
      
      const counts = await getRemainingCountsAsync();
      setUsageCounts(counts);
      
      const selectedContent = location.state?.selectedContent as SelectedContent | undefined;
      if (selectedContent) {
        if (selectedContent.type === 'image') {
          setGeneratedImageUrl(selectedContent.url);
          setActiveTab("image-to-video");
        } else if (selectedContent.type === 'video') {
          setGeneratedVideoUrl(selectedContent.url);
          setActiveTab("video-editor");
        }
      }
    };
    
    initialize();
    
    const interval = setInterval(async () => {
      const freshCounts = await getRemainingCountsAsync();
      setUsageCounts(freshCounts);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [location]);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl);
    setActiveTab("image-to-video");
  };

  const handleVideoGenerated = (videoUrl: string) => {
    setGeneratedVideoUrl(videoUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6 mt-16">
        <section className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gradient mb-4">
            AI Video Creator
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Transform your ideas into stunning videos with our AI-powered tools. Generate images from text, then convert them into captivating videos.
          </p>
          
          {!hasApiKey && (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-yellow-200 text-sm glass-morphism">
              Please set your Infinity API key using the button in the header to enable image and video generation.
            </div>
          )}
          
          {hasApiKey && (
            <div className="mt-4 flex flex-wrap justify-center gap-4 md:gap-8 text-sm">
              <div className="px-4 py-2 bg-blue-900/20 border border-blue-700/30 rounded-md text-blue-200 neo-blur">
                <span className="font-medium">Images:</span> {usageCounts.remainingImages}/{IMAGE_LIMIT} remaining
              </div>
              <div className="px-4 py-2 bg-purple-900/20 border border-purple-700/30 rounded-md text-purple-200 neo-blur">
                <span className="font-medium">Videos:</span> {usageCounts.remainingVideos}/{VIDEO_LIMIT} remaining
              </div>
            </div>
          )}
        </section>

        <Tabs 
          value={activeTab} 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-1 mb-8 bg-slate-800/70 p-1 backdrop-blur-md rounded-xl overflow-x-auto">
            <TabsTrigger 
              value="text-to-image" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Text→Image" : "Text to Image"}
            </TabsTrigger>
            <TabsTrigger 
              value="image-to-video" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Image→Video" : "Image to Video"}
            </TabsTrigger>
            <TabsTrigger 
              value="runway-video" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Runway Video" : "Runway Video"}
            </TabsTrigger>
            <TabsTrigger 
              value="story-to-video" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Story→Video" : "Story to Video"}
            </TabsTrigger>
            <TabsTrigger 
              value="video-editor" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Merge Videos" : "Video Merger"}
            </TabsTrigger>
            <TabsTrigger 
              value="image-playground" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Image Play" : "Image Playground"}
            </TabsTrigger>
            <TabsTrigger 
              value="video-playground" 
              className="text-xs md:text-sm py-1.5 px-1 md:px-3 data-[state=active]:bg-gradient-to-b data-[state=active]:from-brand-purple data-[state=active]:to-brand-blue data-[state=active]:text-white"
            >
              {isMobile ? "Video Play" : "Video Playground"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="text-to-image" className="mt-0">
            <TextToImage onImageGenerated={handleImageGenerated} />
          </TabsContent>
          
          <TabsContent value="image-to-video" className="mt-0">
            <ImageToVideo 
              initialImageUrl={generatedImageUrl}
              onVideoGenerated={handleVideoGenerated}
              onSwitchToEditor={() => setActiveTab("video-editor")}
            />
          </TabsContent>

          <TabsContent value="runway-video" className="mt-0">
            <RunwayImageToVideo />
          </TabsContent>
          
          <TabsContent value="story-to-video" className="mt-0">
            <StoryToVideo />
          </TabsContent>
          
          <TabsContent value="video-editor" className="mt-0">
            <Card className="border-0 shadow-lg glass-morphism overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full overflow-hidden rounded-lg">
                  <div className={isMobile ? "h-[500px]" : "h-[700px]"}>
                    <iframe
                      src="https://ezgif.com/merge-videos"
                      title="Video Merger"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="image-playground" className="mt-0">
            <Card className="border-0 shadow-lg glass-morphism overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full overflow-hidden rounded-lg">
                  <div className={isMobile ? "h-[500px]" : "h-[700px]"}>
                    <iframe
                      src="https://waloneai-zerocodewl.hf.space"
                      title="Image Playground"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="video-playground" className="mt-0">
            <Card className="border-0 shadow-lg glass-morphism overflow-hidden">
              <CardContent className="p-0">
                <div className="w-full overflow-hidden rounded-lg">
                  <div className={isMobile ? "h-[500px]" : "h-[700px]"}>
                    <iframe
                      src="https://alibaba-pai-easyanimate.hf.space"
                      title="Video Playground"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-6 border-t border-slate-700/50 bg-slate-900/70 backdrop-blur-sm">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
      
      <AIAssistant />
    </div>
  );
};

export default Index;
