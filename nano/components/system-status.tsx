"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, RefreshCw, Activity } from 'lucide-react';

interface SystemStatus {
  status: string;
  timestamp: string;
  environment: {
    GROQ_API_KEY: boolean;
    PINECONE_API_KEY: boolean;
    PINECONE_INDEX_NAME: boolean;
    PINECONE_HOST: boolean;
  };
  pinecone: {
    status: string;
    indexStats?: any;
    error?: string;
  };
  endpoints: Record<string, string>;
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/rag/status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data);
      } else {
        throw new Error(data.error || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const getStatusBadge = (isOk: boolean, label: string) => (
    <Badge variant={isOk ? "default" : "destructive"} className="flex items-center gap-1">
      {isOk ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
      {label}
    </Badge>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Checking system status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            System Status Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStatus} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!status) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
          <Button onClick={fetchStatus} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center gap-2">
          <span className="font-medium">Overall:</span>
          {getStatusBadge(status.status === 'ok', status.status === 'ok' ? 'Healthy' : 'Error')}
          <span className="text-sm text-gray-500">
            Last checked: {new Date(status.timestamp).toLocaleTimeString()}
          </span>
        </div>

        {/* Environment Variables */}
        <div>
          <h4 className="font-medium mb-2">Environment Configuration</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(status.environment).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{key}:</span>
                {getStatusBadge(value, value ? 'Set' : 'Missing')}
              </div>
            ))}
          </div>
        </div>

        {/* Pinecone Status */}
        <div>
          <h4 className="font-medium mb-2">Pinecone Database</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Connection:</span>
              {getStatusBadge(
                status.pinecone.status === 'connected',
                status.pinecone.status === 'connected' ? 'Connected' : 'Disconnected'
              )}
            </div>
            
            {status.pinecone.error && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                Error: {status.pinecone.error}
              </div>
            )}
            
            {status.pinecone.indexStats && (
              <div className="text-sm bg-gray-50 p-2 rounded">
                <div>Dimension: {status.pinecone.indexStats.dimension}</div>
                <div>Total Records: {status.pinecone.indexStats.totalRecordCount}</div>
                <div>Index Fullness: {(status.pinecone.indexStats.indexFullness * 100).toFixed(2)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* API Endpoints */}
        <div>
          <h4 className="font-medium mb-2">Available Endpoints</h4>
          <div className="text-sm space-y-1">
            {Object.entries(status.endpoints).map(([name, path]) => (
              <div key={name} className="flex justify-between">
                <span className="capitalize">{name}:</span>
                <code className="text-xs bg-gray-100 px-1 rounded">{path}</code>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}