import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface PaymentState {
  packageType: "images" | "videos" | "combo";
  packageName: string;
  packagePrice: string;
  imageCredits: number;
  videoCredits: number;
}

const bankAccounts = [
  { name: "KBZ Pay", account: "09974902335", owner: "Yan Naing Soe" },
  { name: "AYA Pay", account: "09969609655", owner: "Su Shwe Sin Win" },
  { name: "Wave Pay", account: "09969609655", owner: "Su Shwe Sin Win" }
];

const contactMethods = [
  {
    name: "Email",
    value: "htetnay4u@gmail.com",
    icon: <Mail className="h-4 w-4 mr-2" />,
    action: "mailto:htetnay4u@gmail.com"
  },
  {
    name: "Phone",
    value: "09969609655",
    icon: <Phone className="h-4 w-4 mr-2" />,
    action: "tel:+959969609655"
  },
  {
    name: "Viber Phone",
    value: "+95 09740807009",
    icon: <Phone className="h-4 w-4 mr-2" />,
    action: "viber://add?number=959740807009"
  },
  {
    name: "Telegram",
    value: "@itechmm",
    icon: <Mail className="h-4 w-4 mr-2" />,
    action: "https://t.me/itechmm"
  }
];

const OfflinePayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get package information from navigation state
  const { packageType, packageName, packagePrice, imageCredits, videoCredits } = 
    (location.state as PaymentState) || { 
      packageType: "images", 
      packageName: "Unknown Package", 
      packagePrice: "0", 
      imageCredits: 0, 
      videoCredits: 0 
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Please log in to submit payment",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!email) {
        toast({
          title: "Error",
          description: "Please enter your Gmail account",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Generate a unique payment reference ID
      const paymentRefId = uuidv4().substring(0, 8).toUpperCase();
      
      // Store payment information in the database
      const { error: dbError } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          reference_id: paymentRefId,
          package_type: packageType,
          package_name: packageName,
          amount: packagePrice,
          image_credits: imageCredits,
          video_credits: videoCredits,
          email: email,
          status: 'pending'
        });
      
      if (dbError) {
        throw new Error(`Error storing payment info: ${dbError.message}`);
      }
      
      toast({
        title: "Payment Request Created",
        description: `Your payment reference is #${paymentRefId}. Please contact our team to complete your payment.`,
      });
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("Payment submission error:", error);
      toast({
        title: "Submission Failed",
        description: "An error occurred while processing your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
        <CardHeader>
          <CardTitle>Offline Payment</CardTitle>
          <CardDescription>
            Complete your payment by bank transfer and contact our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md mb-4">
            <h3 className="font-medium mb-2">Order Summary</h3>
            <p className="text-sm">Package: {packageName}</p>
            <p className="text-sm">Amount: {packagePrice}</p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium mb-2">Bank Transfer Details</h3>
            <div className="bg-muted p-3 rounded-md space-y-3">
              {bankAccounts.map((bank, index) => (
                <div key={index} className="text-sm border-b last:border-0 pb-2 last:pb-0">
                  <p className="font-medium">{bank.name}</p>
                  <p>Account: {bank.account}</p>
                  <p>Name: {bank.owner}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Please transfer the exact amount and include your reference number in the transaction notes.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Contact Our Team</h3>
              <p className="text-sm text-muted-foreground">
                After making the payment, please contact us via one of these methods:
              </p>
              
              <div className="grid grid-cols-1 gap-2 mt-2">
                {contactMethods.map((method, index) => (
                  <Button 
                    key={index}
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => window.open(method.action, 'https://m.me/infinitytechmyanmar')}
                  >
                    {method.icon}
                    <div className="text-left">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.value}</p>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Your Gmail Account</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We'll send payment confirmation to this email
                </p>
              </div>
              
              <CardFooter className="px-0 pt-4">
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Generate Payment Reference"}
                </Button>
              </CardFooter>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflinePayment;
