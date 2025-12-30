import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    
    if (data.type !== 'vital_update' || !data.beds) {
      return NextResponse.json({ error: 'Invalid webhook data' }, { status: 400 })
    }

    console.log('Received bed data update:', data.beds.length, 'beds')

    // Process each bed update
    for (const bed of data.beds) {
      // Update or insert patient
      const patientData = {
        id: bed.patientId,
        bed_number: `ICU-${bed.id.toString().padStart(3, '0')}`,
        name: bed.patientName,
        age: getAgeFromCase(bed.case), // Estimate age based on case
        sex: getSexFromName(bed.patientName), // Estimate sex from name
        admission_date: bed.admissionTime,
        admission_diagnosis: getCaseDiagnosis(bed.case),
        ward: 'ICU',
        attending_team: 'ICU Team',
        problem_list: [bed.case.replace('_', ' ')],
        comorbidities: getComorbidities(bed.case),
        active_issues: getActiveIssues(bed.case, bed.status),
        medications: getMedications(bed.case),
        allergies: [],
        code_status: 'Full Code',
        important_events: [`Admitted ${new Date(bed.admissionTime).toLocaleDateString()}`],
        updated_at: new Date().toISOString()
      }

      // Upsert patient
      const { error: patientError } = await supabaseAdmin
        .from('patients')
        .upsert(patientData, { onConflict: 'id' })

      if (patientError) {
        console.error('Error upserting patient:', patientError)
        continue
      }

      // Insert vital signs
      const vitalData = {
        patient_id: bed.patientId,
        heart_rate: Math.round(bed.vitals.heartRate),
        systolic_bp: Math.round(bed.vitals.bloodPressure.systolic),
        diastolic_bp: Math.round(bed.vitals.bloodPressure.diastolic),
        map: Math.round((bed.vitals.bloodPressure.systolic + 2 * bed.vitals.bloodPressure.diastolic) / 3),
        spo2: Math.round(bed.vitals.oxygenSaturation),
        respiratory_rate: Math.round(bed.vitals.respiratoryRate),
        temperature: Math.round((bed.vitals.temperature - 32) * 5/9 * 10) / 10, // Convert F to C
        ventilator_mode: getVentilatorMode(bed.case, bed.status),
        alarms: getAlarms(bed.vitals, bed.status),
        timestamp: bed.vitals.timestamp,
        created_at: new Date().toISOString()
      }

      const { error: vitalError } = await supabaseAdmin
        .from('vital_signs')
        .insert(vitalData)

      if (vitalError) {
        console.error('Error inserting vital signs:', vitalError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      processed: data.beds.length,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper functions to enrich data
function getAgeFromCase(caseType: string): number {
  const ageMap: Record<string, number> = {
    'stable': 65,
    'asthma_acute': 45,
    'myocardial_infarction': 68,
    'pneumonia': 72,
    'sepsis': 58,
    'diabetic_ketoacidosis': 34
  }
  return ageMap[caseType] || 60
}

function getSexFromName(name: string): 'M' | 'F' {
  const femaleNames = ['Jane', 'Alice', 'Diana']
  const firstName = name.split(' ')[0]
  return femaleNames.includes(firstName) ? 'F' : 'M'
}

function getCaseDiagnosis(caseType: string): string {
  const diagnosisMap: Record<string, string> = {
    'stable': 'Post-operative monitoring',
    'asthma_acute': 'Acute asthma exacerbation',
    'myocardial_infarction': 'ST-elevation myocardial infarction',
    'pneumonia': 'Community-acquired pneumonia',
    'sepsis': 'Severe sepsis with organ dysfunction',
    'diabetic_ketoacidosis': 'Diabetic ketoacidosis'
  }
  return diagnosisMap[caseType] || 'Critical care monitoring'
}

function getComorbidities(caseType: string): string[] {
  const comorbidityMap: Record<string, string[]> = {
    'stable': ['Hypertension'],
    'asthma_acute': ['Asthma', 'Allergic rhinitis'],
    'myocardial_infarction': ['CAD', 'Hypertension', 'Hyperlipidemia'],
    'pneumonia': ['COPD', 'Diabetes Type 2'],
    'sepsis': ['Diabetes', 'CKD'],
    'diabetic_ketoacidosis': ['Type 1 Diabetes', 'Depression']
  }
  return comorbidityMap[caseType] || []
}

function getActiveIssues(caseType: string, status: string): string[] {
  const baseIssues: Record<string, string[]> = {
    'stable': ['Post-op monitoring'],
    'asthma_acute': ['Bronchospasm', 'Hypoxemia'],
    'myocardial_infarction': ['Chest pain', 'Cardiac monitoring'],
    'pneumonia': ['Respiratory distress', 'Fever'],
    'sepsis': ['Hypotension', 'Altered mental status'],
    'diabetic_ketoacidosis': ['Hyperglycemia', 'Ketosis', 'Dehydration']
  }
  
  const issues = baseIssues[caseType] || []
  
  if (status === 'critical') {
    issues.push('Requires close monitoring')
  } else if (status === 'emergency') {
    issues.push('Hemodynamically unstable')
  }
  
  return issues
}

function getMedications(caseType: string): string[] {
  const medicationMap: Record<string, string[]> = {
    'stable': ['Metoprolol 25mg BID'],
    'asthma_acute': ['Albuterol nebulizer q4h', 'Prednisone 40mg daily'],
    'myocardial_infarction': ['Aspirin 81mg daily', 'Metoprolol 25mg BID', 'Atorvastatin 80mg daily'],
    'pneumonia': ['Ceftriaxone 1g q24h', 'Azithromycin 500mg daily'],
    'sepsis': ['Norepinephrine drip', 'Piperacillin-tazobactam 4.5g q6h'],
    'diabetic_ketoacidosis': ['Insulin drip per protocol', 'Normal saline']
  }
  return medicationMap[caseType] || []
}

function getVentilatorMode(caseType: string, status: string): string | null {
  if (status === 'emergency' && ['sepsis', 'myocardial_infarction'].includes(caseType)) {
    return 'AC/VC'
  }
  if (caseType === 'asthma_acute' && status !== 'stable') {
    return 'BiPAP'
  }
  return null
}

function getAlarms(vitals: any, status: string): string[] {
  const alarms: string[] = []
  
  if (vitals.heartRate > 100) alarms.push('Tachycardia')
  if (vitals.heartRate < 60) alarms.push('Bradycardia')
  if (vitals.bloodPressure.systolic < 90) alarms.push('Hypotension')
  if (vitals.bloodPressure.systolic > 160) alarms.push('Hypertension')
  if (vitals.oxygenSaturation < 95) alarms.push('Low SpO2')
  if (vitals.temperature > 101) alarms.push('Fever')
  if (vitals.respiratoryRate > 24) alarms.push('Tachypnea')
  
  if (status === 'emergency') alarms.push('Critical Status')
  if (status === 'critical') alarms.push('High Acuity')
  
  return alarms
}