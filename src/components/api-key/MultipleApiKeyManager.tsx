import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExternalLink, Key, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface ApiKey {
  name: string;
  value: string;
  isDefault?: boolean;
}

interface MultipleApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  storageKeyPrefix: string;
  learnMoreLink?: string;
}

export const MultipleApiKeyManager = ({
  isOpen,
  onClose,
  serviceName,
  storageKeyPrefix,
  learnMoreLink
}: MultipleApiKeyManagerProps) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadSavedKeys();
    }
  }, [isOpen]);

  const loadSavedKeys = () => {
    try {
      // Check for direct key
      const directKey = localStorage.getItem(storageKeyPrefix);
      
      // Check for key list
      const savedKeysJson = localStorage.getItem(`${storageKeyPrefix}_list`);
      let savedKeys: ApiKey[] = [];
      
      if (savedKeysJson) {
        savedKeys = JSON.parse(savedKeysJson);
      } else if (directKey) {
        // If only direct key exists, convert to list format
        savedKeys = [
          { name: "Default", value: directKey, isDefault: true }
        ];
      }
      
      setApiKeys(savedKeys);
    } catch (error) {
      console.error("Failed to load saved API keys", error);
      setApiKeys([]);
    }
  };

  const handleAddKey = () => {
    if (!newKeyName.trim() || !newKeyValue.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both a name and value for your API key",
        variant: "destructive",
      });
      return;
    }

    const updatedKeys = [
      ...apiKeys, 
      { 
        name: newKeyName, 
        value: newKeyValue,
        isDefault: apiKeys.length === 0 // First key is default
      }
    ];
    
    saveKeys(updatedKeys);
    setNewKeyName("");
    setNewKeyValue("");
    
    toast({
      title: "API Key Added",
      description: `${newKeyName} API key has been added successfully`,
    });
  };

  const handleRemoveKey = (index: number) => {
    const updatedKeys = [...apiKeys];
    const removedKey = updatedKeys[index];
    updatedKeys.splice(index, 1);
    
    // If we removed the default key, make the first remaining key default
    if (removedKey.isDefault && updatedKeys.length > 0) {
      updatedKeys[0].isDefault = true;
    }
    
    saveKeys(updatedKeys);
    
    toast({
      title: "API Key Removed",
      description: `${removedKey.name} API key has been removed`,
    });
  };

  const handleSetDefault = (index: number) => {
    const updatedKeys = apiKeys.map((key, i) => ({
      ...key,
      isDefault: i === index
    }));
    
    saveKeys(updatedKeys);
    
    toast({
      title: "Default Key Updated",
      description: `${apiKeys[index].name} is now the default API key`,
    });
  };

  const saveKeys = (keys: ApiKey[]) => {
    try {
      // Save the list
      localStorage.setItem(`${storageKeyPrefix}_list`, JSON.stringify(keys));
      
      // Also save default key to the direct key location for backward compatibility
      const defaultKey = keys.find(key => key.isDefault);
      if (defaultKey) {
        localStorage.setItem(storageKeyPrefix, defaultKey.value);
      } else if (keys.length > 0) {
        // If no default but keys exist, use first
        localStorage.setItem(storageKeyPrefix, keys[0].value);
      } else {
        // If no keys, remove the direct key
        localStorage.removeItem(storageKeyPrefix);
      }
      
      // Also save the fallback key (second non-default key)
      const nonDefaultKeys = keys.filter(key => !key.isDefault);
      if (nonDefaultKeys.length > 0) {
        localStorage.setItem(`fallback${storageKeyPrefix.charAt(0).toUpperCase() + storageKeyPrefix.slice(1)}`, nonDefaultKeys[0].value);
      } else {
        localStorage.removeItem(`fallback${storageKeyPrefix.charAt(0).toUpperCase() + storageKeyPrefix.slice(1)}`);
      }
      
      setApiKeys(keys);
    } catch (error) {
      console.error("Failed to save API keys", error);
      toast({
        title: "Error",
        description: "Failed to save API keys",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage {serviceName} API Keys</DialogTitle>
          <DialogDescription>
            Add and manage multiple API keys for {serviceName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Existing Keys */}
          <div className="space-y-2">
            <Label>Your API Keys</Label>
            {apiKeys.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">
                No API keys added yet
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {apiKeys.map((key, index) => (
                  <Card key={index} className="p-3 flex items-center justify-between">
                    <div className="flex-grow">
                      <div className="font-medium flex items-center">
                        {key.name}
                        {key.isDefault && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500">
                        {key.value.substring(0, 8)}...
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!key.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleSetDefault(index)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveKey(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Add New Key */}
          <div className="pt-4 border-t">
            <Label className="font-medium">Add New API Key</Label>
            <div className="grid grid-cols-1 gap-3 mt-2">
              <div>
                <Label htmlFor="newKeyName">Key Name</Label>
                <Input
                  id="newKeyName"
                  placeholder="e.g. Primary, Backup, etc."
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="newKeyValue">API Key</Label>
                <Input
                  id="newKeyValue"
                  type="password"
                  placeholder="Enter API key value"
                  value={newKeyValue}
                  onChange={(e) => setNewKeyValue(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleAddKey} 
                className="w-full mt-2"
              >
                <Plus className="mr-2 h-4 w-4" /> Add API Key
              </Button>
            </div>
          </div>
          
          {learnMoreLink && (
            <div className="text-sm text-center mt-4">
              <a
                href={learnMoreLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 flex items-center justify-center"
              >
                Learn more about getting an API key <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
