
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Available style modifiers
const STYLE_MODIFIERS = [
  { id: "anime", name: "Anime", description: "Japanese animation style" },
  { id: "photorealistic", name: "Photorealistic", description: "Ultra realistic photos" },
  { id: "illustration", name: "Illustration", description: "Illustrated art style" },
  { id: "concept", name: "Concept Art", description: "Professional concept art" },
  { id: "painting", name: "Painting", description: "Traditional painting style" },
  { id: "3d", name: "3D Render", description: "3D rendered models" },
];

interface StyleModifiersProps {
  styleModifier: string;
  setStyleModifier: (value: string) => void;
  disabled?: boolean;
}

export const StyleModifiers = ({ styleModifier, setStyleModifier, disabled }: StyleModifiersProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Style Modifier</label>
      <Select 
        value={styleModifier} 
        onValueChange={setStyleModifier}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a style" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">None</SelectItem>
          {STYLE_MODIFIERS.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              {style.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {styleModifier && (
        <Badge 
          variant="outline" 
          onClick={() => !disabled && setStyleModifier("")} 
          className={`mt-2 ${disabled ? "opacity-50" : "cursor-pointer"}`}
        >
          {STYLE_MODIFIERS.find(s => s.id === styleModifier)?.name}
          <span className="ml-1">×</span>
        </Badge>
      )}
    </div>
  );
};
