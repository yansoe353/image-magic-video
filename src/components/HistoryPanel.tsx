import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Image, Video, Calendar, Clock, Download, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";

interface ContentHistoryItem {
  id: string;
  content_type: 'image' | 'video';
  content_url: string;
  prompt?: string;
  created_at: string;
  metadata?: any;
}

interface HistoryPanelProps {
  onSelectContent?: (url: string, type: 'image' | 'video') => void;
}

const HistoryPanel = ({ onSelectContent }: HistoryPanelProps) => {
  const [activeTab, setActiveTab] = useState<'all' | 'image' | 'video'>('all');
  const [items, setItems] = useState<ContentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  
  const itemsPerPage = 12;

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('user_content_history')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);
      
      if (activeTab !== 'all') {
        query = query.eq('content_type', activeTab);
      }
      
      const { data, count, error } = await query;
      
      if (error) throw error;
      
      setItems(data as ContentHistoryItem[]);
      
      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError("Failed to load history. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load content history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [activeTab, currentPage]);

  const handleDownload = (url: string, contentType: 'image' | 'video') => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `generated-${contentType}-${Date.now()}.${contentType === 'image' ? 'png' : 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectContent = (url: string, contentType: 'image' | 'video') => {
    if (onSelectContent) {
      onSelectContent(url, contentType);
      toast({
        title: "Content Selected",
        description: `The ${contentType} has been selected for use.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Content History</h2>
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex justify-center mb-4">
            {activeTab === 'video' ? (
              <Video className="h-12 w-12 text-slate-400" />
            ) : (
              <Image className="h-12 w-12 text-slate-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-slate-700">No content found</h3>
          <p className="text-slate-500 mt-2">
            {activeTab === 'all' 
              ? "You haven't generated any content yet."
              : `You haven't generated any ${activeTab}s yet.`}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="aspect-square bg-slate-100 relative">
                  {item.content_type === 'image' ? (
                    <img 
                      src={item.content_url} 
                      alt={item.prompt || "Generated image"} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video 
                      src={item.content_url}
                      className="w-full h-full object-cover"
                      muted
                      onMouseOver={(e) => e.currentTarget.play()}
                      onMouseOut={(e) => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1">
                    {item.content_type === 'image' ? (
                      <Image className="h-4 w-4" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="text-xs text-slate-500 flex items-center mb-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className="mx-1">•</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                  </div>
                  {item.prompt && (
                    <p className="text-xs text-slate-700 line-clamp-2 mb-2">{item.prompt}</p>
                  )}
                  <div className="flex gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleSelectContent(item.content_url, item.content_type)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownload(item.content_url, item.content_type)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                  {item.content_url.includes('supabase') && (
                    <p className="text-xs text-slate-500 mt-1 text-center">
                      Stored in your cloud
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  {currentPage === 1 ? (
                    <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                      <span className="sr-only">Go to previous page</span>
                      &lt;
                    </Button>
                  ) : (
                    <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} />
                  )}
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => {
                    if (index > 0 && page > array[index - 1] + 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="flex h-9 w-9 items-center justify-center">...</span>
                        </PaginationItem>
                      );
                    }
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === currentPage}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                
                <PaginationItem>
                  {currentPage === totalPages ? (
                    <Button variant="outline" size="icon" disabled className="cursor-not-allowed">
                      <span className="sr-only">Go to next page</span>
                      &gt;
                    </Button>
                  ) : (
                    <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} />
                  )}
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPanel;
