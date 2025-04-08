
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { CreditCard, Image, Video, ChevronsRight, ArrowLeft } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";

const PurchaseCredits = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<"images" | "videos" | "combo">("images");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const packages = {
    images: { name: "100 Image Credits", price: "20,000 Ks", imageCredits: 100, videoCredits: 0 },
    videos: { name: "100 Video Credits", price: "20,000 Ks", imageCredits: 0, videoCredits: 100 },
    combo: { name: "Combo Pack", price: "35,000 Ks", imageCredits: 100, videoCredits: 100 }
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to purchase credits",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const selectedPkg = packages[selectedPackage];
      
      // Redirect to offline payment form with package details
      navigate("/offline-payment", { 
        state: { 
          packageType: selectedPackage,
          packageName: selectedPkg.name,
          packagePrice: selectedPkg.price,
          imageCredits: selectedPkg.imageCredits,
          videoCredits: selectedPkg.videoCredits
        } 
      });
      
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast({
        title: "Purchase Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-md mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <Card className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/20">
        <CardHeader className="space-y-1 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gradient">Purchase Credits</CardTitle>
              <CardDescription className="text-slate-300">
                Select a package to purchase additional generation credits
              </CardDescription>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-900/30 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-300" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <RadioGroup 
              value={selectedPackage} 
              onValueChange={(value) => setSelectedPackage(value as "images" | "videos" | "combo")}
              className="grid gap-4"
            >
              <div className="rounded-md p-3 hover:bg-slate-800/50 transition-colors border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-1">
                  <RadioGroupItem value="images" id="images" />
                  <Label htmlFor="images" className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-blue-900/30 flex items-center justify-center mr-2">
                      <Image className="h-3 w-3 text-blue-300" />
                    </div>
                    <span className="font-medium text-slate-200">Image Credits</span>
                  </Label>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium text-slate-300">100 Image Generation Credits</p>
                  <p className="text-sm text-slate-400">20,000 Ks</p>
                </div>
              </div>

              <div className="rounded-md p-3 hover:bg-slate-800/50 transition-colors border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-1">
                  <RadioGroupItem value="videos" id="videos" />
                  <Label htmlFor="videos" className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-purple-900/30 flex items-center justify-center mr-2">
                      <Video className="h-3 w-3 text-purple-300" />
                    </div>
                    <span className="font-medium text-slate-200">Video Credits</span>
                  </Label>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium text-slate-300">100 Video Generation Credits</p>
                  <p className="text-sm text-slate-400">20,000 Ks</p>
                </div>
              </div>

              <div className="rounded-md p-3 hover:bg-slate-800/50 transition-colors border border-purple-500/30">
                <div className="flex items-center space-x-2 mb-1">
                  <RadioGroupItem value="combo" id="combo" />
                  <Label htmlFor="combo" className="flex items-center">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-900/30 to-purple-900/30 flex items-center justify-center mr-2">
                      <ChevronsRight className="h-3 w-3 text-purple-200" />
                    </div>
                    <span className="font-medium text-slate-200">Combo Pack <span className="text-purple-300 text-xs">(Save 12.5%)</span></span>
                  </Label>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium text-slate-300">100 Image + 100 Video Credits</p>
                  <p className="text-sm text-slate-400">35,000 Ks</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-2">
          <Button 
            onClick={handlePurchase} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
          >
            {isLoading ? "Processing..." : "Continue to Payment"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PurchaseCredits;
