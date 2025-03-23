
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImage from "@/components/TextToImage";
import ImageToVideo from "@/components/ImageToVideo";
import Header from "@/components/Header";
import { getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIAssistant } from "@/components/AIAssistant";
import VideoEditor from "@/components/VideoEditor";

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6 mt-16">
        <section className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue mb-4">
            AI Video Creator
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Transform your ideas into stunning videos with our AI-powered tools. Generate images from text, then convert them into captivating videos.
          </p>
          
          {!hasApiKey && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-sm">
              Please set your Infinity API key using the button in the header to enable image and video generation.
            </div>
          )}
          
          {hasApiKey && (
            <div className="mt-4 flex justify-center gap-8 text-sm">
              <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-md">
                <span className="font-medium">Images:</span> {usageCounts.remainingImages}/{IMAGE_LIMIT} remaining
              </div>
              <div className="px-4 py-2 bg-purple-50 border border-purple-100 rounded-md">
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
          <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-1' : 'grid-cols-5'} mb-8`}>
            <TabsTrigger value="text-to-image" className={`${isMobile ? 'text-xs py-1 px-1' : ''}`}>
              {isMobile ? "Text→Image" : "Text to Image"}
            </TabsTrigger>
            <TabsTrigger value="image-to-video" className={`${isMobile ? 'text-xs py-1 px-1' : ''}`}>
              {isMobile ? "Image→Video" : "Image to Video"}
            </TabsTrigger>
            <TabsTrigger value="video-editor" className={`${isMobile ? 'text-xs py-1 px-1' : ''}`}>
              {isMobile ? "Video Edit" : "Video Editor"}
            </TabsTrigger>
            <TabsTrigger value="image-playground" className={`${isMobile ? 'text-xs py-1 px-1' : ''}`}>
              {isMobile ? "Image Play" : "Image Playground"}
            </TabsTrigger>
            <TabsTrigger value="video-playground" className={`${isMobile ? 'text-xs py-1 px-1' : ''}`}>
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
            />
          </TabsContent>
          
          <TabsContent value="video-editor" className="mt-0">
            <VideoEditor generatedVideoUrl={generatedVideoUrl} />
          </TabsContent>
          
          <TabsContent value="image-playground" className="mt-0">
            <Card className="border-0 shadow-lg">
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
            <Card className="border-0 shadow-lg">
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
      
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="container text-center text-slate-500 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
      
      {/* AI Assistant - only shown on the create page */}
      <AIAssistant />
    </div>
  );
};

export default Index;
