import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ragService } from '@/lib/rag-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, patientId, documentName, content, query } = await request.json()

    switch (action) {
      case 'add':
        if (!patientId || !documentName || !content) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }
        
        const addSuccess = await ragService.addDocument(patientId, documentName, content)
        return NextResponse.json({ 
          success: addSuccess,
          message: addSuccess ? 'Document added to RAG successfully' : 'Failed to add document to RAG'
        })

      case 'query':
        if (!patientId || !query) {
          return NextResponse.json({ error: 'Missing patientId or query' }, { status: 400 })
        }
        
        const results = await ragService.queryRelevantContent(patientId, query)
        return NextResponse.json({ 
          success: true,
          results,
          count: results.length
        })

      case 'stats':
        if (!patientId) {
          return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
        }
        
        const stats = await ragService.getStats(patientId)
        return NextResponse.json({ 
          success: true,
          stats
        })

      case 'remove':
        if (!patientId) {
          return NextResponse.json({ error: 'Missing patientId' }, { status: 400 })
        }
        
        const removeSuccess = await ragService.removePatientDocuments(patientId)
        return NextResponse.json({ 
          success: removeSuccess,
          message: removeSuccess ? 'Patient documents removed from RAG' : 'Failed to remove documents'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('RAG API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}