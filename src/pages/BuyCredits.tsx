
import { useState } from "react";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Check, MessageCircle, Phone, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getUserId } from "@/utils/storageUtils";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const packages = [
  {
    id: "image-100",
    name: "100 Pro Image Generations",
    description: "Generate 100 high-quality AI images",
    price: 20000,
    type: "image",
    amount: 100
  },
  {
    id: "video-20",
    name: "20 Pro Video Generations",
    description: "Generate 20 high-quality AI videos",
    price: 25000,
    type: "video",
    amount: 20
  }
];

const BuyCredits = () => {
  const [selectedPackage, setSelectedPackage] = useState(packages[0].id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("kpay");
  const [transactionId, setTransactionId] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !phone || !paymentMethod) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const userId = await getUserId();
      
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please log in before purchasing credits",
          variant: "destructive"
        });
        navigate("/login");
        return;
      }
      
      // Create payment request in database
      const { error } = await supabase.from("payment_requests").insert({
        user_id: userId,
        package_id: selectedPackage,
        amount: selectedPkg?.price || 0,
        payment_method: paymentMethod,
        reference_number: transactionId,
        payment_details: {
          name,
          email,
          phone,
          additional_info: additionalInfo,
          selected_package: selectedPkg
        }
      });
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Payment request submitted successfully",
        description: "Our team will process your request shortly"
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error("Payment submission error:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your payment request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <Header />
      
      <main className="container max-w-4xl py-8 px-4 md:px-6 mt-16">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">Buy Additional Credits</h1>
        
        {!isSubmitted ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="space-y-4 sticky top-24">
                <h2 className="text-xl font-medium text-white mb-4">Choose a Package</h2>
                
                <RadioGroup 
                  value={selectedPackage} 
                  onValueChange={setSelectedPackage}
                  className="space-y-4"
                >
                  {packages.map((pkg) => (
                    <div 
                      key={pkg.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPackage === pkg.id 
                          ? 'border-brand-blue bg-brand-blue/10' 
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <RadioGroupItem value={pkg.id} id={pkg.id} className="sr-only" />
                      <Label 
                        htmlFor={pkg.id}
                        className="flex items-start cursor-pointer"
                      >
                        <div className="flex-grow">
                          <div className="font-medium text-white">{pkg.name}</div>
                          <div className="text-sm text-slate-400">{pkg.description}</div>
                          <div className="mt-1 text-lg font-semibold text-brand-purple">{pkg.price.toLocaleString()} Ks</div>
                        </div>
                        {selectedPackage === pkg.id && (
                          <Check className="h-5 w-5 text-brand-blue ml-2 mt-1" />
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <Card className="border border-slate-700 bg-slate-800/50">
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                  <CardDescription>
                    Submit your payment details to complete your purchase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                        className="bg-slate-900"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email address (optional)"
                        className="bg-slate-900"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Your phone number"
                        required
                        className="bg-slate-900"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Payment Method <span className="text-red-500">*</span></Label>
                      <RadioGroup 
                        value={paymentMethod} 
                        onValueChange={setPaymentMethod}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === "kpay" 
                            ? 'border-brand-blue bg-brand-blue/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}>
                          <RadioGroupItem value="kpay" id="kpay" className="sr-only" />
                          <Label htmlFor="kpay" className="flex flex-col items-center gap-2 cursor-pointer">
                            <span className="text-sm font-medium">KBZ Pay</span>
                          </Label>
                        </div>
                        
                        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === "wave" 
                            ? 'border-brand-blue bg-brand-blue/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}>
                          <RadioGroupItem value="wave" id="wave" className="sr-only" />
                          <Label htmlFor="wave" className="flex flex-col items-center gap-2 cursor-pointer">
                            <span className="text-sm font-medium">Wave Pay</span>
                          </Label>
                        </div>
                        
                        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === "bank" 
                            ? 'border-brand-blue bg-brand-blue/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}>
                          <RadioGroupItem value="bank" id="bank" className="sr-only" />
                          <Label htmlFor="bank" className="flex flex-col items-center gap-2 cursor-pointer">
                            <span className="text-sm font-medium">Bank Transfer</span>
                          </Label>
                        </div>
                        
                        <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          paymentMethod === "cash" 
                            ? 'border-brand-blue bg-brand-blue/10' 
                            : 'border-slate-700 hover:border-slate-600'
                        }`}>
                          <RadioGroupItem value="cash" id="cash" className="sr-only" />
                          <Label htmlFor="cash" className="flex flex-col items-center gap-2 cursor-pointer">
                            <span className="text-sm font-medium">Cash</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="transactionId">Transaction ID / Reference</Label>
                      <Input
                        id="transactionId"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="If applicable, enter transaction ID"
                        className="bg-slate-900"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="additionalInfo">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        placeholder="Any additional information about your payment"
                        className="bg-slate-900"
                      />
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            Complete Purchase ({selectedPkg?.price.toLocaleString()} Ks)
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <Card className="border border-green-600/30 bg-green-950/20">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center">
                  <Check className="h-6 w-6 mr-2" />
                  Payment Request Submitted
                </CardTitle>
                <CardDescription className="text-slate-300">
                  We've received your payment request for {selectedPkg?.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertTitle>What happens next?</AlertTitle>
                  <AlertDescription>
                    Our team will verify your payment and activate your credits within 24 hours. 
                    You'll receive a notification when your credits are added to your account.
                  </AlertDescription>
                </Alert>
                
                <div className="text-center space-y-4 pt-4">
                  <p className="text-white">Need assistance? Contact us directly:</p>
                  
                  <div className="flex justify-center gap-4">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>+95 9876543210</span>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Viber</span>
                    </Button>
                    
                    <Button variant="outline" className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Telegram</span>
                    </Button>
                  </div>
                  
                  <div className="pt-4">
                    <Button onClick={() => navigate("/create")} className="mr-4">
                      Return to Create
                    </Button>
                    <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                      Make Another Purchase
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-center text-sm text-slate-500">
                Payment ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}
              </CardFooter>
            </Card>
          </div>
        )}
      </main>
      
      <footer className="py-6 border-t border-slate-700/50 bg-slate-900/70 backdrop-blur-sm mt-16">
        <div className="container text-center text-slate-400 max-w-6xl mx-auto">
          <p>© {new Date().getFullYear()} YoteShin AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default BuyCredits;
