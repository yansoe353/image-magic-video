
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImage from "@/components/TextToImage";
import ImageToVideo from "@/components/ImageToVideo";
import Header from "@/components/Header";
import { getRemainingCounts, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("text-to-image");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [usageCounts, setUsageCounts] = useState({ remainingImages: 0, remainingVideos: 0 });

  useEffect(() => {
    // Initialize component
    const initialize = async () => {
      // Check if API key is set
      const storedApiKey = localStorage.getItem("falApiKey");
      setHasApiKey(!!storedApiKey);
      
      // Get current usage counts
      const counts = await getRemainingCounts();
      setUsageCounts(counts);
    };
    
    initialize();
    
    // Set up interval to refresh usage counts
    const interval = setInterval(async () => {
      const freshCounts = await getRemainingCounts();
      setUsageCounts(freshCounts);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImageUrl(imageUrl);
    setActiveTab("image-to-video");
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
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
            <TabsTrigger value="image-to-video">Image to Video</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text-to-image" className="mt-0">
            <TextToImage onImageGenerated={handleImageGenerated} />
          </TabsContent>
          
          <TabsContent value="image-to-video" className="mt-0">
            <ImageToVideo initialImageUrl={generatedImageUrl} />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="container text-center text-slate-500 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
