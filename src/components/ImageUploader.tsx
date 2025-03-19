
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fal } from "@fal-ai/client";

interface ImageUploaderProps {
  imagePreview: string;
  setImagePreview: (url: string) => void;
  setImageUrl: (url: string) => void;
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;
}

const ImageUploader = ({
  imagePreview,
  setImagePreview,
  setImageUrl,
  isUploading,
  setIsUploading
}: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreview(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      const uploadedUrl = await fal.storage.upload(file);
      setImageUrl(uploadedUrl);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <Label>Upload Image</Label>
      <div 
        className="border-2 border-dashed border-slate-200 rounded-lg p-4 mt-1 cursor-pointer text-center hover:bg-slate-50 transition-colors"
        onClick={triggerFileInput}
      >
        <Input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {imagePreview ? (
          <div className="relative">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-40 object-contain mx-auto" 
            />
            <div className="absolute top-0 right-0 bg-white rounded-full p-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <Upload className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500">
              {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
