
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircle, SendHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  text: string;
  isUser: boolean;
  timestamp: Date;
};

const CustomerSupportChat = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! How can we help you with purchasing an API key?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const newMessage: Message = {
      text: message,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate response after a short delay
    setTimeout(() => {
      const responseMessage: Message = {
        text: "Thank you for your message. Our support team will get back to you soon via the email you provided.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, responseMessage]);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please provide your email so we can contact you.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Support Request Sent",
      description: "We've received your messages and will contact you soon.",
    });
    
    setOpen(false);
    // Reset states for next time
    setEmail("");
    setMessages([
      {
        text: "Hello! How can we help you with purchasing an API key?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)} 
        variant="outline"
        className="flex items-center gap-2 mt-2"
      >
        <MessageCircle className="h-4 w-4" />
        Chat with Support
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Support</DialogTitle>
            <DialogDescription>
              Chat with our team about purchasing an API key
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-80">
            <div className="flex-1 overflow-y-auto p-2 bg-gray-50 rounded-md mb-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`mb-2 p-2 rounded-lg ${
                    msg.isUser 
                      ? "bg-blue-100 ml-auto max-w-[80%]" 
                      : "bg-gray-200 mr-auto max-w-[80%]"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                onClick={handleSendMessage}
                className="self-end"
                size="icon"
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Label htmlFor="email">Your Email for Follow-up</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={handleSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CustomerSupportChat;
