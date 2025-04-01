
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPublicGallery } from "@/utils/storageUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Image, Video, ArrowRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface GalleryItem {
  id: string;
  content_type: "image" | "video";
  content_url: string;
  prompt: string;
  created_at: string;
  metadata?: Record<string, any>;
}

const PublicGallery = () => {
  const [activeTab, setActiveTab] = useState<"all" | "images" | "videos">("all");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadGallery = async () => {
      setIsLoading(true);
      try {
        const contentType = activeTab === "images" ? "image" : activeTab === "videos" ? "video" : undefined;
        const items = await fetchPublicGallery(contentType as "image" | "video" | undefined);
        setGalleryItems(items);
      } catch (error) {
        console.error("Error loading gallery:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGallery();
  }, [activeTab]);

  const handleUsePrompt = (item: GalleryItem) => {
    navigate("/create", { 
      state: { 
        prompt: item.prompt,
        selectedContent: {
          url: item.content_url,
          type: item.content_type
        }
      } 
    });
  };

  return (
    <section className="py-16 px-4 bg-slate-800">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
            Public Gallery
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Explore content created by our community
          </p>
        </div>

        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "all" | "images" | "videos")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-purple"></div>
              </div>
            ) : galleryItems.length === 0 ? (
              <div className="text-center py-12 bg-slate-700/30 rounded-lg">
                <p className="text-xl text-slate-300">No content available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden bg-slate-800/50 border border-slate-700/50 hover:shadow-lg hover:shadow-brand-purple/10 transition-all">
                    <div className="aspect-square bg-black/50 relative group overflow-hidden">
                      {item.content_type === "image" ? (
                        <img 
                          src={item.content_url} 
                          alt={item.prompt} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video 
                            src={item.content_url} 
                            className="w-full h-full object-cover"
                            muted
                            loop
                            onMouseOver={(e) => e.currentTarget.play()}
                            onMouseOut={(e) => {
                              e.currentTarget.pause();
                              e.currentTarget.currentTime = 0;
                            }}
                          ></video>
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <Play className="w-12 h-12 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        {item.content_type === "image" ? (
                          <Image className="w-5 h-5 text-white/70" />
                        ) : (
                          <Video className="w-5 h-5 text-white/70" />
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-white line-clamp-2 h-10 mb-2">{item.prompt}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-2 text-xs"
                        onClick={() => handleUsePrompt(item)}
                      >
                        Use this {item.content_type === "image" ? "image" : "video"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center mt-10">
          <Button
            onClick={() => navigate("/create")}
            className="bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 transition-opacity"
          >
            Create Your Own <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PublicGallery;
