
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Bot, User, Loader2, SendHorizontal, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGeminiAPI } from "@/hooks/useGeminiAPI";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI assistant. I can help you create images and videos. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("GEMINI_API_KEY") || "");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { generateResponse, isLoading } = useGeminiAPI({ apiKey });

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please set your Gemini API key in settings",
        variant: "destructive",
      });
      setIsSettingsOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      // Call the Gemini API
      const response = await generateResponse(`
As an AI assistant specializing in helping users create images and videos, please respond to the following user query:
${input}

Focus on:
1. Tips for creating better image prompts
2. Techniques for video creation and editing
3. Creative ideas for visual content
4. How to use the platform's features effectively

Keep responses concise, practical, and helpful for creative work.
      `);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error processing message:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to get a response. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const saveApiKey = () => {
    localStorage.setItem("GEMINI_API_KEY", apiKey);
    setIsSettingsOpen(false);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved",
    });
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>
          <Button
            size="icon"
            variant="outline"
            className="rounded-full h-12 w-12 fixed bottom-4 right-4 shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Bot className="h-6 w-6" />
          </Button>
        </DrawerTrigger>
        <DrawerContent className="h-[85vh] sm:h-[70vh] max-w-[450px] mx-auto rounded-t-lg">
          <DrawerHeader className="flex justify-between items-center">
            <DrawerTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI Assistant</span>
            </DrawerTitle>
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>AI Assistant Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">Gemini API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your Gemini API key"
                    />
                    <p className="text-xs text-muted-foreground">
                      Get your API key from{" "}
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={saveApiKey}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </DrawerHeader>
          
          <ScrollArea className="flex-1 p-4 h-[calc(85vh-160px)] sm:h-[calc(70vh-160px)]">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      message.role === "assistant" ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <Avatar className={`h-8 w-8 ${message.role === "user" ? "bg-blue-500" : "bg-emerald-500"}`}>
                      {message.role === "assistant" ? (
                        <Bot className="h-4 w-4 text-white" />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </Avatar>
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "assistant"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <DrawerFooter>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Ask me about creating images or videos..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizontal className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
