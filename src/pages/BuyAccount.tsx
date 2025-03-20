
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, Send, ArrowLeft, ImageIcon, VideoIcon } from "lucide-react";
import BuyApiKey from "@/components/api-key/BuyApiKeyPopover";

const BuyAccount = () => {
  const navigate = useNavigate();

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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <Button 
        variant="outline" 
        className="mb-6" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-8 text-center">Premium Account</h1>
      
      <div className="flex justify-center">
        <Card className="shadow-md border-brand-purple max-w-lg w-full">
          <CardHeader className="bg-gradient-to-r from-brand-purple to-brand-blue text-white rounded-t-lg">
            <CardTitle className="text-center">Premium Account</CardTitle>
            <CardDescription className="text-center text-lg font-semibold text-white">
              60000 Ks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 py-6">
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Full access to all features</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Unlimited Image Generation in Playground</span>
              </li>
              <li className="flex items-start">
                <ImageIcon className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                <span><strong>100</strong> Pro image generations</span>
              </li>
              <li className="flex items-start">
                <VideoIcon className="h-5 w-5 text-brand-purple mr-2 flex-shrink-0" />
                <span><strong>20</strong> video generations</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Priority support</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>No watermarks</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>API access for business integration</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex-col space-y-4">
            <div className="w-full text-center mb-2">
              <BuyApiKey />
            </div>
            <div className="grid gap-2 w-full">
              <ExternalLinkButton 
                href="viber://chat?number=+959740807009"
                className="flex w-full items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                <Phone className="h-4 w-4" />
                Viber Contact (09740807009)
              </ExternalLinkButton>
              
              <ExternalLinkButton 
                href="https://m.me/infinitytechmyanmar"
                className="flex w-full items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Messenger Contact
              </ExternalLinkButton>
              
              <ExternalLinkButton 
                href="https://t.me/+959740807009"
                className="flex w-full items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white transition-colors"
              >
                <Send className="h-4 w-4" />
                Telegram Contact (09740807009)
              </ExternalLinkButton>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BuyAccount;
