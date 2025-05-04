
import React from 'react';
import { Cpu } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AIMainControlProps {
  enableAI: boolean;
  handleEnableAI: (value: boolean) => void;
  disabled?: boolean;
  isInitializing: boolean;
}

const AIMainControl: React.FC<AIMainControlProps> = ({
  enableAI,
  handleEnableAI,
  disabled = false,
  isInitializing
}) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-col">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Cpu className="h-4 w-4" /> AI Audio Processing
          <span className="inline-flex items-center rounded-md bg-moroder-accent/20 px-2 py-0.5 text-xs font-medium text-moroder-accent">
            Beta
          </span>
        </h3>
        <p className="text-xs text-muted-foreground max-w-[300px] mt-1">
          Advanced AI-powered processing for superior audio quality
        </p>
      </div>
      <Switch
        id="enable-ai"
        disabled={disabled || isInitializing}
        checked={enableAI}
        onCheckedChange={handleEnableAI}
      />
    </div>
  );
};

export default AIMainControl;
