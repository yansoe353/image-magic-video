
import { useState, useEffect } from "react";
import { Github, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import ApiKeyInput from "@/components/ApiKeyInput";
import { fal } from "@fal-ai/client";

const Header = () => {
  const [isApiKeySet, setIsApiKeySet] = useState(false);

  useEffect(() => {
    // Check if API key is already set in localStorage
    const storedApiKey = localStorage.getItem("falApiKey");
    if (storedApiKey) {
      try {
        // Configure fal.ai client with the API key
        fal.config({
          credentials: storedApiKey
        });
        setIsApiKeySet(true);
      } catch (error) {
        console.error("Error configuring fal.ai client:", error);
      }
    }
  }, []);

  return (
    <header className="w-full border-b border-slate-200 bg-white">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-purple to-brand-blue">
            Magic Video
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ApiKeyInput onApiKeySet={setIsApiKeySet} />
          
          {isApiKeySet && (
            <span className="text-xs text-green-600 mr-2">
              API Key Set
            </span>
          )}
          
          <Button variant="outline" size="icon" asChild>
            <a 
              href="https://github.com/your-username/ai-video-generator"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
