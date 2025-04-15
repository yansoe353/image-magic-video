
import React from 'react';

// Simple utility to check if the user is likely from Myanmar
// In a production app, you might use a more sophisticated geolocation service

// Store the result to avoid checking multiple times
let isFromMyanmarCache: boolean | null = null;

export const checkIfUserIsFromMyanmar = async (): Promise<boolean> => {
  // Return cached result if available
  if (isFromMyanmarCache !== null) {
    return isFromMyanmarCache;
  }

  try {
    // Check for Myanmar time zone (Asia/Yangon)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === 'Asia/Rangoon' || timeZone === 'Asia/Yangon') {
      isFromMyanmarCache = true;
      return true;
    }

    // Check preferred language
    const languages = navigator.languages || [navigator.language];
    if (languages.some(lang => lang.toLowerCase().includes('my') || lang.toLowerCase().includes('myanmar'))) {
      isFromMyanmarCache = true;
      return true;
    }

    // Default to false if no indicators detected
    isFromMyanmarCache = false;
    return false;
  } catch (error) {
    console.error('Error detecting location:', error);
    return false;
  }
};

// React hook for components
export const useIsFromMyanmar = (): boolean => {
  const [isFromMyanmar, setIsFromMyanmar] = React.useState<boolean>(false);
  
  React.useEffect(() => {
    const checkLocation = async () => {
      const result = await checkIfUserIsFromMyanmar();
      setIsFromMyanmar(result);
    };
    
    checkLocation();
  }, []);
  
  return isFromMyanmar;
};
