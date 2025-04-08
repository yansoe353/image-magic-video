
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, MessageCircle, Send } from "lucide-react";

interface PaymentState {
  packageType: "images" | "videos" | "combo";
  packageName: string;
  packagePrice: string;
  imageCredits: number;
  videoCredits: number;
}

const contactOptions = [
  { name: "Phone", icon: <Phone className="h-4 w-4" />, contact: "09740807009", link: "tel:+959740807009" },
  { name: "Facebook Messenger", icon: <MessageCircle className="h-4 w-4" />, contact: "infinitytechmyanmar", link: "https://m.me/infinitytechmyanmar" },
  { name: "Telegram", icon: <Send className="h-4 w-4" />, contact: "09740807009", link: "https://t.me/+959740807009" }
];

const OfflinePayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get package information from navigation state
  const { packageType, packageName, packagePrice, imageCredits, videoCredits } = 
    (location.state as PaymentState) || { 
      packageType: "images", 
      packageName: "Unknown Package", 
      packagePrice: "0", 
      imageCredits: 0, 
      videoCredits: 0 
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
        <CardHeader className="border-b border-slate-700/50">
          <CardTitle className="text-xl text-gradient">Payment Information</CardTitle>
          <CardDescription className="text-slate-300">
            Contact us to complete your purchase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="bg-black/30 p-4 rounded-md mb-4 border border-purple-500/10">
            <h3 className="font-medium mb-2 text-purple-300">Order Summary</h3>
            <p className="text-sm text-slate-300">Package: {packageName}</p>
            <p className="text-sm text-slate-300">Amount: {packagePrice}</p>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-medium text-center mb-4 text-slate-200">Contact Us Through</h3>
            
            {contactOptions.map((option, index) => (
              <a 
                key={index}
                href={option.link}
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full block"
              >
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-between p-3 h-auto bg-slate-800 border-slate-600 hover:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    <span>{option.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{option.contact}</span>
                </Button>
              </a>
            ))}
            
            <div className="bg-purple-900/20 rounded-md p-4 mt-4 border border-purple-500/20">
              <p className="text-sm text-center text-slate-300">
                Please include your package details when contacting us.<br />
                Our team will assist you with the payment process.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end pt-4">
          <Button 
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white"
          >
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OfflinePayment;
