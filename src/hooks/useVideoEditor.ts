import { useState } from "react";
import { createFFmpeg, fetchFile } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.7/dist/umd/ffmpeg.min.js';



const ffmpeg = createFFmpeg({ log: true });

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

export function useVideoEditor() {
  const [videoClips, setVideoClips] = useState<VideoClip[]>([]);
  const [audioTrack, setAudioTrack] = useState<AudioTrack | null>(null);
  const [combinedVideoUrl, setCombinedVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

    try {
      await ffmpeg.load();

      for (let i = 0; i < videoClips.length; i++) {
        const response = await fetch(videoClips[i].url);
        const blob = await response.blob();
        const file = new File([blob], `input${i}.mp4`, { type: 'video/mp4' });
        ffmpeg.FS('writeFile', `input${i}.mp4`, await fetchFile(file));
      }

      const inputs = videoClips.map((_, index) => `input${index}.mp4`).join('|');
      await ffmpeg.run('-i', `concat:${inputs}`, '-c', 'copy', 'output.mp4');

      const data = ffmpeg.FS('readFile', 'output.mp4');
      const videoBlob = new Blob([data.buffer], { type: 'video/mp4' });
      const videoUrl = URL.createObjectURL(videoBlob);
      setCombinedVideoUrl(videoUrl);

    } catch (error) {
      console.error("Failed to combine videos:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    videoClips,
    audioTrack,
    combinedVideoUrl,
    isProcessing,
    addVideoClip,
    removeVideoClip,
    reorderVideoClips,
    setAudio,
    combineVideos
  };
}
