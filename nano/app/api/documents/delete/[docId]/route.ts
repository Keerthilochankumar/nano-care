import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
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
    return NextResponse.json({ success: true })

    // TODO: Uncomment when database is set up
    /*
    const supabase = supabaseAdmin

    // First check if the document belongs to the user
    const { data: document, error: fetchError } = await supabase
      .from('patient_documents')
      .select('*')
      .eq('id', docId)
      .eq('uploaded_by', userId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found or unauthorized' }, { status: 404 })
    }

    // Delete the document record
    const { error: deleteError } = await supabase
      .from('patient_documents')
      .delete()
      .eq('id', docId)
      .eq('uploaded_by', userId)

    if (deleteError) {
      console.error('Error deleting document:', deleteError)
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
    */

  } catch (error) {
    console.error('Document DELETE Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}