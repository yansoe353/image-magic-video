
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCircle, Phone, Send } from "lucide-react";
import CustomerSupportChat from "./CustomerSupportChat";

const BuyApiKeyPopover = () => {
  // Create direct link components instead of using click handlers
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
      className="block w-full" // Make the entire area clickable
    >
      <Button 
        type="button"
        className={className}
        onClick={(e) => e.preventDefault()} // Prevent any button default behavior
      >
        {children}
      </Button>
    </a>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="link" 
          className="p-0 text-brand-blue hover:underline h-auto"
        >
          Get an API key from Infinity
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4">
        <div className="space-y-4">
          <h3 className="font-semibold text-center text-lg">Buy Infinity API Key</h3>
          <div className="text-center">
            <p className="font-bold text-xl mb-4">Price: 50000 Ks</p>
            <div className="grid grid-cols-1 gap-2">
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
              
              <CustomerSupportChat />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default BuyApiKeyPopover;
