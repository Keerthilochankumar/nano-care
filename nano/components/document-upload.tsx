"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, File, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { estimateProcessingTime, getFileTypeIcon, formatFileSize, getFileSizeWarning } from '@/lib/utils/file-utils';

interface UploadResult {
  filename: string;
  success: boolean;
  chunksUploaded?: number;
  error?: string;
}

export function DocumentUpload({ onUploadComplete }: { onUploadComplete?: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadResults([]);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadResults(result.results);
        toast.success(result.message);
        setFiles([]);
        onUploadComplete?.();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supports: .txt, .md, .json, .pdf, .csv, .rtf, .doc, .docx files (max 10MB each)
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Large files (&gt;5MB) may take several minutes to process
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".txt,.md,.json,.pdf,.csv,.rtf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Selected Files ({files.length})</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getFileTypeIcon(file.type, file.name)}</span>
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-500">
                        Est. processing: {estimateProcessingTime(file.size, file.type)}
                      </span>
                    </div>
                    {getFileSizeWarning(file.size) && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠️ {getFileSizeWarning(file.size)}
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="ml-2 flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
        </Button>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing files...</span>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Upload Results</h4>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {uploadResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">{result.filename}</span>
                    {result.success && result.chunksUploaded && (
                      <span className="text-xs text-gray-500">
                        ({result.chunksUploaded} chunks)
                      </span>
                    )}
                  </div>
                  {result.error && (
                    <span className="text-xs text-red-500">{result.error}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}