
import React from 'react';
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SettingsTooltipProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
  sideOffset?: number;
  maxWidth?: string;
}

const SettingsTooltip: React.FC<SettingsTooltipProps> = ({ 
  children, 
  icon = <Info className="h-4 w-4 text-moroder-primary/60" />,
  sideOffset = 4,
  maxWidth = "300px"
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger>
          <span className="cursor-help">
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent 
          sideOffset={sideOffset} 
          className="bg-moroder-dark/90 border border-moroder-primary/20 text-moroder-light z-50"
          style={{ maxWidth }}
        >
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SettingsTooltip;
