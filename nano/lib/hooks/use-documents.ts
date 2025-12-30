import { useState, useCallback } from 'react';

interface Document {
  filename: string;
  chunks: number;
  uploadedAt: string;
  fileType: string;
}

interface UseDocumentsReturn {
  documents: Document[];
  loading: boolean;
  error: string | null;
  fetchDocuments: () => Promise<void>;
  deleteDocument: (filename: string) => Promise<boolean>;
  uploadDocuments: (files: File[]) => Promise<boolean>;
}

export function useDocuments(): UseDocumentsReturn {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/documents/list');
      const result = await response.json();

      if (result.success) {
        setDocuments(result.documents);
      } else {
        throw new Error(result.error || 'Failed to fetch documents');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (filename: string): Promise<boolean> => {
    setError(null);

    try {
      const response = await fetch('/api/documents/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filename }),
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc.filename !== filename));
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete document');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting document:', err);
      return false;
    }
  }, []);

  const uploadDocuments = useCallback(async (files: File[]): Promise<boolean> => {
    setError(null);

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
        // Refresh documents list
        await fetchDocuments();
        return true;
      } else {
        throw new Error(result.error || 'Failed to upload documents');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error uploading documents:', err);
      return false;
    }
  }, [fetchDocuments]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    deleteDocument,
    uploadDocuments,
  };
}