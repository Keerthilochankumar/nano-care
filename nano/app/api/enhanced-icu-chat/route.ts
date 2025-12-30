import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { groq } from '@ai-sdk/groq'
import { streamText } from 'ai'
import { ragService } from '@/lib/rag-service'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, patientId, patientData, ragEnabled } = await request.json()

    // Get the user's question from the last message
    const userMessage = messages[messages.length - 1]?.content || ''

    // Query RAG system if enabled
    let ragResults: Array<{
      content: string;
      score: number;
      metadata: {
        documentName: string;
        [key: string]: any;
      };
    }> = []
    if (ragEnabled && userMessage) {
      try {
        console.log('🔍 Querying RAG system for:', userMessage)
        ragResults = await ragService.queryRelevantContent(patientId, userMessage, 5)
        console.log(`📊 Found ${ragResults.length} relevant chunks`)
        
        // Log RAG results for debugging
        if (ragResults.length > 0) {
          console.log('RAG Results:', ragResults.map(r => ({
            document: r.metadata.documentName,
            score: r.score,
            contentPreview: r.content.substring(0, 100) + '...'
          })))
        }
      } catch (ragError) {
        console.error('RAG query error:', ragError)
        // Continue without RAG if it fails
      }
    } else if (ragEnabled) {
      console.log('⚠️ RAG enabled but no user message to query')
    } else {
      console.log('ℹ️ RAG disabled for this request')
    }

    // Build the system prompt with patient context and RAG results
    const systemPrompt = buildICUSystemPrompt(patientData, ragEnabled, ragResults)

    // Create the streaming response
    const result = await streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemPrompt,
      messages: messages,
      temperature: 0.8, // Higher temperature for more dynamic, specific responses
    })

    // Return streaming response
    return result.toTextStreamResponse()

  } catch (error) {
    console.error('Enhanced ICU Chat API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function buildICUSystemPrompt(
  patientData: any, 
  ragEnabled: boolean, 
  ragResults: Array<{
    content: string;
    score: number;
    metadata: {
      documentName: string;
      [key: string]: any;
    };
  }> = []
): string {
  const { master, vitals } = patientData

  // Extract current vital signs and clinical status
  const currentVitals = vitals.length > 0 ? vitals[0] : null
  const map = currentVitals ? Math.round((currentVitals.systolic_bp + 2 * currentVitals.diastolic_bp) / 3) : null
  
  // Identify critical findings
  const criticalFindings = []
  if (currentVitals) {
    if (currentVitals.heart_rate < 60) criticalFindings.push('bradycardia')
    if (currentVitals.heart_rate > 100) criticalFindings.push('tachycardia')
    if (map && map < 65) criticalFindings.push('hypotension')
    if (currentVitals.spo2 < 95) criticalFindings.push('hypoxemia')
    if (currentVitals.temperature > 38.0) criticalFindings.push('fever')
    if (currentVitals.status === 'critical' || currentVitals.status === 'emergency') criticalFindings.push('hemodynamically unstable')
  }

  // Extract key clinical information
  const clinicalContext = {
    patient: `${master.name}, ${master.age}y ${master.sex}`,
    diagnosis: master.admission_diagnosis,
    issues: master.active_issues,
    comorbidities: master.comorbidities,
    medications: master.medications,
    allergies: master.allergies,
    currentVitals: currentVitals ? {
      hr: currentVitals.heart_rate,
      bp: `${currentVitals.systolic_bp}/${currentVitals.diastolic_bp}`,
      map: map,
      spo2: currentVitals.spo2,
      temp: currentVitals.temperature,
      rr: currentVitals.respiratory_rate,
      status: currentVitals.status,
      alarms: currentVitals.alarms,
      timestamp: new Date(currentVitals.timestamp).toLocaleString()
    } : null,
    criticalFindings: criticalFindings
  }

  const prompt = `You are an ICU Decision Support System. Analyze the real-time patient data and provide specific, actionable clinical insights.

PATIENT: ${clinicalContext.patient}
PRIMARY DIAGNOSIS: ${clinicalContext.diagnosis}
ACTIVE ISSUES: ${clinicalContext.issues.join(', ')}
COMORBIDITIES: ${clinicalContext.comorbidities.join(', ')}
CURRENT MEDICATIONS: ${clinicalContext.medications.join(', ')}
ALLERGIES: ${clinicalContext.allergies.length > 0 ? clinicalContext.allergies.join(', ') : 'NKDA'}

CURRENT VITALS (${clinicalContext.currentVitals?.timestamp || 'No recent data'}):
${clinicalContext.currentVitals ? `
- Heart Rate: ${clinicalContext.currentVitals.hr} bpm
- Blood Pressure: ${clinicalContext.currentVitals.bp} mmHg (MAP: ${clinicalContext.currentVitals.map})
- SpO2: ${clinicalContext.currentVitals.spo2}%
- Temperature: ${clinicalContext.currentVitals.temp}°C
- Respiratory Rate: ${clinicalContext.currentVitals.rr}/min
- Clinical Status: ${clinicalContext.currentVitals.status.toUpperCase()}
${clinicalContext.currentVitals.alarms.length > 0 ? `- ACTIVE ALARMS: ${clinicalContext.currentVitals.alarms.join(', ')}` : ''}
` : 'No current vital signs available'}

${clinicalContext.criticalFindings.length > 0 ? `CRITICAL FINDINGS: ${clinicalContext.criticalFindings.join(', ')}` : ''}

${ragEnabled && ragResults.length > 0 ? `
RELEVANT CLINICAL DOCUMENTS (RAG SYSTEM):
${ragResults.map((result, index) => `
Document ${index + 1}: ${result.metadata.documentName} (Relevance: ${(result.score * 100).toFixed(1)}%)
Content: ${result.content}
`).join('\n')}
` : ragEnabled ? 'RAG ENABLED: No relevant clinical documents found for this query.' : 'RAG DISABLED: Base analysis only on patient data and vital signs above.'}

INSTRUCTIONS:
1. Analyze the specific question in context of this patient's real-time data
2. ${ragEnabled && ragResults.length > 0 ? 'Use the relevant clinical documents from the RAG system to provide evidence-based insights' : 'Provide targeted clinical insights based ONLY on current vitals and patient data'}
3. Focus on actionable recommendations specific to the current clinical situation
4. Reference specific data points (vital signs${ragEnabled && ragResults.length > 0 ? ', document findings' : ''}) in your analysis
5. Prioritize immediate clinical concerns and time-sensitive interventions
6. Be concise and specific - avoid generic medical advice
7. Always correlate findings with the patient's underlying conditions and current status
${ragEnabled && ragResults.length > 0 ? '8. When referencing document content, mention the specific document name and relevance score' : ''}
${!ragEnabled ? '8. IMPORTANT: Do not reference any clinical documents or external information - base your analysis solely on the patient data provided above.' : ''}

Respond as an experienced ICU physician analyzing this specific patient's data to answer the user's question. Base your response entirely on the provided real-time data${ragEnabled && ragResults.length > 0 ? ' and relevant clinical documents from the RAG system' : ' (no additional documents available)'}.`

  return prompt
}