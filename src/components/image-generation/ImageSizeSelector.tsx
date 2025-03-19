
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export const IMAGE_SIZES = {
  square: "Square (1:1)",
  square_hd: "Square HD (1:1)",
  portrait_4_3: "Portrait (4:3)",
  portrait_16_9: "Portrait (16:9)",
  landscape_4_3: "Landscape (4:3)",
  landscape_16_9: "Landscape (16:9)",
};

export type ImageSizeOption = keyof typeof IMAGE_SIZES;

interface ImageSizeSelectorProps {
  value: ImageSizeOption;
  onChange: (size: ImageSizeOption) => void;
  disabled?: boolean;
}

export const ImageSizeSelector = ({ value, onChange, disabled }: ImageSizeSelectorProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Image Size</label>
      <Select 
        value={value} 
        onValueChange={(newValue: ImageSizeOption) => onChange(newValue)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select size" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(IMAGE_SIZES).map(([sizeValue, label]) => (
            <SelectItem key={sizeValue} value={sizeValue}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
