
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImage from "@/components/TextToImage";
import ImageToVideo from "@/components/ImageToVideo";
import Header from "@/components/Header";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("image-to-video");

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      <main className="flex-1 container max-w-5xl py-8 px-4 md:px-6">
        <section className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue mb-4">
            AI Video Generator
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Transform your ideas into stunning videos with our AI-powered tools. Generate images from text, then convert them into captivating videos.
          </p>
        </section>

        <Tabs 
          defaultValue="image-to-video" 
          className="w-full"
          onValueChange={(value) => setActiveTab(value)}
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="image-to-video">Image to Video</TabsTrigger>
            <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
          </TabsList>
          
          <TabsContent value="image-to-video" className="mt-0">
            <ImageToVideo />
          </TabsContent>
          
          <TabsContent value="text-to-image" className="mt-0">
            <TextToImage onImageGenerated={(imageUrl) => {
              setActiveTab("image-to-video");
            }} />
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="container text-center text-slate-500">
          <p>© {new Date().getFullYear()} AI Video Generator. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
