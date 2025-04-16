
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LANGUAGES, type LanguageOption } from "@/utils/translationUtils";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import { useIsFromMyanmar } from "@/utils/locationUtils";
import MyanmarVpnWarning from "@/components/MyanmarVpnWarning";

// Define the structure for documentation content
interface DocSection {
  id: string;
  title: string;
  content: string;
  subsections?: {
    id: string;
    title: string;
    content: string;
  }[];
}

const Documentation = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageOption>("en");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<DocSection[]>([]);
  const { generateResponse, isLoading, error } = useGeminiAPI({ maxOutputTokens: 2048 });
  const { toast } = useToast();
  const isFromMyanmar = useIsFromMyanmar();

  // Original English documentation content
  const originalContent: DocSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      content: "Welcome to our AI-powered content creation platform. This guide will help you understand how to use all the features effectively.",
      subsections: [
        {
          id: "setup-account",
          title: "Setting Up Your Account",
          content: "Create an account by clicking on the 'Sign Up' button in the top right corner. After verification, you'll have access to all basic features. To unlock advanced features, you may need to purchase credits."
        },
        {
          id: "api-key",
          title: "Adding Your Infinity API Key",
          content: "To use the image and video generation features, you'll need an Infinity API key. Click on the 'Set API Key' button in the navigation bar, enter your key from Infinity Tech, and save it. Your API key will be securely stored and used for all future generations."
        },
        {
          id: "understanding-limits",
          title: "Understanding Generation Limits",
          content: "Free accounts have daily limits on image and video generations. You can view your remaining generations on each creation page. Premium users or those who purchase additional credits have higher or unlimited generations."
        }
      ]
    },
    {
      id: "text-to-image",
      title: "Text to Image",
      content: "Create stunning images from text descriptions using our AI model.",
      subsections: [
        {
          id: "text-to-image-basics",
          title: "Basic Usage",
          content: "1. Navigate to the Text to Image page\n2. Enter a descriptive prompt in the text field\n3. Adjust settings like image size and guidance scale if needed\n4. Click 'Generate' and wait for your image\n5. Download the image or use it directly in video creation"
        },
        {
          id: "text-to-image-tips",
          title: "Writing Effective Prompts",
          content: "Be specific about what you want to see in the image. Include details about style (e.g., 'photorealistic', 'digital art'), lighting ('sunset', 'studio lighting'), and composition ('close-up', 'wide shot'). Avoid vague descriptions and include references to artists or movements if you want a particular style."
        }
      ]
    },
    {
      id: "image-to-video",
      title: "Image to Video",
      content: "Transform any still image into a dynamic video clip with motion and effects.",
      subsections: [
        {
          id: "image-to-video-basics",
          title: "Basic Usage",
          content: "1. Go to the Image to Video page\n2. Upload an image or use one generated from Text to Image\n3. Enter a prompt describing how the image should animate\n4. Select aspect ratio and adjust settings\n5. Click 'Generate Video' and wait for processing\n6. Preview, download or edit the video further"
        },
        {
          id: "image-to-video-tips",
          title: "Animation Tips",
          content: "For best results, describe the motion clearly (e.g., 'camera slowly zooms in', 'character turns head to the right'). Be specific about which elements should move and how. The AI works best with simple, progressive motions rather than complex sequences."
        }
      ]
    },
    {
      id: "story-to-video",
      title: "Story to Video",
      content: "Create a video sequence from a written story or narrative.",
      subsections: [
        {
          id: "story-to-video-basics",
          title: "Basic Usage",
          content: "1. Navigate to the Story to Video page\n2. Enter your story or narrative in the text field\n3. Adjust video settings and preferences\n4. Click 'Create Video' to start generation\n5. Each scene will be generated sequentially\n6. Review, edit, or download the final video"
        },
        {
          id: "story-to-video-tips",
          title: "Writing Effective Stories",
          content: "Structure your story with clear scenes. Use descriptive language for visuals. Keep scenes concise but vivid. The AI will interpret your narrative and create appropriate visuals for each segment of your story."
        }
      ]
    },
    {
      id: "script-to-video",
      title: "Script to Video",
      content: "Convert a screenplay or script into a video sequence with proper timing and transitions.",
      subsections: [
        {
          id: "script-to-video-basics",
          title: "Basic Usage",
          content: "1. Go to the Script to Video page\n2. Enter your script using proper formatting\n3. Define scenes, dialogue, and transitions\n4. Set video properties and style preferences\n5. Generate the video sequence\n6. Edit timing and transitions if needed"
        },
        {
          id: "script-format",
          title: "Script Format",
          content: "Use standard screenplay format when possible. Scene headings should be clear (e.g., 'INT. LIVING ROOM - DAY'). Action paragraphs should describe what's visible. Character names should be in all caps before dialogue. Include important camera directions if needed."
        }
      ]
    },
    {
      id: "buying-credits",
      title: "Buying Additional Credits",
      content: "Purchase more generation credits to create more content beyond the free limits.",
      subsections: [
        {
          id: "credit-options",
          title: "Credit Options",
          content: "Navigate to the Buy Credits page to see available packages. We offer plans starting at 25,000 Ks (approximately 175 Thai Baht) for 50 credits and 20,000 Ks (approximately 150 Thai Baht) for 40 credits. Each credit allows you to generate one image or video."
        },
        {
          id: "payment-process",
          title: "Payment Process",
          content: "1. Select your desired credit package\n2. Enter your email address (required for receipt)\n3. Choose your payment method (Bank transfer, mobile payment)\n4. Complete the payment following the instructions\n5. Credits will be added to your account within 24 hours of payment verification"
        }
      ]
    },
    {
      id: "prompt-engineering",
      title: "Prompt Engineering",
      content: "Learn how to write effective prompts to get the best results from our AI models.",
      subsections: [
        {
          id: "prompt-basics",
          title: "Basic Principles",
          content: "Good prompts are specific, descriptive, and clear. Include details about style, mood, composition, lighting, and subject. Use references to known artists or styles when applicable. Be explicit about what you want to see."
        },
        {
          id: "prompt-examples",
          title: "Example Prompts",
          content: "Instead of: 'A beautiful landscape'\nTry: 'A serene mountain landscape at sunset with golden light casting long shadows across a valley with a winding river, dramatic clouds, style of Albert Bierstadt'\n\nInstead of: 'A person walking'\nTry: 'A silhouette of a person walking along a beach at dusk, reflections in wet sand, cinematic lighting with purple and orange hues, wide angle shot'"
        },
        {
          id: "negative-prompts",
          title: "Using Negative Prompts",
          content: "Negative prompts tell the AI what NOT to include. Useful negative prompts include 'blur, distortion, low quality, deformed hands, extra fingers, text, watermarks'. These help avoid common AI generation issues."
        }
      ]
    }
  ];

  // Function to translate content using Gemini
  const translateContent = async (lang: LanguageOption) => {
    if (lang === "en") {
      setTranslatedContent(originalContent);
      return;
    }

    setIsTranslating(true);
    const translatedSections: DocSection[] = [];
    let hasError = false;

    try {
      for (const section of originalContent) {
        try {
          // Translate section title
          const translatedTitle = await generateResponse(
            `Translate the following text from English to ${LANGUAGES[lang]}. Keep any technical terms as they are, but translate everything else accurately and preserve formatting:\n\n${section.title}`
          );

          // Translate section content
          const translatedSectionContent = await generateResponse(
            `Translate the following text from English to ${LANGUAGES[lang]}. Keep any technical terms as they are, but translate everything else accurately and preserve formatting:\n\n${section.content}`
          );

          const translatedSubsections = [];
          
          if (section.subsections) {
            for (const subsection of section.subsections) {
              try {
                // Translate subsection title
                const translatedSubTitle = await generateResponse(
                  `Translate the following text from English to ${LANGUAGES[lang]}. Keep any technical terms as they are, but translate everything else accurately and preserve formatting:\n\n${subsection.title}`
                );

                // Translate subsection content
                const translatedSubContent = await generateResponse(
                  `Translate the following text from English to ${LANGUAGES[lang]}. Keep any technical terms as they are, but translate everything else accurately and preserve formatting:\n\n${subsection.content}`
                );

                translatedSubsections.push({
                  id: subsection.id,
                  title: translatedSubTitle,
                  content: translatedSubContent
                });
              } catch (subsectionError) {
                console.error("Error translating subsection:", subsectionError);
                // Fall back to English for this subsection
                translatedSubsections.push({
                  id: subsection.id,
                  title: subsection.title,
                  content: subsection.content
                });
                hasError = true;
              }
            }
          }

          translatedSections.push({
            id: section.id,
            title: translatedTitle,
            content: translatedSectionContent,
            subsections: translatedSubsections
          });
        } catch (sectionError) {
          console.error("Error translating section:", sectionError);
          // Fall back to English for this section
          translatedSections.push({
            id: section.id,
            title: section.title,
            content: section.content,
            subsections: section.subsections
          });
          hasError = true;
        }
      }

      setTranslatedContent(translatedSections);
      
      if (hasError) {
        toast({
          title: "Partial Translation",
          description: `Some parts could not be translated to ${LANGUAGES[lang]} and remain in English`,
          variant: "warning",
        });
      } else {
        toast({
          title: "Translation Complete",
          description: `Content translated to ${LANGUAGES[lang]}`,
        });
      }
    } catch (error) {
      console.error("Translation error:", error);
      toast({
        title: "Translation Error",
        description: "Failed to translate content. Please try again later.",
        variant: "destructive",
      });
      // Fall back to English content
      setTranslatedContent(originalContent);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (language: LanguageOption) => {
    if (language === selectedLanguage || isTranslating) return;
    
    setSelectedLanguage(language);
    translateContent(language);
  };

  // Initialize with English content
  useEffect(() => {
    setTranslatedContent(originalContent);
    
    // If user is from Myanmar, automatically set language to Myanmar
    if (isFromMyanmar) {
      handleLanguageChange("my");
    }
  }, [isFromMyanmar]);

  return (
    <div className="container py-8 max-w-6xl">
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Documentation</h1>
            <p className="text-muted-foreground mt-2">
              Learn how to use our platform effectively
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Language:</span>
            <Tabs
              value={selectedLanguage}
              onValueChange={(v: LanguageOption) => handleLanguageChange(v)}
            >
              <TabsList>
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <TabsTrigger key={code} value={code as LanguageOption} disabled={isTranslating}>
                    {code === "my" ? "မြန်မာ" : name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isFromMyanmar && <MyanmarVpnWarning className="mb-8" />}

        {isTranslating ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Translating content to {LANGUAGES[selectedLanguage]}...</p>
          </div>
        ) : (
          <Tabs defaultValue="getting-started" className="space-y-8">
            <div className="overflow-x-auto pb-2">
              <TabsList className="h-auto flex-wrap justify-start">
                {translatedContent.map((section) => (
                  <TabsTrigger key={section.id} value={section.id}>
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {translatedContent.map((section) => (
              <TabsContent key={section.id} value={section.id} className="space-y-6">
                <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-6 whitespace-pre-line">{section.content}</p>
                      
                      {section.subsections && section.subsections.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                          {section.subsections.map((subsection) => (
                            <AccordionItem key={subsection.id} value={subsection.id}>
                              <AccordionTrigger className="text-left">
                                {subsection.title}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="whitespace-pre-line pt-2 pb-4 px-2">
                                  {subsection.content}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="col-span-1">
                    <CardHeader>
                      <CardTitle>Tutorial Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="aspect-video bg-slate-200 rounded-lg flex items-center justify-center">
                        <p className="text-slate-500">Tutorial screenshot or video will appear here</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Documentation;
