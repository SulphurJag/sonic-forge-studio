
import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, Settings, Upload, ListOrdered } from "lucide-react";
import { useNavigate, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleTabChange = (tab: string) => {
    if (tab === 'queue') {
      // Set the tab in the URL or use state management to show the queue tab
      navigate('/?tab=queue');
    } else if (tab === 'settings') {
      navigate('/?tab=settings');
    } else if (tab === 'upload') {
      navigate('/');
    }
  };
  
  return (
    <header className="w-full py-4 px-6 flex items-center justify-between border-b border-moroder-primary/20">
      <div className="flex items-center space-x-2">
        <Volume2 className="h-6 w-6 text-moroder-primary" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-moroder-primary to-moroder-accent bg-clip-text text-transparent">
          Moroder Audio Mastering Suite
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleTabChange('queue')}
        >
          <ListOrdered className="h-4 w-4 mr-2" />
          Queue
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => handleTabChange('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          className="bg-moroder-primary hover:bg-moroder-primary/90"
          onClick={() => handleTabChange('upload')}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Audio
        </Button>
      </div>
    </header>
  );
};

export default Header;
