
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ImageSizeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: Record<string, { label: string, aspectRatio: string }>;
  disabled?: boolean;
}

export const ImageSizeSelector = ({
  value,
  onChange,
  options,
  disabled = false
}: ImageSizeSelectorProps) => {
  return (
    <div>
      <Label htmlFor="image-size" className="mb-2 block">Image Size</Label>
      <Select
        id="image-size"
        value={value}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select size" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(options).map(([key, { label }]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
