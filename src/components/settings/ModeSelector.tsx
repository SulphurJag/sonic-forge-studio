
import React from 'react';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModeSelectorProps {
  mode: string;
  onModeChange: (mode: string) => void;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ 
  mode, 
  onModeChange, 
  disabled = false 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="mode">Processing Mode</Label>
      <Select 
        disabled={disabled} 
        value={mode} 
        onValueChange={onModeChange}
      >
        <SelectTrigger id="mode" className="bg-moroder-dark border border-moroder-primary/20">
          <SelectValue placeholder="Select mode" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="music">Music</SelectItem>
          <SelectItem value="podcast">Podcast</SelectItem>
          <SelectItem value="vocal">Vocal Stem</SelectItem>
          <SelectItem value="instrumental">Instrumental Stem</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModeSelector;
