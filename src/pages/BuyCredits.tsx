
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, Send, ArrowLeft, ImageIcon, VideoIcon, Bot, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CreditPackage {
  id: string;
  name: string;
  price: number;
  imageCredits: number;
  videoCredits: number;
  priceInKyat: number;
}

const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "basic",
    name: "Basic",
    price: 60000,
    imageCredits: 100,
    videoCredits: 20,
    priceInKyat: 60000
  },
  {
    id: "standard",
    name: "Standard",
    price: 100000,
    imageCredits: 200,
    videoCredits: 40,
    priceInKyat: 100000
  },
  {
    id: "premium",
    name: "Premium",
    price: 150000,
    imageCredits: 350,
    videoCredits: 70,
    priceInKyat: 150000
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 250000,
    imageCredits: 700,
    videoCredits: 140,
    priceInKyat: 250000
  }
];

const BuyCredits = () => {
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { toast } = useToast();

  const ExternalLinkButton = ({ 
    href, 
    children, 
    className 
  }: { 
    href: string; 
    children: React.ReactNode; 
    className?: string 
  }) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="block w-full" 
    >
      <Button 
        type="button"
        className={className}
      >
        {children}
      </Button>
    </a>
  );

  const handlePaymentClick = (packageId: string) => {
    setSelectedPackage(packageId);
    navigate("/offline-payment", { state: { packageId } });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-8 text-center">Buy Credits</h1>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {CREDIT_PACKAGES.map((pkg) => (
          <Card key={pkg.id} className={`shadow-md transition-all duration-300 ${selectedPackage === pkg.id ? 'ring-2 ring-brand-purple' : ''}`}>
            <CardHeader className={`${pkg.id === 'premium' ? 'bg-gradient-to-r from-brand-purple to-brand-blue text-white' : ''} rounded-t-lg`}>
              <CardTitle className="text-center">{pkg.name} Package</CardTitle>
              <CardDescription className={`text-center text-lg font-semibold ${pkg.id === 'premium' ? 'text-white' : ''}`}>
                {pkg.priceInKyat.toLocaleString()} Ks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 py-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ImageIcon className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                  <span><strong>{pkg.imageCredits}</strong> image credits</span>
                </li>
                <li className="flex items-start">
                  <VideoIcon className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                  <span><strong>{pkg.videoCredits}</strong> video credits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>No watermarks</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Access to all features</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => handlePaymentClick(pkg.id)} 
                className="w-full bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Now
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-6 text-center">Contact Us Directly</h2>
        <div className="flex flex-wrap justify-center gap-4">
          <ExternalLinkButton 
            href="viber://chat?number=+959740807009"
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
          >
            <Phone className="h-4 w-4" />
            Viber Contact (09740807009)
          </ExternalLinkButton>
          
          <ExternalLinkButton 
            href="https://m.me/infinitytechmyanmar"
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Messenger Contact
          </ExternalLinkButton>
          
          <ExternalLinkButton 
            href="https://t.me/+959740807009"
            className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white transition-colors"
          >
            <Send className="h-4 w-4" />
            Telegram Contact (09740807009)
          </ExternalLinkButton>
        </div>
      </div>
    </div>
  );
};

export default BuyCredits;
