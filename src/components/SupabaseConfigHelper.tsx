
import React, { useState } from 'react';
import { isSupabaseConfigured } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Copy, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SupabaseConfigHelper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  const handleSaveToLocalStorage = () => {
    if (!url || !key) {
      toast({
        title: "Missing Information",
        description: "Please enter both URL and Anonymous Key",
        variant: "destructive"
      });
      return;
    }

    localStorage.setItem('VITE_SUPABASE_URL', url);
    localStorage.setItem('VITE_SUPABASE_ANON_KEY', key);
    
    toast({
      title: "Settings Saved",
      description: "Supabase credentials saved to local storage. Please refresh the page.",
    });
  };

  const handleCopyConfig = () => {
    const configText = `
# Add these to your .env file
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`;
    
    navigator.clipboard.writeText(configText);
    toast({
      title: "Copied to Clipboard",
      description: "Environment variables template copied",
    });
  };

  if (isSupabaseConfigured()) {
    return (
      <Card className="bg-moroder-dark/40 border-green-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Connection status information</CardDescription>
          </div>
          <CheckCircle className="h-5 w-5 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p className="flex items-center text-green-500">
              <CheckCircle className="h-4 w-4 mr-2" /> 
              Successfully connected to Supabase
            </p>
            <p className="text-muted-foreground">
              Your application is properly configured with Supabase credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-moroder-dark/40 border-amber-500/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Supabase Setup Required</CardTitle>
          <CardDescription>Configure your Supabase connection</CardDescription>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </CardHeader>
      <CardContent className="space-y-4">
        {showInstructions && (
          <div className="rounded-md bg-amber-500/10 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Info className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-500">Setup Instructions</h3>
                <div className="mt-2 text-sm text-amber-400/90">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Sign up or log in to <a href="https://supabase.com" className="text-blue-400 underline" target="_blank" rel="noreferrer">Supabase</a></li>
                    <li>Create a new project</li>
                    <li>Go to Settings → API in the Supabase dashboard</li>
                    <li>Copy your "Project URL" and "anon/public" key</li>
                    <li>Enter these values below or add to your environment variables</li>
                  </ol>
                </div>
                <div className="mt-2 text-xs text-amber-400/70">
                  <Button variant="link" size="sm" className="p-0 h-auto text-amber-400/70" onClick={() => setShowInstructions(false)}>
                    Hide instructions
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid w-full gap-2">
            <Label htmlFor="supabase-url">Supabase URL</Label>
            <Input 
              type="text" 
              id="supabase-url" 
              placeholder="https://xxxxxxxxxxxx.supabase.co" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-moroder-dark/60"
            />
          </div>
          
          <div className="grid w-full gap-2">
            <Label htmlFor="supabase-key">Anonymous Key</Label>
            <Input 
              type="text" 
              id="supabase-key" 
              placeholder="eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" 
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="bg-moroder-dark/60"
            />
          </div>
        </div>
        
        <div className="flex flex-col space-y-2 pt-2">
          <Button 
            onClick={handleSaveToLocalStorage}
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            Save to LocalStorage & Refresh
          </Button>
          
          <div className="text-xs text-muted-foreground text-center px-4 py-2">
            <p>This will store your Supabase credentials in your browser's local storage.</p>
            <p>For production, add these values to your environment variables.</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleCopyConfig}
            className="flex items-center mt-2"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy .env template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseConfigHelper;
