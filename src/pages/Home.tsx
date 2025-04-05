
import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import FeatureCard from "@/components/FeatureCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, BookOpen, Video, Music, Film } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      
      <main className="flex-1 flex flex-col">
        <section className="bg-gradient-to-br from-brand-800 to-brand-900 text-white py-24 md:py-32">
          <div className="container max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Unleash Your Creativity with AI
            </h1>
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Create stunning visuals and videos effortlessly using our AI-powered tools.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/create">
                <Button className="bg-brand-600 hover:bg-brand-500 text-white">
                  Get Started
                </Button>
              </Link>
              <Link to="/examples">
                <Button variant="outline" className="text-white">
                  See Examples
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Featured Service */}
        <section className="py-16 bg-gradient-to-r from-purple-900/50 to-blue-900/50">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1 rounded-full text-white text-sm font-medium">
                  NEW SERVICE
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">AI Video Service</h2>
                <p className="text-slate-300">
                  Transform any image to video. Add compelling soundtracks, voice narrations, 
                  or sound effects to your videos with our cutting-edge technology powered by Infinity Tech.
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-purple-700/30 flex items-center justify-center">
                      <Music className="h-5 w-5 text-purple-300" />
                    </div>
                    <span className="text-slate-300">Custom Audio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-blue-700/30 flex items-center justify-center">
                      <Film className="h-5 w-5 text-blue-300" />
                    </div>
                    <span className="text-slate-300">Professional Results</span>
                  </div>
                </div>
                <Link to="/create">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white">
                    Try Image to Video
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl border border-purple-500/20">
                <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-800 flex items-center justify-center">
                  <Video className="h-20 w-20 text-white opacity-80" />
                </div>
                <div className="bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                      <span className="text-slate-300 text-sm">AI-Audio Generation</span>
                    </div>
                    <span className="text-slate-400 text-xs">fal.ai powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="container max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              Create Amazing Content
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto">
              YoteShin AI combines powerful AI models to transform your ideas into stunning visuals and videos.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title="Text to Image"
              description="Generate high-quality images from text prompts."
              icon="image"
              link="/create"
            />
            <FeatureCard
              title="Image to Video"
              description="Turn static images into engaging videos."
              icon="video"
              link="/create"
            />
            <FeatureCard
              title="Video to Audio"
              description="Add AI-generated audio to your videos."
              icon="music"
              link="/create?tab=video-to-video"
            />
            
            <FeatureCard
              title="Story to Video"
              description="Turn your story ideas into complete videos with AI-generated scenes."
              icon="book"
              link="/create?tab=story-to-video"
            />
            
            <FeatureCard
              title="AI Video Editor"
              description="Edit and enhance your videos with AI-powered tools."
              icon="edit"
              link="/create"
            />
            
            <Card className="bg-slate-900/50 border-slate-700 hover:border-brand-600 transition-colors">
              <CardHeader>
                <CardTitle className="text-white">User Gallery</CardTitle>
                <CardDescription>Explore public AI creations from our community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-44 bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-md flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-purple-400 opacity-80" />
                </div>
              </CardContent>
              <CardFooter>
                <Link to="/gallery" className="w-full">
                  <Button variant="secondary" className="w-full">
                    Browse Gallery
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>
      
      <footer className="py-6 border-t border-slate-700/50 bg-slate-900/70 backdrop-blur-sm">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
