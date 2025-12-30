'use client'

import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import { supabase } from '@/lib/supabase'

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Heart, Activity, Thermometer, Wind, Users, Clock } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { BedStatusIndicator } from './bed-status-indicator'

// Helper functions to enrich webhook data
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

export default function ICUDashboard() {
  const { user } = useUser()
  const [patients, setPatients] = useState<ExtendedPatient[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({ connected: false, url: '' })

  useEffect(() => {
    // Import the WebSocket client dynamically (client-side only)
    const initializeWebSocket = async () => {
      const { bedMonitoringClient } = await import('@/lib/websocket-client')
      
      // Connect to WebSocket
      bedMonitoringClient.connect()
      
      // Set up listener for real-time updates
      const unsubscribe = bedMonitoringClient.onDataUpdate((beds) => {
        console.log('📊 Received real-time bed data update:', beds.length, 'beds')
        updatePatientsFromBeds(beds)
      })
      
      // Get initial data
      const initialBeds = bedMonitoringClient.getCurrentBedData()
      updatePatientsFromBeds(initialBeds)
      setLoading(false)
      
      // Update connection status
      const status = bedMonitoringClient.getConnectionStatus()
      setConnectionStatus(status)
      
      // Check connection status periodically
      const statusInterval = setInterval(() => {
        const currentStatus = bedMonitoringClient.getConnectionStatus()
        setConnectionStatus(currentStatus)
      }, 5000)
      
      // Cleanup on unmount
      return () => {
        unsubscribe()
        bedMonitoringClient.disconnect()
        clearInterval(statusInterval)
      }
    }
    
    initializeWebSocket()
  }, [])

  const updatePatientsFromBeds = (beds: any[]) => {
    const webhookPatients = beds.map((bed: any) => ({
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
        temperature: Math.round((bed.vitals.temperature - 32) * 5/9 * 10) / 10,
        respiratory_rate: Math.round(bed.vitals.respiratoryRate),
        timestamp: bed.vitals.timestamp,
        status: bed.status,
        alarms: getAlarms(bed.vitals, bed.status)
      }
    }))
    setPatients(webhookPatients)
  }

  const fetchPatients = async () => {
    // This is now handled by the WebSocket connection
    console.log('Patients are updated via WebSocket connection')
  }

  const syncBedData = async () => {
    if (syncing) return
    
    setSyncing(true)
    try {
      const { bedMonitoringClient } = await import('@/lib/websocket-client')
      const beds = bedMonitoringClient.getCurrentBedData()
      updatePatientsFromBeds(beds)
      console.log('✅ Refreshed bed data:', beds.length, 'beds')
    } catch (error) {
      console.error('Error refreshing bed data:', error)
    } finally {
      setSyncing(false)
    }
  }

  const getStatusColor = (admissionDate: string) => {
    const days = Math.floor((Date.now() - new Date(admissionDate).getTime()) / (1000 * 60 * 60 * 24))
    if (days < 1) return 'bg-green-100 text-green-800'
    if (days < 7) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading ICU Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Heart className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">ICU Decision Support</h1>
                <p className="text-sm text-gray-500">Clinical Management System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.firstName}</span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Stable</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.active_issues.length <= 1).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.active_issues.some(issue => 
                      issue.includes('monitoring') || issue.includes('unstable')
                    )).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Thermometer className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Emergency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {patients.filter(p => p.active_issues.some(issue => 
                      issue.includes('unstable') || issue.includes('hemodynamically')
                    )).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${connectionStatus.connected ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Wind className={`h-4 w-4 ${connectionStatus.connected ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">WebSocket</p>
                    <p className={`text-xs ${connectionStatus.connected ? 'text-green-600' : 'text-gray-500'}`}>
                      {connectionStatus.connected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={syncBedData}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Activity className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wind className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Patient List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>ICU Patients</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {patients.map((patient) => (
                <div key={patient.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {patient.bed_number}
                        </Badge>
                        <h3 className="font-semibold text-lg">{patient.name}</h3>
                        <BedStatusIndicator 
                          status={patient.current_vitals?.status}
                          activeIssues={patient.active_issues}
                          className="ml-2"
                        />
                        <Badge className={getStatusColor(patient.admission_date)}>
                          {formatDistanceToNow(new Date(patient.admission_date), { addSuffix: true })}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <p><strong>Age/Sex:</strong> {patient.age}y {patient.sex}</p>
                          <p><strong>Weight:</strong> {patient.weight ? `${patient.weight}kg` : 'N/A'}</p>
                        </div>
                        <div>
                          <p><strong>Diagnosis:</strong> {patient.admission_diagnosis}</p>
                          <p><strong>Team:</strong> {patient.attending_team}</p>
                        </div>
                        <div>
                          <p><strong>Code Status:</strong> {patient.code_status}</p>
                          <p><strong>Active Issues:</strong> {patient.active_issues.length}</p>
                        </div>
                      </div>
                      
                      {/* Current Vitals */}
                      {patient.current_vitals && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-sm text-gray-700 mb-2">Current Vitals</h4>
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <span className={`font-mono ${patient.current_vitals.heart_rate > 100 || patient.current_vitals.heart_rate < 60 ? 'text-red-600 font-bold' : ''}`}>
                                HR: {patient.current_vitals.heart_rate}
                              </span>
                            </div>
                            <div>
                              <span className={`font-mono ${patient.current_vitals.systolic_bp < 90 ? 'text-red-600 font-bold' : ''}`}>
                                BP: {patient.current_vitals.systolic_bp}/{patient.current_vitals.diastolic_bp}
                              </span>
                            </div>
                            <div>
                              <span className={`font-mono ${patient.current_vitals.spo2 < 95 ? 'text-red-600 font-bold' : ''}`}>
                                SpO2: {patient.current_vitals.spo2}%
                              </span>
                            </div>
                            <div>
                              <span className="font-mono">RR: {patient.current_vitals.respiratory_rate}</span>
                            </div>
                            <div>
                              <span className={`font-mono ${patient.current_vitals.temperature > 38 ? 'text-red-600 font-bold' : ''}`}>
                                Temp: {patient.current_vitals.temperature}°C
                              </span>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">
                                {new Date(patient.current_vitals.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          {patient.current_vitals.alarms.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {patient.current_vitals.alarms.slice(0, 3).map((alarm, index) => (
                                <Badge key={index} variant="destructive" className="text-xs">
                                  {alarm}
                                </Badge>
                              ))}
                              {patient.current_vitals.alarms.length > 3 && (
                                <Badge variant="destructive" className="text-xs">
                                  +{patient.current_vitals.alarms.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {patient.active_issues.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {patient.active_issues.slice(0, 3).map((issue, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {issue}
                              </Badge>
                            ))}
                            {patient.active_issues.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{patient.active_issues.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Link href={`/patient/${patient.id}`}>
                        <Button className="w-full">
                          <Activity className="h-4 w-4 mr-2" />
                          Open Chat
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {patients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No patients currently in the ICU</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}