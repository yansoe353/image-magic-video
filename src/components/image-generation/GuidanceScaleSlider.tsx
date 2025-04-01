
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export interface GuidanceScaleSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const GuidanceScaleSlider = ({
  value,
  onChange,
  disabled = false,
  min = 1,
  max = 20,
  step = 0.5
}: GuidanceScaleSliderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="guidance-scale">Guidance Scale</Label>
        <span className="text-sm font-medium">{value}</span>
      </div>
      <Slider
        id="guidance-scale"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(values) => onChange(values[0])}
        disabled={disabled}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Less Creative</span>
        <span>More Accurate</span>
      </div>
    </div>
  );
};
