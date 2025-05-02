
import React from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import SettingsTooltip from './SettingsTooltip';

interface SwitchWithLabelProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  tooltip?: React.ReactNode;
  icon?: React.ReactNode;
}

const SwitchWithLabel: React.FC<SwitchWithLabelProps> = ({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  tooltip,
  icon
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Label htmlFor={id} className="cursor-pointer">
          {label}
        </Label>
        {tooltip && <SettingsTooltip icon={icon}>{tooltip}</SettingsTooltip>}
      </div>
      <Switch
        id={id}
        disabled={disabled}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

export default SwitchWithLabel;
