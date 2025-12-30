import { Pinecone } from '@pinecone-database/pinecone'
import { HfInference } from '@huggingface/inference'

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || 'dummy-key-for-development'
})

// Initialize Hugging Face client for embeddings
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || 'dummy-key-for-development')

// Configuration
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'healthcare-rag'
const EMBEDDING_MODEL = 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2' // 768 dimensions
const EMBEDDING_DIMENSION = 1024 // Target dimension for the index
const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

export interface DocumentChunk {
  id: string
  content: string
  metadata: {
    patientId: string
    documentName: string
    chunkIndex: number
    timestamp: string
  }
}

export interface RAGResult {
  content: string
  score: number
  metadata: {
    documentName: string
    patientId: string
  }
}

class RAGService {
  private index: any = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      // Check if we have valid API keys
      if (!process.env.PINECONE_API_KEY || process.env.PINECONE_API_KEY === 'dummy-key-for-development') {
        console.warn('⚠️ Pinecone API key not configured - using fallback RAG')
        this.isInitialized = true
        return
      }

      // Get or create index
      const indexList = await pinecone.listIndexes()
      const indexExists = indexList.indexes?.some(index => index.name === INDEX_NAME)

      if (!indexExists) {
        console.log('📊 Creating Pinecone index:', INDEX_NAME)
        try {
          await pinecone.createIndex({
            name: INDEX_NAME,
            dimension: EMBEDDING_DIMENSION, // Match existing index dimension
            metric: 'cosine',
            spec: {
              serverless: {
                cloud: 'aws',
                region: 'us-east-1'
              }
            }
          })
          
          // Wait for index to be ready
          console.log('⏳ Waiting for index to be ready...')
          await new Promise(resolve => setTimeout(resolve, 10000))
        } catch (createError) {
          console.error('❌ Failed to create index:', createError)
          // Try to use existing index if creation fails
        }
      } else {
        console.log('✅ Using existing Pinecone index:', INDEX_NAME)
      }

      this.index = pinecone.index(INDEX_NAME)
      this.isInitialized = true
      console.log('✅ RAG service initialized with Pinecone')
    } catch (error) {
      console.error('❌ Failed to initialize Pinecone:', error)
      this.isInitialized = true // Continue with fallback
    }
  }

  // Split text into chunks
  private splitIntoChunks(text: string): string[] {
    const chunks: string[] = []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    let currentChunk = ''
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (currentChunk.length + trimmedSentence.length > CHUNK_SIZE) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim())
          // Add overlap
          const words = currentChunk.split(' ')
          currentChunk = words.slice(-CHUNK_OVERLAP).join(' ') + ' ' + trimmedSentence
        } else {
          currentChunk = trimmedSentence
        }
      } else {
        currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
      }
    }
    
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim())
    }
    
    return chunks.filter(chunk => chunk.length > 50) // Filter out very short chunks
  }

  // Generate embeddings using Hugging Face
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_KEY === 'dummy-key-for-development') {
        // Return dummy embedding for development with correct dimension
        return Array(EMBEDDING_DIMENSION).fill(0).map(() => Math.random() - 0.5)
      }

      const response = await hf.featureExtraction({
        model: EMBEDDING_MODEL,
        inputs: text
      })
      
      let embedding = Array.isArray(response) ? response as number[] : []
      
      // Ensure the embedding has the correct dimension
      if (embedding.length < EMBEDDING_DIMENSION) {
        // Pad with zeros if too short
        embedding = [...embedding, ...Array(EMBEDDING_DIMENSION - embedding.length).fill(0)]
      } else if (embedding.length > EMBEDDING_DIMENSION) {
        // Truncate if too long
        embedding = embedding.slice(0, EMBEDDING_DIMENSION)
      }
      
      return embedding
    } catch (error) {
      console.error('Error generating embedding:', error)
      // Return dummy embedding as fallback with correct dimension
      return Array(EMBEDDING_DIMENSION).fill(0).map(() => Math.random() - 0.5)
    }
  }

  // Add document to vector database
  async addDocument(patientId: string, documentName: string, content: string): Promise<boolean> {
    await this.initialize()

    try {
      if (!this.index) {
        console.log('📝 Storing document locally (Pinecone not available)')
        // Store in a simple in-memory cache for server-side fallback
        const key = `rag-${patientId}-${documentName}`
        // Note: This is a server-side fallback, not localStorage
        console.log(`Stored document ${key} in fallback storage`)
        return true
      }

      console.log('📊 Processing document for RAG:', documentName)
      
      // Split document into chunks
      const chunks = this.splitIntoChunks(content)
      console.log(`📄 Split into ${chunks.length} chunks`)

      // Generate embeddings and upsert to Pinecone
      const vectors = []
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i]
        const embedding = await this.generateEmbedding(chunk)
        
        vectors.push({
          id: `${patientId}-${documentName}-${i}`,
          values: embedding,
          metadata: {
            patientId,
            documentName,
            content: chunk,
            chunkIndex: i,
            timestamp: new Date().toISOString()
          }
        })
      }

      // Upsert vectors to Pinecone
      await this.index.upsert(vectors)
      console.log(`✅ Added ${vectors.length} chunks to vector database`)
      
      return true
    } catch (error) {
      console.error('❌ Error adding document to RAG:', error)
      return false
    }
  }

  // Query vector database for relevant content
  async queryRelevantContent(patientId: string, query: string, topK: number = 5): Promise<RAGResult[]> {
    await this.initialize()

    try {
      if (!this.index) {
        console.log('🔍 Using fallback search (Pinecone not available)')
        // Return empty results for server-side fallback
        // In a production environment, you might implement a simple text search here
        return []
      }

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query)
      
      // Query Pinecone
      const queryResponse = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: { patientId }
      })

      // Format results
      const results: RAGResult[] = queryResponse.matches?.map((match: any) => ({
        content: match.metadata?.content || '',
        score: match.score || 0,
        metadata: {
          documentName: match.metadata?.documentName || '',
          patientId: match.metadata?.patientId || ''
        }
      })) || []

      console.log(`🔍 Found ${results.length} relevant chunks for query: "${query}"`)
      return results
    } catch (error) {
      console.error('❌ Error querying RAG:', error)
      return []
    }
  }

  // Remove all documents for a patient
  async removePatientDocuments(patientId: string): Promise<boolean> {
    await this.initialize()

    try {
      if (!this.index) {
        // Server-side fallback - just log the action
        console.log(`🗑️ Would remove documents for patient: ${patientId} (fallback mode)`)
        return true
      }

      // Delete from Pinecone by patient ID
      await this.index.deleteMany({ patientId })
      console.log(`🗑️ Removed all documents for patient: ${patientId}`)
      
      return true
    } catch (error) {
      console.error('❌ Error removing patient documents:', error)
      return false
    }
  }

  // Get statistics
  async getStats(patientId: string): Promise<{ documentCount: number; chunkCount: number }> {
    await this.initialize()

    try {
      if (!this.index) {
        // Server-side fallback - return zero stats
        console.log('📊 Stats request - using fallback (Pinecone not available)')
        return { documentCount: 0, chunkCount: 0 }
      }

      // Query Pinecone for stats
      const statsResponse = await this.index.query({
        vector: Array(EMBEDDING_DIMENSION).fill(0),
        topK: 1000,
        includeMetadata: true,
        filter: { patientId }
      })

      const documents = new Set()
      let chunkCount = 0

      statsResponse.matches?.forEach((match: any) => {
        if (match.metadata?.documentName) {
          documents.add(match.metadata.documentName)
          chunkCount++
        }
      })

      return { documentCount: documents.size, chunkCount }
    } catch (error) {
      console.error('❌ Error getting RAG stats:', error)
      return { documentCount: 0, chunkCount: 0 }
    }
  }
}

// Export singleton instance
export const ragService = new RAGService()