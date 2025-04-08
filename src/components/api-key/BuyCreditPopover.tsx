
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Send, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CustomerSupportChat from "./CustomerSupportChat";
import { useNavigate } from "react-router-dom";

const BuyCreditPopover = () => {
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
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="link" 
          className="p-0 text-brand-blue hover:underline h-auto"
        >
          Buy more credits
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-center">Buy Additional Credits</SheetTitle>
          <SheetDescription className="text-center">
            <p className="font-bold text-xl mb-4">Starting from 60000 Ks</p>
          </SheetDescription>
        </SheetHeader>
        
        <div className="grid gap-4 py-4">
          <Button
            onClick={() => navigate("/buy-credits")}
            className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-brand-purple to-brand-blue hover:opacity-90 text-white transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            View Credit Packages
          </Button>
          
          <h3 className="font-medium mb-2 text-center">Contact us directly:</h3>
          
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
          
          <div className="mt-2">
            <CustomerSupportChat />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BuyCreditPopover;
