'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ModernPatientChat from './modern-patient-chat'
import { Activity } from 'lucide-react'

interface PatientChatWrapperProps {
  patientId: string
  userId: string
}

interface ExtendedPatient {
  id: string
  bed_number: string
  name: string
  age: number
  sex: 'M' | 'F' | 'Other'
  weight?: number
  admission_date: string
  admission_diagnosis: string
  ward: string
  attending_team: string
  problem_list: string[]
  comorbidities: string[]
  active_issues: string[]
  medications: string[]
  allergies: string[]
  code_status: string
  important_events: string[]
  created_at: string
  updated_at: string
  current_vitals?: {
    heart_rate: number
    systolic_bp: number
    diastolic_bp: number
    spo2: number
    temperature: number
    respiratory_rate: number
    timestamp: string
    status: string
    alarms: string[]
  }
}

// Helper functions (same as in dashboard)
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
  
  const issues = [...(baseIssues[caseType] || [])]
  
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

function getAlarms(vitals: any, status: string): string[] {
  const alarms: string[] = []
  
  // Heart rate alarms
  if (vitals.heartRate > 120) alarms.push('Severe Tachycardia')
  else if (vitals.heartRate > 100) alarms.push('Tachycardia')
  if (vitals.heartRate < 50) alarms.push('Severe Bradycardia')
  else if (vitals.heartRate < 60) alarms.push('Bradycardia')
  
  // Blood pressure alarms
  const map = Math.round((vitals.bloodPressure.systolic + 2 * vitals.bloodPressure.diastolic) / 3)
  if (map < 65) alarms.push('Hypotension (MAP < 65)')
  if (vitals.bloodPressure.systolic < 90) alarms.push('Systolic Hypotension')
  if (vitals.bloodPressure.systolic > 180) alarms.push('Hypertensive Crisis')
  
  // Oxygen saturation alarms
  if (vitals.oxygenSaturation < 88) alarms.push('Severe Hypoxemia')
  else if (vitals.oxygenSaturation < 95) alarms.push('Hypoxemia')
  
  // Temperature alarms (assuming Fahrenheit input)
  const tempC = (vitals.temperature - 32) * 5/9
  if (tempC > 39.0) alarms.push('High Fever')
  else if (tempC > 38.0) alarms.push('Fever')
  if (tempC < 36.0) alarms.push('Hypothermia')
  
  // Respiratory rate alarms
  if (vitals.respiratoryRate > 30) alarms.push('Severe Tachypnea')
  else if (vitals.respiratoryRate > 24) alarms.push('Tachypnea')
  if (vitals.respiratoryRate < 8) alarms.push('Bradypnea')
  
  // Status-based alarms
  if (status === 'emergency') alarms.push('Emergency Status')
  if (status === 'critical') alarms.push('Critical Status')
  
  return alarms
}

export default function PatientChatWrapper({ patientId, userId }: PatientChatWrapperProps) {
  const [patient, setPatient] = useState<ExtendedPatient | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const initializePatientData = async () => {
      try {
        const { bedMonitoringClient } = await import('@/lib/websocket-client')
        
        // Connect to WebSocket if not already connected
        bedMonitoringClient.connect()
        
        // Set up listener for real-time updates
        const unsubscribe = bedMonitoringClient.onDataUpdate((beds) => {
          const foundBed = beds.find(bed => bed.patientId === patientId)
          if (foundBed) {
            updatePatientFromBed(foundBed)
          }
        })
        
        // Get initial data
        const beds = bedMonitoringClient.getCurrentBedData()
        const foundBed = beds.find(bed => bed.patientId === patientId)
        
        if (foundBed) {
          updatePatientFromBed(foundBed)
        } else {
          console.error('Patient not found:', patientId)
          router.push('/dashboard')
          return
        }
        
        setLoading(false)
        
        // Cleanup on unmount
        return () => {
          unsubscribe()
        }
      } catch (error) {
        console.error('Error initializing patient data:', error)
        router.push('/dashboard')
      }
    }
    
    initializePatientData()
  }, [patientId, router])

  const updatePatientFromBed = (bed: any) => {
    const patientData: ExtendedPatient = {
      id: bed.patientId,
      bed_number: `ICU-${bed.id.toString().padStart(3, '0')}`,
      name: bed.patientName,
      age: getAgeFromCase(bed.case),
      sex: getSexFromName(bed.patientName),
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_vitals: {
        heart_rate: Math.round(bed.vitals.heartRate),
        systolic_bp: Math.round(bed.vitals.bloodPressure.systolic),
        diastolic_bp: Math.round(bed.vitals.bloodPressure.diastolic),
        spo2: Math.round(bed.vitals.oxygenSaturation),
        temperature: Math.round((bed.vitals.temperature - 32) * 5/9 * 10) / 10, // Convert F to C
        respiratory_rate: Math.round(bed.vitals.respiratoryRate),
        timestamp: bed.vitals.timestamp,
        status: bed.status,
        alarms: getAlarms(bed.vitals, bed.status)
      }
    }
    setPatient(patientData)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading patient data...</p>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Patient not found</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return <ModernPatientChat patient={patient} userId={userId} />
}