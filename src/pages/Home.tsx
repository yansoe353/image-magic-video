
import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Pricing from "@/components/Pricing";
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
import { ImageIcon } from "lucide-react";

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
        
        <Pricing />
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
