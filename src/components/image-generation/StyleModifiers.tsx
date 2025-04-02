
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

// Available LoRAs for flux-lora model
export const AVAILABLE_LORAS = [
  { id: "anime", name: "Myanmar King", description: "Myanmar King Model", path: "https://v3.fal.media/files/zebra/b5PFVmWU1Juo4BVsmWphW_pytorch_lora_weights.safetensors", scale: 1.0 },
  { id: "photorealistic", name: "Photorealistic", description: "Ultra realistic photos", path: "path/to/photorealistic.weights", scale: 1.0 },
  { id: "illustration", name: "Illustration", description: "Illustrated art style", path: "path/to/illustration.weights", scale: 1.0 },
  { id: "concept", name: "Concept Art", description: "Professional concept art", path: "path/to/concept.weights", scale: 1.0 },
  { id: "painting", name: "Painting", description: "Traditional painting style", path: "path/to/painting.weights", scale: 1.0 },
  { id: "3d", name: "3D Render", description: "3D rendered models", path: "path/to/3d.weights", scale: 1.0 },
];

export type LoraOption = typeof AVAILABLE_LORAS[number]['id'];

interface StyleModifiersProps {
  selectedLoras: LoraOption[];
  onToggleLora: (lora: LoraOption) => void;
  loraScale: { [key: string]: number };
  onScaleChange: (lora: LoraOption, scale: number) => void;
  disabled?: boolean;
}

export const StyleModifiers = ({ selectedLoras = [], onToggleLora, loraScale = {}, onScaleChange, disabled }: StyleModifiersProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Style Modifiers (LoRAs)</label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {AVAILABLE_LORAS.map((lora) => (
          <div key={lora.id} className="flex items-start space-x-2">
            <Checkbox
              id={`lora-${lora.id}`}
              checked={selectedLoras && selectedLoras.includes(lora.id as LoraOption)}
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
              {selectedLoras && selectedLoras.includes(lora.id as LoraOption) && (
                <div className="flex items-center space-x-2">
                  <label htmlFor={`scale-${lora.id}`} className="text-xs">Scale:</label>
                  <input
                    type="number"
                    id={`scale-${lora.id}`}
                    value={loraScale[lora.id] || 1.0}
                    onChange={(e) => onScaleChange(lora.id as LoraOption, parseFloat(e.target.value))}
                    disabled={disabled}
                    className="text-xs border rounded px-2 py-1"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {selectedLoras && selectedLoras.length > 0 && (
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
