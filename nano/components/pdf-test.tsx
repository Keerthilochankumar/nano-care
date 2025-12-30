"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PDFTestResult {
  filename: string;
  size: number;
  type: string;
  methods: {
    pdfjs: {
      success: boolean;
      pages?: number;
      textLength?: number;
      preview?: string;
      error?: string;
    };
    simple: {
      success: boolean;
      textLength?: number;
      preview?: string;
      error?: string;
    };
  };
}

export function PDFTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<PDFTestResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    await testPDF(file);
  };

  const testPDF = async (file: File) => {
    setTesting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/test-pdf', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
        toast.success('PDF test completed');
      } else {
        toast.error(data.error || 'PDF test failed');
      }
    } catch (error) {
      console.error('PDF test error:', error);
      toast.error('Failed to test PDF');
    } finally {
      setTesting(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      testPDF(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          PDF Processing Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Drop Zone */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-600 mb-1">
            Drop a PDF file here or click to browse
          </p>
          <p className="text-xs text-gray-500">
            Test PDF text extraction capabilities
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Testing Status */}
        {testing && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Testing PDF processing...</p>
          </div>
        )}

        {/* Test Results */}
        {result && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded">
              <h4 className="font-medium mb-2">File Information</h4>
              <div className="text-sm space-y-1">
                <div>Name: {result.filename}</div>
                <div>Size: {(result.size / 1024 / 1024).toFixed(2)} MB</div>
                <div>Type: {result.type}</div>
              </div>
            </div>

            {/* PDF.js Method */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                {result.methods.pdfjs.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <h4 className="font-medium">PDF.js Method</h4>
              </div>
              
              {result.methods.pdfjs.success ? (
                <div className="text-sm space-y-1">
                  <div>Pages: {result.methods.pdfjs.pages}</div>
                  <div>Text Length: {result.methods.pdfjs.textLength} characters</div>
                  {result.methods.pdfjs.preview && (
                    <div>
                      <div className="font-medium mt-2">Preview:</div>
                      <div className="bg-gray-100 p-2 rounded text-xs">
                        {result.methods.pdfjs.preview}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Error: {result.methods.pdfjs.error}
                </div>
              )}
            </div>

            {/* Simple Method */}
            <div className="border rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                {result.methods.simple.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <h4 className="font-medium">Simple Extraction Method</h4>
              </div>
              
              {result.methods.simple.success ? (
                <div className="text-sm space-y-1">
                  <div>Text Length: {result.methods.simple.textLength} characters</div>
                  {result.methods.simple.preview && (
                    <div>
                      <div className="font-medium mt-2">Preview:</div>
                      <div className="bg-gray-100 p-2 rounded text-xs">
                        {result.methods.simple.preview}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  Error: {result.methods.simple.error}
                </div>
              )}
            </div>

            {/* Recommendation */}
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-medium text-blue-800 mb-1">Recommendation</h4>
              <p className="text-sm text-blue-700">
                {result.methods.pdfjs.success 
                  ? "✅ PDF.js method works well for this file. Upload should succeed."
                  : result.methods.simple.success
                  ? "⚠️ Only simple extraction works. Text quality may be limited."
                  : "❌ PDF text extraction failed. Try converting to .txt format first."
                }
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}