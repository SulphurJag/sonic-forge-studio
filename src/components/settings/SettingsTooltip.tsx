
import React from 'react';
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SettingsTooltipProps {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const SettingsTooltip: React.FC<SettingsTooltipProps> = ({ 
  children, 
  icon = <Info className="h-4 w-4 text-moroder-primary/60" /> 
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {icon}
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SettingsTooltip;
