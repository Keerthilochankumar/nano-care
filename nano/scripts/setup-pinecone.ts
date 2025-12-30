import { config } from 'dotenv';
import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from '../lib/rag';

// Load environment variables
config();

// This script helps you set up your Pinecone index and add sample data
async function setupPinecone() {
  if (!process.env.PINECONE_API_KEY) {
    console.error('PINECONE_API_KEY is required');
    process.exit(1);
  }

  if (!process.env.PINECONE_INDEX_NAME) {
    console.error('PINECONE_INDEX_NAME is required');
    process.exit(1);
  }

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });

  const indexName = process.env.PINECONE_INDEX_NAME;
  const indexHost = process.env.PINECONE_HOST;

  try {
    console.log(`Connecting to Pinecone index: ${indexName}`);
    
    // Connect to existing index using the host URL
    const index = indexHost 
      ? pinecone.index(indexName, indexHost)
      : pinecone.index(indexName);

    // Test connection
    const stats = await index.describeIndexStats();
    console.log('✅ Connected to Pinecone index successfully!');
    console.log(`Index stats:`, stats);

    // Add sample data
    console.log('Adding sample data...');
    const sampleData = [
      {
        id: 'sample-doc-1',
        text: 'Next.js is a React framework that enables functionality such as server-side rendering and generating static websites. It provides features like automatic code splitting, optimized performance, and built-in CSS support.',
        source: 'Next.js Documentation'
      },
      {
        id: 'sample-doc-2',
        text: 'Pinecone is a vector database that makes it easy to build high-performance vector search applications. It provides fast, accurate similarity search and is optimized for machine learning applications.',
        source: 'Pinecone Documentation'
      },
      {
        id: 'sample-doc-3',
        text: 'RAG (Retrieval-Augmented Generation) combines information retrieval with text generation to provide more accurate and contextual responses. It allows AI models to access external knowledge bases.',
        source: 'AI Research Papers'
      },
      {
        id: 'sample-doc-4',
        text: 'Groq is a high-performance AI inference platform that provides fast language model processing. It offers APIs for various AI models with optimized hardware acceleration.',
        source: 'Groq Documentation'
      },
      {
        id: 'sample-doc-5',
        text: 'Vector embeddings are numerical representations of text that capture semantic meaning. They enable similarity search and are fundamental to modern AI applications like RAG systems.',
        source: 'Machine Learning Textbook'
      }
    ];

    for (const doc of sampleData) {
      console.log(`Processing: ${doc.id}`);
      const embedding = await generateEmbedding(doc.text, 1024);
      await index.upsert([{
        id: doc.id,
        values: embedding,
        metadata: {
          text: doc.text,
          source: doc.source,
          filename: `${doc.id}.txt`,
          chunkIndex: 0,
          totalChunks: 1,
          fileType: 'text/plain',
          fileSize: doc.text.length,
          uploadedAt: new Date().toISOString()
        }
      }]);
      console.log(`✅ Added: ${doc.id}`);
    }

    console.log('\n🎉 Pinecone setup complete!');
    console.log(`Index: ${indexName}`);
    console.log(`Host: ${indexHost || 'Default'}`);
    console.log(`Sample documents added: ${sampleData.length}`);
    console.log('\nYou can now:');
    console.log('1. Visit /rag-test to test the RAG functionality');
    console.log('2. Upload your own documents via the dashboard');
    console.log('3. Use the chat with RAG enabled');
    
  } catch (error) {
    console.error('Error setting up Pinecone:', error);
    process.exit(1);
  }
}

// Run the setup
setupPinecone();