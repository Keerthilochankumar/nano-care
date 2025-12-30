import { useState, useCallback } from 'react';

interface RAGMatch {
  id: string;
  score: number;
  text: string;
  source: string;
}

interface RAGResponse {
  success: boolean;
  context: string;
  sources: string[];
  systemPrompt: string;
  matchCount: number;
  matches: RAGMatch[];
  error?: string;
}

interface UseRAGReturn {
  queryRAG: (query: string, topK?: number) => Promise<RAGResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: RAGResponse | null;
}

export function useRAG(): UseRAGReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<RAGResponse | null>(null);

  const queryRAG = useCallback(async (query: string, topK: number = 5): Promise<RAGResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, topK }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RAGResponse = await response.json();
      setLastResponse(data);
      
      if (!data.success) {
        throw new Error(data.error || 'RAG query failed');
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      const errorResponse: RAGResponse = {
        success: false,
        context: '',
        sources: [],
        systemPrompt: '',
        matchCount: 0,
        matches: [],
        error: errorMessage,
      };
      
      setLastResponse(errorResponse);
      return errorResponse;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    queryRAG,
    isLoading,
    error,
    lastResponse,
  };
}