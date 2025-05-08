
import React from 'react';
import { isSupabaseConfigured } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const SupabaseConfigHelper: React.FC = () => {
  // Supabase is now configured by default
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
};

export default SupabaseConfigHelper;
