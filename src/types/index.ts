
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

export interface VideoShort {
  id: string;
  title?: string;
  description?: string;
  script: string;
  videoUrl: string;
  thumbnailUrl: string;
  audioUrl: string;
  imageUrls: string[];
  captionsText?: string;
  isPublic: boolean;
  createdAt: string;
}

export interface VideoShortConfiguration {
  topic: string;
  voiceOption: string;
  videoStyle: string;
  addCaptions: boolean;
  isPublic: boolean;
}
