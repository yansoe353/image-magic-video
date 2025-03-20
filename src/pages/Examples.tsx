
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { useLanguage } from "@/utils/translationUtils";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Examples = () => {
  const navigate = useNavigate();
  const { language, translate } = useLanguage();
  
  // Original example video data
  const originalExamples = [
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

  // Translated texts state
  const [pageTitle, setPageTitle] = useState("Video Examples");
  const [pageDescription, setPageDescription] = useState("Explore what YoteShin AI can create with these example videos");
  const [backButton, setBackButton] = useState("Back");
  const [promptLabel, setPromptLabel] = useState("Prompt:");
  const [tryPromptButton, setTryPromptButton] = useState("Try this prompt");
  const [footerText, setFooterText] = useState(`© ${new Date().getFullYear()} YoteShin AI. All rights reserved.`);
  
  // Translated examples state
  const [examples, setExamples] = useState(originalExamples);

  // Handle translations when language changes
  useEffect(() => {
    async function translateContent() {
      // Page content translations
      setPageTitle(await translate("Video Examples"));
      setPageDescription(await translate("Explore what YoteShin AI can create with these example videos"));
      setBackButton(await translate("Back"));
      setPromptLabel(await translate("Prompt:"));
      setTryPromptButton(await translate("Try this prompt"));
      setFooterText(await translate(`© ${new Date().getFullYear()} YoteShin AI. All rights reserved.`));
      
      // Examples translations (if not in Myanmar/English)
      if (language !== 'my') {
        const translatedExamples = await Promise.all(
          originalExamples.map(async (example) => ({
            ...example,
            title: await translate(example.title, 'my'),
            description: await translate(example.description, 'my'),
            // Don't translate the prompt as it needs to work with the AI model
          }))
        );
        setExamples(translatedExamples);
      } else {
        setExamples(originalExamples);
      }
    }
    
    translateContent();
  }, [language, translate]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6 mt-16">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backButton}
            </Button>
            <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
              {pageTitle}
            </h1>
            <p className="text-slate-600 mt-2">
              {pageDescription}
            </p>
          </div>
          <LanguageSwitcher />
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
                  <span className="font-medium">{promptLabel}</span> {example.prompt}
                </div>
                <Button 
                  className="mt-4 w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 transition-opacity"
                  onClick={() => navigate('/create', { state: { prompt: example.prompt } })}
                >
                  {tryPromptButton}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="container text-center text-slate-500 max-w-6xl mx-auto">
          <p>{footerText}</p>
        </div>
      </footer>
    </div>
  );
};

export default Examples;
