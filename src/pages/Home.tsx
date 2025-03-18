
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Sparkles, Video, Image, Shield } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-purple-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
                  YoteShin AI
                </span>
                <br />Transform Your Ideas Into Videos
              </h1>
              <p className="text-lg md:text-xl text-slate-300 max-w-xl">
                Create stunning videos from images and text prompts using our advanced AI technology. Fast, easy, and powerful.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/create")} 
                  className="bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 transition-opacity"
                >
                  Start Creating <ArrowRight className="ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-white border-white hover:bg-white/10"
                >
                  View Examples
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-purple to-brand-blue rounded-lg blur opacity-75"></div>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <img 
                  src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b" 
                  alt="AI Video Creation" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-20 h-20 text-white/80 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Powerful Video Creation Features
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              YoteShin AI offers cutting-edge tools to transform your creative vision into reality
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Brain className="w-10 h-10 text-brand-purple" />,
                title: "Text to Image",
                description: "Generate stunning images from your text descriptions using our advanced AI models."
              },
              {
                icon: <Video className="w-10 h-10 text-brand-blue" />,
                title: "Image to Video",
                description: "Turn static images into dynamic videos with natural motion and realistic animations."
              },
              {
                icon: <Shield className="w-10 h-10 text-green-500" />,
                title: "Video Editing",
                description: "Combine video clips, add audio, and create professional-quality content in minutes."
              }
            ].map((feature, index) => (
              <div key={index} className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              How YoteShin AI Works
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Create videos in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: "01",
                title: "Describe or Upload",
                description: "Enter a text prompt or upload an image to start the creation process."
              },
              {
                number: "02",
                title: "AI Generation",
                description: "Our AI technology transforms your input into high-quality video content."
              },
              {
                number: "03",
                title: "Edit and Export",
                description: "Refine your video with our editing tools and export in various formats."
              }
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-7xl font-bold text-slate-100 absolute -top-10 left-0">
                  {step.number}
                </div>
                <div className="relative z-10 pt-8">
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Amazing Videos?
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Join thousands of creators who are already using YoteShin AI to bring their ideas to life.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/create")}
            className="bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 transition-opacity"
          >
            Get Started Now <ArrowRight className="ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-slate-950 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
                YoteShin AI
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                © {new Date().getFullYear()} YoteShin AI. All rights reserved.
              </p>
            </div>
            <div className="flex gap-8">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
