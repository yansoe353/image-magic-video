
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Available LoRAs for flux-lora model
export const AVAILABLE_LORAS = [
  { id: "anime", name: "Anime Style", description: "Anime art style" },
  { id: "photorealistic", name: "Photorealistic", description: "Ultra realistic photos" },
  { id: "illustration", name: "Illustration", description: "Illustrated art style" },
  { id: "concept", name: "Concept Art", description: "Professional concept art" },
  { id: "painting", name: "Painting", description: "Traditional painting style" },
  { id: "3d", name: "3D Render", description: "3D rendered models" },
];

export type LoraOption = typeof AVAILABLE_LORAS[number]['id'];

interface StyleModifiersProps {
  selectedLoras: LoraOption[];
  onToggleLora: (lora: LoraOption) => void;
  disabled?: boolean;
}

export const StyleModifiers = ({ selectedLoras, onToggleLora, disabled }: StyleModifiersProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Style Modifiers (LoRAs)</label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {AVAILABLE_LORAS.map((lora) => (
          <div key={lora.id} className="flex items-start space-x-2">
            <Checkbox 
              id={`lora-${lora.id}`}
              checked={selectedLoras.includes(lora.id as LoraOption)}
              onCheckedChange={() => onToggleLora(lora.id as LoraOption)}
              disabled={disabled}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor={`lora-${lora.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {lora.name}
              </label>
              <p className="text-xs text-slate-500">
                {lora.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {selectedLoras.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLoras.map(lora => (
            <Badge key={lora} variant="outline" onClick={() => !disabled && onToggleLora(lora)} className={disabled ? "opacity-50" : "cursor-pointer"}>
              {AVAILABLE_LORAS.find(l => l.id === lora)?.name}
              <span className="ml-1">×</span>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
