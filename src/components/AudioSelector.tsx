
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Music, Upload, X, Play, Pause } from "lucide-react";
import { type AudioTrack } from "@/hooks/useVideoEditor";

interface AudioSelectorProps {
  audioTrack: AudioTrack | null;
  onSetAudio: (audio: AudioTrack | null) => void;
}

const AudioSelector = ({ audioTrack, onSetAudio }: AudioSelectorProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) return;
    
    setIsUploading(true);
    
    try {
      // In a real implementation, you would upload the file to a server
      // For this demo, we'll create a local URL
      const audioUrl = URL.createObjectURL(audioFile);
      
      onSetAudio({
        id: Date.now().toString(),
        url: audioUrl,
        name: audioFile.name
      });
      
      setAudioFile(null);
    } catch (error) {
      console.error("Failed to process audio:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleRemove = () => {
    onSetAudio(null);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Audio Track</h3>
      
      {audioTrack ? (
        <Card className="p-3 flex items-center">
          <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
            <Music className="h-5 w-5 text-indigo-600" />
          </div>
          
          <div className="flex-grow">
            <h4 className="font-medium text-sm truncate">{audioTrack.name}</h4>
          </div>
          
          <div className="flex-shrink-0 flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePlayPause}
              className="h-8 w-8"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRemove}
              className="h-8 w-8 text-red-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {isPlaying && (
            <audio 
              src={audioTrack.url} 
              autoPlay 
              onEnded={() => setIsPlaying(false)} 
              className="hidden"
            />
          )}
        </Card>
      ) : (
        <div className="space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="audio-file" className="mb-2 block text-sm">Select audio file</Label>
              <Input 
                id="audio-file" 
                type="file" 
                accept="audio/*" 
                onChange={handleFileChange}
                className="text-sm"
              />
            </div>
            <Button 
              onClick={handleUpload} 
              disabled={!audioFile || isUploading}
              className="flex items-center"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
          
          {audioFile && (
            <p className="text-xs text-gray-500">
              Selected: {audioFile.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AudioSelector;
