
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Sparkles, Video, Image, Shield, Play, Eye, Film, HelpCircle } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  // Example video data from Examples.tsx
  const featuredVideos = [
    {
      id: 1,
      title: "ပင်လယ်နဂါး",
      description: "ပင်လယ်နဂါး Animation.",
      videoUrl: "https://rhbpeivthnmvzhblnvya.supabase.co/storage/v1/object/public/generated_content/578029e3-a91e-4dba-a5d5-5ab22f8c2d2b/videos/f2a26e3e-168c-47c8-9a0c-b6198636b68d.mp4",
      prompt: "ပင်လယ်ပြင်ပေါ်ကနေ ဖြတ်သန်းပျံနေသည့် ချစ်စရာ နဂါးလေးတစ်ကောင်"
    },
    {
      id: 2,
      title: "SuperDog",
      description: "ချစ်စရာ Superdog.",
      videoUrl: "https://rhbpeivthnmvzhblnvya.supabase.co/storage/v1/object/public/generated_content/578029e3-a91e-4dba-a5d5-5ab22f8c2d2b/videos/adbe7061-edca-4388-88c9-4e035fdb1a0f.mp4",
      prompt: "ချစ်စရလုပ်ပြနေသည့်နေသည့် superdog"
    },
    {
      id: 3,
      title: "ချစ်စရာ စားဖိုမှုး ကြောင်လေး",
      description: "Cute Chef Cat",
      videoUrl: "https://rhbpeivthnmvzhblnvya.supabase.co/storage/v1/object/public/generated_content/578029e3-a91e-4dba-a5d5-5ab22f8c2d2b/videos/4cfc8b89-165c-43e3-9921-4e8cd49494bd.mp4",
      prompt: "မီးဖိုချောင်ထဲမှာ ဟင်းချက်နေသည့် chef cat, detail, realistic"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 to-slate-800">
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
                  onClick={() => navigate("/examples")}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white group transition-all backdrop-blur-sm"
                >
                  <Eye className="mr-2 text-white group-hover:animate-pulse" />
                  View Examples
                </Button>
              </div>
              <div>
                <Button 
                  variant="link" 
                  onClick={() => navigate("/buy-account")}
                  className="text-white hover:text-brand-purple underline"
                >
                  Purchase Full Account
                </Button>
              </div>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-purple to-brand-blue rounded-lg blur opacity-75"></div>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video 
                  src={featuredVideos[0].videoUrl} 
                  autoPlay 
                  muted 
                  loop 
                  className="w-full h-full object-cover opacity-80"
                ></video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-20 h-20 text-white/80 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Videos Section */}
      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
              Featured AI Videos
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              Check out these amazing videos created with YoteShin AI
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredVideos.map((video) => (
              <div key={video.id} className="bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50 backdrop-blur-sm hover:shadow-lg hover:shadow-purple-900/20 transition-all">
                <div className="aspect-video bg-black/50 relative group">
                  <video 
                    src={video.videoUrl} 
                    className="w-full h-full object-cover"
                    muted
                    loop
                    onMouseOver={(e) => e.currentTarget.play()}
                    onMouseOut={(e) => {
                      e.currentTarget.pause();
                      e.currentTarget.currentTime = 0;
                    }}
                  ></video>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-white mb-2">{video.title}</h3>
                  <p className="text-slate-300 mb-3">{video.description}</p>
                  <div className="bg-slate-800 p-2 rounded-md text-xs text-slate-300 font-mono">
                    <span className="font-medium text-brand-purple">Prompt:</span> {video.prompt}
                  </div>
                  <Button 
                    className="mt-4 w-full bg-gradient-to-r from-brand-purple/80 to-brand-blue/80 hover:from-brand-purple hover:to-brand-blue transition-all"
                    onClick={() => navigate('/create', { state: { prompt: video.prompt } })}
                  >
                    Try this prompt
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Button 
              onClick={() => navigate("/examples")}
              variant="outline"
              className="border-brand-purple text-brand-purple hover:bg-brand-purple/10"
            >
              View All Examples
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Powerful Video Creation Features
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
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
              <div key={index} className="bg-slate-700/50 p-6 rounded-xl border border-slate-600/50 hover:shadow-md transition-shadow backdrop-blur-sm">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-slate-900">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How YoteShin AI Works
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
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
                <div className="text-7xl font-bold text-slate-800 absolute -top-10 left-0">
                  {step.number}
                </div>
                <div className="relative z-10 pt-8">
                  <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
                  <p className="text-slate-300">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-slate-800">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="inline-block p-3 bg-brand-purple/10 rounded-full mb-4">
            <HelpCircle className="h-6 w-6 text-brand-purple" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Find answers to common questions about our platform and services
          </p>
          <Button 
            onClick={() => navigate("/faq")}
            variant="outline"
            className="border-brand-purple text-brand-purple hover:bg-brand-purple/10"
          >
            View All FAQs
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-slate-900 to-purple-900 text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Create Amazing Videos?
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            Join thousands of creators who are already using YoteShin AI to bring their ideas to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/create")}
              className="bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 transition-opacity"
            >
              Get Started Now <ArrowRight className="ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate("/buy-account")}
              className="border-white/20 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              Buy Account
            </Button>
          </div>
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
              <a onClick={() => navigate("/faq")} className="text-slate-400 hover:text-white transition-colors cursor-pointer">FAQ</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
