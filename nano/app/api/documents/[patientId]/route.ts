import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { patientId } = await params

    // Return empty documents array since we're using local storage
    // This prevents errors while allowing the frontend to work
    return NextResponse.json({ documents: [] })

    // TODO: Uncomment when database is set up
    /*
    const supabase = supabaseAdmin

    const { data, error } = await supabase
      .from('patient_documents')
      .select('*')
      .eq('patient_id', patientId)
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching documents:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const documents = data?.map(record => ({
      id: record.id,
      name: record.file_name,
      type: record.file_type,
      size: record.file_size,
      uploadedAt: record.created_at,
      processed: record.processed,
      content: record.processed_content
    })) || []

    return NextResponse.json({ documents })
    */

  } catch (error) {
    console.error('Documents GET Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}