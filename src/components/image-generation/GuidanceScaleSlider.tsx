
interface GuidanceScaleSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const GuidanceScaleSlider = ({ value, onChange, disabled }: GuidanceScaleSliderProps) => {
  return (
    <div>
      <label className="text-sm font-medium mb-2 block">Guidance Scale: {value}</label>
      <input
        type="range"
        min="1"
        max="20"
        step="0.5"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full"
        disabled={disabled}
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>Creative</span>
        <span>Precise</span>
      </div>
    </div>
  );
};
