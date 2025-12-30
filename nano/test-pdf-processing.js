// Simple test script to verify PDF processing works
const fs = require('fs');
const path = require('path');

async function testPDFProcessing() {
  try {
    console.log('Testing PDF processing...');
    
    // Try to import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    console.log('✅ pdfjs-dist imported successfully');
    
    // Check if we have a sample PDF file
    const pdfPath = path.join(__dirname, 'public', 'sample.pdf');
    if (fs.existsSync(pdfPath)) {
      console.log('✅ Sample PDF found');
      
      const buffer = fs.readFileSync(pdfPath);
      console.log('✅ PDF buffer loaded, size:', buffer.length);
      
      // Try to load the PDF
      const loadingTask = pdfjsLib.getDocument({ data: buffer });
      const pdfDocument = await loadingTask.promise;
      console.log('✅ PDF document loaded, pages:', pdfDocument.numPages);
      
      // Extract text from first page
      const page = await pdfDocument.getPage(1);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      console.log('✅ Text extracted from first page:', pageText.substring(0, 100) + '...');
      
    } else {
      console.log('⚠️ No sample PDF found at', pdfPath);
    }
    
  } catch (error) {
    console.error('❌ PDF processing test failed:', error);
  }
}

testPDFProcessing();