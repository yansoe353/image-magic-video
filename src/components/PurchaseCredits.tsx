
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

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Purchase Credits</CardTitle>
              <CardDescription>
                Select a package to purchase additional generation credits
              </CardDescription>
            </div>
            <CreditCard className="h-8 w-8 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <RadioGroup 
              value={selectedPackage} 
              onValueChange={(value) => setSelectedPackage(value as "images" | "videos" | "combo")}
              className="grid gap-4"
            >
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <RadioGroupItem value="images" id="images" />
                  <Label htmlFor="images" className="flex items-center">
                    <Image className="mr-2 h-4 w-4" />
                    <span className="font-medium">Image Credits</span>
                  </Label>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium">100 Image Generation Credits</p>
                  <p className="text-sm text-muted-foreground">20,000 Ks</p>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <RadioGroupItem value="videos" id="videos" />
                  <Label htmlFor="videos" className="flex items-center">
                    <Video className="mr-2 h-4 w-4" />
                    <span className="font-medium">Video Credits</span>
                  </Label>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium">100 Video Generation Credits</p>
                  <p className="text-sm text-muted-foreground">20,000 Ks</p>
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <RadioGroupItem value="combo" id="combo" />
                  <Label htmlFor="combo" className="flex items-center">
                    <ChevronsRight className="mr-2 h-4 w-4" />
                    <span className="font-medium">Combo Pack (Save 12.5%)</span>
                  </Label>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium">100 Image + 100 Video Credits</p>
                  <p className="text-sm text-muted-foreground">35,000 Ks</p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handlePurchase} disabled={isLoading}>
            {isLoading ? "Processing..." : "Continue to Payment"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PurchaseCredits;
