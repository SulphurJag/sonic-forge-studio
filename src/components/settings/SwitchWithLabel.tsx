
import React from 'react';
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SwitchWithLabelProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconColor?: string;
  tooltip?: React.ReactNode;
  beta?: boolean;
}

const SwitchWithLabel: React.FC<SwitchWithLabelProps> = ({
  id,
  label,
  checked,
  onCheckedChange,
  disabled = false,
  icon,
  iconColor = "text-blue-500/70",
  tooltip,
  beta = false
}) => {
  return (
    <div className="flex items-center justify-between">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              {icon && <span className={iconColor}>{icon}</span>}
              <label
                htmlFor={id}
                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${disabled ? 'text-muted-foreground' : ''}`}
              >
                {label}
              </label>
              {beta && (
                <span className="inline-flex items-center rounded-md bg-moroder-accent/20 px-2 py-0.5 text-xs font-medium text-moroder-accent">
                  Beta
                </span>
              )}
            </div>
          </TooltipTrigger>
          {tooltip && (
            <TooltipContent>
              <div className="max-w-xs text-xs">{tooltip}</div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

export default SwitchWithLabel;
