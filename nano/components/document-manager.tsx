"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { File, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Document {
  filename: string;
  chunks: number;
  uploadedAt: string;
  fileType: string;
  fileSize?: number;
}

export function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents/list');
      const result = await response.json();
      
      if (result.success) {
        setDocuments(result.documents);
      } else {
        toast.error('Failed to load documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (filename: string) => {
    try {
      setDeleting(filename);
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(result.message);
        fetchDocuments(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'text/plain': return 'bg-blue-100 text-blue-800';
      case 'text/markdown': return 'bg-green-100 text-green-800';
      case 'application/json': return 'bg-purple-100 text-purple-800';
      case 'application/pdf': return 'bg-red-100 text-red-800';
      case 'text/csv': return 'bg-yellow-100 text-yellow-800';
      case 'application/rtf': return 'bg-orange-100 text-orange-800';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileTypeLabel = (fileType: string, filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (fileType) {
      case 'text/plain': return 'txt';
      case 'text/markdown': return 'md';
      case 'application/json': return 'json';
      case 'application/pdf': return 'pdf';
      case 'text/csv': return 'csv';
      case 'application/rtf': return 'rtf';
      case 'application/msword': return 'doc';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'docx';
      default: return extension || 'file';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Document Library ({documents.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDocuments}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No documents uploaded yet</p>
            <p className="text-sm text-gray-500">Upload some files to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.filename}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="font-medium truncate">{doc.filename}</span>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getFileTypeColor(doc.fileType)}`}
                    >
                      {getFileTypeLabel(doc.fileType, doc.filename)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{doc.chunks} chunks</span>
                    {doc.fileSize && (
                      <span>{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    )}
                    <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteDocument(doc.filename)}
                  disabled={deleting === doc.filename}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {deleting === doc.filename ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}