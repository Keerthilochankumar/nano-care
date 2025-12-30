"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from './document-upload';
import { DocumentManager } from './document-manager';
import { RAGTest } from './rag-test';
import { SystemStatus } from './system-status';
import { PDFTest } from './pdf-test';
import { Database, Upload, Search, FileText, Activity, TestTube } from 'lucide-react';

export function RAGDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadComplete = () => {
    // Trigger refresh of document manager
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Database className="h-8 w-8" />
          RAG System Dashboard
        </h1>
        <p className="text-gray-600">
          Upload documents, manage your knowledge base, and test RAG functionality
        </p>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="status" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            System Status
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Documents
          </TabsTrigger>
          <TabsTrigger value="manage" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manage Library
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Test RAG
          </TabsTrigger>
          <TabsTrigger value="pdf-test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            PDF Test
          </TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-6">
          <SystemStatus />
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <DocumentUpload onUploadComplete={handleUploadComplete} />
        </TabsContent>

        <TabsContent value="manage" className="mt-6">
          <DocumentManager key={refreshKey} />
        </TabsContent>

        <TabsContent value="test" className="mt-6">
          <RAGTest />
        </TabsContent>

        <TabsContent value="pdf-test" className="mt-6">
          <PDFTest />
        </TabsContent>
      </Tabs>
    </div>
  );
}