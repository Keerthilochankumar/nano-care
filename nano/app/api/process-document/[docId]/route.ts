import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { docId } = await params

    // Just return success since we're using local storage
    return NextResponse.json({ 
      success: true,
      message: 'Document processed successfully (using local storage)' 
    })

    // TODO: Uncomment when database is set up
    /*
    const supabase = supabaseAdmin

    // Get the document
    const { data: document, error: fetchError } = await supabase
      .from('patient_documents')
      .select('*')
      .eq('id', docId)
      .eq('uploaded_by', userId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    if (document.processed) {
      return NextResponse.json({ message: 'Document already processed' })
    }

    // Process the document content
    let processedContent = document.raw_content

    // Basic processing - in production you'd want more sophisticated processing
    if (document.file_type === 'text/plain' || document.file_type === 'text/markdown') {
      // Clean up the text content
      processedContent = document.raw_content
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    } else {
      // For other file types, set a placeholder
      processedContent = `Document "${document.file_name}" uploaded but content extraction not yet implemented for ${document.file_type} files.`
    }

    // Update the document as processed
    const { error: updateError } = await supabase
      .from('patient_documents')
      .update({
        processed: true,
        processed_content: processedContent,
        processed_at: new Date().toISOString()
      })
      .eq('id', docId)
      .eq('uploaded_by', userId)

    if (updateError) {
      console.error('Error updating document:', updateError)
      return NextResponse.json({ error: 'Failed to process document' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Document processed successfully' 
    })
    */

  } catch (error) {
    console.error('Process Document Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}