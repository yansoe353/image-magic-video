
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isAdmin } from "@/utils/authUtils";
import { falService } from "@/services/falService";
import { Loader2, Save, Key } from "lucide-react";

const ApiKeyManager = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [currentApiKey, setCurrentApiKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userIsAdmin, setUserIsAdmin] = useState<boolean>(false);
  const { toast } = useToast();
  
  // Check if user is admin and fetch current API key
  useEffect(() => {
    const initialize = async () => {
      // Check admin status
      const adminStatus = await isAdmin();
      setUserIsAdmin(adminStatus);
      
      if (!adminStatus) {
        toast({
          title: "Access Denied",
          description: "You need admin privileges to manage API keys",
          variant: "destructive",
        });
        return;
      }
      
      // Fetch current API key
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('api_keys')
          .select('key_value')
          .eq('key_name', 'fal_api_key')
          .single();
          
        if (!error && data) {
          // Mask the key for display
          const maskedKey = data.key_value.substring(0, 5) + '...' + 
                           data.key_value.substring(data.key_value.length - 5);
          setCurrentApiKey(maskedKey);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [toast]);
  
  // Save the API key to Supabase
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use falService to save the key to Supabase
      await falService.setApiKey(apiKey);
      
      // Mask the new key and update display
      const maskedKey = apiKey.substring(0, 5) + '...' + 
                        apiKey.substring(apiKey.length - 5);
      setCurrentApiKey(maskedKey);
      
      setApiKey(""); // Clear input field
      
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error("Failed to save API key:", error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Don't render anything if user is not admin
  if (!userIsAdmin) {
    return null;
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Key className="h-6 w-6 text-brand-purple" />
          <div>
            <CardTitle>FAL API Key Management</CardTitle>
            <CardDescription>
              Set the global FAL API key for all users
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentApiKey && (
          <div className="mb-4 p-3 bg-slate-100 rounded-md">
            <p className="text-sm font-medium text-slate-700">Current API Key</p>
            <p className="font-mono text-sm">{currentApiKey}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Enter New API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your FAL.AI API key"
            />
            <p className="text-xs text-slate-500">
              <a
                href="https://m.me/infinitytechmyanmar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Get your key from Infinity Tech
              </a>
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={saveApiKey} 
          disabled={isLoading || !apiKey.trim()}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save API Key
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyManager;
