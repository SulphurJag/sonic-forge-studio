
import React from 'react';
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import SettingsTooltip from './SettingsTooltip';

interface SliderWithLabelProps {
  id?: string;
  label: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  disabled?: boolean;
  tooltip?: React.ReactNode;
  unit?: string;
  icon?: React.ReactNode;
  valueLabel?: string;
}

const SliderWithLabel: React.FC<SliderWithLabelProps> = ({
  id,
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  disabled = false,
  tooltip,
  unit = '',
  icon,
  valueLabel
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Label htmlFor={id}>{label}</Label>
          {tooltip && <SettingsTooltip icon={icon}>{tooltip}</SettingsTooltip>}
        </div>
        <span className="text-sm text-muted-foreground">
          {valueLabel || `${value[0]}${unit}`}
        </span>
      </div>
      <Slider
        id={id}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onValueChange}
        className="py-2"
      />
    </div>
  );
};

export default SliderWithLabel;
