
import { useState } from "react";
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

export interface VideoClip {
  id: string;
  url: string;
  name: string;
  duration?: number;
  startTime?: number;
  endTime?: number;
}

export interface AudioTrack {
  id: string;
  url: string;
  name: string;
}

// Create FFmpeg instance outside the hook to ensure it's only created once
const ffmpeg = createFFmpeg({ 
  log: true,
  corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js'
});

// Flag to track if ffmpeg is loaded
let ffmpegLoaded = false;

export function useVideoEditor() {
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [combinedVideoUrl, setCombinedVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);

  const addVideoClip = (clip: VideoClip) => {
    setVideoClips((prev) => [...prev, clip]);
  };

  const removeVideoClip = (clipId: string) => {
    setVideoClips((prev) => prev.filter((clip) => clip.id !== clipId));
  };

  const reorderVideoClips = (startIndex: number, endIndex: number) => {
    setVideoClips((clips) => {
      const result = Array.from(clips);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  };

  const setAudio = (audio: AudioTrack | null) => {
    setAudioTrack(audio);
  };

  const combineVideos = async () => {
    if (videoClips.length === 0) return;
    
    setIsProcessing(true);
    setProgressPercent(0);
    
    try {
      // Load FFmpeg if not already loaded
      if (!ffmpegLoaded) {
        await ffmpeg.load();
        ffmpegLoaded = true;
      }
      
      // Create a list file for concatenation
      let fileContent = '';
      
      // Download and write each clip to FFmpeg's virtual file system
      for (let i = 0; i < videoClips.length; i++) {
        setProgressPercent(Math.floor((i / videoClips.length) * 50));
        
        // Fetch the video file
        const response = await fetch(videoClips[i].url);
        const arrayBuffer = await response.arrayBuffer();
        
        // Write to FFmpeg filesystem
        const inputFileName = `input${i}.mp4`;
        ffmpeg.FS('writeFile', inputFileName, new Uint8Array(arrayBuffer));
        
        // Add to the concat list
        fileContent += `file ${inputFileName}\n`;
      }
      
      // Write the concat list file
      ffmpeg.FS('writeFile', 'concat_list.txt', new TextEncoder().encode(fileContent));
      
      setProgressPercent(50);
      
      // Combine videos using the concat demuxer
      await ffmpeg.run(
        '-f', 'concat',
        '-safe', '0',
        '-i', 'concat_list.txt',
        '-c', 'copy',
        'output.mp4'
      );
      
      setProgressPercent(80);
      
      // Handle audio track if provided
      if (audioTrack) {
        // Save the combined video as temporary
        ffmpeg.FS('rename', 'output.mp4', 'temp_output.mp4');
        
        // Fetch the audio file
        const audioResponse = await fetch(audioTrack.url);
        const audioArrayBuffer = await audioResponse.arrayBuffer();
        
        // Write audio to FFmpeg filesystem
        ffmpeg.FS('writeFile', 'audio.mp3', new Uint8Array(audioArrayBuffer));
        
        // Add audio to the video
        await ffmpeg.run(
          '-i', 'temp_output.mp4',
          '-i', 'audio.mp3',
          '-map', '0:v',
          '-map', '1:a',
          '-shortest',
          'output.mp4'
        );
      }
      
      setProgressPercent(90);
      
      // Read the output file
      const data = ffmpeg.FS('readFile', 'output.mp4');
      
      // Create a blob URL from the processed video
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      setCombinedVideoUrl(url);
      
      // Clean up files
      videoClips.forEach((_, index) => {
        try {
          ffmpeg.FS('unlink', `input${index}.mp4`);
        } catch (e) {
          console.log(`Could not unlink input${index}.mp4:`, e);
        }
      });
      
      try {
        ffmpeg.FS('unlink', 'concat_list.txt');
        ffmpeg.FS('unlink', 'output.mp4');
        if (audioTrack) {
          ffmpeg.FS('unlink', 'temp_output.mp4');
          ffmpeg.FS('unlink', 'audio.mp3');
        }
      } catch (e) {
        console.log('Error during cleanup:', e);
      }
      
    } catch (error) {
      console.error("Failed to combine videos:", error);
    } finally {
      setProgressPercent(100);
      setIsProcessing(false);
    }
  };

  return {
    videoClips,
    audioTrack,
    combinedVideoUrl,
    isProcessing,
    progressPercent,
    addVideoClip,
    removeVideoClip,
    reorderVideoClips,
    setAudio,
    combineVideos
  };
}
