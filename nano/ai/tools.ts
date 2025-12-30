import { tool } from "ai";
import { z } from "zod";
import { queryRAG, buildRAGContext } from "../lib/rag";

export const weatherTool = tool({
  description: "Get the weather in a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async ({ location }) => ({
    location,
    temperature: 72 + Math.floor(Math.random() * 21) - 10,
  }),
});

export const ragTool = tool({
  description: "Search knowledge base for relevant information to answer user questions",
  inputSchema: z.object({
    query: z.string().describe("The user's question or search query"),
    topK: z.number().optional().describe("Number of results to retrieve (default: 5)"),
  }),
  execute: async ({ query, topK = 5 }) => {
    try {
      const ragResult = await queryRAG(query, topK);
      const { context, sources } = buildRAGContext(ragResult);
      
      return {
        success: true,
        context,
        sources,
        matchCount: ragResult.matches.length,
        matches: ragResult.matches.map(match => ({
          score: match.score,
          text: match.metadata.text.substring(0, 200) + '...', // Truncate for display
          source: match.metadata.source,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        context: '',
        sources: [],
        matchCount: 0,
        matches: [],
      };
    }
  },
});
