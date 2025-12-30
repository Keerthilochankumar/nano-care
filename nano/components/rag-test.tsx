"use client";

import { useState } from 'react';
import { useRAG } from '@/lib/hooks/use-rag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function RAGTest() {
  const [query, setQuery] = useState('');
  const { queryRAG, isLoading, error, lastResponse } = useRAG();

  const handleTest = async () => {
    if (!query.trim()) return;
    await queryRAG(query);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>RAG Test Interface</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter your test query..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          />
          <Button onClick={handleTest} disabled={isLoading || !query.trim()}>
            {isLoading ? 'Searching...' : 'Test RAG'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
            Error: {error}
          </div>
        )}

        {lastResponse && lastResponse.success && (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="font-medium text-green-800">
                Found {lastResponse.matchCount} matches
              </p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="font-medium text-blue-800 mb-2">Context:</p>
              <p className="text-sm text-blue-700">{lastResponse.context}</p>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
              <p className="font-medium text-purple-800 mb-2">Sources:</p>
              <ul className="text-sm text-purple-700">
                {lastResponse.sources.map((source, index) => (
                  <li key={index}>• {source}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Matches:</p>
              {lastResponse.matches.map((match, index) => (
                <div key={index} className="p-2 bg-gray-50 border rounded-md">
                  <p className="text-sm font-medium">Score: {match.score.toFixed(4)}</p>
                  <p className="text-sm text-gray-600">{match.text}</p>
                  <p className="text-xs text-gray-500">Source: {match.source}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}