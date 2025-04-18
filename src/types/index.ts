
export interface StoryScene {
  text: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface CharacterDetails {
  mainCharacter?: string;
  secondaryCharacters?: string;
  environment?: string;
  styleNotes?: string;
  [key: string]: string | undefined;
}
