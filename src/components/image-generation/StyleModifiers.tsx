import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Define the CustomLora type
export type CustomLora = {
  path: string;
  weight: number;
};

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
  customLoras: CustomLora[];
  onToggleLora: (lora: LoraOption) => void;
  onUpdateWeight: (lora: LoraOption, weight: number) => void;
  onAddCustomLora: (path: string, weight: number) => void;
  onRemoveCustomLora: (path: string) => void;
  disabled?: boolean;
}

export const StyleModifiers = ({ selectedLoras, customLoras, onToggleLora, onUpdateWeight, onAddCustomLora, onRemoveCustomLora, disabled }: StyleModifiersProps) => {
  const [customPath, setCustomPath] = useState("");
  const [customWeight, setCustomWeight] = useState(1.0);

  const handleAddCustomLora = () => {
    if (customPath.trim() !== "") {
      onAddCustomLora(customPath, customWeight);
      setCustomPath("");
      setCustomWeight(1.0);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Style Modifiers (LoRAs)</label>
      <div className="grid grid-cols-2 gap-2 mt-1">
        {AVAILABLE_LORAS.map((lora) => {
          const selectedLora = selectedLoras.find(sl => sl === lora.id);
          return (
            <div key={lora.id} className="flex items-start space-x-2">
              <Checkbox
                id={`lora-${lora.id}`}
                checked={!!selectedLora}
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
                {selectedLora && (
                  <input
                    type="number"
                    value={selectedLoras.find(sl => sl === lora.id)?.weight || 1.0}
                    onChange={(e) => onUpdateWeight(lora.id as LoraOption, Number(e.target.value))}
                    className="mt-1 p-1 border border-gray-300 rounded-md"
                    disabled={disabled}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {customLoras.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {customLoras.map((lora, index) => (
            <Badge key={index} variant="outline" onClick={() => !disabled && onRemoveCustomLora(lora.path)} className={disabled ? "opacity-50" : "cursor-pointer"}>
              {lora.path} (Weight: {lora.weight})
              <span className="ml-1">×</span>
            </Badge>
          ))}
        </div>
      )}
      <div className="mt-4">
        <label className="text-sm font-medium mb-2 block">Add Custom LoRA</label>
        <input
          type="text"
          value={customPath}
          onChange={(e) => setCustomPath(e.target.value)}
          placeholder="LoRA Path"
          className="p-2 border border-gray-300 rounded-md mb-2"
          disabled={disabled}
        />
        <input
          type="number"
          value={customWeight}
          onChange={(e) => setCustomWeight(Number(e.target.value))}
          placeholder="Weight"
          className="p-2 border border-gray-300 rounded-md mb-2"
          disabled={disabled}
        />
        <button
          onClick={handleAddCustomLora}
          className="p-2 bg-blue-500 text-white rounded-md"
          disabled={disabled}
        >
          Add Custom LoRA
        </button>
      </div>
    </div>
  );
};
