
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, Plus, Minus, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { translateText, LanguageOption, LANGUAGES } from "@/utils/translationUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const FAQ = () => {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const [translatedFaqItems, setTranslatedFaqItems] = useState<Array<{question: string, answer: string}>>([]); 
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const faqItems = [
    {
      question: "What is YoteShin AI?",
      answer: "YoteShin AI is an advanced AI-powered platform that allows you to create stunning videos from images and text prompts. Our technology enables fast, easy, and powerful video generation for various creative needs."
    },
    {
      question: "How does the image to video generation work?",
      answer: "Our AI analyzes your image and text prompt to understand the scene, then generates natural motion and animations based on your specifications. The technology uses deep learning to create realistic movement while preserving the quality and style of your original image."
    },
    {
      question: "What's the difference between Playground and Pro image generation?",
      answer: "Playground image generation allows you to experiment with AI image creation, but these images are not saved to your cloud storage. Pro image generation produces higher quality results that are automatically saved to your cloud storage for future use. Pro images also offer better quality and are optimized for easier generation with more consistent results."
    },
    {
      question: "What are the benefits of a Premium Account?",
      answer: "A Premium Account provides full access to all features, unlimited playground image generation, 100 Pro image generations, 20 video generations, priority support, no watermarks, and API access for integrating our technology into your own applications."
    },
    {
      question: "Can I use the generated videos commercially?",
      answer: "Yes, with a Premium Account, you own the rights to all videos you generate and can use them for commercial purposes. Always ensure that you have proper rights to any images you upload as base materials."
    },
    {
      question: "How long does video generation take?",
      answer: "Most videos are generated within 1-3 minutes, depending on complexity, length, and server load. Premium users receive priority processing for faster results."
    },
    {
      question: "What file formats do you support?",
      answer: "We accept JPG, PNG, and WebP image uploads. Generated videos are available in MP4 format with various resolution options, including HD and 4K for Premium users."
    },
    {
      question: "Is there a limit to how many videos I can create?",
      answer: "Free accounts have limited generations per month. Premium accounts include 20 video generations and can purchase additional generation credits as needed."
    },
    {
      question: "How do I contact support?",
      answer: "Premium users can contact support through Viber, Messenger, or Telegram as shown on our Buy Account page. We aim to respond to all inquiries within 24 hours."
    }
  ];

  useEffect(() => {
    translateFaqItems(selectedLanguage);
  }, [selectedLanguage]);

  const translateFaqItems = async (language: LanguageOption) => {
    if (language === "en") {
      setTranslatedFaqItems(faqItems);
      return;
    }

    setIsTranslating(true);
    try {
      const translatedItems = await Promise.all(
        faqItems.map(async (item) => {
          const translatedQuestion = await translateText(item.question, "en", language);
          const translatedAnswer = await translateText(item.answer, "en", language);
          return {
            question: translatedQuestion,
            answer: translatedAnswer
          };
        })
      );
      setTranslatedFaqItems(translatedItems);
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate FAQ content",
        variant: "destructive",
      });
      // Fallback to English if translation fails
      setTranslatedFaqItems(faqItems);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleLanguageChange = (language: LanguageOption) => {
    if (language === selectedLanguage) return;
    setSelectedLanguage(language);
  };

  return (
    <div className="min-h-screen">
      {/* Header Section */}
      <section className="py-12 px-4 bg-gradient-to-br from-slate-900 to-purple-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-6">
            <Button 
              variant="outline" 
              className="bg-white/10 text-white hover:bg-white/20 border-white/20" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-white/70" />
              <Select value={selectedLanguage} onValueChange={(value: LanguageOption) => handleLanguageChange(value)}>
                <SelectTrigger className="w-[180px] bg-white/10 text-white border-white/20">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <SelectItem key={code} value={code as LanguageOption}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <HelpCircle className="h-16 w-16 mx-auto mb-4 text-brand-purple" />
            <h1 className="text-4xl font-bold mb-4">
              {selectedLanguage === "en" ? "Frequently Asked Questions" : 
               selectedLanguage === "my" ? "မေးလေ့ရှိသော မေးခွန်းများ" : 
               "คำถามที่พบบ่อย"}
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto">
              {selectedLanguage === "en" ? "Find answers to common questions about YoteShin AI and our services" : 
               selectedLanguage === "my" ? "YoteShin AI နှင့် ကျွန်ုပ်တို့၏ ဝန်ဆောင်မှုများအကြောင်း အဖြေများရှာပါ" : 
               "ค้นหาคำตอบสำหรับคำถามทั่วไปเกี่ยวกับ YoteShin AI และบริการของเรา"}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          {isTranslating ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
              <span className="ml-3 text-lg text-slate-600">Translating content...</span>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {translatedFaqItems.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <AccordionTrigger className="px-6 py-4 text-left font-medium text-lg text-slate-800">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 text-slate-600">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
          
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">
              {selectedLanguage === "en" ? "Still have questions?" : 
               selectedLanguage === "my" ? "မေးခွန်းများ ရှိနေသေးပါသလား?" : 
               "ยังมีคำถามอยู่หรือไม่?"}
            </p>
            <Button 
              onClick={() => navigate("/buy-account")}
              className="bg-gradient-to-r from-brand-purple to-brand-blue text-white"
            >
              {selectedLanguage === "en" ? "Contact Support" : 
               selectedLanguage === "my" ? "အကူအညီရယူရန်" : 
               "ติดต่อฝ่ายสนับสนุน"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
