
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
import { ImageIcon, BookOpen, Video, Music, Film, Star, Sparkles, Zap, Rocket } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header />
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section with Sci-Fi Theme */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1470813740244-df37b8c1edcb')] bg-cover bg-center opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/80"></div>
          
          {/* Animated Particles */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse-opacity"
                style={{
                  top: `${Math.random() * 100}%`, 
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  animationDuration: `${3 + Math.random() * 7}s`
                }}
              ></div>
            ))}
          </div>
          
          {/* Content */}
          <div className="container relative max-w-6xl mx-auto px-4 text-center z-10">
            <div className="inline-block mb-4">
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-xs text-white font-medium">
                POWERED BY GEMINI AI
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 text-gradient">
              Next-Gen AI <br className="md:hidden" /> Creation Portal
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Harness the power of advanced neural networks to transform your imagination into stunning visuals and immersive videos.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/create">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white hover:translate-y-[-2px] transition-all duration-300 shadow-lg shadow-purple-500/20"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Launch Creator
                </Button>
              </Link>
              <Link to="/examples">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="text-slate-200 border-slate-700 hover:bg-slate-800 hover:translate-y-[-2px] transition-all duration-300"
                >
                  <Star className="h-4 w-4 mr-2 text-yellow-400" />
                  View Examples
                </Button>
              </Link>
            </div>
          </div>
        </section>
        
        {/* Featured Service */}
        <section className="py-20 bg-gradient-to-r from-purple-900/30 to-blue-900/30 relative overflow-hidden">
          {/* Backdrop elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full"></div>
          
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="space-y-6">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1 rounded-full text-white text-sm font-medium">
                  REVOLUTIONARY TECH
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gradient">AI Video Generation</h2>
                <p className="text-slate-300 leading-relaxed">
                  Transform static images into dynamic videos with our cutting-edge technology. 
                  Add compelling soundtracks, voice narrations, or sound effects to bring your 
                  creations to life with our state-of-the-art generative AI.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-900/30 flex items-center justify-center border border-purple-500/30">
                      <Music className="h-5 w-5 text-purple-300" />
                    </div>
                    <span className="text-slate-300">AI Audio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center border border-blue-500/30">
                      <Film className="h-5 w-5 text-blue-300" />
                    </div>
                    <span className="text-slate-300">Pro Results</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center border border-indigo-500/30">
                      <Zap className="h-5 w-5 text-indigo-300" />
                    </div>
                    <span className="text-slate-300">Fast Processing</span>
                  </div>
                </div>
                <Link to="/create">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white mt-4">
                    <Rocket className="h-4 w-4 mr-2" />
                    Start Creating
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg overflow-hidden shadow-2xl border border-purple-500/20 transform hover:scale-105 transition-all duration-700">
                <div className="aspect-video bg-gradient-to-br from-purple-900 to-blue-800 flex items-center justify-center relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-20 w-20 text-white opacity-80" />
                  </div>
                  
                  {/* Tech grid overlay */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5')] bg-cover opacity-10"></div>
                  
                  {/* Interactive elements */}
                  <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-purple-900/50 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
                </div>
                <div className="bg-slate-900 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                      <span className="text-slate-300 text-sm">AI-Video Generation</span>
                    </div>
                    <span className="text-slate-400 text-xs">Made in Myanmar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section className="container max-w-7xl mx-auto px-4 py-20 md:py-28 relative">
          {/* Backdrop elements */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/5 blur-[120px] rounded-full"></div>
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gradient mb-6">
              Create Beyond Imagination
            </h2>
            <p className="text-slate-300 max-w-3xl mx-auto">
              YoteShin AI combines powerful neural networks and advanced generative models to transform 
              your ideas into stunning visuals and videos with unprecedented quality and speed.
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 relative z-10">
            <FeatureCard
              title="Text to Image"
              description="Generate photorealistic or artistic images from detailed text prompts."
              icon="image"
              link="/create"
            />
            <FeatureCard
              title="Image to Video"
              description="Animate your static images into cinematic short videos with motion and effects."
              icon="video"
              link="/create"
            />
            <FeatureCard
              title="Video to Audio"
              description="Enhance videos with AI-generated soundtracks, voiceovers, and sound effects."
              icon="music"
              link="/create?tab=video-to-video"
            />
            
            <FeatureCard
              title="Story to Video"
              description="Convert narrative text into complete animated video sequences with multiple scenes."
              icon="book"
              link="/create?tab=story-to-video"
            />
            
            <FeatureCard
              title="AI Video Editor"
              description="Professional-grade video editing tools powered by machine learning algorithms."
              icon="edit"
              link="/create"
            />
            
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 hover:border-purple-500/30 transition-colors transform hover:translate-y-[-5px] duration-300">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  User Gallery
                </CardTitle>
                <CardDescription className="text-slate-300">Explore public AI creations from our creative community</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-44 bg-gradient-to-br from-purple-900/40 to-slate-900 rounded-md flex items-center justify-center overflow-hidden relative">
                  {/* Gallery preview overlay */}
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1433086966358-54859d0ed716')] bg-cover bg-center opacity-20"></div>
                  <ImageIcon className="h-16 w-16 text-purple-400 opacity-80 relative z-10" />
                </div>
              </CardContent>
              <CardFooter>
                <Link to="/gallery" className="w-full">
                  <Button variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200">
                    Browse Gallery
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-slate-800 bg-black relative">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
