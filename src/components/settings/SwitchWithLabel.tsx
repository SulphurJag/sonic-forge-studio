
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
  iconColor?: string;
  className?: string;
  beta?: boolean;
}

const SwitchWithLabel: React.FC<SwitchWithLabelProps> = ({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  tooltip,
  icon,
  iconColor = "text-moroder-primary/60",
  className = "",
  beta = false
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <Label htmlFor={id} className="cursor-pointer flex items-center gap-2">
          {label}
          {beta && (
            <span className="inline-flex items-center rounded-md bg-moroder-primary/20 px-2 py-0.5 text-xs font-medium">
              Beta
            </span>
          )}
        </Label>
        {tooltip && icon && (
          <SettingsTooltip>
            {React.cloneElement(icon as React.ReactElement, { className: `h-4 w-4 ${iconColor}` })}
            {tooltip}
          </SettingsTooltip>
        )}
        {tooltip && !icon && (
          <SettingsTooltip>{tooltip}</SettingsTooltip>
        )}
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
