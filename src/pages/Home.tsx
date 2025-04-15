
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
import { 
  ImageIcon, 
  BookOpen, 
  Video, 
  Music, 
  Film, 
  Zap, 
  Code, 
  RefreshCw,
  MessageSquareText,
  Sparkles
} from "lucide-react";
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Home = () => {
  const demoVideos = [
    {
      title: "AI Portrait Animation",
      thumbnail: "https://placehold.co/600x400/252946/FFF?text=AI+Portrait",
      description: "Transform still portraits into lifelike animations"
    },
    {
      title: "Cinematic Scene Creation",
      thumbnail: "https://placehold.co/600x400/252946/FFF?text=Cinematic+Scene",
      description: "Generate Hollywood-quality scenes from text prompts"
    },
    {
      title: "Product Showcase",
      thumbnail: "https://placehold.co/600x400/252946/FFF?text=Product+Demo",
      description: "Create compelling product videos with AI enhancement"
    },
    {
      title: "Story Visualization",
      thumbnail: "https://placehold.co/600x400/252946/FFF?text=Story+Visual",
      description: "Turn written stories into visual narratives"
    }
  ];

  const features = [
    {
      icon: <Video className="h-10 w-10 text-purple-400" />,
      title: "Image to Video",
      description: "Transform any image into a dynamic video with lifelike motion and effects."
    },
    {
      icon: <MessageSquareText className="h-10 w-10 text-blue-400" />,
      title: "Text to Video",
      description: "Create videos directly from text prompts with precise creative control."
    },
    {
      icon: <RefreshCw className="h-10 w-10 text-green-400" />,
      title: "Video Enhancement",
      description: "Upscale and enhance existing video quality with AI processing."
    },
    {
      icon: <Music className="h-10 w-10 text-amber-400" />,
      title: "Audio Generation",
      description: "Add AI-generated soundtracks and voiceovers to your videos."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/30">
      <Header />
      
      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 border-b border-slate-800">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900 to-blue-900/20 z-0"></div>
          <div className="absolute inset-0 bg-[url('https://placehold.co/1920x1080/252946/FFF?text=AI+Video+Grid')] opacity-10 bg-cover bg-center"></div>
          
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-1 rounded-full text-white text-sm font-medium mb-2">
                  NEXT-GEN AI VIDEOS
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400">
                    Create Stunning Videos
                  </span>
                  <br />with AI
                </h1>
                <p className="text-xl text-slate-300 max-w-lg">
                  Generate professional-quality videos from text, images, or stories in minutes using our state-of-the-art AI technology.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/create">
                    <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-lg px-6 py-6 h-auto">
                      Start Creating Now
                    </Button>
                  </Link>
                  <Link to="/examples">
                    <Button variant="outline" className="text-white text-lg px-6 py-6 h-auto">
                      See Examples
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span>Powered by Infinity API</span>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-video bg-gradient-to-br from-purple-900/50 to-blue-900/50 rounded-lg overflow-hidden border border-slate-700/50 shadow-2xl">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Video className="h-16 w-16 text-white opacity-80" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">YoteShin AI Video</div>
                        <div className="text-slate-300 text-sm">Transform your ideas into reality</div>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                        01:24
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Videos Carousel */}
        <section className="py-20 bg-slate-900/70">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                See AI Video Generation in Action
              </h2>
              <p className="text-slate-300 max-w-3xl mx-auto">
                Explore examples of what our AI can create. From cinematic scenes to product showcases.
              </p>
            </div>
            
            <div className="relative px-10">
              <Carousel className="w-full">
                <CarouselContent>
                  {demoVideos.map((video, index) => (
                    <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-2">
                        <Card className="bg-slate-800/60 border-slate-700 hover:border-purple-500/50 transition-colors overflow-hidden">
                          <div className="aspect-video relative overflow-hidden">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center">
                              <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors">
                                <Video className="h-6 w-6 text-white" />
                              </div>
                            </div>
                          </div>
                          <CardContent className="pt-4">
                            <h3 className="font-medium text-white text-lg">{video.title}</h3>
                            <p className="text-slate-400 text-sm mt-1">{video.description}</p>
                          </CardContent>
                        </Card>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-0 bg-slate-800 border-slate-700" />
                <CarouselNext className="right-0 bg-slate-800 border-slate-700" />
              </Carousel>
            </div>
          </div>
        </section>
        
        {/* Key Features */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/10 to-blue-900/10"></div>
          <div className="container max-w-6xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Advanced AI Video Creation Tools
              </h2>
              <p className="text-slate-300 max-w-3xl mx-auto">
                YoteShin AI combines cutting-edge technologies to transform your ideas into professional videos.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-slate-800/40 border-slate-700 hover:bg-slate-800/60 transition-all group">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-2xl bg-slate-900/80 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-white">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-400">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Detailed Features Section */}
        <section className="py-16 border-t border-slate-800 bg-slate-900/70">
          <div className="container max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
                Create with YoteShin AI
              </h2>
              <p className="text-slate-300 max-w-3xl mx-auto">
                Access a comprehensive suite of AI tools designed for creators of all skill levels.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                title="Text to Image"
                description="Generate high-quality images from text prompts with precise control."
                icon="image"
                link="/create"
              />
              
              <FeatureCard
                title="Image to Video"
                description="Transform static images into dynamic videos with realistic motion."
                icon="video"
                link="/create"
              />
              
              <FeatureCard
                title="Audio Enhancement"
                description="Add AI-generated audio to bring your videos to life."
                icon="music"
                link="/create?tab=video-to-video"
              />
              
              <FeatureCard
                title="Story to Video"
                description="Turn written narratives into complete visual experiences."
                icon="book"
                link="/create?tab=story-to-video"
              />
              
              <FeatureCard
                title="Script to Video"
                description="Convert your screenplay or script directly into video content."
                icon="edit"
                link="/create?tab=script-to-video"
              />
              
              <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900/90 border-purple-700/30 hover:border-purple-500/50 transition-all group">
                <CardHeader>
                  <div className="bg-purple-900/40 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                    <ImageIcon className="h-6 w-6 text-purple-300" />
                  </div>
                  <CardTitle className="text-white group-hover:text-purple-300 transition-colors">User Gallery</CardTitle>
                  <CardDescription className="text-slate-400">Explore AI creations from our community</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-36 bg-gradient-to-br from-purple-900/20 to-slate-900 rounded-md flex items-center justify-center overflow-hidden">
                    <div className="grid grid-cols-3 gap-1 w-full h-full">
                      <div className="bg-purple-900/20"></div>
                      <div className="bg-blue-900/20"></div>
                      <div className="bg-cyan-900/20"></div>
                      <div className="bg-blue-900/30"></div>
                      <div className="bg-purple-900/30"></div>
                      <div className="bg-cyan-900/30"></div>
                      <div className="bg-cyan-900/20"></div>
                      <div className="bg-purple-900/20"></div>
                      <div className="bg-blue-900/20"></div>
                    </div>
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
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-900/30 to-blue-900/30">
          <div className="container max-w-5xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
              Ready to Create Amazing Videos?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of creators using YoteShin AI to bring their ideas to life.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/create">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-lg px-8 py-6 h-auto">
                  Start Creating
                </Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="text-white text-lg px-8 py-6 h-auto">
                  View Pricing
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="py-8 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-medium mb-3">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/create" className="text-slate-400 hover:text-white transition-colors">Create</Link></li>
                <li><Link to="/examples" className="text-slate-400 hover:text-white transition-colors">Examples</Link></li>
                <li><Link to="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/faq" className="text-slate-400 hover:text-white transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/gallery" className="text-slate-400 hover:text-white transition-colors">Gallery</Link></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3">Connect</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-800 text-center text-slate-500">
            <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
