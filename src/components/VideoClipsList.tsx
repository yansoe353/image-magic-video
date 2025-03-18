
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Move, Play, Pause } from "lucide-react";
import { type VideoClip } from "@/hooks/useVideoEditor";

interface VideoClipsListProps {
  clips: VideoClip[];
  onRemoveClip: (clipId: string) => void;
  onReorderClips: (startIndex: number, endIndex: number) => void;
}

const VideoClipsList = ({ clips, onRemoveClip, onReorderClips }: VideoClipsListProps) => {
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  
  const handlePlayPause = (clipId: string) => {
    setPlayingClipId(playingClipId === clipId ? null : clipId);
  };

  // In a real implementation, you would use a drag-and-drop library like react-beautiful-dnd
  // For simplicity, we'll use buttons to move clips up and down
  const moveClipUp = (index: number) => {
    if (index > 0) {
      onReorderClips(index, index - 1);
    }
  };

  const moveClipDown = (index: number) => {
    if (index < clips.length - 1) {
      onReorderClips(index, index + 1);
    }
  };

  if (clips.length === 0) {
    return (
      <div className="text-center p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
        <p className="text-gray-500">No video clips added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {clips.map((clip, index) => (
        <Card key={clip.id} className="p-3 flex items-center">
          <div className="flex-shrink-0 w-16 h-12 bg-black rounded overflow-hidden mr-3">
            <video src={clip.url} className="w-full h-full object-cover" />
          </div>
          
          <div className="flex-grow">
            <h4 className="font-medium text-sm truncate">{clip.name}</h4>
            <p className="text-xs text-gray-500">
              {clip.duration ? `${Math.round(clip.duration)}s` : 'Processing...'}
            </p>
          </div>
          
          <div className="flex-shrink-0 flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handlePlayPause(clip.id)}
              className="h-8 w-8"
            >
              {playingClipId === clip.id ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => moveClipUp(index)}
              disabled={index === 0}
              className="h-8 w-8"
            >
              <Move className="h-4 w-4 rotate-90" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => moveClipDown(index)}
              disabled={index === clips.length - 1}
              className="h-8 w-8"
            >
              <Move className="h-4 w-4 -rotate-90" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onRemoveClip(clip.id)}
              className="h-8 w-8 text-red-500 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default VideoClipsList;
