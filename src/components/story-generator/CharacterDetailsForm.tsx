
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Sparkles } from "lucide-react";
import { CharacterDetails } from "@/types";

interface CharacterDetailsFormProps {
  characterDetails: CharacterDetails;
  setCharacterDetails: (details: CharacterDetails) => void;
  setShowCharacterForm: (show: boolean) => void;
  generateCharacterTemplate: () => void;
  storyPrompt: string;
  isGeneratingStory: boolean;
}

const CharacterDetailsForm = ({
  characterDetails,
  setCharacterDetails,
  setShowCharacterForm,
  generateCharacterTemplate,
  storyPrompt,
  isGeneratingStory
}: CharacterDetailsFormProps) => {
  return (
    <Card className="mt-4">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-bold flex items-center">
          <User className="mr-2 h-5 w-5" />
          Character Details
        </h3>
        
        <div>
          <Label>Main Character</Label>
          <Textarea
            value={characterDetails.mainCharacter || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, mainCharacter: e.target.value})}
            placeholder="Detailed description of main character (appearance, clothing, etc.)"
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label>Secondary Characters</Label>
          <Textarea
            value={characterDetails.secondaryCharacters || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, secondaryCharacters: e.target.value})}
            placeholder="Descriptions of other important characters"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label>Environment</Label>
          <Textarea
            value={characterDetails.environment || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, environment: e.target.value})}
            placeholder="Description of the main setting/environment"
            className="min-h-[80px]"
          />
        </div>

        <div>
          <Label>Style Notes</Label>
          <Textarea
            value={characterDetails.styleNotes || ''}
            onChange={(e) => setCharacterDetails({...characterDetails, styleNotes: e.target.value})}
            placeholder="Any specific visual style requirements"
            className="min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={() => setShowCharacterForm(false)}
            variant="outline"
          >
            Done
          </Button>
          <Button 
            onClick={generateCharacterTemplate}
            disabled={!storyPrompt || isGeneratingStory}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Auto-Generate Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CharacterDetailsForm;
