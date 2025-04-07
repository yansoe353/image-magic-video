
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, addUserCredits } from "@/utils/authUtils";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface PaymentState {
  packageType: "images" | "videos" | "combo";
  packageName: string;
  packagePrice: string;
  imageCredits: number;
  videoCredits: number;
}

const bankAccounts = [
  { name: "KBZ Bank", account: "0129-8472-0001-8472", owner: "Aung Ko" },
  { name: "AYA Bank", account: "1234-5678-9101-1121", owner: "Aung Ko" },
  { name: "CB Bank", account: "3141-5926-5358-9793", owner: "Aung Ko" }
];

const OfflinePayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Get package information from navigation state
  const { packageType, packageName, packagePrice, imageCredits, videoCredits } = 
    (location.state as PaymentState) || { 
      packageType: "images", 
      packageName: "Unknown Package", 
      packagePrice: "0", 
      imageCredits: 0, 
      videoCredits: 0 
    };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setUploadProgress(0);
    
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

      if (!uploadedFile) {
        toast({
          title: "Error",
          description: "Please upload your payment screenshot",
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
      
      setUploadProgress(20);

      // Upload the payment screenshot to Supabase Storage
      const fileName = `payment_${paymentRefId}_${Date.now()}_${uploadedFile.name.replace(/\s+/g, '_')}`;
      const { data: fileData, error: uploadError } = await supabase.storage
        .from('payments')
        .upload(`screenshots/${fileName}`, uploadedFile);
      
      if (uploadError) {
        throw new Error(`Error uploading file: ${uploadError.message}`);
      }
      
      setUploadProgress(60);
      
      // Get the file URL
      const { data: publicUrl } = supabase.storage
        .from('payments')
        .getPublicUrl(`screenshots/${fileName}`);
        
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
          screenshot_url: publicUrl.publicUrl,
          email: email,
          status: 'pending'
        });
      
      if (dbError) {
        throw new Error(`Error storing payment info: ${dbError.message}`);
      }
      
      setUploadProgress(100);
      
      toast({
        title: "Payment Submitted",
        description: `Your payment with reference #${paymentRefId} has been submitted for verification. We'll update your credits once approved.`,
      });
      
      // Redirect to home page
      setTimeout(() => {
        navigate("/");
      }, 2000);
      
    } catch (error) {
      console.error("Payment submission error:", error);
      toast({
        title: "Submission Failed",
        description: "An error occurred while submitting your payment information. Please try again.",
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
            Complete your payment by bank transfer and submit proof below
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
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="screenshot">Payment Screenshot</Label>
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Please upload a screenshot of your payment confirmation
              </p>
            </div>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            <CardFooter className="px-0 pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || !uploadedFile}
              >
                {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflinePayment;
