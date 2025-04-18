
export const geminiImagePromptTemplate = (prompt: string, options: { 
  negative_prompt?: string;
  style?: string;
} = {}) => {
  const { style, negative_prompt } = options;
  
  let enhancedPrompt = `Generate a high-quality, detailed image of: ${prompt}`;
  
  if (style) {
    enhancedPrompt += `\nStyle: ${style}`;
  }
  
  if (negative_prompt) {
    enhancedPrompt += `\nAvoid: ${negative_prompt}`;
  }
  
  enhancedPrompt += "\nEnsure high resolution, good lighting, and clear details.";
  
  return enhancedPrompt;
};
