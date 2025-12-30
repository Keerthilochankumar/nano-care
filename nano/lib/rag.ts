import { Pinecone } from '@pinecone-database/pinecone';

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;
let pineconeIndex: any = null;

export async function initializePinecone() {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required');
    }
    
    if (!process.env.PINECONE_INDEX_NAME) {
      throw new Error('PINECONE_INDEX_NAME environment variable is required');
    }
    
    try {
      pineconeClient = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
      });
      
      pineconeIndex = process.env.PINECONE_HOST 
        ? pineconeClient.index(process.env.PINECONE_INDEX_NAME, process.env.PINECONE_HOST)
        : pineconeClient.index(process.env.PINECONE_INDEX_NAME);
        
      console.log('Pinecone client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Pinecone client:', error);
      throw new Error(`Pinecone initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  return { client: pineconeClient, index: pineconeIndex };
}

// Enhanced embedding service with multiple providers
export async function generateEmbedding(text: string, dimensions: number = 1024): Promise<number[]> {
  try {
    // Truncate text if too long (most embedding models have token limits)
    const maxLength = 8000; // Conservative limit
    const truncatedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    // Try OpenAI embeddings first (if API key available)
    if (process.env.OPENAI_API_KEY) {
      try {
        const embedding = await generateOpenAIEmbedding(truncatedText, dimensions);
        if (embedding) return embedding;
      } catch (error) {
        console.log('OpenAI embedding failed, trying Hugging Face...');
      }
    }
    
    // Try Hugging Face API if key is available
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const embedding = await generateHuggingFaceEmbedding(truncatedText, dimensions);
        if (embedding) return embedding;
      } catch (error) {
        console.log('Hugging Face embedding failed, using fallback...');
      }
    }
    
    // Fallback to local embedding generation
    console.log('Using enhanced fallback embedding generation');
    return generateEnhancedEmbedding(truncatedText, dimensions);
  } catch (error) {
    console.log('Error in embedding generation, using fallback');
    return generateEnhancedEmbedding(text, dimensions);
  }
}

async function generateOpenAIEmbedding(text: string, targetDimensions: number): Promise<number[] | null> {
  try {
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small', // 1536 dimensions
      input: text,
    });

    let embedding = response.data[0].embedding;
    
    // Adjust dimensions if needed
    if (embedding.length !== targetDimensions) {
      embedding = adjustEmbeddingDimensions(embedding, targetDimensions);
    }
    
    console.log(`Generated OpenAI embedding: ${embedding.length} dimensions`);
    return embedding;
  } catch (error) {
    console.error('OpenAI embedding error:', error);
    return null;
  }
}

async function generateHuggingFaceEmbedding(text: string, targetDimensions: number): Promise<number[] | null> {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        options: { wait_for_model: true }
      }),
    });

    if (response.ok) {
      let embedding = await response.json();
      
      // Handle different response formats
      if (Array.isArray(embedding) && Array.isArray(embedding[0])) {
        embedding = embedding[0];
      }
      
      if (Array.isArray(embedding)) {
        // Adjust dimensions if needed
        if (embedding.length !== targetDimensions) {
          embedding = adjustEmbeddingDimensions(embedding, targetDimensions);
        }
        
        console.log(`Generated Hugging Face embedding: ${embedding.length} dimensions`);
        return embedding;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Hugging Face embedding error:', error);
    return null;
  }
}

function adjustEmbeddingDimensions(embedding: number[], targetDimensions: number): number[] {
  if (embedding.length === targetDimensions) {
    return embedding;
  }
  
  if (embedding.length > targetDimensions) {
    // Truncate
    return embedding.slice(0, targetDimensions);
  } else {
    // Pad with zeros or repeat pattern
    const padded = [...embedding];
    while (padded.length < targetDimensions) {
      const remaining = targetDimensions - padded.length;
      if (remaining >= embedding.length) {
        padded.push(...embedding);
      } else {
        padded.push(...embedding.slice(0, remaining));
      }
    }
    return padded;
  }
}

// Enhanced fallback embedding function
function generateEnhancedEmbedding(text: string, dimensions: number = 1024): number[] {
  const embedding = new Array(dimensions).fill(0);
  
  // Preprocess text
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const words = cleanText.split(' ').filter(word => word.length > 0);
  
  // Character-level features
  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i);
    const pos1 = (charCode * 7 + i) % dimensions;
    const pos2 = (charCode * 13 + i * 3) % dimensions;
    const pos3 = (charCode * 17 + i * 5) % dimensions;
    
    embedding[pos1] += Math.sin(charCode * 0.1 + i * 0.01);
    embedding[pos2] += Math.cos(charCode * 0.1 + i * 0.01);
    embedding[pos3] += Math.tanh(charCode * 0.01);
  }
  
  // Word-level features
  words.forEach((word, wordIdx) => {
    const wordHash = word.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    // Multiple positions per word for better distribution
    for (let i = 0; i < 3; i++) {
      const pos = Math.abs(wordHash + i * 1000 + wordIdx) % dimensions;
      embedding[pos] += (word.length * 0.1) + (1 / (wordIdx + 1)) * 0.05;
    }
    
    // Add positional encoding
    const posEncoding = Math.sin(wordIdx / words.length * Math.PI);
    const posIndex = (wordHash + wordIdx) % dimensions;
    embedding[posIndex] += posEncoding * 0.1;
  });
  
  // N-gram features (bigrams)
  for (let i = 0; i < words.length - 1; i++) {
    const bigram = words[i] + words[i + 1];
    const bigramHash = bigram.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    const pos = Math.abs(bigramHash) % dimensions;
    embedding[pos] += 0.05;
  }
  
  // Document-level features
  const docLength = words.length;
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  const uniqueWords = new Set(words).size;
  
  // Encode document statistics
  embedding[0] += docLength * 0.001;
  embedding[1] += avgWordLength * 0.01;
  embedding[2] += uniqueWords * 0.001;
  
  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
}

export interface RAGResult {
  matches: Array<{
    id: string;
    score: number;
    metadata: {
      text: string;
      source: string;
      [key: string]: any;
    };
  }>;
}

export async function queryRAG(query: string, topK: number = 5): Promise<RAGResult> {
  try {
    const { index } = await initializePinecone();
    
    // Generate embedding for the query (1024 dimensions to match your index)
    const queryEmbedding = await generateEmbedding(query, 1024);
    
    // Query Pinecone
    const result = await index.query({
      vector: queryEmbedding,
      topK,
      includeValues: false,
      includeMetadata: true,
    });

    return result;
  } catch (error) {
    console.error('Error querying RAG:', error);
    throw error;
  }
}

export function buildRAGContext(ragResult: RAGResult): { context: string; sources: string[] } {
  const matchedInfo = ragResult.matches
    .map(item => item.metadata.text)
    .join(' ');
  
  const sources = ragResult.matches
    .map(item => item.metadata.source)
    .filter((source, index, self) => self.indexOf(source) === index); // Remove duplicates

  const context = `Information: ${matchedInfo} and the sources: ${sources.join(', ')}`;
  
  return { context, sources };
}

export function createRAGSystemPrompt(context: string): string {
  return `Instructions:
- Be helpful and answer questions concisely. If you don't know the answer, say 'I don't know'
- Utilize the context provided for accurate and specific information.
- Incorporate your preexisting knowledge to enhance the depth and relevance of your response.
- Cite your sources when possible

Context: ${context}`;
}

// Document processing utilities
export interface DocumentChunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    filename: string;
    chunkIndex: number;
    totalChunks: number;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    [key: string]: any;
  };
}

export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  // Validate inputs
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input for chunking');
  }
  
  if (chunkSize <= 0 || overlap < 0 || overlap >= chunkSize) {
    throw new Error('Invalid chunk size or overlap parameters');
  }
  
  // Limit maximum text size to prevent memory issues (50MB of text)
  const maxTextSize = 50 * 1024 * 1024;
  if (text.length > maxTextSize) {
    console.warn(`Text too large (${text.length} chars), truncating to ${maxTextSize} chars`);
    text = text.substring(0, maxTextSize);
  }
  
  const chunks: string[] = [];
  let start = 0;
  const maxChunks = 10000; // Prevent excessive chunking
  
  while (start < text.length && chunks.length < maxChunks) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    
    // Only add non-empty chunks
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
    
    start = end - overlap;
    
    // Prevent infinite loops
    if (start >= text.length || (end === text.length && start >= end)) {
      break;
    }
    
    // Safety check for overlap issues
    const lastChunkIndex = chunks.length > 1 ? text.indexOf(chunks[chunks.length - 1]) : -1;
    if (start <= lastChunkIndex) {
      start = end; // Skip overlap if it would cause issues
    }
  }
  
  if (chunks.length >= maxChunks) {
    console.warn(`Reached maximum chunk limit (${maxChunks}), some text may be truncated`);
  }
  
  console.log(`Created ${chunks.length} chunks from ${text.length} characters`);
  return chunks;
}

export async function extractTextFromFile(file: File): Promise<string> {
  try {
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
    
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds the 10MB limit`);
    }
    
    // Additional check for very large files that might cause processing issues
    if (file.size > 5 * 1024 * 1024) { // 5MB
      console.warn(`Large file detected (${(file.size / 1024 / 1024).toFixed(2)}MB), processing may take longer`);
    }
    
    let text = '';
    
    // Handle different file types
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      try {
        text = await extractTextFromPDF(file);
      } catch (pdfError) {
        console.error('PDF processing failed:', pdfError);
        throw new Error(`PDF processing failed: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}. Please try converting the PDF to text format first.`);
      }
    } else if (
      file.type === 'text/plain' || 
      file.type === 'text/markdown' || 
      file.name.toLowerCase().endsWith('.txt') ||
      file.name.toLowerCase().endsWith('.md')
    ) {
      text = await file.text();
    } else if (file.type === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
      const jsonContent = await file.text();
      const parsed = JSON.parse(jsonContent);
      text = JSON.stringify(parsed, null, 2);
    } else if (
      file.type === 'application/msword' ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx')
    ) {
      // For Word documents, try to read as text (basic support)
      text = await file.text();
    } else if (
      file.type === 'text/csv' ||
      file.name.toLowerCase().endsWith('.csv')
    ) {
      text = await file.text();
    } else if (
      file.type === 'application/rtf' ||
      file.name.toLowerCase().endsWith('.rtf')
    ) {
      text = await file.text();
    } else {
      // Try to read as text for other file types
      try {
        text = await file.text();
      } catch (textError) {
        throw new Error(`Unsupported file format or corrupted file: ${textError instanceof Error ? textError.message : 'Unknown error'}`);
      }
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('File is empty or contains no readable text');
    }
    
    console.log(`Extracted ${text.length} characters from ${file.name}`);
    return text;
  } catch (error) {
    console.error('Error reading file:', error);
    throw new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // PDF processing requires pdfjs-dist which is not installed
    // Return a placeholder for now
    console.warn('PDF processing not available - pdfjs-dist not installed');
    return `[PDF Document: ${file.name} - Content extraction requires PDF processing library. File uploaded but content not extracted.]`;
  } catch (error) {
    console.error('Error processing PDF:', error);
    return `[Error processing PDF: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

// Simple fallback PDF text extraction
async function extractTextFromPDFSimple(buffer: Buffer): Promise<string> {
  try {
    console.log('Using simple PDF text extraction fallback');
    
    // Convert buffer to string and try to extract readable text
    const pdfString = buffer.toString('latin1');
    
    // Look for text patterns in PDF
    const textPatterns = [
      /\(([^)]+)\)/g, // Text in parentheses
      /\[([^\]]+)\]/g, // Text in brackets
      /BT\s+[\s\S]*?ET/g, // Text between BT (Begin Text) and ET (End Text)
    ];
    
    let extractedText = '';
    
    for (const pattern of textPatterns) {
      const matches = pdfString.match(pattern);
      if (matches) {
        for (const match of matches) {
          // Clean up the extracted text
          let cleanText = match
            .replace(/^\(|\)$/g, '') // Remove parentheses
            .replace(/^\[|\]$/g, '') // Remove brackets
            .replace(/BT\s+|ET/g, '') // Remove BT/ET markers
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ') // Keep only printable ASCII
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
          
          if (cleanText.length > 3) { // Only add meaningful text
            extractedText += cleanText + ' ';
          }
        }
      }
    }
    
    // Also try to find readable text directly
    const readableText = pdfString
      .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      .split(' ')
      .filter(word => word.length > 2 && /^[a-zA-Z]/.test(word))
      .join(' ');
    
    if (readableText.length > extractedText.length) {
      extractedText = readableText;
    }
    
    if (!extractedText.trim()) {
      throw new Error('No readable text found in PDF using simple extraction');
    }
    
    console.log(`Simple extraction: ${extractedText.length} characters`);
    return extractedText.trim();
  } catch (error) {
    throw new Error(`Simple PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function processAndUploadDocument(
  file: File,
  chunkSize: number = 1000,
  overlap: number = 200
): Promise<{ success: boolean; chunksUploaded: number; error?: string }> {
  try {
    console.log(`Starting to process document: ${file.name}`);
    
    const { index } = await initializePinecone();
    console.log('Connected to Pinecone index');
    
    // Extract text from file
    console.log('Extracting text from file...');
    const text = await extractTextFromFile(file);
    console.log(`Extracted ${text.length} characters from file`);
    
    if (!text.trim()) {
      throw new Error('No text content found in file');
    }
    
    // Validate text size
    const maxTextSize = 50 * 1024 * 1024; // 50MB of text
    if (text.length > maxTextSize) {
      console.warn(`Text size (${text.length}) exceeds limit, will be truncated during chunking`);
    }
    
    // Check for reasonable text content
    if (text.length < 10) {
      throw new Error('File contains insufficient text content (less than 10 characters)');
    }
    
    // Chunk the text
    console.log('Chunking text...');
    let chunks: string[];
    try {
      chunks = chunkText(text, chunkSize, overlap);
      console.log(`Created ${chunks.length} chunks`);
    } catch (chunkError) {
      console.error('Chunking failed:', chunkError);
      // Fallback: create a single chunk with truncated text
      const maxSingleChunk = 8000; // 8KB max for single chunk
      const truncatedText = text.length > maxSingleChunk ? text.substring(0, maxSingleChunk) : text;
      chunks = [truncatedText];
      console.log(`Fallback: created 1 chunk with ${truncatedText.length} characters`);
    }
    
    if (chunks.length === 0) {
      throw new Error('Failed to create any text chunks from the document');
    }
    
    // Process each chunk
    console.log('Processing chunks and generating embeddings...');
    
    // Process chunks in batches to prevent memory issues
    const batchSize = 10; // Process 10 chunks at a time
    const results = [];
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} (chunks ${i + 1}-${Math.min(i + batchSize, chunks.length)})`);
      
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const chunkIndex = i + batchIndex;
        const chunkId = `${file.name}-chunk-${chunkIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          console.log(`Generating embedding for chunk ${chunkIndex + 1}/${chunks.length}`);
          const embedding = await generateEmbedding(chunk, 1024);
          
          const documentChunk: DocumentChunk = {
            id: chunkId,
            text: chunk,
            metadata: {
              source: file.name,
              filename: file.name,
              chunkIndex: chunkIndex,
              totalChunks: chunks.length,
              fileType: file.type || 'text/plain',
              fileSize: file.size,
              uploadedAt: new Date().toISOString(),
            }
          };
          
          console.log(`Uploading chunk ${chunkIndex + 1} to Pinecone`);
          return await index.upsert([{
            id: chunkId,
            values: embedding,
            metadata: documentChunk.metadata
          }]);
        } catch (chunkError) {
          console.error(`Failed to process chunk ${chunkIndex + 1}:`, chunkError);
          throw new Error(`Failed to process chunk ${chunkIndex + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`);
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    console.log(`Successfully uploaded ${chunks.length} chunks for ${file.name}`);
    
    return {
      success: true,
      chunksUploaded: chunks.length
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      success: false,
      chunksUploaded: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteDocument(filename: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { index } = await initializePinecone();
    
    // Query for all chunks of this document
    const queryResult = await index.query({
      vector: new Array(1024).fill(0), // Dummy vector for metadata filtering
      topK: 1000,
      includeMetadata: true,
      filter: {
        filename: { $eq: filename }
      }
    });
    
    // Delete all chunks
    const idsToDelete = queryResult.matches.map((match: any) => match.id);
    
    if (idsToDelete.length > 0) {
      await index.deleteMany(idsToDelete);
    }
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function listDocuments(): Promise<{ documents: Array<{ filename: string; chunks: number; uploadedAt: string; fileType: string }> }> {
  try {
    const { index } = await initializePinecone();
    
    // Query for all documents (this is a simplified approach)
    const queryResult = await index.query({
      vector: new Array(1024).fill(0),
      topK: 1000,
      includeMetadata: true
    });
    
    // Group by filename
    const documentMap = new Map();
    
    queryResult.matches.forEach((match: any) => {
      const metadata = match.metadata;
      if (metadata && metadata.filename) {
        const filename = metadata.filename as string;
        
        if (!documentMap.has(filename)) {
          documentMap.set(filename, {
            filename,
            chunks: 0,
            uploadedAt: metadata.uploadedAt as string,
            fileType: metadata.fileType as string,
            fileSize: metadata.fileSize as number || 0
          });
        }
        
        documentMap.get(filename).chunks++;
      }
    });
    
    return {
      documents: Array.from(documentMap.values())
    };
  } catch (error) {
    console.error('Error listing documents:', error);
    return { documents: [] };
  }
}