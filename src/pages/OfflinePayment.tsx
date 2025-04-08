
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Copy, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/utils/authUtils";

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  imageCredits: number;
  videoCredits: number;
  priceInKyat: number;
}

const CREDIT_PACKAGES: Record<string, CreditPackage> = {
  "basic": {
    id: "basic",
    name: "Basic",
    price: 60000,
    imageCredits: 100,
    videoCredits: 20,
    priceInKyat: 60000
  },
  "standard": {
    id: "standard",
    name: "Standard",
    price: 100000,
    imageCredits: 200,
    videoCredits: 40,
    priceInKyat: 100000
  },
  "premium": {
    id: "premium",
    name: "Premium",
    price: 150000,
    imageCredits: 350,
    videoCredits: 70,
    priceInKyat: 150000
  },
  "enterprise": {
    id: "enterprise",
    name: "Enterprise",
    price: 250000,
    imageCredits: 700,
    videoCredits: 140,
    priceInKyat: 250000
  }
};

const PAYMENT_METHODS = [
  {
    type: "bank",
    name: "KBZ Bank",
    accountName: "Aung Min Thein",
    accountNumber: "09740807009",
    qrcode: "/kbzpay_qr.jpg"
  },
  {
    type: "mobile",
    name: "Wave Money",
    accountName: "Aung Min Thein",
    accountNumber: "09740807009",
    qrcode: "/wave_qr.jpg"
  },
  {
    type: "mobile",
    name: "KBZ Pay",
    accountName: "Aung Min Thein", 
    accountNumber: "09740807009",
    qrcode: "/kbzpay_qr.jpg"
  }
];

const OfflinePayment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const packageId = location.state?.packageId || "basic";
  const selectedPackage = CREDIT_PACKAGES[packageId] || CREDIT_PACKAGES.basic;
  
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [notes, setNotes] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setScreenshot(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(selectedMethod.accountNumber);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Account number copied to clipboard",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !transactionId) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const user = await getCurrentUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to purchase credits",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }
      
      let screenshotUrl = "";
      
      if (screenshot) {
        const filename = `payment_proof/${user.id}/${Date.now()}-${screenshot.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('payments')
          .upload(filename, screenshot);
          
        if (uploadError) {
          throw new Error(uploadError.message);
        }
        
        const { data: urlData } = supabase.storage
          .from('payments')
          .getPublicUrl(filename);
          
        screenshotUrl = urlData.publicUrl;
      }
      
      // Store payment request in database
      const { data, error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          package_id: selectedPackage.id,
          package_name: selectedPackage.name,
          amount: selectedPackage.price,
          payment_method: selectedMethod.name,
          payer_name: name,
          payer_phone: phone,
          transaction_id: transactionId,
          notes: notes,
          screenshot_url: screenshotUrl,
          status: 'pending',
          image_credits: selectedPackage.imageCredits,
          video_credits: selectedPackage.videoCredits
        });
      
      if (error) throw new Error(error.message);
      
      toast({
        title: "Payment submitted",
        description: "Your payment has been submitted and is awaiting verification",
      });
      
      navigate("/");
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit payment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Offline Payment</CardTitle>
          <CardDescription className="text-center">
            Complete your purchase of the {selectedPackage.name} package
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-medium text-lg mb-2">Order Summary</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm">Package:</div>
              <div className="text-sm font-medium">{selectedPackage.name}</div>
              
              <div className="text-sm">Image Credits:</div>
              <div className="text-sm font-medium">{selectedPackage.imageCredits}</div>
              
              <div className="text-sm">Video Credits:</div>
              <div className="text-sm font-medium">{selectedPackage.videoCredits}</div>
              
              <div className="text-sm">Total Amount:</div>
              <div className="text-sm font-medium">{selectedPackage.priceInKyat.toLocaleString()} Ks</div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">Select Payment Method</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.name}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={`p-3 border rounded-lg text-center ${
                    selectedMethod.name === method.name 
                      ? 'border-brand-purple bg-brand-purple/10' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-lg mb-2">{selectedMethod.name} Payment Details</h3>
            <div className="flex items-center space-x-2 mb-2">
              <div className="text-sm">{selectedMethod.type === 'bank' ? 'Account' : 'Phone'} Number:</div>
              <div className="text-sm font-medium">{selectedMethod.accountNumber}</div>
              <Button variant="outline" size="sm" onClick={copyAccountNumber}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="text-sm mb-2">Account Name: {selectedMethod.accountName}</div>
            <div className="text-sm mb-4">Amount: {selectedPackage.priceInKyat.toLocaleString()} Ks</div>
            
            {selectedMethod.qrcode && (
              <div className="flex justify-center mb-4">
                <img 
                  src={selectedMethod.qrcode} 
                  alt={`${selectedMethod.name} QR Code`} 
                  className="w-48 h-48 object-contain bg-white p-2 rounded-lg"
                />
              </div>
            )}
            
            <div className="text-sm text-center text-muted-foreground">
              Please make the payment using the details above and then submit the form below with your payment information.
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Your Phone *</Label>
                  <Input 
                    id="phone" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID / Reference *</Label>
                <Input 
                  id="transactionId" 
                  value={transactionId} 
                  onChange={(e) => setTransactionId(e.target.value)} 
                  required
                  placeholder="Enter transaction ID or reference number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="screenshot">
                  Payment Screenshot (optional but recommended)
                </Label>
                <input
                  type="file"
                  id="screenshot"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6">
                  {screenshotPreview ? (
                    <div className="relative w-full">
                      <img 
                        src={screenshotPreview} 
                        alt="Payment Screenshot" 
                        className="mx-auto max-h-48 object-contain rounded"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setScreenshot(null);
                          setScreenshotPreview(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Screenshot
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional information"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Payment Information'}
              </Button>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <p className="text-sm text-muted-foreground text-center">
            Your credits will be added to your account after we verify your payment.
            This typically takes less than 24 hours during business days.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OfflinePayment;
