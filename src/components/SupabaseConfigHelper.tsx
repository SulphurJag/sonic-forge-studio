
import React, { useEffect, useState } from 'react';
import { isSupabaseConfigured, checkDatabaseSchema } from '@/services/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, AlertTriangle, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DatabaseStatus {
  isSetup: boolean;
  error: string | null;
  isChecking: boolean;
}

const SupabaseConfigHelper: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>({
    isSetup: false,
    error: null,
    isChecking: true
  });

  const checkSchema = async () => {
    setDbStatus(prev => ({ ...prev, isChecking: true }));
    const result = await checkDatabaseSchema();
    setDbStatus({
      isSetup: result.isSetup,
      error: result.error,
      isChecking: false
    });
  };

  useEffect(() => {
    checkSchema();
  }, []);

  if (!isSupabaseConfigured()) {
    return (
      <Card className="bg-moroder-dark/40 border-amber-500/20">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Configuration required</CardDescription>
          </div>
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p className="flex items-center text-amber-500">
              <AlertTriangle className="h-4 w-4 mr-2" /> 
              Supabase not configured
            </p>
            <p className="text-muted-foreground">
              Please provide your Supabase URL and Anonymous Key.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-moroder-dark/40 border-green-500/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Supabase Connection</CardTitle>
          <CardDescription>Connection and database status</CardDescription>
        </div>
        <CheckCircle className="h-5 w-5 text-green-500" />
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-3">
          <p className="flex items-center text-green-500">
            <CheckCircle className="h-4 w-4 mr-2" /> 
            Successfully connected to Supabase
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              <span>Database Schema:</span>
            </div>
            {dbStatus.isChecking ? (
              <span className="text-muted-foreground">Checking...</span>
            ) : dbStatus.isSetup ? (
              <span className="text-green-500">✓ Ready</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-500">⚠ Setup Required</span>
                <Button size="sm" variant="outline" onClick={checkSchema}>
                  Retry
                </Button>
              </div>
            )}
          </div>
          
          {dbStatus.error && !dbStatus.isSetup && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded p-2">
              <p className="text-amber-500 text-xs">
                Database setup required. Please run the SQL migration in your Supabase dashboard.
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                See DATABASE_SETUP.md for instructions.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SupabaseConfigHelper;
