import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImage from "@/components/TextToImage";
import ImageToVideo from "@/components/ImageToVideo";
import StoryToVideo from "@/components/StoryToVideo";
import VideoToVideo from "@/components/VideoToVideo";
import Header from "@/components/Header";
import { getRemainingCounts, getRemainingCountsAsync, IMAGE_LIMIT, VIDEO_LIMIT } from "@/utils/usageTracker";
import { Card, CardContent } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { AIAssistant } from "@/components/AIAssistant";

interface SelectedContent {
  url: string;
  type: 'image' | 'video';
}

const Index = () => {
  const
