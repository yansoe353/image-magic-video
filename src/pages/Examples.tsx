
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Examples = () => {
  const navigate = useNavigate();

  // Example video data
  const examples = [
    {
      id: 1,
      title: "ပင်လယ်နဂါး",
      description: "ပင်လယ်နဂါး Animation.",
      videoUrl: "https://rhbpeivthnmvzhblnvya.supabase.co/storage/v1/object/public/generated_content/578029e3-a91e-4dba-a5d5-5ab22f8c2d2b/videos/f2a26e3e-168c-47c8-9a0c-b6198636b68d.mp4",
      prompt: "ပင်လယ်ပြင်ပေါ်ကနေ ဖြတ်သန်းပျံနေသည့် ချစ်စရာ နဂါးလေးတစ်ကောင်"
    },
    {
      id: 2,
      title: "Nature Animation",
      description: "Peaceful forest scene with gentle wind moving through leaves and flowing water.",
      videoUrl: "https://storage.googleapis.com/fal-serverless/fal-ai/wan-i2v-output-videos/fal_qbwu7rtgnkwwva_fal_4sn5xmrzdhkkca_fal_4sn5xmrzdhkkca.mp4",
      prompt: "ပင်လယ်ပြင်ပေါ်ကနေ ဖြတ်သန်းပျံနေသည့် ချစ်စရာ နဂါးလေးတစ်ကောင်"
    },
    {
      id: 3,
      title: "Portrait Animation",
      description: "Subtly animated portrait with realistic facial movements and expressions.",
      videoUrl: "https://storage.googleapis.com/fal-serverless/fal-ai/wan-i2v-output-videos/fal_qbxnpxvmdh6xj6_fal_4sn5xmrzdhkkca_fal_4sn5xmrzdhkkca.mp4",
      prompt: "Portrait of a person with subtle facial movements, blinking eyes, slight smile, photorealistic"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6 mt-16">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
            Video Examples
          </h1>
          <p className="text-slate-600 mt-2">
            Explore what YoteShin AI can create with these example videos
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => (
            <div key={example.id} className="bg-white rounded-lg overflow-hidden shadow-sm border border-slate-200 flex flex-col">
              <div className="aspect-video bg-slate-100 relative">
                <video 
                  src={example.videoUrl} 
                  className="w-full h-full object-cover"
                  controls
                ></video>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-lg mb-1">{example.title}</h3>
                <p className="text-slate-600 text-sm mb-3 flex-1">{example.description}</p>
                <div className="bg-slate-50 p-2 rounded-md text-xs text-slate-700 font-mono">
                  <span className="font-medium">Prompt:</span> {example.prompt}
                </div>
                <Button 
                  className="mt-4 w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 transition-opacity"
                  onClick={() => navigate('/create', { state: { prompt: example.prompt } })}
                >
                  Try this prompt
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="container text-center text-slate-500 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Examples;
