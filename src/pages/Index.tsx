
import React, { useState } from "react";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImage from "@/components/TextToImage";
import ImageToVideo from "@/components/ImageToVideo";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { user, useCredits } = useAuth();
  const navigate = useNavigate();
  
  const handleGenerateVideo = () => {
    const creditCost = 1; // Each video generation costs 1 credit
    
    if (!user || user.credits < creditCost) {
      toast.error("You don't have enough credits to generate a video");
      return false;
    }
    
    // Use credits
    const success = useCredits(creditCost);
    if (success) {
      toast.success("Using 1 credit to generate your video");
      return true;
    }
    
    return false;
  };

  return (
    <div className="container max-w-6xl mx-auto p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Create AI Videos</h1>
        <p className="text-slate-600">
          Generate amazing videos using AI technology. You have {user?.credits || 0} credits available.
        </p>
      </div>

      {(user?.credits === 0) && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-yellow-800">Out of credits</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-yellow-700">
              You've used all your credits. Purchase more to continue creating videos.
            </CardDescription>
          </CardContent>
          <CardFooter>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-yellow-700 border-yellow-300 hover:bg-yellow-100">
                  <Coins className="mr-2 h-4 w-4" />
                  Get more credits
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Get more credits</DialogTitle>
                  <DialogDescription>
                    Purchase credits to continue creating amazing videos
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                  {[
                    { amount: 10, price: 5, popular: false },
                    { amount: 50, price: 20, popular: true },
                    { amount: 100, price: 35, popular: false },
                  ].map((pkg) => (
                    <Card key={pkg.amount} className={`${pkg.popular ? 'border-brand-purple' : ''} relative`}>
                      {pkg.popular && (
                        <div className="absolute -top-2 -right-2 bg-brand-purple text-white text-xs px-2 py-0.5 rounded-full">
                          Best value
                        </div>
                      )}
                      <CardHeader className="pb-3 pt-4">
                        <CardTitle className="text-xl">{pkg.amount} Credits</CardTitle>
                        <CardDescription>${pkg.price}.00</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground">
                          ${(pkg.price / pkg.amount).toFixed(2)} per credit
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant={pkg.popular ? "default" : "outline"}
                          className="w-full"
                        >
                          Purchase
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      )}

      <Tabs defaultValue="image-to-video" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
          <TabsTrigger value="image-to-video">Image to Video</TabsTrigger>
        </TabsList>
        <TabsContent value="text-to-image">
          <TextToImage onImageGenerated={setImageUrl} onCheckCredits={handleGenerateVideo} />
        </TabsContent>
        <TabsContent value="image-to-video">
          <ImageToVideo
            imageUrl={imageUrl}
            onVideoGenerated={setVideoBlob}
            onCheckCredits={handleGenerateVideo}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
