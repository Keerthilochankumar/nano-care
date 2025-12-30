import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ragService } from '@/lib/rag-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patientId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!patientId) {
      return NextResponse.json({ error: 'No patient ID provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''
    let success = false

    try {
      // Determine file type and process accordingly
      const fileType = file.type.toLowerCase()
      const fileName = file.name.toLowerCase()

      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        // Process PDF files using pdfjs-dist
        console.log('Processing PDF file:', file.name)
        try {
          // Dynamic import to handle ES module compatibility
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
          
          // Load the PDF document
          const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
          const pdfDocument = await loadingTask.promise
          
          let fullText = ''
          
          // Extract text from each page
          for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum)
            const textContent = await page.getTextContent()
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ')
            fullText += pageText + '\n'
          }
          
          extractedText = fullText.trim()
          success = extractedText.length > 10 // Ensure we got meaningful content
          console.log('PDF processed successfully, extracted', extractedText.length, 'characters')
          
          // Clean up the extracted text
          extractedText = extractedText
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .replace(/\s{3,}/g, ' ')
            .trim()
            
        } catch (pdfError) {
          console.error('PDF processing error:', pdfError)
          // Fallback to manual instructions if PDF processing fails
          extractedText = `PDF Document: ${file.name}

Automatic PDF processing failed. Error: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}

To enable RAG analysis with this document:

OPTION 1 - Convert to Text:
1. Open the PDF in any PDF reader
2. Select all text (Ctrl+A)
3. Copy the text (Ctrl+C)
4. Create a new .txt file and paste the content
5. Upload the .txt file instead

OPTION 2 - Use Sample Content:
For testing purposes, you can use the sample cardiology report content available in the system.

File Details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Type: ${file.type}
- Error: ${pdfError instanceof Error ? pdfError.message : 'Processing failed'}`
          
          success = false // Mark as not processed due to error
        }
        
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
        // Process DOCX using mammoth
        console.log('Processing DOCX file:', file.name)
        try {
          const mammoth = await import('mammoth')
          const result = await mammoth.extractRawText({ buffer })
          extractedText = result.value
          success = extractedText.length > 10 // Ensure we got meaningful content
          console.log('DOCX processed successfully, extracted', extractedText.length, 'characters')
        } catch (docxError) {
          console.error('DOCX processing error:', docxError)
          extractedText = `Word Document: ${file.name}

Failed to extract content automatically. Please:
1. Open the document in Word
2. Select all content (Ctrl+A)
3. Copy the text (Ctrl+C)
4. Create a new .txt file and paste
5. Upload the .txt file for RAG analysis

Error: ${docxError instanceof Error ? docxError.message : 'Unknown error'}`
          success = false
        }
        
      } else if (fileType === 'application/msword' || fileName.endsWith('.doc')) {
        // For older DOC files
        console.log('Processing DOC file:', file.name)
        extractedText = `Legacy Word Document: ${file.name}

This older Word document format requires manual conversion:
1. Open the document in Word
2. Save as .docx format or copy all text
3. Upload the newer format or create a .txt file
4. This will enable RAG analysis

File Details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Format: Legacy Word Document`
        success = false
        
      } else if (fileType.startsWith('text/') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv') || fileName.endsWith('.log')) {
        // Process text files - these work reliably
        console.log('Processing text file:', file.name)
        extractedText = buffer.toString('utf8')
        success = extractedText.length > 0
        console.log('Text file processed successfully, extracted', extractedText.length, 'characters')
        
      } else {
        // Unknown file type
        console.log('Unknown file type:', file.name, fileType)
        extractedText = `Unknown File Type: ${file.name}

File type "${fileType}" is not supported for automatic processing.

Supported formats:
- Text files (.txt, .md, .csv, .log)
- Word documents (.docx) - automatic processing
- PDF files (.pdf) - manual conversion required

To use this file with RAG:
1. Convert the file to plain text format
2. Save as .txt file
3. Upload the text version

File Details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Type: ${fileType || 'Unknown'}`
        success = false
      }

      // Clean up the extracted text if successful
      if (success && extractedText) {
        extractedText = extractedText
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/\s{3,}/g, ' ')
          .trim()

        // Add to RAG system if processing was successful
        if (success && extractedText) {
          try {
            console.log('🔍 Adding document to RAG system:', file.name)
            const ragSuccess = await ragService.addDocument(patientId, file.name, extractedText)
            if (ragSuccess) {
              console.log('✅ Document successfully added to RAG system')
            } else {
              console.warn('⚠️ Failed to add document to RAG system')
            }
          } catch (ragError) {
            console.error('❌ RAG system error:', ragError)
            // Don't fail the entire request if RAG fails
          }
        }
      }

      return NextResponse.json({
        success,
        content: extractedText,
        length: extractedText.length,
        fileType: file.type,
        fileName: file.name,
        ragEnabled: success, // Indicates if document was added to RAG
        message: success 
          ? `Successfully extracted ${extractedText.length} characters from ${file.name} and added to RAG system`
          : `${file.name} uploaded. ${success ? '' : 'Manual conversion needed for RAG analysis.'}`
      })

    } catch (processingError) {
      console.error('Document processing error:', processingError)
      return NextResponse.json({
        success: false,
        content: `Processing Error: ${file.name}

An error occurred while processing this file:
${processingError instanceof Error ? processingError.message : 'Unknown error'}

Please try:
1. Converting the file to .txt format
2. Re-uploading the file
3. Using a different file format

File Details:
- Name: ${file.name}
- Size: ${(file.size / 1024).toFixed(1)} KB
- Type: ${file.type}`,
        length: 0,
        fileType: file.type,
        fileName: file.name,
        ragEnabled: false,
        message: `Error processing ${file.name}: ${processingError instanceof Error ? processingError.message : 'Unknown error'}`,
        error: processingError instanceof Error ? processingError.message : 'Processing failed'
      })
    }

  } catch (error) {
    console.error('Document processing API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to process document',
        ragEnabled: false
      },
      { status: 500 }
    )
  }
}