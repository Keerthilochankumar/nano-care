import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patientId') as string

    if (!file || !patientId) {
      return NextResponse.json({ error: 'File and patientId are required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or MD files.' 
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // For now, just return success with a mock ID since the frontend handles local storage
    // This allows the system to work without database setup
    const mockId = Date.now().toString() + Math.random().toString(36).substr(2, 9)

    return NextResponse.json({ 
      id: mockId,
      message: 'Document uploaded successfully (using local storage)' 
    })

    // TODO: Uncomment below when database is set up
    /*
    const supabase = supabaseAdmin

    // Read file content
    const fileBuffer = await file.arrayBuffer()
    const fileContent = Buffer.from(fileBuffer)

    // For now, we'll store the raw content as text
    // In a production system, you'd want to use proper file storage
    let textContent = ''
    
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      textContent = new TextDecoder().decode(fileContent)
    } else {
      // For other file types, we'll store a placeholder
      // In production, you'd use libraries like pdf-parse, mammoth, etc.
      textContent = `[${file.type} file - content extraction not implemented yet]`
    }

    // Insert document record
    const { data, error } = await supabase
      .from('patient_documents')
      .insert({
        patient_id: patientId,
        uploaded_by: userId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        raw_content: textContent,
        processed: false,
        processed_content: null
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving document:', error)
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
    }

    return NextResponse.json({ 
      id: data.id,
      message: 'Document uploaded successfully' 
    })
    */

  } catch (error) {
    console.error('Upload Document Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}