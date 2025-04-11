
import { StoryScene, CharacterDetails } from '@/types';

export const generateStoryTextFile = (
  title: string,
  scenes: StoryScene[],
  characterDetails?: CharacterDetails
): string => {
  let content = `# ${title}\n\n`;
  content += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
  
  // Add character details if available
  if (characterDetails && Object.keys(characterDetails).length > 0) {
    content += "## Character Details\n\n";
    
    for (const [key, value] of Object.entries(characterDetails)) {
      if (value) {
        // Format the key to be more readable
        const formattedKey = key.replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
        
        content += `**${formattedKey}:** ${value}\n\n`;
      }
    }
  }
  
  // Add each scene to the text content
  content += "## Story Scenes\n\n";
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    content += `### Scene ${i + 1}\n\n`;
    content += `${scene.text}\n\n`;
    
    if (scene.imagePrompt) {
      content += `Image Prompt: ${scene.imagePrompt}\n\n`;
    }
  }
  
  return content;
};

export const downloadTextFile = (content: string, filename: string): void => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
};
