'use client'

import { useState, useEffect, useRef } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  ArrowLeft, 
  Send, 
  FileText, 
  TrendingUp,
  AlertTriangle,
  Clock,
  User,
  Stethoscope
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import ReactMarkdown from 'react-markdown'

interface PatientChatProps {
  patient: {
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
  userId: string
}

export default function PatientChat({ patient, userId }: PatientChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      const userMessage = { 
        id: Date.now().toString(),
        role: 'user' as const, 
        content: input,
        timestamp: new Date().toISOString()
      }
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setInput('')
      setIsLoading(true)
      
      try {
        const response = await fetch('/api/icu-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            patientId: patient.id,
            patientData: {
              master: patient,
              documents: [], // No documents from WebSocket data
              vitals: patient.current_vitals ? [patient.current_vitals] : []
            }
          })
        })
        
        if (response.ok) {
          const reader = response.body?.getReader()
          const decoder = new TextDecoder()
          let assistantMessage = ''
          
          if (reader) {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              
              const chunk = decoder.decode(value)
              assistantMessage += chunk
            }
            
            setMessages([...newMessages, { 
              id: (Date.now() + 1).toString(),
              role: 'assistant' as const, 
              content: assistantMessage,
              timestamp: new Date().toISOString()
            }])
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const latestVitals = patient.current_vitals

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                  {patient.bed_number}
                </Badge>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{patient.name}</h1>
                  <p className="text-sm text-gray-500">
                    {patient.age}y {patient.sex} • {patient.admission_diagnosis}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Vitals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-red-600" />
                  <span>Live Vitals</span>
                  {latestVitals && (
                    <Badge variant="secondary" className="text-xs">
                      {formatDistanceToNow(new Date(latestVitals.timestamp), { addSuffix: true })}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestVitals ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">HR:</span>
                        <span className={`font-mono ${latestVitals.heart_rate && (latestVitals.heart_rate < 60 || latestVitals.heart_rate > 100) ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.heart_rate || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">BP:</span>
                        <span className="font-mono">
                          {latestVitals.systolic_bp && latestVitals.diastolic_bp 
                            ? `${latestVitals.systolic_bp}/${latestVitals.diastolic_bp}` 
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">MAP:</span>
                        <span className={`font-mono ${latestVitals.systolic_bp && latestVitals.diastolic_bp && Math.round((latestVitals.systolic_bp + 2 * latestVitals.diastolic_bp) / 3) < 65 ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.systolic_bp && latestVitals.diastolic_bp 
                            ? Math.round((latestVitals.systolic_bp + 2 * latestVitals.diastolic_bp) / 3)
                            : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SpO2:</span>
                        <span className={`font-mono ${latestVitals.spo2 && latestVitals.spo2 < 95 ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.spo2 ? `${latestVitals.spo2}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">RR:</span>
                        <span className="font-mono">{latestVitals.respiratory_rate || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Temp:</span>
                        <span className={`font-mono ${latestVitals.temperature && latestVitals.temperature > 38.0 ? 'text-red-600 font-bold' : ''}`}>
                          {latestVitals.temperature ? `${latestVitals.temperature}°C` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    {latestVitals.alarms && latestVitals.alarms.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Active Alarms</span>
                        </div>
                        <div className="space-y-1">
                          {latestVitals.alarms.map((alarm, index) => (
                            <Badge key={index} variant="destructive" className="text-xs">
                              {alarm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No recent vital signs available</p>
                )}
              </CardContent>
            </Card>

            {/* Patient Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Patient Summary</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Demographics</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Age/Sex:</strong> {patient.age}y {patient.sex}</p>
                    <p><strong>Weight:</strong> {patient.weight ? `${patient.weight}kg` : 'N/A'}</p>
                    <p><strong>Admitted:</strong> {format(new Date(patient.admission_date), 'MMM dd, yyyy HH:mm')}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Care Team</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>Ward:</strong> {patient.ward}</p>
                    <p><strong>Team:</strong> {patient.attending_team}</p>
                    <p><strong>Code Status:</strong> {patient.code_status}</p>
                  </div>
                </div>

                {patient.active_issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Active Issues</h4>
                    <div className="flex flex-wrap gap-1">
                      {patient.active_issues.map((issue, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {patient.allergies.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Allergies</h4>
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((allergy, index) => (
                        <Badge key={index} variant="destructive" className="text-xs">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Clinical Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm border-l-2 border-blue-200 pl-3 py-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Current Status</span>
                      <Badge variant="outline" className="text-xs">
                        Live Data
                      </Badge>
                    </div>
                    <p className="text-gray-500 text-xs">
                      Real-time data from bed monitoring system
                    </p>
                  </div>
                  
                  {patient.problem_list.length > 0 && (
                    <div className="text-sm border-l-2 border-green-200 pl-3 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Problem List</span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {patient.problem_list.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {patient.medications.length > 0 && (
                    <div className="text-sm border-l-2 border-purple-200 pl-3 py-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Current Medications</span>
                      </div>
                      <p className="text-gray-500 text-xs">
                        {patient.medications.slice(0, 2).join(', ')}
                        {patient.medications.length > 2 && ` +${patient.medications.length - 2} more`}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                  <span>Clinical Decision Support</span>
                </CardTitle>
                <p className="text-sm text-gray-600">
                  AI assistant for clinical decision-support. Always verify recommendations with bedside assessment.
                </p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">Ready to assist with clinical decisions</p>
                      <p className="text-sm">Ask about patient status, interpret findings, or discuss treatment options</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-gray-600">Analyzing patient data...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="flex space-x-2">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about patient status, interpret findings, or discuss clinical decisions..."
                    className="flex-1 min-h-[60px] resize-none"
                    disabled={isLoading}
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This is decision-support information for trained clinicians and does not replace bedside assessment, multidisciplinary discussion, or local protocols.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}