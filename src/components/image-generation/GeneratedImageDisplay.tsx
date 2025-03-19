
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, Loader2 } from "lucide-react";

interface GeneratedImageDisplayProps {
  imageUrl: string | null;
  isLoading: boolean;
  isUploading: boolean;
  onUseImage: () => void;
  onDownload: () => void;
}

export const GeneratedImageDisplay = ({
  imageUrl,
  isLoading,
  isUploading,
  onUseImage,
  onDownload
}: GeneratedImageDisplayProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Generated Image</h2>
      <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center mb-4 overflow-hidden">
        {imageUrl ? (
          <div className="relative w-full h-full">
            <img
              src={imageUrl}
              alt="Generated"
              className="w-full h-full object-contain"
            />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
                <span className="ml-2 text-white">Storing...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-slate-400 flex flex-col items-center">
            <ImageIcon className="h-12 w-12 mb-2" />
            <span>Your image will appear here</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button 
          onClick={onUseImage}
          disabled={!imageUrl || isLoading || isUploading} 
          className="flex-1"
        >
          Use This Image
        </Button>
        <Button 
          variant="outline" 
          onClick={onDownload}
          disabled={!imageUrl || isLoading || isUploading}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs text-slate-500 mt-2 text-center">
        Stored in your personal cloud storage
      </p>
    </div>
  );
};
