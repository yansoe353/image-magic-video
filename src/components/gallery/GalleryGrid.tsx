
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Image as ImageIcon, Film } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface GalleryItem {
  id: string;
  content_type: string;
  content_url: string;
  prompt: string;
  created_at: string;
  is_public?: boolean;
}

// Define ContentType as a literal type instead of string to avoid recursive type issues
type ContentType = "all" | "image" | "video";

export const GalleryGrid = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Explicitly type the state value to prevent deep type recursion
  const [activeTab, setActiveTab] = useState<ContentType>("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchPublicContent = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('user_content_history')
          .select('*');
        
        // Always filter for public content regardless of other filters
        query = query.eq('is_public', true);
        
        if (activeTab !== "all") {
          query = query.eq('content_type', activeTab);
        }
        
        // Add sorting to get the latest content
        query = query.order('created_at', { ascending: false });
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error details:", error);
          throw error;
        }
        
        console.log("Fetched gallery items:", data ? data.length : 0);
        setGalleryItems(data || []);
      } catch (error) {
        console.error("Error fetching gallery items:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicContent();
  }, [activeTab]);

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  // Format date to more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ContentType)}>
        <TabsList className="w-full max-w-md mx-auto bg-slate-800/50">
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          <TabsTrigger value="image" className="flex-1">Images</TabsTrigger>
          <TabsTrigger value="video" className="flex-1">Videos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="image" className="mt-6">
          {renderContent()}
        </TabsContent>
        
        <TabsContent value="video" className="mt-6">
          {renderContent()}
        </TabsContent>
      </Tabs>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          {selectedItem && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-lg">
                {selectedItem.content_type === 'image' ? (
                  <img 
                    src={selectedItem.content_url} 
                    alt={selectedItem.prompt || 'Gallery image'} 
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <video 
                    src={selectedItem.content_url} 
                    controls 
                    className="w-full h-auto rounded-lg"
                  />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Prompt</h3>
                <p className="text-slate-300">{selectedItem.prompt}</p>
                <p className="text-xs text-slate-500">Created: {formatDate(selectedItem.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderContent() {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      );
    }

    if (galleryItems.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-slate-400">No public {activeTab !== "all" ? activeTab + "s" : "content"} found.</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {galleryItems.map((item) => (
          <Card 
            key={item.id} 
            className="overflow-hidden cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="p-0">
              <div className="relative">
                <AspectRatio ratio={1}>
                  {item.content_type === 'image' ? (
                    <img 
                      src={item.content_url} 
                      alt={item.prompt || 'Gallery image'}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center relative">
                      <video 
                        src={item.content_url}
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Film className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  )}
                </AspectRatio>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                  <div className="flex items-center text-xs text-white">
                    {item.content_type === 'image' ? 
                      <ImageIcon className="h-3 w-3 mr-1" /> : 
                      <Film className="h-3 w-3 mr-1" />
                    }
                    <span className="capitalize">{item.content_type}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};
